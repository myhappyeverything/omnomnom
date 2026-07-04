import { Card, CardContent } from '@/components/ui/card'

export function TermsPage() {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-foreground text-lg font-semibold">Terms of use</h1>
      <Card>
        <CardContent className="text-muted-foreground space-y-4 text-sm leading-relaxed">
          <p>
            Purple is a personal project, not a commercial product. These terms exist so it's clear
            what you can expect from it.
          </p>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">Who this is for</h2>
            <p>
              Access is limited to two accounts, created by invitation. There is no public sign-up,
              and registration closes automatically once both accounts exist.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">Not medical advice</h2>
            <p>
              Calorie, macro, and score calculations are estimates based on formulas (Mifflin-St
              Jeor for BMR, standard activity multipliers) and the nutrition data available for each
              food — they can be wrong, especially for AI-identified meals. Nothing in this app is
              medical, dietary, or health advice; talk to a qualified professional for that.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">No uptime guarantee</h2>
            <p>
              This runs on Cloudflare's free/low-cost tiers as a personal project. It's kept running
              on a best-effort basis, with no guaranteed availability, backup schedule, or support
              response time. Use the data export in Settings periodically if you want your own
              backup.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">Third-party services</h2>
            <p>
              Meal photo recognition uses OpenAI's Vision API, food data comes from OpenFoodFacts
              and the USDA, and reminders are delivered through OneSignal. Each operates under its
              own terms; this app has no control over their availability or accuracy.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">Changes</h2>
            <p>
              Since this is actively developed software rather than a fixed product, features and
              these terms may change at any time without prior notice.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
