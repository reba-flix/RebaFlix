const translatorPattern = /(?:^|\n)\s*Translator:\s*(.+?)\s*$/im

export function extractTranslator(description?: string | null) {
  return description?.match(translatorPattern)?.[1]?.trim() || null
}

export function stripTranslator(description?: string | null) {
  if (!description) return ''
  return description.replace(translatorPattern, '').trim()
}

export function translatorMatches(description: string | null | undefined, query: string) {
  const translator = extractTranslator(description)
  return translator?.toLowerCase().includes(query.trim().toLowerCase()) ?? false
}
