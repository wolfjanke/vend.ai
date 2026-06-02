export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-32 bg-surface2 rounded-xl mb-2" />
        <div className="h-4 w-56 bg-surface2 rounded-lg" />
      </div>
      <div className="flex gap-2 mb-5">
        <div className="h-11 w-32 bg-surface2 rounded-xl" />
        <div className="h-11 w-32 bg-surface2 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 space-y-2">
            <div className="h-5 w-3/4 bg-surface2 rounded-lg" />
            <div className="h-4 w-16 bg-surface2 rounded-lg" />
            <div className="h-10 w-full bg-surface2 rounded-xl mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}
