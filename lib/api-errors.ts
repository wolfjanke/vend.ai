import { NextResponse } from 'next/server'

const ORDER_REJECT_MESSAGE =
  'Não foi possível processar o pedido. Atualize a página e tente novamente.'

export function orderReject422() {
  return NextResponse.json({ error: ORDER_REJECT_MESSAGE }, { status: 422 })
}

export function validationErrorResponse(firstMessage?: string) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: ORDER_REJECT_MESSAGE }, { status: 422 })
  }
  return NextResponse.json(
    { error: firstMessage ?? 'Dados inválidos' },
    { status: 400 },
  )
}
