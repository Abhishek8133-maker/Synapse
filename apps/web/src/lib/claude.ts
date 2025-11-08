import { ClaudeRequest, ClaudeResponse, ThoughtType } from '@synapse/shared-types'

export class ClaudeService {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.LITELLM_PROXY_URL || 'http://localhost:4000'
    this.apiKey = process.env.LITELLM_PROXY_API_KEY || ''
  }

  async completion(request: ClaudeRequest): Promise<ClaudeResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        max_tokens: request.max_tokens || 1000,
        temperature: request.temperature || 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async classifyContent(content: string, context?: any): Promise<{
    type: ThoughtType
    title: string
    tags: string[]
    metadata: any
  }> {
    const prompt = `You are Synapse, an intelligent content classifier. Analyze the following content and classify it.

Content: "${content}"
Context: ${context ? JSON.stringify(context, null, 2) : 'None'}

Respond with a JSON object in this exact format:
{
  "type": "product|quote|article|todo|note|image|video",
  "title": "Brief, descriptive title (max 100 chars)",
  "tags": ["tag1", "tag2", "tag3"],
  "metadata": {
    "author": "Author name (if applicable)",
    "source": "Source name (if applicable)",
    "price": 29.99,
    "currency": "USD",
    "brand": "Brand name (if product)",
    "priority": "low|medium|high (if todo)",
    "due_date": "2024-01-15 (if todo)",
    "subtasks": ["task1", "task2"] (if todo)
  }
}

Classification rules:
- Product: Contains price, shopping-related terms, brand names
- Quote: Text in quotes, attributed statements, wisdom/advice
- Article: Long text with author, publication, reading time indicators
- Todo: Action items, tasks, checklists, things to do
- Note: General information, personal thoughts, everything else
- Image/Video: Media content descriptions

Only include relevant metadata fields. Use null for missing values.`

    try {
      const response = await this.completion({
        model: 'litellm_proxy/claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.1,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from Claude')
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Claude')
      }

      const classification = JSON.parse(jsonMatch[0])

      // Validate and clean the response
      return {
        type: classification.type || ThoughtType.NOTE,
        title: classification.title || 'Untitled',
        tags: Array.isArray(classification.tags) ? classification.tags : [],
        metadata: classification.metadata || {},
      }
    } catch (error) {
      console.error('Error classifying content:', error)

      // Fallback classification
      return {
        type: ThoughtType.NOTE,
        title: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        tags: [],
        metadata: {},
      }
    }
  }

  async processSearchQuery(query: string): Promise<{
    intent: 'search' | 'save' | 'summarize'
    contentTypes: ThoughtType[]
    timeFilters: { type: 'relative'; value: string } | null
    keywords: string[]
    semanticQuery: string
    filters: any
  }> {
    const prompt = `You are Synapse search analyzer. Convert this natural language query into a structured search:

Query: "${query}"

Respond with JSON in this format:
{
  "intent": "search|save|summarize",
  "contentTypes": ["product", "quote", "article", "todo", "note", "image", "video"],
  "timeFilters": {"type": "relative", "value": "30d|7d|1d|today"} or null,
  "keywords": ["keyword1", "keyword2"],
  "semanticQuery": "semantic search query",
  "filters": {
    "priceRange": {"max": 300} or null,
    "authors": ["author1"] or null,
    "sources": ["source1"] or null,
    "tags": ["tag1"] or null
  }
}

Examples:
"AI articles from last month" → {"contentTypes": ["article"], "timeFilters": {"type": "relative", "value": "30d"}}
"Black leather shoes under $300" → {"contentTypes": ["product"], "filters": {"priceRange": {"max": 300}}}
"Karpathy quote on tokenization" → {"contentTypes": ["quote"], "keywords": ["Karpathy", "tokenization"]}`

    try {
      const response = await this.completion({
        model: 'litellm_proxy/claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from Claude')
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Claude')
      }

      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('Error processing search query:', error)

      // Fallback processing
      return {
        intent: 'search',
        contentTypes: [],
        timeFilters: null,
        keywords: query.split(' ').filter(word => word.length > 2),
        semanticQuery: query,
        filters: null,
      }
    }
  }

  async generateSummary(content: string): Promise<string> {
    const prompt = `Summarize the following content in 2-3 sentences:

${content}

Focus on the key points and main insights. Keep it concise and informative.`

    try {
      const response = await this.completion({
        model: 'litellm_proxy/claude-3-haiku',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3,
      })

      return response.choices[0]?.message?.content || 'Summary not available'
    } catch (error) {
      console.error('Error generating summary:', error)
      return content.substring(0, 200) + '...'
    }
  }
}

// Singleton instance
export const claudeService = new ClaudeService()