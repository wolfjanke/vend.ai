export default function StoreLoading() {
  return (
    <div className="min-h-screen animate-pulse p-4 space-y-6 max-w-lg mx-auto">
      <div className="h-12 bg-surface2 rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-[3/4] bg-surface2 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
