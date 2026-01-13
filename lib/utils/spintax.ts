/**
 * Spintax Parser
 * Löst Spintax-Syntax auf und gibt eine zufällige Variation zurück
 *
 * Beispiel:
 * "{Hallo|Hi|Hey} {{name}}, {wie geht's|was geht}?"
 * → "Hi {{name}}, was geht?"
 *
 * Unterstützt auch verschachtelte Spintax:
 * "{Hallo|Hi {dort|da}}"
 * → "Hi dort" oder "Hallo"
 */

/**
 * Löst einen Spintax-String auf und gibt eine zufällige Variation zurück
 */
export function resolveSpintax(text: string): string {
  if (!text) return text

  // Regex für Spintax: {option1|option2|option3}
  // Muss vorsichtig sein, um nicht {{variable}} zu matchen
  const spintaxRegex = /\{([^{}]*?\|[^{}]*?)\}/g

  let result = text
  let hasMatch = true

  // Iterativ auflösen für verschachtelte Spintax
  while (hasMatch) {
    hasMatch = false
    result = result.replace(spintaxRegex, (match, options) => {
      hasMatch = true
      const choices = options.split('|')
      const randomIndex = Math.floor(Math.random() * choices.length)
      return choices[randomIndex]
    })
  }

  return result
}

/**
 * Prüft ob ein Text Spintax enthält
 */
export function hasSpintax(text: string): boolean {
  if (!text) return false
  // Suche nach {x|y} aber nicht nach {{variable}}
  return /\{[^{}]*?\|[^{}]*?\}/.test(text)
}

/**
 * Gibt alle möglichen Variationen eines Spintax-Strings zurück
 * Nützlich für Preview/Vorschau
 */
export function getAllVariations(text: string, maxVariations = 10): string[] {
  const variations = new Set<string>()

  // Generiere mehrere zufällige Variationen
  for (let i = 0; i < maxVariations * 3 && variations.size < maxVariations; i++) {
    variations.add(resolveSpintax(text))
  }

  return Array.from(variations)
}
