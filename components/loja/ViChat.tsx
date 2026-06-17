'use client'

import { useState, useRef, useEffect, useMemo, type MouseEvent } from 'react'
import type { ViMessage, StoreContext } from '@/types'
import { defaultWelcomeMessage, normalizeAssistantGender } from '@/lib/assistant-gender'
import { renderSafeMarkdown } from '@/lib/safe-markdown'
import { enrichViProductLinks } from '@/lib/vi-message-links'

function buildViSuggestions(ctx: StoreContext): Array<{ label: string; text: string }> {
  const gf = ctx.genderFocus ?? 'feminine'
  const ag = ctx.ageGroup ?? 'adult'
  if (ag === 'kids') {
    return [
      { label: 'Infantil', text: 'Roupas infantis disponíveis' },
      { label: 'Conforto', text: 'Peças confortáveis para criança' },
      { label: 'Promoções', text: 'Promoções do dia' },
      { label: 'Tamanhos', text: 'Tem tamanho infantil 6?' },
    ]
  }
  if (gf === 'masculine') {
    return [
      { label: 'Básicos', text: 'Camisetas e bermudas' },
      { label: 'Casual', text: 'Look casual masculino' },
      { label: 'Promoções', text: 'Promoções do dia' },
      { label: 'Tamanhos', text: 'Tem tamanho M?' },
    ]
  }
  if (gf === 'unisex' || gf === 'mixed') {
    return [
      { label: 'Novidades', text: 'Novidades da loja' },
      { label: 'Casual', text: 'Looks casuais' },
      { label: 'Promoções', text: 'Promoções do dia' },
      { label: 'Tamanhos', text: 'Tem tamanho P?' },
    ]
  }
  return [
    { label: 'Festa', text: 'Vestido para festa' },
    { label: 'Casual', text: 'Looks casuais' },
    { label: 'Promoções', text: 'Promoções do dia' },
    { label: 'Tamanhos', text: 'Tem tamanho P?' },
  ]
}

interface Props {
  isOpen:                 boolean
  onToggle:               () => void
  storeContext:           StoreContext
  pendingMessage?:        string | null
  onPendingMessageShown?: () => void
}

