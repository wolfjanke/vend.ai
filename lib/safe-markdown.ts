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
  return /^https:\/\//i.test(trimmed)
}

/**
 * Renderiza markdown leve (negrito, links, quebras) com escape HTML.
 * Links só permitem protocolo https://.
 */
export function renderSafeMarkdown(text: string): string {
  const safe = escapeHtml(text)
  return safe
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, label: string, href: string) => {
        if (!isSafeHref(href)) return label
        return `<a href="${href.trim()}" target="_blank" rel="noopener noreferrer" class="text-primary underline font-semibold break-all">${label}</a>`
      },
    )
    .replace(/\n/g, '<br />')
}
