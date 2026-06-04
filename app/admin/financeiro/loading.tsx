export default function Loading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="mb-6">
        <div className="h-7 w-36 bg-surface2 rounded-xl mb-2" />
        <div className="h-4 w-80 bg-surface2 rounded-lg" />
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="h-4 w-20 bg-surface2 rounded-lg mb-3" />
        <div className="flex gap-3">
          <div className="flex-1 h-11 bg-surface2 rounded-xl" />
          <div className="flex-1 h-11 bg-surface2 rounded-xl" />
          <div className="h-11 w-20 bg-surface2 rounded-xl" />
        </div>
      </div>
      <div className="grid w-full gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 text-center space-y-2">
            <div className="h-3 w-20 bg-surface2 rounded-lg mx-auto" />
            <div className="h-7 w-28 bg-surface2 rounded-lg mx-auto" />
            <div className="h-3 w-16 bg-surface2 rounded-lg mx-auto" />
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
        <div className="h-4 w-32 bg-surface2 rounded-lg" />
        {[1, 2].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-20 bg-surface2 rounded-lg shrink-0" />
            <div className="flex-1 h-px bg-surface2" />
            <div className="h-4 w-24 bg-surface2 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
