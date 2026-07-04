import { Link } from 'react-router-dom'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="text-muted-foreground border-border border-t px-6 py-8 text-center text-sm">
      <p>
        Made with love (and mild sleep deprivation) by{' '}
        <a
          href="https://introvertsmakestuff.com/"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          Introverts Make Stuff
        </a>
      </p>
      <p className="mt-1">
        <a href="mailto:hello@introvertsmakestuff.com" className="hover:text-foreground">
          hello@introvertsmakestuff.com
        </a>
      </p>
      <p className="mt-4 flex items-center justify-center gap-3">
        <span>&copy; {year} OmNomNom</span>
        <span aria-hidden="true">&middot;</span>
        <Link to="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <span aria-hidden="true">&middot;</span>
        <Link to="/terms" className="hover:text-foreground">
          Terms
        </Link>
      </p>
    </footer>
  )
}
