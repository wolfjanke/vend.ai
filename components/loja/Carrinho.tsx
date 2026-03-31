'use client'

import { useState } from 'react'
import type { CartItem, DeliveryAddress } from '@/types'
import MaskedInput from '@/components/ui/MaskedInput'
import CepInput from '@/components/ui/CepInput'

interface Props {
  isOpen:     boolean
  cart:       CartItem[]
  onClose:    () => void
  onChangeQty:(idx: number, delta: number) => void
  onRemove:   (idx: number) => void
  onCheckout: (name: string, phone: string, notes: string, delivery: DeliveryAddress) => Promise<void>
}

export default function Carrinho({ isOpen, cart, onClose, onChangeQty, onRemove, onCheckout }: Props) {
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [notes,   setNotes]   = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})

  const total = cart.reduce((s, c) => s + c.price * c.qty, 0)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Informe seu nome'
    if (!phone.trim()) e.phone = 'Informe seu WhatsApp'
    else {
      const d = phone.replace(/\D/g, '')
      if (d.length < 10 || d.length > 11) e.phone = 'WhatsApp inválido'
    }
    if (!logradouro.trim()) e.logradouro = 'Informe o endereço'
    if (!numero.trim()) e.numero = 'Informe o número'
    if (!bairro.trim()) e.bairro = 'Informe o bairro'
    if (!cidade.trim()) e.cidade = 'Informe a cidade'
    if (!uf.trim() || uf.length !== 2) e.uf = 'UF inválida'
    const cepD = cep.replace(/\D/g, '')
    if (cepD.length !== 8) e.cep = 'CEP inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleCheckout() {
    if (!validate()) return

    setLoading(true)
    try {
      const delivery: DeliveryAddress = {
        cep:         cep.includes('-') ? cep : `${cep.slice(0, 5)}-${cep.slice(5)}`,
        logradouro:  logradouro.trim(),
        numero:      numero.trim(),
        complemento: complemento.trim() || undefined,
        bairro:      bairro.trim(),
        cidade:      cidade.trim(),
        uf:          uf.trim().toUpperCase(),
      }
      await onCheckout(name.trim(), phone.trim(), notes.trim(), delivery)
      setName(''); setPhone(''); setNotes('')
      setCep(''); setLogradouro(''); setNumero(''); setComplemento('')
      setBairro(''); setCidade(''); setUf('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[200] bg-bg/85 backdrop-blur-[8px] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 right-0 bottom-0 z-[201] w-full max-w-[420px] bg-surface border-l border-border flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2 font-syne font-bold text-base sm:text-lg min-w-0">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <span className="truncate">Seu Carrinho</span>
          </div>
          <button type="button" onClick={onClose} className="min-h-[44px] min-w-[44px] bg-surface2 border border-border rounded-lg flex items-center justify-center text-muted hover:text-foreground transition-colors shrink-0" aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted text-center">
              <span className="text-5xl opacity-40">🛍️</span>
              <p>Seu carrinho está vazio</p>
              <p className="text-xs">Adicione produtos para começar</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {cart.map((item, i) => (
                <div key={`${item.product_id}-${item.size}-${item.variant_id}`} className="flex gap-3 py-3.5 border-b border-border last:border-0">
                  <div className="w-[60px] h-[75px] bg-surface2 rounded-xl flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                    {item.photo
                      ? <img src={item.photo} alt="" className="w-full h-full object-cover" />
                      : '👗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{item.name}</div>
                    <div className="text-xs text-muted mb-2 break-words">
                      {item.color && `${item.color} • `}Tamanho: {item.size}
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-accent font-bold text-sm">
                        R${(item.price * item.qty).toFixed(2).replace('.', ',')}
                      </span>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => onChangeQty(i, -1)} className="min-w-[32px] min-h-[32px] bg-surface2 border border-border rounded-lg flex items-center justify-center text-foreground text-base hover:border-primary hover:text-primary transition-colors">−</button>
                        <span className="text-sm font-semibold min-w-[16px] text-center">{item.qty}</span>
                        <button type="button" onClick={() => onChangeQty(i, 1)}  className="min-w-[32px] min-h-[32px] bg-surface2 border border-border rounded-lg flex items-center justify-center text-foreground text-base hover:border-primary hover:text-primary transition-colors">+</button>
                      </div>
                    </div>
                    <button type="button" onClick={() => onRemove(i)} className="text-warm text-xs mt-1.5 opacity-70 hover:opacity-100 transition-opacity">✕ Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-5 border-t border-border bg-surface shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="flex justify-between items-center mb-4 font-syne">
            <span className="text-muted text-sm">Total</span>
            <span className="text-accent text-xl font-extrabold">R${total.toFixed(2).replace('.', ',')}</span>
          </div>

          {cart.length > 0 && (
            <div className="flex flex-col gap-2.5 mb-4">
              <div>
                <input
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-foreground text-sm outline-none transition-all placeholder:text-muted ${errors.name ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
                  placeholder="👤 Seu nome completo"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(p => { const n = { ...p }; delete n.name; return n }) }}
                />
                {errors.name && <p className="text-xs text-warm mt-1">{errors.name}</p>}
              </div>

              <div>
                <MaskedInput
                  mask="phone"
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-foreground text-sm outline-none transition-all placeholder:text-muted ${errors.phone ? 'border-warm' : 'border-border focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)]'}`}
                  placeholder="📱 Seu WhatsApp (11) 99999-9999"
                  value={phone}
                  onChange={v => { setPhone(v); setErrors(p => { const n = { ...p }; delete n.phone; return n }) }}
                  autoComplete="tel"
                />
                {errors.phone && <p className="text-xs text-warm mt-1">{errors.phone}</p>}
              </div>

              <p className="text-xs font-bold text-muted uppercase tracking-wider pt-1">Entrega</p>
              <div>
                <label className="text-[11px] text-muted block mb-1">CEP</label>
                <CepInput
                  value={cep}
                  onChange={setCep}
                  onFilled={d => {
                    setLogradouro(d.logradouro)
                    setBairro(d.bairro)
                    setCidade(d.cidade)
                    setUf(d.uf)
                  }}
                />
                {errors.cep && <p className="text-xs text-warm mt-1">{errors.cep}</p>}
              </div>
              <div>
                <label className="text-[11px] text-muted block mb-1">Logradouro</label>
                <input
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-sm outline-none ${errors.logradouro ? 'border-warm' : 'border-border focus:border-primary'}`}
                  value={logradouro}
                  onChange={e => setLogradouro(e.target.value)}
                  placeholder="Rua, Avenida…"
                />
                {errors.logradouro && <p className="text-xs text-warm mt-1">{errors.logradouro}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-muted block mb-1">Número</label>
                  <input
                    className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-sm ${errors.numero ? 'border-warm' : 'border-border'}`}
                    value={numero}
                    onChange={e => setNumero(e.target.value)}
                  />
                  {errors.numero && <p className="text-xs text-warm mt-1">{errors.numero}</p>}
                </div>
                <div>
                  <label className="text-[11px] text-muted block mb-1">Complemento</label>
                  <input
                    className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-sm"
                    value={complemento}
                    onChange={e => setComplemento(e.target.value)}
                    placeholder="Apto…"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted block mb-1">Bairro</label>
                <input
                  className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-sm ${errors.bairro ? 'border-warm' : 'border-border'}`}
                  value={bairro}
                  onChange={e => setBairro(e.target.value)}
                />
                {errors.bairro && <p className="text-xs text-warm mt-1">{errors.bairro}</p>}
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div>
                  <label className="text-[11px] text-muted block mb-1">Cidade</label>
                  <input
                    className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-sm ${errors.cidade ? 'border-warm' : 'border-border'}`}
                    value={cidade}
                    onChange={e => setCidade(e.target.value)}
                  />
                  {errors.cidade && <p className="text-xs text-warm mt-1">{errors.cidade}</p>}
                </div>
                <div className="w-20">
                  <label className="text-[11px] text-muted block mb-1">UF</label>
                  <input
                    className={`w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border rounded-xl text-sm uppercase ${errors.uf ? 'border-warm' : 'border-border'}`}
                    value={uf}
                    maxLength={2}
                    onChange={e => setUf(e.target.value.toUpperCase())}
                  />
                  {errors.uf && <p className="text-xs text-warm mt-1">{errors.uf}</p>}
                </div>
              </div>

              <input
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary focus:shadow-[0_0_0_3px_var(--primary-dim)] transition-all placeholder:text-muted"
                placeholder="📝 Observações (opcional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full min-h-[48px] py-3.5 bg-accent text-bg font-syne font-extrabold text-base rounded-[14px] flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_6px_30px_var(--accent-glow)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            {loading ? 'Enviando…' : 'Finalizar pelo WhatsApp'}
          </button>
        </div>
      </div>
    </>
  )
}
