export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="h-7 w-28 bg-surface2 rounded-xl mb-2" />
          <div className="h-4 w-52 bg-surface2 rounded-lg" />
        </div>
        <div className="h-11 w-36 bg-surface2 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="aspect-square bg-surface2" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-3/4 bg-surface2 rounded-lg" />
              <div className="h-4 w-16 bg-surface2 rounded-lg" />
              <div className="h-4 w-20 bg-surface2 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
