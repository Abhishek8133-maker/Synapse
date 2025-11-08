import { ThoughtType, Thought, SearchQuery } from '@synapse/shared-types'

// Utility functions for content processing
export function generateThoughtTitle(content: string, type: ThoughtType): string {
  if (!content) return 'Untitled'

  const maxLength = 100
  let title = content

  // Remove HTML tags and extra whitespace
  title = title.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

  if (title.length <= maxLength) {
    return title
  }

  // Truncate at word boundary
  const truncated = title.substring(0, maxLength).trim()
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
}

export function generateThoughtType(content: string, context?: any): ThoughtType {
  // Basic heuristics for thought type detection
  const lowerContent = content.toLowerCase()

  // Check for URLs
  if (content.match(/^https?:\/\//) || content.match(/www\.\S+/)) {
    return ThoughtType.ARTICLE
  }

  // Check for product indicators
  if (lowerContent.includes('$') || lowerContent.includes('price') ||
      lowerContent.includes('buy') || lowerContent.includes('shop')) {
    return ThoughtType.PRODUCT
  }

  // Check for todo indicators
  if (lowerContent.includes('todo') || lowerContent.includes('task') ||
      lowerContent.match(/^\s*[-*+]\s/) || lowerContent.match(/^\d+\.\s/)) {
    return ThoughtType.TODO
  }

  // Check for quote indicators
  if (content.match(/^["']/) || context?.selectedElement === 'blockquote' ||
      lowerContent.includes('said') || lowerContent.includes('according to')) {
    return ThoughtType.QUOTE
  }

  // Default to note
  return ThoughtType.NOTE
}

export function extractKeywords(content: string): string[] {
  if (!content) return []

  // Simple keyword extraction
  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !isStopWord(word))

  // Count frequency and return top 5
  const frequency: Record<string, number> = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })

  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'been',
    'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
    'shall', 'must', 'does', 'did', 'do', 'a', 'an', 'as', 'if', 'when', 'where',
    'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
    'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs'
  ])

  return stopWords.has(word)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()

  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 30) {
    return formatDate(date)
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength).trim()
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
}

export function highlightSearchTerms(text: string, terms: string[]): string {
  if (!terms || terms.length === 0) return text

  let highlightedText = text
  terms.forEach(term => {
    if (!term) return
    const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi')
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
  })

  return highlightedText
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildSearchQuery(query: string): SearchQuery {
  return {
    query,
    limit: 20,
    offset: 0,
    filters: {}
  }
}

export function extractSearchFilters(query: string): {
  cleanQuery: string
  filters: Partial<SearchQuery['filters']>
} {
  const filters: Partial<SearchQuery['filters']> = {}
  let cleanQuery = query

  // Extract content type filters
  const contentTypes = ['product', 'quote', 'article', 'todo', 'note', 'image', 'video']
  contentTypes.forEach(type => {
    const regex = new RegExp(`\\b${type}\\b`, 'gi')
    if (regex.test(query)) {
      filters.contentTypes = filters.contentTypes || []
      filters.contentTypes.push(type as ThoughtType)
      cleanQuery = cleanQuery.replace(regex, '').trim()
    }
  })

  // Extract date range filters
  const todayMatch = cleanQuery.match(/\btoday\b/i)
  const thisWeekMatch = cleanQuery.match(/\bthis week\b/i)
  const thisMonthMatch = cleanQuery.match(/\bthis month\b/i)

  if (todayMatch) {
    filters.dateRange = 'today'
    cleanQuery = cleanQuery.replace(todayMatch[0], '').trim()
  } else if (thisWeekMatch) {
    filters.dateRange = 'thisWeek'
    cleanQuery = cleanQuery.replace(thisWeekMatch[0], '').trim()
  } else if (thisMonthMatch) {
    filters.dateRange = 'thisMonth'
    cleanQuery = cleanQuery.replace(thisMonthMatch[0], '').trim()
  }

  // Extract price range filters
  const priceRangeMatch = cleanQuery.match(/\bunder\s+\$(\d+)\b/i)
  if (priceRangeMatch) {
    filters.priceRange = { max: parseInt(priceRangeMatch[1]) }
    cleanQuery = cleanQuery.replace(priceRangeMatch[0], '').trim()
  }

  return { cleanQuery, filters }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname
  } catch (_) {
    return ''
  }
}

export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}