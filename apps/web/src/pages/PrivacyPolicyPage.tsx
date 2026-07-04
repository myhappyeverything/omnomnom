import { Card, CardContent } from '@/components/ui/card'

export function PrivacyPolicyPage() {
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-foreground text-lg font-semibold">Privacy policy</h1>
      <Card>
        <CardContent className="text-muted-foreground space-y-4 text-sm leading-relaxed">
          <p>
            OmNomNom is a personal nutrition and health tracker. This page explains what data it
            keeps and why.
          </p>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">What's stored</h2>
            <p>
              Your account (name, email, date of birth, sex, height), the meals, water, and weight
              entries you log, any goals you set, your notification and unit preferences, and any
              custom foods or recipes you create. All of it lives in a Cloudflare D1 database
              dedicated to this app — it is not shared with, or sold to, anyone.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">Meal photos</h2>
            <p>
              Photos you take to log a meal are uploaded to Cloudflare R2 storage and sent to
              OpenAI's Vision API to identify what's in them. OpenAI does not receive your name,
              email, or any other account details — only the photo itself. The actual nutrition
              values used in your log always come from OpenFoodFacts or the USDA food database,
              never invented by the AI.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">Push notifications</h2>
            <p>
              If you enable reminders, your device registers a subscription with OneSignal, which
              delivers the notification. OneSignal only receives a device identifier — not your
              meal, weight, or water history.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">Food search</h2>
            <p>
              Searching for a food sends your search text to OpenFoodFacts and/or the USDA FoodData
              Central API to find a match. No account information is included in these requests.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">Your control over this data</h2>
            <p>
              From Settings you can download a full copy of your data at any time, or permanently
              delete your account — which immediately and irreversibly removes every record tied to
              it from the database.
            </p>
          </section>

          <section className="space-y-1">
            <h2 className="text-foreground font-medium">Who can see it</h2>
            <p>
              Each account can only ever see its own data — there is no sharing, following, or admin
              visibility into another account's logs.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
