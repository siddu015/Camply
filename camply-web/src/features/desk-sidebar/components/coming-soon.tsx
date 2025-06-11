export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-muted-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
