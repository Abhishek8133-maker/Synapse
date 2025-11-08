import { db } from '../db'
import { Thought, ThoughtType } from '@synapse/shared-types'

// Vector search integration for Pinecone
export class VectorSearchModel {
  private pineconeApiKey: string
  private pineconeEnvironment: string
  private indexName: string

  constructor() {
    this.pineconeApiKey = process.env.PINECONE_API_KEY || ''
    this.pineconeEnvironment = process.env.PINECONE_ENVIRONMENT || ''
    this.indexName = process.env.PINECONE_INDEX || 'synapse-thoughts'
  }

  async upsertThought(thought: Thought, embedding: number[]): Promise<void> {
    if (!this.pineconeApiKey) {
      console.warn('Pinecone API key not configured, skipping vector upsert')
      return
    }

    try {
      const response = await fetch(`https://${this.indexName}-${this.pineconeEnvironment}.svc.pinecone.io/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Api-Key': this.pineconeApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vectors: [
            {
              id: thought.id,
              values: embedding,
              metadata: {
                user_id: thought.user_id,
                type: thought.type,
                title: thought.title,
                content: thought.content.substring(0, 1000), // Limit content size
                tags: thought.tags,
                created_at: thought.created_at,
                source_url: thought.source_url,
              },
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Pinecone upsert error: ${response.status}`)
      }

      // Update thought with embedding reference
      await db('thoughts')
        .where('id', thought.id)
        .update({
          embedding_id: thought.id,
          updated_at: new Date(),
        })
    } catch (error) {
      console.error('Error upserting to Pinecone:', error)
      throw error
    }
  }

  async deleteThought(thoughtId: string): Promise<void> {
    if (!this.pineconeApiKey) return

    try {
      const response = await fetch(`https://${this.indexName}-${this.pineconeEnvironment}.svc.pinecone.io/vectors/delete`, {
        method: 'POST',
        headers: {
          'Api-Key': this.pineconeApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: [thoughtId],
        }),
      })

      if (!response.ok) {
        throw new Error(`Pinecone delete error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting from Pinecone:', error)
      throw error
    }
  }

  async searchSimilar(
    userId: string,
    queryEmbedding: number[],
    options: {
      limit?: number
      type?: ThoughtType
      minScore?: number
    } = {}
  ): Promise<Array<{
    id: string
    score: number
    metadata: any
  }>> {
    if (!this.pineconeApiKey) {
      return [] // Fallback to empty results if not configured
    }

    const { limit = 20, type, minScore = 0.5 } = options

    try {
      const filter: any = {
        user_id: userId,
      }

      if (type) {
        filter.type = type
      }

      const response = await fetch(`https://${this.indexName}-${this.pineconeEnvironment}.svc.pinecone.io/query`, {
        method: 'POST',
        headers: {
          'Api-Key': this.pineconeApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vector: queryEmbedding,
          topK: limit,
          filter,
          includeMetadata: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Pinecone query error: ${response.status}`)
      }

      const result = await response.json()

      return result.matches
        .filter((match: any) => match.score >= minScore)
        .map((match: any) => ({
          id: match.id,
          score: match.score,
          metadata: match.metadata,
        }))
    } catch (error) {
      console.error('Error searching Pinecone:', error)
      return []
    }
  }

  async hybridSearch(
    userId: string,
    query: string,
    queryEmbedding: number[],
    options: {
      limit?: number
      type?: ThoughtType
      tags?: string[]
      dateRange?: string
    } = {}
  ): Promise<Array<{
    thought: Thought
    semanticScore: number
    keywordScore: number
    combinedScore: number
  }>> {
    const { limit = 20, type, tags, dateRange } = options

    // Get semantic search results
    const semanticResults = await this.searchSimilar(userId, queryEmbedding, {
      limit: limit * 2, // Get more to allow for filtering
      type,
    })

    const semanticIds = semanticResults.map(r => r.id)

    if (semanticIds.length === 0) {
      return []
    }

    // Get keyword search results
    let keywordQuery = db('thoughts')
      .where('user_id', userId)
      .where('is_archived', false)
      .where((builder) => {
        builder
          .where('title', 'ilike', `%${query}%`)
          .orWhere('content', 'ilike', `%${query}%`)
      })

    if (type) {
      keywordQuery = keywordQuery.where('type', type)
    }

    if (tags && tags.length > 0) {
      keywordQuery = keywordQuery.whereRaw('tags && ?', [tags])
    }

    // Apply date filter
    if (dateRange) {
      const filterDate = new Date()
      switch (dateRange) {
        case '1d':
          filterDate.setDate(filterDate.getDate() - 1)
          break
        case '7d':
          filterDate.setDate(filterDate.getDate() - 7)
          break
        case '30d':
          filterDate.setDate(filterDate.getDate() - 30)
          break
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
      }
      keywordQuery = keywordQuery.where('created_at', '>=', filterDate)
    }

    const keywordResults = await keywordQuery.limit(limit * 2)

    // Combine and score results
    const combinedResults = new Map<string, any>()

    // Add semantic results
    semanticResults.forEach(({ id, score, metadata }) => {
      const thought = keywordResults.find(t => t.id === id)
      if (thought) {
        combinedResults.set(id, {
          thought,
          semanticScore: score,
          keywordScore: this.calculateKeywordScore(thought, query),
          combinedScore: score * 0.7 + this.calculateKeywordScore(thought, query) * 0.3,
        })
      }
    })

    // Add keyword-only results
    keywordResults.forEach((thought) => {
      if (!combinedResults.has(thought.id)) {
        const keywordScore = this.calculateKeywordScore(thought, query)
        combinedResults.set(thought.id, {
          thought,
          semanticScore: 0,
          keywordScore,
          combinedScore: keywordScore * 0.5,
        })
      }
    })

    // Sort by combined score and return top results
    return Array.from(combinedResults.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, limit)
  }

  private calculateKeywordScore(thought: Thought, query: string): number {
    const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 2)
    let score = 0

    queryWords.forEach(word => {
      if (thought.title.toLowerCase().includes(word)) {
        score += 0.3
      }
      if (thought.content.toLowerCase().includes(word)) {
        score += 0.2
      }
      if (thought.tags?.some(tag => tag.toLowerCase().includes(word))) {
        score += 0.25
      }
    })

    // Normalize score
    return Math.min(score, 1.0)
  }

  async createUserIndex(userId: string): Promise<void> {
    // In Pinecone, we use a single index with user_id filtering
    // This method can be used for future optimization if needed
    console.log(`Vector index ready for user: ${userId}`)
  }

  async getUserStats(userId: string): Promise<{
    totalVectors: number
    indexSize: string
    lastUpdated: Date | null
  }> {
    if (!this.pineconeApiKey) {
      return {
        totalVectors: 0,
        indexSize: 'Not configured',
        lastUpdated: null,
      }
    }

    try {
      // Get index stats
      const response = await fetch(`https://${this.indexName}-${this.pineconeEnvironment}.svc.pinecone.io/describe_index_stats`, {
        method: 'GET',
        headers: {
          'Api-Key': this.pineconeApiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Pinecone stats error: ${response.status}`)
      }

      const stats = await response.json()
      const userVectorCount = stats.dimensionUsage?.[userId] || 0

      return {
        totalVectors: userVectorCount,
        indexSize: `${stats.totalVectorCount} vectors`,
        lastUpdated: new Date(), // Pinecone doesn't provide per-user lastUpdated
      }
    } catch (error) {
      console.error('Error getting Pinecone stats:', error)
      return {
        totalVectors: 0,
        indexSize: 'Error',
        lastUpdated: null,
      }
    }
  }
}

// Singleton instance
export const vectorSearchModel = new VectorSearchModel()