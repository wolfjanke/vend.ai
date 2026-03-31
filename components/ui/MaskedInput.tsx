'use client'

import { maskCep, maskCurrencyFromDigits, maskPhone } from '@/lib/masks'

type Mask = 'phone' | 'currency' | 'cep' | 'none'

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  mask:       Mask
  value:      string
  onChange:   (value: string) => void
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}

export default function MaskedInput({
  mask,
  value,
  onChange,
  onBlur,
  className = '',
  inputMode,
  ...rest
}: Props) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (mask === 'phone') onChange(maskPhone(raw))
    else if (mask === 'currency') {
      const next = maskCurrencyFromDigits(raw)
      onChange(next)
    }
    else if (mask === 'cep') onChange(maskCep(raw))
    else onChange(raw)
  }

  const im =
    inputMode ?? (mask === 'currency' || mask === 'phone' || mask === 'cep' ? 'numeric' : undefined)

  return (
    <input
      {...rest}
      type="text"
      inputMode={im}
      autoComplete={rest.autoComplete ?? (mask === 'cep' ? 'postal-code' : mask === 'phone' ? 'tel' : undefined)}
      value={value}
      onChange={handleChange}
      className={className}
    />
  )
}
