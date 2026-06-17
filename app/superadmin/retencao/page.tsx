import RetencaoClient from './RetencaoClient'
import { BRAND } from '@/lib/brand'

export const metadata = {
  title: `Retenção — Superadmin ${BRAND.displayName}`,
}

export default function RetencaoPage() {
  return <RetencaoClient />
}
