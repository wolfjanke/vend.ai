import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BILLING_DOC_REQUIRED_MSG } from '@/lib/billing-owner'

const mockSql = vi.fn()
const mockBuildPayload = vi.fn()
const mockCreateCustomer = vi.fn()
const mockUpdateCustomer = vi.fn()
const mockAssertConfigured = vi.fn()

vi.mock('@/lib/db', () => ({ sql: (...args: unknown[]) => mockSql(...args) }))
vi.mock('@/lib/billing-owner', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/billing-owner')>()
  return {
    ...actual,
    buildAsaasCustomerPayload: (...args: unknown[]) => mockBuildPayload(...args),
  }
})
vi.mock('@/lib/payments/config', () => ({
  getVendaiAsaasKey: () => 'test-key',
  assertPaymentsConfigured: () => mockAssertConfigured(),
}))
vi.mock('@/lib/payments/wolf-hub', () => ({
  createCustomer: (...args: unknown[]) => mockCreateCustomer(...args),
  updateCustomer: (...args: unknown[]) => mockUpdateCustomer(...args),
  createPayment: vi.fn(),
  asaasCreateSubscription: vi.fn(),
  cancelSubscriptionAsaas: vi.fn(),
}))

import { ensureBillingCustomer } from '@/lib/payments/subscriptions'

describe('ensureBillingCustomer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSql.mockResolvedValue([{
      id: 'store-1',
      name: 'Loja',
      plan: 'free',
      asaas_subscription_id: null,
      asaas_billing_customer_id: null,
      subscription_status: null,
      subscription_started_at: null,
      subscription_ends_at: null,
      trial_ends_at: null,
      billing_cycle: 'monthly',
      vi_overage_messages: 0,
      owner_email: 'lojista@example.com',
    }])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('falha com mensagem clara quando doc ausente', async () => {
    mockBuildPayload.mockResolvedValue(null)
    await expect(ensureBillingCustomer('store-1')).rejects.toThrow(BILLING_DOC_REQUIRED_MSG)
    expect(mockCreateCustomer).not.toHaveBeenCalled()
  })

  it('cria cliente Asaas com doc quando ainda não existe', async () => {
    mockBuildPayload.mockResolvedValue({
      name: 'João',
      email: 'lojista@example.com',
      cpfCnpj: '52998224725',
      externalReference: 'store-1',
    })
    mockCreateCustomer.mockResolvedValue({ id: 'cus_new' })
    mockSql
      .mockResolvedValueOnce([{
        id: 'store-1',
        name: 'Loja',
        plan: 'free',
        asaas_subscription_id: null,
        asaas_billing_customer_id: null,
        subscription_status: null,
        subscription_started_at: null,
        subscription_ends_at: null,
        trial_ends_at: null,
        billing_cycle: 'monthly',
        vi_overage_messages: 0,
        owner_email: 'lojista@example.com',
      }])
      .mockResolvedValueOnce([])

    const id = await ensureBillingCustomer('store-1')
    expect(id).toBe('cus_new')
    expect(mockCreateCustomer).toHaveBeenCalledWith(expect.objectContaining({
      cpfCnpj: '52998224725',
    }))
  })

  it('atualiza cliente existente sem doc (backfill)', async () => {
    mockSql.mockResolvedValue([{
      id: 'store-1',
      name: 'Loja',
      plan: 'free',
      asaas_subscription_id: null,
      asaas_billing_customer_id: 'cus_old',
      subscription_status: null,
      subscription_started_at: null,
      subscription_ends_at: null,
      trial_ends_at: null,
      billing_cycle: 'monthly',
      vi_overage_messages: 0,
      owner_email: 'lojista@example.com',
    }])
    mockBuildPayload.mockResolvedValue({
      name: 'João',
      email: 'lojista@example.com',
      cpfCnpj: '52998224725',
      externalReference: 'store-1',
    })
    mockUpdateCustomer.mockResolvedValue({ id: 'cus_old' })

    const id = await ensureBillingCustomer('store-1')
    expect(id).toBe('cus_old')
    expect(mockUpdateCustomer).toHaveBeenCalledWith('cus_old', expect.objectContaining({
      cpfCnpj: '52998224725',
    }))
    expect(mockCreateCustomer).not.toHaveBeenCalled()
  })
})
