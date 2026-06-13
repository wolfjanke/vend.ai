'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import type { ViMessage, StoreContext } from '@/types'
import { defaultWelcomeMessage } from '@/lib/assistant-gender'
import { normalizeAssistantGender } from '@/lib/assistant-gender'

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
  const [messages,      setMessages]      = useState<ViMessage[]>([])
  const [apiMessages,   setApiMessages]   = useState<ViMessage[]>([])
  const [input,         setInput]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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
  }, [isOpen, messages.length, storeContext.name, storeContext.welcomeMessage, assistantName])

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

      const reader  = response.body.getReader()
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
      const friendly = detail && !['Erro na API', 'Resposta inválida', 'Resposta vazia'].includes(detail)
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

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function renderContent(text: string) {
    const safe = escapeHtml(text)
    return safe
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline font-semibold break-all">$1</a>',
      )
      .replace(/\n/g, '<br />')
  }

  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={onToggle}
        title={`Conversar com ${assistantName}`}
        aria-label={`Abrir chat com ${assistantName}`}
        className="vi-chat-fab fixed z-[150] w-14 h-14 min-h-[44px] min-w-[44px] bg-grad rounded-full border-none flex items-center justify-center shadow-[0_4px_20px_var(--primary-glow)] hover:scale-110 hover:shadow-[0_6px_30px_var(--primary-glow)] transition-all right-4 sm:right-7 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(1.75rem+env(safe-area-inset-bottom,0px))]"
        style={{ animation: 'floatIn 0.6s 0.5s both' }}
      >
        <div className="absolute inset-[-4px] rounded-full border-2 border-primary animate-pulse2 opacity-0" />
        <span className="text-2xl">✦</span>
      </button>

      {/* Panel */}
      <div className={`fixed z-[150] w-[340px] max-w-[min(340px,calc(100vw-24px))] bg-surface border border-border rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_var(--primary-dim)] transition-all duration-300 origin-bottom-right right-3 sm:right-7 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}`}>

        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border"
          style={{ background: 'linear-gradient(135deg, var(--theme-primary-surface), var(--accent-dim))' }}
        >
          <div className="w-9 h-9 bg-grad rounded-full flex items-center justify-center text-lg">✦</div>
          <div>
            <div className="font-syne font-bold text-sm truncate">{assistantName} — Assistente</div>
            <div className="flex items-center gap-1 text-accent text-[11px]">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-blink" />
              Online agora
            </div>
          </div>
          <button onClick={onToggle} className="ml-auto text-muted hover:text-foreground text-xl transition-colors">×</button>
        </div>

        {/* Messages */}
        <div className="h-[280px] overflow-y-auto p-3.5 flex flex-col gap-2.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
              <div
                className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed break-words min-w-0 ${
                  msg.role === 'user'
                    ? 'bg-primary/20 border border-primary/30 rounded-br-[4px]'
                    : 'bg-surface2 border border-border rounded-bl-[4px]'
                }`}
                dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
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
          <div className="flex gap-1.5 flex-wrap px-3.5 py-2 border-t border-border">
            {suggestions.map(s => (
              <button key={`${s.label}-${s.text}`} type="button" onClick={() => sendMessage(s.text)} className="px-2.5 py-1 bg-primary/10 border border-primary/30 rounded-lg text-primary text-[11px] hover:bg-primary hover:text-white transition-all">
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 px-3.5 py-3 border-t border-border">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            className="flex-1 px-3 py-2 bg-surface2 border border-border rounded-[10px] text-foreground text-[13px] outline-none focus:border-primary transition-all placeholder:text-muted"
            placeholder={`Pergunte para a ${assistantName}…`}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-9 h-9 bg-primary rounded-[10px] flex items-center justify-center text-white hover:bg-primary/80 hover:shadow-[0_0_15px_var(--primary-glow)] transition-all disabled:opacity-50 flex-shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </>
  )
}
