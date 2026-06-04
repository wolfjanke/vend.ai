export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 min-w-0">
      <div className="mb-6">
        <div className="h-7 w-24 bg-surface2 rounded-xl mb-2" />
        <div className="h-4 w-64 bg-surface2 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="bg-surface border border-border rounded-2xl p-5 h-48 xl:col-span-4" />
        <div className="xl:col-span-8 grid w-full gap-3 grid-cols-1 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface border border-border rounded-2xl p-5 h-36" />
          ))}
        </div>
      </div>
    </div>
  )
}