export default function ViChat({
  isOpen,
  onToggle,
  storeContext,
  pendingMessage,
  onPendingMessageShown,
}: Props) {
  const assistantName = storeContext.assistantName?.trim() || 'Vi'
  const suggestions = useMemo(() => buildViSuggestions(storeContext), [
    storeContext.genderFocus,
    storeContext.ageGroup,
    storeContext.segmentLabel,
  ])
  const [messages, setMessages] = useState<ViMessage[]>([])
  const [apiMessages, setApiMessages] = useState<ViMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [keyboardInset, setKeyboardInset] = useState(0)
  const linkProducts = useMemo(
    () =>
      storeContext.products
        .filter(p => p.productUrl)
        .map(p => ({ name: p.name, productUrl: p.productUrl! })),
    [storeContext.products],
  )

  function renderMessageHtml(content: string): string {
    return renderSafeMarkdown(enrichViProductLinks(content, linkProducts))
  }

  function handleMessageClick(e: MouseEvent<HTMLDivElement>) {
    const anchor = (e.target as HTMLElement).closest('a')
    if (!anchor) return
    const href = anchor.getAttribute('href')
    if (!href || !href.includes('/produto/')) return

    let path = href
    if (/^https?:\/\//i.test(href)) {
      try {
        const url = new URL(href)
        if (url.origin !== window.location.origin) return
        path = `${url.pathname}${url.search}${url.hash}`
      } catch {
        return
      }
    }

    e.preventDefault()
    window.location.assign(path)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (!isOpen) {
      setKeyboardInset(0)
      return
    }

    const vv = window.visualViewport
    if (!vv) return

    const updateInset = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardInset(inset)
    }

    updateInset()
    vv.addEventListener('resize', updateInset)
    vv.addEventListener('scroll', updateInset)
    return () => {
      vv.removeEventListener('resize', updateInset)
      vv.removeEventListener('scroll', updateInset)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const isMobile = window.matchMedia('(max-width: 639px)').matches
    if (!isMobile) return

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome: ViMessage = {
        role:    'assistant',
        content:
          storeContext.welcomeMessage?.trim() ||
          defaultWelcomeMessage(
            assistantName,
            storeContext.name,
            'friendly',
            normalizeAssistantGender(storeContext.assistantGender),
          ),
      }
      setTimeout(() => setMessages([welcome]), 400)
    }
    if (isOpen) inputRef.current?.focus()
  }, [isOpen, messages.length, storeContext.name, storeContext.welcomeMessage, assistantName, storeContext.assistantGender])

  useEffect(() => {
    if (!pendingMessage?.trim()) return
    setMessages(prev => {
      if (prev.some(m => m.content === pendingMessage)) return prev
      return [...prev, { role: 'assistant', content: pendingMessage }]
    })
    setShowSuggestions(false)
    onPendingMessageShown?.()
  }, [pendingMessage, onPendingMessageShown])

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    setInput('')
    setShowSuggestions(false)

    const userMsg: ViMessage = { role: 'user', content }
    const apiNext = [...apiMessages, userMsg]
    const displayNext = [...messages, userMsg]
    setMessages(displayNext)
    setLoading(true)

    try {
      const response = await fetch('/api/vi', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: apiNext, storeContext }),
      })

      const contentType = response.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        const data = await response.json() as {
          redirectWhatsApp?: boolean
          message?:          string
          whatsappUrl?:      string
          text?:             string
          error?:            string
        }
        if (!response.ok && !data.redirectWhatsApp) {
          throw new Error(data.error ?? 'Erro na API')
        }
        if (data.redirectWhatsApp && data.message) {
          const wa = data.whatsappUrl
            ? `\n\n[Continuar no WhatsApp](${data.whatsappUrl})`
            : ''
          const assistantMsg: ViMessage = { role: 'assistant', content: `${data.message}${wa}` }
          setApiMessages([...apiNext, assistantMsg])
          setMessages([...displayNext, assistantMsg])
          return
        }
        if (data.text) {
          const assistantMsg: ViMessage = { role: 'assistant', content: data.text }
          setApiMessages([...apiNext, assistantMsg])
          setMessages([...displayNext, assistantMsg])
          return
        }
        throw new Error(data.error ?? 'Resposta inválida')
      }

      if (!response.ok || !response.body) throw new Error('Erro na API')

      const assistantMsg: ViMessage = { role: 'assistant', content: '' }
      setMessages([...displayNext, assistantMsg])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages([...displayNext, { role: 'assistant', content: accumulated }])
      }

      if (!accumulated.trim()) throw new Error('Resposta vazia')
      setApiMessages([...apiNext, { role: 'assistant', content: accumulated }])
    } catch (err) {
      const detail = err instanceof Error ? err.message : ''
      const friendly = detail && !['Erro na API', 'Resposta inválida', 'Resposta vazia', 'Erro interno'].includes(detail)
        ? detail
        : 'Desculpe, tive um problema. Tente novamente ou fale com nossa vendedora no WhatsApp!'
      setMessages([...displayNext, {
        role:    'assistant',
        content: friendly,
      }])
    } finally {
      setLoading(false)
    }
  }

  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const panelBottom =
    keyboardInset > 0 && typeof window !== 'undefined' && window.innerWidth < 640
      ? keyboardInset
      : undefined

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[149] bg-bg/50 sm:hidden border-0 p-0 cursor-default"
          aria-label="Fechar chat"
          onClick={onToggle}
        />
      )}

      {/* FAB — oculto com painel aberto */}
      <button
        type="button"
        onClick={onToggle}
        title={`Conversar com ${assistantName}`}
        aria-label={`Abrir chat com ${assistantName}`}
        aria-expanded={isOpen}
        className={[
          'vi-chat-fab fixed z-[150] w-14 h-14 min-h-[44px] min-w-[44px] bg-grad rounded-full border-none flex items-center justify-center shadow-[0_4px_20px_var(--primary-glow)] transition-all duration-300',
          'right-4 sm:right-7 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(1.75rem+env(safe-area-inset-bottom,0px))]',
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'opacity-100 scale-100 hover:scale-110 hover:shadow-[0_6px_30px_var(--primary-glow)]',
        ].join(' ')}
        style={{ animation: isOpen ? undefined : 'floatIn 0.6s 0.5s both' }}
      >
        <span className="text-2xl">✦</span>
      </button>

      {/* Panel — drawer no mobile, card no desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chat com ${assistantName}`}
        className={[
          'vi-chat-panel fixed z-[150] bg-surface border border-border overflow-hidden flex flex-col min-h-0 max-w-full',
          'shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_var(--primary-dim)] transition-all duration-300',
          'inset-x-0 bottom-0 rounded-t-3xl border-b-0',
          'max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)))]',
          'sm:inset-x-auto sm:right-7 sm:bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:w-[340px] sm:max-w-[min(340px,calc(100vw-24px))] sm:rounded-3xl sm:border-b sm:max-h-none sm:origin-bottom-right',
          isOpen
            ? 'translate-y-0 opacity-100 pointer-events-auto sm:scale-100'
            : 'translate-y-full opacity-0 pointer-events-none sm:translate-y-0 sm:opacity-0 sm:scale-90',
        ].join(' ')}
        style={panelBottom != null ? { bottom: panelBottom } : undefined}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-3.5 sm:py-3.5 border-b border-border shrink-0 pt-[max(0.875rem,env(safe-area-inset-top,0px))] sm:pt-3.5"
          style={{
            background: 'linear-gradient(135deg, var(--theme-primary-surface), var(--accent-dim))',
          }}
        >
          <div className="w-9 h-9 bg-grad rounded-full flex items-center justify-center text-lg shrink-0">✦</div>
          <div className="min-w-0">
            <div className="font-syne font-bold text-sm truncate">{assistantName} — Assistente</div>
            <div className="flex items-center gap-1 text-accent text-[11px]">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-blink shrink-0" />
              Online agora
            </div>
          </div>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Fechar chat"
            className="ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-foreground text-2xl transition-colors shrink-0"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 min-h-[180px] sm:h-[280px] sm:flex-none overflow-y-auto p-3.5 flex flex-col gap-2.5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}
        >
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
              <div
                className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words min-w-0 ${
                  msg.role === 'user'
                    ? 'bg-primary/20 border border-primary/30 rounded-br-[4px]'
                    : 'bg-surface2 border border-border rounded-bl-[4px]'
                }`}
                onClick={msg.role === 'assistant' ? handleMessageClick : undefined}
                dangerouslySetInnerHTML={{ __html: renderMessageHtml(msg.content) }}
              />
              <div className={`text-[10px] text-muted mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>{now}</div>
            </div>
          ))}

          {loading && (
            <div className="self-start flex gap-1 px-3 py-3 bg-surface2 border border-border rounded-2xl rounded-bl-[4px]">
              {[0, 0.2, 0.4].map((delay, i) => (
                <span key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-typing-dot" style={{ animationDelay: `${delay}s` }} />
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && messages.length <= 1 && (
          <div className="flex gap-2 flex-wrap px-3.5 py-2 border-t border-border shrink-0">
            {suggestions.map(s => (
              <button
                key={`${s.label}-${s.text}`}
                type="button"
                onClick={() => sendMessage(s.text)}
                className="min-h-[44px] px-3 py-2 bg-primary/10 border border-primary/30 rounded-xl text-primary text-xs font-medium hover:bg-primary hover:text-white transition-all"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div
          className="flex gap-2 px-3.5 py-3 border-t border-border shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 min-h-[44px] px-3 py-2.5 bg-surface2 border border-border rounded-xl text-foreground text-sm outline-none focus:border-primary transition-all placeholder:text-muted min-w-0"
            placeholder={`Pergunte para a ${assistantName}…`}
          />
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Enviar mensagem"
            className="min-h-[44px] min-w-[44px] bg-primary rounded-xl flex items-center justify-center text-white hover:bg-primary/80 hover:shadow-[0_0_15px_var(--primary-glow)] transition-all disabled:opacity-50 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
