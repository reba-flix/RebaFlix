const translatorPattern = /(?:^|\n)\s*Translator:\s*(.+?)\s*$/im

export function extractTranslator(description?: string | null) {
  return description?.match(translatorPattern)?.[1]?.trim() || null
}

export function stripTranslator(description?: string | null) {
  if (!description) return ''
  return description.replace(translatorPattern, '').trim()
}
