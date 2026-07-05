export function TermsPage() {
  return (
    <div className="px-6 pt-8 pb-6">
      <h1 className="text-foreground mb-8 text-3xl font-bold tracking-tight">Terms of use</h1>
      <div className="text-muted-foreground space-y-6 text-sm leading-relaxed">
        <p>
          OmNomNom is a personal project, not a commercial product. These terms exist so it's
          clear what you can expect from it.
        </p>

        <section className="space-y-1">
          <h2 className="text-foreground text-base font-semibold">Who this is for</h2>
          <p>Anyone can create an account. Each account only ever sees its own data.</p>
        </section>

        <section className="space-y-1">
          <h2 className="text-foreground text-base font-semibold">Not medical advice</h2>
          <p>
            Calorie, macro, and score calculations are estimates based on formulas (Mifflin-St
            Jeor for BMR, standard activity multipliers) and the nutrition data available for each
            food — they can be wrong, especially for AI-identified meals. Nothing in this app is
            medical, dietary, or health advice; talk to a qualified professional for that.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-foreground text-base font-semibold">No uptime guarantee</h2>
          <p>
            This runs on Cloudflare's free/low-cost tiers as a personal project. It's kept running
            on a best-effort basis, with no guaranteed availability, backup schedule, or support
            response time. Use the data export in Settings periodically if you want your own
            backup.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-foreground text-base font-semibold">Third-party services</h2>
          <p>
            Meal photo recognition uses OpenAI's Vision API, food data comes from OpenFoodFacts
            and the USDA, and reminders are delivered through OneSignal. Each operates under its
            own terms; this app has no control over their availability or accuracy.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-foreground text-base font-semibold">Changes</h2>
          <p>
            Since this is actively developed software rather than a fixed product, features and
            these terms may change at any time without prior notice.
          </p>
        </section>
      </div>
    </div>
  )
}
