import ClienteDetailClient from './ClienteDetailClient'

type Props = { params: { id: string } }

export default function SuperadminClienteDetailPage({ params }: Props) {
  return <ClienteDetailClient id={params.id} />
}
