import { z } from 'zod'

// Content types for thoughts
export enum ThoughtType {
  PRODUCT = 'product',
  QUOTE = 'quote',
  ARTICLE = 'article',
  TODO = 'todo',
  NOTE = 'note',
  IMAGE = 'image',
  VIDEO = 'video',
}

// Zod schemas for validation
export const ThoughtMetadataSchema = z.object({
  // Product metadata
  price: z.number().optional(),
  currency: z.string().optional(),
  brand: z.string().optional(),
  availability: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),

  // Article metadata
  author: z.string().optional(),
  publication: z.string().optional(),
  publish_date: z.string().optional(),
  read_time: z.number().optional(),
  word_count: z.number().optional(),

  // Todo metadata
  completed: z.boolean().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  subtasks: z.array(z.string()).optional(),

  // Common metadata
  tags: z.array(z.string()).optional(),
  source_url: z.string().optional(),
  favicon: z.string().optional(),
})

export type ThoughtMetadata = z.infer<typeof ThoughtMetadataSchema>

export const ThoughtSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: z.nativeEnum(ThoughtType),
  title: z.string(),
  content: z.string(),
  raw_content: z.any().optional(),
  metadata: ThoughtMetadataSchema.optional(),
  source_url: z.string().optional(),
  tags: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Thought = z.infer<typeof ThoughtSchema>

// Collection types
export const CollectionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type Collection = z.infer<typeof CollectionSchema>

// Search types
export const SearchQuerySchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  filters: z.object({
    contentTypes: z.array(z.nativeEnum(ThoughtType)).optional(),
    dateRange: z.string().optional(),
    sources: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    priceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  }).optional(),
})

export type SearchQuery = z.infer<typeof SearchQuerySchema>

export const SearchUnderstandingSchema = z.object({
  intent: z.enum(['search', 'save', 'summarize']),
  contentTypes: z.array(z.nativeEnum(ThoughtType)).optional(),
  timeFilters: z.object({
    type: z.enum(['absolute', 'relative']),
    value: z.string(),
  }).optional(),
  keywords: z.array(z.string()).optional(),
  semanticQuery: z.string().optional(),
  filters: z.any().optional(),
})

export type SearchUnderstanding = z.infer<typeof SearchUnderstandingSchema>

export const SearchResultSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(ThoughtType),
  title: z.string(),
  content: z.string(),
  relevanceScore: z.number().min(0).max(1),
  highlights: z.array(z.string()).optional(),
  metadata: ThoughtMetadataSchema.optional(),
})

export type SearchResult = z.infer<typeof SearchResultSchema>

export const SearchResponseSchema = z.object({
  queryUnderstanding: SearchUnderstandingSchema,
  results: z.array(SearchResultSchema),
  total: z.number(),
  facets: z.object({
    types: z.record(z.number()),
    sources: z.record(z.number()),
    tags: z.record(z.number()),
  }).optional(),
})

export type SearchResponse = z.infer<typeof SearchResponseSchema>

// Capture API types
export const CaptureTextRequestSchema = z.object({
  content: z.string(),
  context: z.object({
    url: z.string(),
    title: z.string(),
    selectedElement: z.string().optional(),
    author: z.string().optional(),
  }),
  userSuggestedType: z.nativeEnum(ThoughtType).optional(),
})

export type CaptureTextRequest = z.infer<typeof CaptureTextRequestSchema>

export const CaptureScreenshotRequestSchema = z.object({
  imageData: z.string(),
  fullPage: z.boolean().default(false),
  context: z.object({
    url: z.string(),
    title: z.string(),
  }),
})

export type CaptureScreenshotRequest = z.infer<typeof CaptureScreenshotRequestSchema>

export const CaptureUrlRequestSchema = z.object({
  url: z.string(),
  context: z.object({
    referrer: z.string().optional(),
  }),
})

export type CaptureUrlRequest = z.infer<typeof CaptureUrlRequestSchema>

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
})

export type ApiResponse = z.infer<typeof ApiResponseSchema>

// User types
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export type User = z.infer<typeof UserSchema>

// Browser extension types
export interface ExtensionMessage {
  type: 'CAPTURE_TEXT' | 'CAPTURE_SCREENSHOT' | 'CAPTURE_URL' | 'GET_PAGE_INFO'
  data: any
}

export interface PageContext {
  url: string
  title: string
  favicon?: string
  author?: string
  publishDate?: string
  selectedText?: string
  selectedElement?: string
}

// Claude AI integration types
export interface ClaudeRequest {
  model: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  max_tokens?: number
  temperature?: number
}

export interface ClaudeResponse {
  id: string
  type: string
  role: string
  content: Array<{
    type: 'text'
    text: string
  }>
  usage: {
    input_tokens: number
    output_tokens: number
  }
}