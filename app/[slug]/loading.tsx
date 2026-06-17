interface StoreLoadingProps {
  catalogColsMobile?: number
}

export default function StoreLoading({ catalogColsMobile }: StoreLoadingProps) {
  const gridCols =
    catalogColsMobile != null
      ? `repeat(${catalogColsMobile}, minmax(0, 1fr))`
      : 'repeat(var(--theme-catalog-cols-mobile, 2), minmax(0, 1fr))'

  return (
    <div
      className="min-h-screen animate-pulse px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-32 space-y-5 max-w-5xl mx-auto min-w-0"
      aria-busy="true"
      aria-label="Carregando loja"
    >
      <div className="h-14 bg-surface2 rounded-xl" />
      <div className="h-11 bg-surface2 rounded-2xl" />
      <div className="flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-9 w-20 shrink-0 bg-surface2 rounded-full" />
        ))}
      </div>
      <div
        className="grid gap-2 sm:gap-3 min-w-0"
        style={{ gridTemplateColumns: gridCols }}
      >
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="aspect-square bg-surface2 rounded-2xl min-w-0" />
        ))}
      </div>
    </div>
  )
}
