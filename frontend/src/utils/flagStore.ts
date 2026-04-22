/**
 * 标记（星标）管理 - 基于 localStorage
 */
const STORAGE_KEY = 'flagged_question_ids'

export function getFlagged(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set<number>()
    return new Set<number>(JSON.parse(raw))
  } catch {
    return new Set<number>()
  }
}

export function toggleFlagged(id: number): Set<number> {
  const set = getFlagged()
  if (set.has(id)) set.delete(id)
  else set.add(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
  return set
}

export function isFlagged(id: number): boolean {
  return getFlagged().has(id)
}
