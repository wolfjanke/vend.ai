interface Props {
  icon:        string
  value:       string | number
  label:       string
  valueColor?: string
  highlight?:  boolean
}

export default function MetricCard({ icon, value, label, valueColor = 'text-foreground', highlight }: Props) {
  return (
    <div className={`bg-surface border rounded-2xl p-4 hover:border-primary/50 hover:-translate-y-0.5 transition-all ${highlight ? 'border-accent/30' : 'border-border'}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`font-syne font-extrabold text-3xl mb-0.5 ${valueColor}`}>{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}
