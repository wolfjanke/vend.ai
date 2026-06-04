export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-44 bg-surface2 rounded-xl mb-2" />
        <div className="h-4 w-60 bg-surface2 rounded-lg" />
      </div>
      <div className="grid w-full gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 space-y-2">
            <div className="h-3 w-16 bg-surface2 rounded-lg" />
            <div className="h-6 w-12 bg-surface2 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid w-full gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 space-y-2">
            <div className="h-3 w-20 bg-surface2 rounded-lg" />
            <div className="h-6 w-24 bg-surface2 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-4 w-32 bg-surface2 rounded-lg" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-surface2 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
