'use client'

import { useState, useRef, useEffect } from 'react'
import type { ViMessage, StoreContext } from '@/types'

const SUGGESTIONS = [
  { label: '👗 Festa',       text: 'Vestido para festa' },
  { label: '😊 Casual',      text: 'Looks casuais' },
  { label: '🔥 Promoções',   text: 'Promoções do dia' },
  { label: '📏 Tamanhos',    text: 'Tem tamanho P?' },
]

interface Props {
  isOpen:       boolean
  onToggle:     () => void
  storeContext: StoreContext
}

export default function ViChat({ isOpen, onToggle, storeContext }: Props) {
  const [messages,      setMessages]      = useState<ViMessage[]>([])
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
        content: `Olá! 👋 Sou a **Vi**, assistente da ${storeContext.name}. Me conta o que você está procurando hoje? Posso buscar por estilo, ocasião, cor ou tamanho!`,
      }
      setTimeout(() => setMessages([welcome]), 400)
    }
    if (isOpen) inputRef.current?.focus()
  }, [isOpen, messages.length, storeContext.name])

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    setInput('')
    setShowSuggestions(false)

    const userMsg: ViMessage = { role: 'user', content }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setLoading(true)

    try {
      const response = await fetch('/api/vi', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: nextMessages, storeContext }),
      })

      if (!response.ok || !response.body) throw new Error('Erro na API')

      // Streaming
      const assistantMsg: ViMessage = { role: 'assistant', content: '' }
      setMessages([...nextMessages, assistantMsg])

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages([...nextMessages, { role: 'assistant', content: accumulated }])
      }
    } catch {
      setMessages([...nextMessages, {
        role:    'assistant',
        content: 'Desculpe, tive um problema. Tente novamente ou fale com nossa vendedora no WhatsApp! 😊',
      }])
    } finally {
      setLoading(false)
    }
  }

  function renderContent(text: string) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      {/* FAB */}
      <button
        onClick={onToggle}
        className="fixed bottom-7 right-7 z-[150] w-14 h-14 bg-grad rounded-full border-none flex items-center justify-center shadow-[0_4px_20px_var(--primary-glow)] hover:scale-110 hover:shadow-[0_6px_30px_var(--primary-glow)] transition-all"
        style={{ animation: 'floatIn 0.6s 0.5s both' }}
      >
        <div className="absolute inset-[-4px] rounded-full border-2 border-primary animate-pulse2 opacity-0" />
        <span className="text-2xl">✦</span>
      </button>

      {/* Panel */}
      <div className={`fixed bottom-24 right-7 z-[150] w-[340px] max-w-[calc(100vw-20px)] bg-surface border border-border rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_0_1px_var(--primary-dim)] transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}`}>

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border" style={{ background: 'linear-gradient(135deg, #7B6EFF22, #00E5A011)' }}>
          <div className="w-9 h-9 bg-grad rounded-full flex items-center justify-center text-lg">✦</div>
          <div>
            <div className="font-syne font-bold text-sm">Vi — Assistente</div>
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
                className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
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
            {SUGGESTIONS.map(s => (
              <button key={s.label} onClick={() => sendMessage(s.text)} className="px-2.5 py-1 bg-primary/10 border border-primary/30 rounded-lg text-primary text-[11px] hover:bg-primary hover:text-white transition-all">
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
            placeholder="Pergunte para a Vi…"
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
