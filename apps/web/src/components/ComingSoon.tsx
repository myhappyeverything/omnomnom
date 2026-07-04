export function ComingSoon({ title, stage }: { title: string; stage: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-foreground text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground text-sm">Arrives in {stage}.</p>
    </div>
  )
}
