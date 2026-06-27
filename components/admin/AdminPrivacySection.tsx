'use client'

import { useEffect, useState } from 'react'
import { Download, Shield } from 'lucide-react'
import MaskedInput from '@/components/ui/MaskedInput'
import SectionHeader from '@/components/admin/SectionHeader'
import { adminCard } from '@/lib/admin-ui'
import { digitsOnly } from '@/lib/masks'

export default function AdminPrivacySection() {
  const [clientPhone, setClientPhone] = useState('')
  const [anonLoading, setAnonLoading] = useState(false)
  const [anonMsg, setAnonMsg] = useState('')
  const [anonErr, setAnonErr] = useState('')

  const [exportLoading, setExportLoading] = useState(false)
  const [exportErr, setExportErr] = useState('')

  const [deletePwd, setDeletePwd] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [hasPassword, setHasPassword] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteErr, setDeleteErr] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!deleteOpen) return
    let cancelled = false
    void fetch('/api/auth/account')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled || !data) return
        setHasPassword(Boolean(data.hasPassword))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [deleteOpen])

  async function handleAnonymize() {
    setAnonErr('')
    setAnonMsg('')
    const digits = digitsOnly(clientPhone)
    if (digits.length < 10) {
      setAnonErr('Informe um WhatsApp válido.')
      return
    }

    setAnonLoading(true)
    try {
      const res = await fetch('/api/admin/privacidade/excluir-cliente', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ customerWhatsapp: digits }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAnonErr(typeof data.error === 'string' ? data.error : 'Erro ao anonimizar.')
        return
      }
      const n = typeof data.updated === 'number' ? data.updated : 0
      setAnonMsg(n > 0 ? `${n} pedido(s) anonimizado(s).` : 'Nenhum pedido encontrado para este WhatsApp.')
      if (n > 0) setClientPhone('')
    } catch {
      setAnonErr('Erro de conexão.')
    } finally {
      setAnonLoading(false)
    }
  }

  async function handleExport() {
    setExportErr('')
    setExportLoading(true)
    try {
      const res = await fetch('/api/admin/privacidade/export')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setExportErr(typeof data.error === 'string' ? data.error : 'Erro ao exportar.')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vendai-dados-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportErr('Erro de conexão.')
    } finally {
      setExportLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteErr('')
    if (hasPassword) {
      if (deletePwd.length < 6) {
        setDeleteErr('Confirme sua senha (mín. 6 caracteres).')
        return
      }
    } else if (!deleteConfirm) {
      setDeleteErr('Marque a confirmação para excluir a conta.')
      return
    }

    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/privacidade/excluir-conta', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(
          hasPassword
            ? { password: deletePwd }
            : { confirmDelete: true as const },
        ),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteErr(typeof data.error === 'string' ? data.error : 'Erro ao excluir conta.')
        return
      }
      window.location.href = '/admin?conta-excluida=1'
    } catch {
      setDeleteErr('Erro de conexão.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className={`${adminCard} flex flex-col gap-4`}>
      <SectionHeader
        title="Privacidade e LGPD"
        description="Anonimize dados de clientes, exporte seus dados ou solicite exclusão da conta."
      />

      <div className="flex items-center gap-2 text-muted">
        <Shield size={16} className="shrink-0" aria-hidden />
        <p className="text-xs break-words">
          Como lojista, você é controlador dos dados dos seus clientes. O vendai.club atua como operador.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Anonimizar pedidos de um cliente</p>
        <p className="text-xs text-muted break-words">
          Remove nome, WhatsApp e endereço dos pedidos vinculados ao número informado (Art. 18, LGPD).
        </p>
        <MaskedInput
          mask="phone"
          value={clientPhone}
          onChange={setClientPhone}
          placeholder="WhatsApp do cliente"
          className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-xl text-sm outline-none focus:border-primary"
        />
        {anonErr && <p className="text-xs text-warm break-words">{anonErr}</p>}
        {anonMsg && <p className="text-xs text-primary break-words">{anonMsg}</p>}
        <button
          type="button"
          disabled={anonLoading}
          onClick={() => void handleAnonymize()}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-surface2 border border-border rounded-xl text-sm hover:border-primary transition-colors disabled:opacity-50"
        >
          {anonLoading ? 'Processando…' : 'Anonimizar pedidos'}
        </button>
      </div>

      <div className="pt-3 border-t border-border space-y-2">
        <p className="text-sm font-medium">Portabilidade de dados</p>
        <p className="text-xs text-muted break-words">
          Baixe uma cópia dos dados da sua loja em JSON (produtos, pedidos, configurações).
        </p>
        {exportErr && <p className="text-xs text-warm break-words">{exportErr}</p>}
        <button
          type="button"
          disabled={exportLoading}
          onClick={() => void handleExport()}
          className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 border border-border rounded-xl text-sm inline-flex items-center justify-center gap-2 hover:border-primary transition-colors disabled:opacity-50"
        >
          <Download size={16} aria-hidden />
          {exportLoading ? 'Preparando…' : 'Exportar meus dados'}
        </button>
      </div>

      <div className="pt-3 border-t border-border space-y-2">
        <p className="text-sm font-medium text-warm">Exclusão de conta</p>
        <p className="text-xs text-muted break-words">
          Remove permanentemente sua loja, produtos e conta. Pedidos são excluídos em cascata.
        </p>
        {!deleteOpen ? (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 border border-warm/30 text-warm text-sm rounded-xl hover:bg-warm/10 transition-colors"
          >
            Solicitar exclusão de conta
          </button>
        ) : (
          <div className="space-y-2">
            {hasPassword ? (
              <input
                type="password"
                className="w-full min-h-[44px] px-4 py-3 bg-surface2 border border-border rounded-xl text-sm"
                placeholder="Confirme sua senha"
                value={deletePwd}
                onChange={e => setDeletePwd(e.target.value)}
              />
            ) : (
              <label className="flex items-start gap-3 min-h-[44px] cursor-pointer text-muted">
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.checked)}
                  className="mt-1 shrink-0 w-5 h-5 rounded border-border accent-primary"
                />
                <span className="text-xs leading-relaxed break-words">
                  Entendo que esta ação é permanente e desejo excluir minha conta.
                </span>
              </label>
            )}
            {deleteErr && <p className="text-xs text-warm break-words">{deleteErr}</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false)
                  setDeletePwd('')
                  setDeleteConfirm(false)
                  setDeleteErr('')
                }}
                className="flex-1 min-h-[44px] border border-border rounded-xl text-sm text-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => void handleDeleteAccount()}
                className="flex-1 min-h-[44px] bg-warm/10 border border-warm/30 text-warm rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {deleteLoading ? 'Excluindo…' : 'Confirmar exclusão'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
