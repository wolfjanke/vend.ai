function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isSafeHref(href: string): boolean {
  const trimmed = href.trim()
  if (/^https?:\/\//i.test(trimmed)) return true
  // Rotas internas da vitrine (/loja/produto/slug)
  return /^\/(?!\/)[^\s]*\/produto\/[^\s#?]+/.test(trimmed)
}

/**
 * Renderiza markdown leve (negrito, links, quebras) com escape HTML.
 * Links permitem https://, http:// (dev) e rotas /slug/produto/... da vitrine.
 */export function renderSafeMarkdown(text: string): string {
  const safe = escapeHtml(text)
  return safe
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, label: string, href: string) => {
        if (!isSafeHref(href)) return label
        const trimmed = href.trim()
        const isExternal = /^https?:\/\//i.test(trimmed)
        const rel = isExternal ? ' rel="noopener noreferrer"' : ''
        const target = isExternal ? ' target="_blank"' : ''
        const safeHref = trimmed.replace(/"/g, '&quot;')
        return `<a href="${safeHref}"${target}${rel} class="vi-message-link text-primary underline font-semibold break-all">${label}</a>`
      },
    )
    .replace(/\n/g, '<br />')
}
