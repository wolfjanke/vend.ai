export default function Loading() {
  return (
    <div className="animate-pulse max-w-lg mx-auto">
      <div className="mb-6">
        <div className="h-7 w-40 bg-surface2 rounded-xl mb-2" />
        <div className="h-4 w-72 bg-surface2 rounded-lg" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="h-5 w-48 bg-surface2 rounded-lg" />
        <div className="h-4 w-full bg-surface2 rounded-lg" />
        <div className="h-4 w-3/4 bg-surface2 rounded-lg" />
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-11 bg-surface2 rounded-xl" />
          ))}
          <div className="h-11 w-32 bg-surface2 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
