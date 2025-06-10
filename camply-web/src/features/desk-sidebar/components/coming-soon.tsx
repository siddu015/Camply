export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center animate-in fade-in-50 duration-300">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-muted-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
