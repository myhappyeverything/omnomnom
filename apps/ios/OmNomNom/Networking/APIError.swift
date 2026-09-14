import Foundation

enum APIError: LocalizedError, Sendable {
    case invalidURL
    case notAuthenticated
    case server(status: Int, message: String)
    case decoding(String)
    case transport(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: "Something went wrong building the request."
        case .notAuthenticated: "You're signed out. Please sign in again."
        case let .server(_, message): message
        case .decoding: "We couldn't read the server's response."
        case let .transport(message): message
        }
    }

    /// True when the failure is a 401 that a token refresh might fix.
    var isUnauthorized: Bool {
        if case let .server(status, _) = self { return status == 401 }
        return false
    }
}
