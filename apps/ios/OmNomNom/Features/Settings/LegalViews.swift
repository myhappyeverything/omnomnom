import SwiftUI

/// A titled block of body text used in the legal documents.
private struct LegalSection: View {
    let title: String
    let text: String
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.headline)
            Text(text).font(.subheadline).foregroundStyle(.secondary)
        }
    }
}

private struct LegalScreen<Content: View>: View {
    let title: String
    let intro: String
    @ViewBuilder var content: Content
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                Text(intro).font(.subheadline).foregroundStyle(.secondary)
                content
            }
            .padding(Theme.Spacing.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct PrivacyView: View {
    var body: some View {
        LegalScreen(title: "Privacy", intro: "OmNomNom is a personal nutrition and health tracker. This page explains what data it keeps and why.") {
            LegalSection(title: "What's stored", text: "Your account (name, email, date of birth, sex, height), the meals, water, and weight entries you log, any goals you set, your notification and unit preferences, and any custom foods or recipes you create. All of it lives in a Cloudflare D1 database dedicated to this app. It is not shared with, or sold to, anyone.")
            LegalSection(title: "Meal photos", text: "Photos you take to log a meal are uploaded to Cloudflare R2 storage and sent to OpenAI's Vision API to identify what's in them. OpenAI does not receive your name, email, or any other account details, only the photo itself. The actual nutrition values used in your log always come from OpenFoodFacts or the USDA food database, never invented by the AI.")
            LegalSection(title: "Notifications", text: "Reminders are scheduled and delivered entirely on your device. They are not sent through any third-party push service and no meal, weight, or water history leaves your device to power them.")
            LegalSection(title: "Food search", text: "Searching for a food sends your search text to OpenFoodFacts and/or the USDA FoodData Central API to find a match. No account information is included in these requests.")
            LegalSection(title: "Your control over this data", text: "From Settings you can export a full copy of your data at any time, or permanently delete your account, which immediately and irreversibly removes every record tied to it from the database.")
            LegalSection(title: "Who can see it", text: "Each account can only ever see its own data. There is no sharing, following, or admin visibility into another account's logs.")
        }
    }
}

struct TermsView: View {
    var body: some View {
        LegalScreen(title: "Terms of Use", intro: "These terms exist so it's clear what you can expect from the app.") {
            LegalSection(title: "Who this is for", text: "Anyone can create an account. Each account only ever sees its own data.")
            LegalSection(title: "Not medical advice", text: "Calorie, macro, and score calculations are estimates based on formulas (Mifflin-St Jeor for BMR, standard activity multipliers) and the nutrition data available for each food. They can be wrong, especially for AI-identified meals. Nothing in this app is medical, dietary, or health advice. Talk to a qualified professional for that.")
            LegalSection(title: "Availability", text: "The app relies on a hosted backend and several third-party services. It is provided on an as-is, best-effort basis with no guaranteed availability. Use the data export in Settings periodically if you want your own backup.")
            LegalSection(title: "Third-party services", text: "Meal photo recognition uses OpenAI's Vision API, and food data comes from OpenFoodFacts and the USDA. Each operates under its own terms; this app has no control over their availability or accuracy.")
            LegalSection(title: "Changes", text: "Since this is actively developed software rather than a fixed product, features and these terms may change at any time without prior notice.")
        }
    }
}

struct AboutView: View {
    private var version: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let b = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(v) (\(b))"
    }

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Spacing.lg) {
                VStack(spacing: Theme.Spacing.md) {
                    Mascot(size: 96)
                    Text("OmNomNom").font(.title.weight(.bold))
                    Text("Version \(version)").font(.subheadline).foregroundStyle(.secondary)
                }
                .padding(.top, Theme.Spacing.xl)

                VStack(spacing: 4) {
                    Text("Made by Introverts Make Stuff").font(.subheadline)
                    Link("www.introvertsmakestuff.com", destination: URL(string: "https://www.introvertsmakestuff.com")!)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.accent)
                }

                Text("Copyright \(String(Calendar.current.component(.year, from: .now))) Introverts Make Stuff. All rights reserved.")
                    .font(.caption).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.top, Theme.Spacing.md)
            }
            .padding(Theme.Spacing.lg)
            .frame(maxWidth: .infinity)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("About")
        .navigationBarTitleDisplayMode(.inline)
    }
}
