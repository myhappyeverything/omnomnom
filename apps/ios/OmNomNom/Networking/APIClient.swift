import Foundation

/// Core HTTP client for the OmNomNom Worker API.
///
/// Auth model (mirrors apps/web/src/api/client.ts):
/// - Access token: short-lived JWT kept only in memory, sent as `Bearer`.
/// - Refresh token: opaque string stored in the Keychain. The server reads it
///   *only* from the `omnomnom_refresh_token` cookie, so we manage that cookie by
///   hand (cookie acceptance is disabled on the session) and attach it to the
///   refresh call. A 401 triggers a single, de-duplicated refresh + one retry.
@MainActor
final class APIClient {
    static let shared = APIClient()

    let baseURL = URL(string: "https://omnomnom-api.wasim-811.workers.dev")!
    private let refreshCookieName = "omnomnom_refresh_token"
    private let refreshTokenKey = "omnomnom.refreshToken"

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private(set) var accessToken: String?
    private var refreshTask: Task<String, Error>?

    var hasStoredSession: Bool { Keychain.get(refreshTokenKey) != nil }

    init() {
        let config = URLSessionConfiguration.default
        config.httpCookieAcceptPolicy = .never
        config.httpShouldSetCookies = false
        config.waitsForConnectivity = true
        session = URLSession(configuration: config)

        decoder = JSONDecoder()
        encoder = JSONEncoder()
    }

    // MARK: Token lifecycle

    func setAccessToken(_ token: String?) { accessToken = token }

    func storeRefreshToken(_ token: String) { Keychain.set(token, for: refreshTokenKey) }

    func clearSession() {
        accessToken = nil
        Keychain.delete(refreshTokenKey)
    }

    /// Capture a rotated refresh token from a Set-Cookie response header.
    /// `value(forHTTPHeaderField:)` is case-insensitive, so this works whether the
    /// server/HTTP-2 returns `Set-Cookie` or `set-cookie`.
    private func captureRefreshCookie(from response: HTTPURLResponse) {
        guard let raw = response.value(forHTTPHeaderField: "Set-Cookie") else { return }
        let cookies = HTTPCookie.cookies(withResponseHeaderFields: ["Set-Cookie": raw], for: baseURL)
        if let cookie = cookies.first(where: { $0.name == refreshCookieName }), !cookie.value.isEmpty {
            storeRefreshToken(cookie.value)
        }
    }

    // MARK: Requests

    struct Endpoint {
        var method: String = "GET"
        var path: String
        var query: [URLQueryItem] = []
        var body: Data?
        var authenticated: Bool = true
    }

    func send<Response: Decodable & Sendable>(_ endpoint: Endpoint, as: Response.Type = Response.self) async throws -> Response {
        let data = try await sendData(endpoint)
        if Response.self == EmptyResponse.self { return EmptyResponse() as! Response }
        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decoding(String(describing: error))
        }
    }

    @discardableResult
    func sendData(_ endpoint: Endpoint, allowRefresh: Bool = true) async throws -> Data {
        let request = try makeRequest(endpoint)
        let (data, response) = try await perform(request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.transport("No HTTP response")
        }

        if http.statusCode == 401, endpoint.authenticated, allowRefresh {
            _ = try await refreshAccessToken()
            // makeRequest re-applies the fresh access token on the retry.
            return try await sendData(endpoint, allowRefresh: false)
        }

        guard (200..<300).contains(http.statusCode) else {
            throw APIError.server(status: http.statusCode, message: Self.message(from: data, status: http.statusCode))
        }
        return data
    }

    private func makeRequest(_ endpoint: Endpoint) throws -> URLRequest {
        var components = URLComponents(url: baseURL.appendingPathComponent(endpoint.path), resolvingAgainstBaseURL: false)
        if !endpoint.query.isEmpty { components?.queryItems = endpoint.query }
        guard let url = components?.url else { throw APIError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method
        request.httpBody = endpoint.body
        if endpoint.body != nil {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if endpoint.authenticated, let accessToken {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    private func perform(_ request: URLRequest) async throws -> (Data, URLResponse) {
        do {
            return try await session.data(for: request)
        } catch {
            throw APIError.transport(error.localizedDescription)
        }
    }

    // MARK: Refresh (single-flight)

    @discardableResult
    func refreshAccessToken() async throws -> String {
        if let refreshTask { return try await refreshTask.value }
        let task = Task<String, Error> { [weak self] in
            guard let self else { throw APIError.notAuthenticated }
            defer { self.refreshTask = nil }
            return try await self.performRefresh()
        }
        refreshTask = task
        return try await task.value
    }

    private func performRefresh() async throws -> String {
        guard let refreshToken = Keychain.get(refreshTokenKey) else {
            throw APIError.notAuthenticated
        }
        var request = URLRequest(url: baseURL.appendingPathComponent("/api/auth/refresh"))
        request.httpMethod = "POST"
        request.setValue("\(refreshCookieName)=\(refreshToken)", forHTTPHeaderField: "Cookie")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await perform(request)
        guard let http = response as? HTTPURLResponse else { throw APIError.transport("No HTTP response") }
        guard (200..<300).contains(http.statusCode) else {
            clearSession()
            throw APIError.notAuthenticated
        }
        captureRefreshCookie(from: http)
        let decoded = try decoder.decode(AccessTokenResponse.self, from: data)
        accessToken = decoded.accessToken
        return decoded.accessToken
    }

    /// On cold start, exchange the stored refresh token for a fresh access token.
    /// Retries through short backoffs to tell "logged out" from "flaky network".
    func restoreSession() async -> Bool {
        guard hasStoredSession else { return false }
        let backoffs: [Int] = [0, 500, 1500, 3000]
        for (index, delay) in backoffs.enumerated() {
            if delay > 0 { try? await Task.sleep(for: .milliseconds(delay)) }
            do {
                _ = try await refreshAccessToken()
                return true
            } catch let error as APIError {
                // notAuthenticated means the refresh token is dead - stop retrying.
                switch error {
                case .notAuthenticated: return false
                default: if index == backoffs.count - 1 { return false }
                }
            } catch {
                if index == backoffs.count - 1 { return false }
            }
        }
        return false
    }

    // MARK: Auth (login/register capture the refresh cookie)

    func login(_ input: LoginInput) async throws -> PublicUser {
        try await authenticate(path: "/api/auth/login", body: input)
    }

    func register(_ input: RegisterInput) async throws -> PublicUser {
        try await authenticate(path: "/api/auth/register", body: input)
    }

    private func authenticate<Body: Encodable>(path: String, body: Body) async throws -> PublicUser {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try encoder.encode(body)

        let (data, response) = try await perform(request)
        guard let http = response as? HTTPURLResponse else { throw APIError.transport("No HTTP response") }
        guard (200..<300).contains(http.statusCode) else {
            throw APIError.server(status: http.statusCode, message: Self.message(from: data, status: http.statusCode))
        }
        captureRefreshCookie(from: http)
        let decoded = try decoder.decode(AuthResponse.self, from: data)
        accessToken = decoded.accessToken
        return decoded.user
    }

    func logout() async {
        if let refreshToken = Keychain.get(refreshTokenKey) {
            var request = URLRequest(url: baseURL.appendingPathComponent("/api/auth/logout"))
            request.httpMethod = "POST"
            request.setValue("\(refreshCookieName)=\(refreshToken)", forHTTPHeaderField: "Cookie")
            _ = try? await perform(request)
        }
        clearSession()
    }

    // MARK: Helpers

    private static func message(from data: Data, status: Int) -> String {
        if let envelope = try? JSONDecoder().decode(ErrorEnvelope.self, from: data), !envelope.error.isEmpty {
            return envelope.error
        }
        return "Request failed (\(status))."
    }

    func encode<Body: Encodable>(_ body: Body) throws -> Data {
        try encoder.encode(body)
    }
}

struct ErrorEnvelope: Decodable, Sendable { let error: String }
struct EmptyResponse: Decodable, Sendable {}
