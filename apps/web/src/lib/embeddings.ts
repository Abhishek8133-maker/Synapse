export class EmbeddingService {
  private apiKey: string
  private model: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || ''
    this.model = 'text-embedding-3-small' // More cost-effective than ada-002
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured for embeddings')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: this.model,
          encoding_format: 'float',
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI embedding error: ${response.status}`)
      }

      const data = await response.json()
      return data.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    // Process in batches to avoid rate limits
    const batchSize = 10
    const embeddings: number[][] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      )
      embeddings.push(...batchEmbeddings)

      // Add delay between batches to avoid rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return embeddings
  }

  async searchEmbedding(query: string, existingEmbeddings: number[][]): Promise<{
    similarities: number[]
    sortedIndices: number[]
  }> {
    const queryEmbedding = await this.generateEmbedding(query)

    const similarities = existingEmbeddings.map(embedding =>
      this.cosineSimilarity(queryEmbedding, embedding)
    )

    // Get sorted indices
    const sortedIndices = similarities
      .map((similarity, index) => ({ similarity, index }))
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.index)

    return {
      similarities,
      sortedIndices,
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must be the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  // Fallback to local embeddings if OpenAI is not available
  async generateLocalEmbedding(text: string): Promise<number[]> {
    // Simple TF-IDF-like embedding for fallback
    // This is a very basic implementation
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)

    // Create a simple frequency vector
    const wordFreq = new Map<string, number>()
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    })

    // Convert to fixed-size vector (first 100 dimensions)
    const vector = new Array(100).fill(0)
    let index = 0

    for (const [word, freq] of wordFreq) {
      if (index >= 100) break
      // Simple hash-based embedding
      const hash = this.simpleHash(word)
      vector[index] = (hash % 1000) / 1000 * (freq / words.length)
      index++
    }

    return vector
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService()