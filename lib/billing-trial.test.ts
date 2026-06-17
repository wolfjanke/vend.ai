import { describe, expect, it } from 'vitest'
import { addDaysBr, formatDateYmdBr } from '@/lib/billing-dates'
import { resolveTrialDays, preservedTrialEnd } from '@/lib/billing-trial'

describe('formatDateYmdBr', () => {
  it('usa calendário de São Paulo', () => {
    const instant = new Date('2026-06-12T02:30:00.000Z')
    expect(formatDateYmdBr(instant)).toBe('2026-06-11')
  })
})

describe('addDaysBr', () => {
  it('soma dias no calendário BR', () => {
    const base = new Date('2026-06-10T15:00:00.000Z')
    const out = addDaysBr(base, 7)
    expect(formatDateYmdBr(out)).toBe('2026-06-17')
  })
})

describe('resolveTrialDays', () => {
  it('concede trial na 1ª assinatura', () => {
    expect(resolveTrialDays({
      planSlug: 'starter',
      isFirstPaid: true,
      subscriptionStatus: null,
      trialEndsAt: null,
    })).toBe(14)
  })

  it('não concede trial em upgrade após histórico', () => {
    expect(resolveTrialDays({
      planSlug: 'pro',
      isFirstPaid: false,
      subscriptionStatus: 'ACTIVE',
      trialEndsAt: null,
    })).toBe(0)
  })

  it('não concede novo trial durante trial ativo', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    expect(resolveTrialDays({
      planSlug: 'pro',
      isFirstPaid: false,
      subscriptionStatus: 'TRIAL',
      trialEndsAt: future,
    })).toBe(0)
    expect(preservedTrialEnd({
      planSlug: 'pro',
      isFirstPaid: false,
      subscriptionStatus: 'TRIAL',
      trialEndsAt: future,
    })).toBeInstanceOf(Date)
  })
})
