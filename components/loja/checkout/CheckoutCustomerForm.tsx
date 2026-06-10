'use client'

import MaskedInput from '@/components/ui/MaskedInput'
import { digitsOnly, isValidCpf, isValidBrazilPhoneDigits } from '@/lib/masks'

export interface FieldErrors {
  name?:    string
  cpf?:     string
  email?:   string
  phone?:   string
}

interface Props {
  name:       string
  cpf:        string
  email:      string
  phone:      string
  errors:     FieldErrors
  onName:     (v: string) => void
  onCpf:      (v: string) => void
  onEmail:    (v: string) => void
  onPhone:    (v: string) => void
  onValidate: () => void
}

export function validateCustomerFields(
  name: string,
  cpf: string,
  email: string,
  phone: string,
): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim()) errors.name = 'Informe seu nome completo'
  if (!isValidCpf(cpf)) errors.cpf = 'CPF inválido'
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'E-mail inválido'
  }
  if (!isValidBrazilPhoneDigits(digitsOnly(phone))) {
    errors.phone = 'WhatsApp inválido (DDD + número)'
  }
  return errors
}

export default function CheckoutCustomerForm({
  name, cpf, email, phone, errors,
  onName, onCpf, onEmail, onPhone, onValidate,
}: Props) {
  const inputCls = 'w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary transition-all'

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
      <h3 className="font-syne font-bold text-sm">Dados pessoais</h3>
      <div>
        <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
          Nome completo *
        </label>
        <input
          required
          className={`${inputCls} ${errors.name ? 'border-warm' : ''}`}
          value={name}
          onChange={e => onName(e.target.value)}
          onBlur={onValidate}
          placeholder="Seu nome"
        />
        {errors.name && <p className="text-xs text-warm mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
          CPF *
        </label>
        <MaskedInput
          mask="cpf"
          className={`${inputCls} ${errors.cpf ? 'border-warm' : ''}`}
          value={cpf}
          onChange={onCpf}
          onBlur={onValidate}
          placeholder="000.000.000-00"
        />
        {errors.cpf && <p className="text-xs text-warm mt-1">{errors.cpf}</p>}
      </div>
      <div>
        <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
          E-mail *
        </label>
        <input
          type="email"
          required
          className={`${inputCls} ${errors.email ? 'border-warm' : ''}`}
          value={email}
          onChange={e => onEmail(e.target.value)}
          onBlur={onValidate}
          placeholder="email@exemplo.com"
        />
        {errors.email && <p className="text-xs text-warm mt-1">{errors.email}</p>}
      </div>
      <div>
        <label className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1.5">
          WhatsApp *
        </label>
        <MaskedInput
          mask="phone"
          className={`${inputCls} ${errors.phone ? 'border-warm' : ''}`}
          value={phone}
          onChange={onPhone}
          onBlur={onValidate}
          placeholder="(11) 99999-9999"
        />
        {errors.phone && <p className="text-xs text-warm mt-1">{errors.phone}</p>}
      </div>
    </div>
  )
}
