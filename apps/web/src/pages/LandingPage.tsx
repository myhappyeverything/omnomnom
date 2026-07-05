import { Link } from 'react-router-dom'
import { Camera, Droplet, Scale, Bell, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Divider } from '@/components/ui/divider'
import { Footer } from '@/components/Footer'
import mascot from '@/assets/omnomnom-mascot.png'

const FEATURES = [
  {
    icon: Camera,
    title: 'Snap it, we guess it',
    description: 'Take a photo of your meal and let the AI do the annoying part.',
  },
  {
    icon: Droplet,
    title: 'Hydration nagging, but cute',
    description: "Gentle water reminders that don't feel like a scolding.",
  },
  {
    icon: Scale,
    title: 'The scale, without the drama',
    description: 'Weight trends and a realistic goal date — no judgment included.',
  },
  {
    icon: Bell,
    title: 'Reminders on your terms',
    description: 'Set quiet hours so nothing buzzes you awake for a snack alert.',
  },
  {
    icon: WifiOff,
    title: 'Works offline, syncs like magic',
    description: 'Log on the subway, in a tunnel, wherever — it catches up later.',
  },
]

export function LandingPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="mx-auto flex max-w-md flex-col items-center px-6 pt-16 pb-10 text-center">
          <img src={mascot} alt="OmNomNom mascot" className="h-40 w-40" width={640} height={640} />
          <h1 className="text-foreground mt-4 text-4xl font-bold tracking-tight">OmNomNom</h1>
          <p className="text-primary mt-2 text-lg font-medium">Track less. Live more.</p>
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            A nutrition tracker that doesn't take itself too seriously. Snap a photo, log a bite,
            get on with your day.
          </p>
          <div className="mt-8 grid w-full grid-cols-2 gap-3">
            <Button asChild variant="secondary">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Create an account</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-md px-6 pb-16">
          <Divider className="mb-2" />
          {FEATURES.map((feature, index) => (
            <div key={feature.title}>
              {index > 0 && <Divider />}
              <div className="flex items-start gap-4 py-5">
                <div className="text-primary flex size-10 shrink-0 items-center justify-center">
                  <feature.icon size={22} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-foreground font-semibold">{feature.title}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      <Footer />
    </div>
  )
}
