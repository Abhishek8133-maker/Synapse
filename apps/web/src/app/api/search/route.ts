import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { claudeService } from '@/lib/claude'
import { ThoughtModel } from '@synapse/database'
import { SearchQuerySchema, SearchResponseSchema } from '@synapse/shared-types'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { query, limit = 20, offset = 0, filters = {} } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      )
    }

    // Process query with Claude to understand intent
    const queryUnderstanding = await claudeService.processSearchQuery(query)

    // Search thoughts using processed query
    let thoughts = await ThoughtModel.search(session.user.id, query, {
      limit,
      offset,
      types: queryUnderstanding.contentTypes.length > 0 ? queryUnderstanding.contentTypes : undefined,
      tags: filters.tags || queryUnderstanding.filters?.tags,
    })

    // Apply additional filters
    if (queryUnderstanding.filters?.priceRange && thoughts.length > 0) {
      thoughts = thoughts.filter(thought => {
        if (thought.type === 'product' && thought.metadata?.price) {
          const price = thought.metadata.price as number
          const maxPrice = queryUnderstanding.filters?.priceRange?.max
          return maxPrice ? price <= maxPrice : true
        }
        return false
      })
    }

    // Apply time filters
    if (queryUnderstanding.timeFilters) {
      const now = new Date()
      const filterDate = new Date()

      switch (queryUnderstanding.timeFilters.value) {
        case '1d':
          filterDate.setDate(now.getDate() - 1)
          break
        case '7d':
          filterDate.setDate(now.getDate() - 7)
          break
        case '30d':
          filterDate.setDate(now.getDate() - 30)
          break
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
      }

      thoughts = thoughts.filter(thought =>
        new Date(thought.created_at) >= filterDate
      )
    }

    // Format search results
    const results = thoughts.map(thought => ({
      id: thought.id,
      type: thought.type,
      title: thought.title,
      content: thought.content,
      relevanceScore: calculateRelevanceScore(thought, query, queryUnderstanding),
      highlights: extractHighlights(thought, queryUnderstanding.keywords),
      metadata: thought.metadata,
    }))

    // Calculate facets
    const facets = {
      types: thoughts.reduce((acc, thought) => {
        acc[thought.type] = (acc[thought.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      sources: thoughts.reduce((acc, thought) => {
        if (thought.source_url) {
          try {
            const domain = new URL(thought.source_url).hostname
            acc[domain] = (acc[domain] || 0) + 1
          } catch (_) {
            // Invalid URL, skip
          }
        }
        return acc
      }, {} as Record<string, number>),
      tags: thoughts.reduce((acc, thought) => {
        thought.tags?.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1
        })
        return acc
      }, {} as Record<string, number>),
    }

    const searchResponse: any = {
      queryUnderstanding,
      results,
      total: thoughts.length,
      facets,
    }

    return NextResponse.json({
      success: true,
      data: searchResponse,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateRelevanceScore(
  thought: any,
  query: string,
  queryUnderstanding: any
): number {
  let score = 0

  // Exact type match bonus
  if (queryUnderstanding.contentTypes.includes(thought.type)) {
    score += 0.3
  }

  // Keyword matching
  queryUnderstanding.keywords?.forEach((keyword: string) => {
    const lowerKeyword = keyword.toLowerCase()
    if (thought.title.toLowerCase().includes(lowerKeyword)) {
      score += 0.2
    }
    if (thought.content.toLowerCase().includes(lowerKeyword)) {
      score += 0.1
    }
    if (thought.tags?.some((tag: string) => tag.toLowerCase().includes(lowerKeyword))) {
      score += 0.15
    }
  })

  // Recency boost (newer content gets slight boost)
  const daysSinceCreation = (Date.now() - new Date(thought.created_at).getTime()) / (1000 * 60 * 60 * 24)
  const recencyBoost = Math.max(0, 0.1 - (daysSinceCreation / 365) * 0.1)
  score += recencyBoost

  // Cap at 1.0
  return Math.min(score, 1.0)
}

function extractHighlights(thought: any, keywords: string[]): string[] {
  if (!keywords || keywords.length === 0) return []

  const highlights: string[] = []
  const content = thought.content.toLowerCase()

  keywords.forEach(keyword => {
    const lowerKeyword = keyword.toLowerCase()
    const index = content.indexOf(lowerKeyword)
    if (index !== -1) {
      const start = Math.max(0, index - 20)
      const end = Math.min(content.length, index + keyword.length + 20)
      const snippet = thought.content.substring(start, end)
      highlights.push(snippet)
    }
  })

  return highlights.slice(0, 3) // Max 3 highlights
}