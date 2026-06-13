import type { AssistantTone } from '@/lib/vi-prompt'

/** Como o assistente se apresenta em português (Vi, Leo, etc.). */
export type AssistantGender = 'feminine' | 'masculine' | 'neutral'

export const ASSISTANT_GENDER_OPTIONS: Array<{
  value: AssistantGender
  label: string
  hint: string
}> = [
  { value: 'feminine', label: 'Feminino', hint: 'Ex.: "Sou a Vi"' },
  { value: 'masculine', label: 'Masculino', hint: 'Ex.: "Sou o Leo"' },
  { value: 'neutral', label: 'Neutro', hint: 'Ex.: "Sou Vi" (sem a/o)' },
]

export function normalizeAssistantGender(raw: unknown): AssistantGender {
  if (raw === 'masculine' || raw === 'neutral' || raw === 'feminine') return raw
  return 'feminine'
}

/** "Sou a Vi" / "Sou o Leo" / "Sou Vi" — com markdown opcional. */
export function assistantIntroPhrase(
  assistantName: string,
  gender: AssistantGender,
  markdown = true,
): string {
  const name = assistantName.trim() || 'Vi'
  const wrap = (n: string) => (markdown ? `**${n}**` : n)
  switch (gender) {
    case 'masculine':
      return `Sou o ${wrap(name)}`
    case 'neutral':
      return `Sou ${wrap(name)}`
    default:
      return `Sou a ${wrap(name)}`
  }
}

export function assistantNameFieldLabel(gender: AssistantGender): string {
  switch (gender) {
    case 'masculine':
    case 'neutral':
      return 'Nome do assistente'
    default:
      return 'Nome da assistente'
  }
}

export function assistantToneFieldLabel(gender: AssistantGender): string {
  switch (gender) {
    case 'masculine':
    case 'neutral':
      return 'Tom do assistente'
    default:
      return 'Tom da assistente'
  }
}

export function assistantOfficialRoleLine(
  gender: AssistantGender,
  storeName: string,
): string {
  switch (gender) {
    case 'masculine':
      return `Você é o assistente oficial da loja ${storeName}`
    case 'neutral':
      return `Você é assistente oficial da loja ${storeName} (linguagem neutra; evite artigos de gênero ao falar de si)`
    default:
      return `Você é a assistente oficial da loja ${storeName}`
  }
}

export function assistantGenderPromptInstructions(
  gender: AssistantGender,
  assistantName: string,
): string {
  const name = assistantName.trim() || 'Vi'
  switch (gender) {
    case 'masculine':
      return `Use masculino ao falar de si: "sou o ${name}", pronomes e adjetivos no masculino.`
    case 'neutral':
      return `Use linguagem neutra: prefira "sou ${name}" (sem "a/o"), evite feminino/masculino forçado ao falar de si.`
    default:
      return `Use feminino ao falar de si: "sou a ${name}", pronomes e adjetivos no feminino.`
  }
}

export function defaultWelcomeMessage(
  assistantName: string,
  storeName: string,
  tone: AssistantTone = 'friendly',
  gender: AssistantGender = 'feminine',
): string {
  const greet =
    tone === 'friendly' || tone === 'playful'
      ? 'Olá! 👋 '
      : 'Olá! '
  return `${greet}${assistantIntroPhrase(assistantName, gender)}, assistente da ${storeName}. Me conta o que você está procurando hoje? Posso buscar por estilo, ocasião, cor ou tamanho!`
}

export function welcomePreviewPlain(
  assistantName: string,
  storeName: string,
  tone: AssistantTone,
  gender: AssistantGender,
): string {
  return defaultWelcomeMessage(assistantName, storeName, tone, gender).replace(/\*\*/g, '')
}
