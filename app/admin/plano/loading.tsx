export default function Loading() {
  return (
    <div className="animate-pulse max-w-2xl space-y-5">
      <div className="mb-6">
        <div className="h-7 w-24 bg-surface2 rounded-xl mb-2" />
        <div className="h-4 w-64 bg-surface2 rounded-lg" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 h-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl h-36" />
        ))}
      </div>
    </div>
  )
}
