export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-7 w-36 bg-surface2 rounded-xl mb-2" />
        <div className="h-4 w-64 bg-surface2 rounded-lg" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-11 flex-1 bg-surface2 rounded-xl" />
        <div className="h-11 w-20 bg-surface2 rounded-xl" />
      </div>
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-9 w-24 bg-surface2 rounded-full shrink-0" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-24 bg-surface2 rounded-lg" />
              <div className="h-5 w-20 bg-surface2 rounded-full" />
            </div>
            <div className="h-4 w-40 bg-surface2 rounded-lg" />
            <div className="h-3 w-32 bg-surface2 rounded-lg" />
            <div className="h-3 w-full bg-surface2 rounded-lg" />
            <div className="h-3 w-3/4 bg-surface2 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
