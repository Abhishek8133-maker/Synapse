import { NextRequest, NextResponse } from 'next/server'
import { embeddingService } from '@/lib/embeddings'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing OpenAI API connection with provided key...')

    // Test basic embedding generation
    const testText = "Synapse is a personal knowledge management system that helps you capture and organize your thoughts."

    const embedding = await embeddingService.generateEmbedding(testText)

    // Test similarity search
    const queryText = "AI-powered knowledge management"
    const queryEmbedding = await embeddingService.generateEmbedding(queryText)

    // Calculate similarity
    const similarity = cosineSimilarity(embedding, queryEmbedding)

    return NextResponse.json({
      success: true,
      message: "✅ OpenAI API key is working correctly!",
      results: {
        embedding_dimensions: embedding.length,
        test_text_length: testText.length,
        query_text_length: queryText.length,
        similarity_score: similarity,
        sample_embedding: embedding.slice(0, 5), // First 5 dimensions
        api_key_status: "valid"
      }
    })

  } catch (error) {
    console.error('API test failed:', error)

    return NextResponse.json({
      success: false,
      message: "❌ OpenAI API test failed",
      error: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        "Check if the API key is correct: sk-tEncCfKIWLpmMkAW0v3J3g",
        "Verify you have sufficient OpenAI API credits",
        "Ensure your OpenAI account is active",
        "Check network connectivity to OpenAI API"
      ]
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Text is required in request body'
      }, { status: 400 })
    }

    const embedding = await embeddingService.generateEmbedding(text)

    return NextResponse.json({
      success: true,
      text,
      embedding_dimensions: embedding.length,
      sample_embedding: embedding.slice(0, 10),
      message: "✅ Embedding generated successfully!"
    })

  } catch (error) {
    console.error('Embedding generation failed:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "❌ Failed to generate embedding"
    }, { status: 500 })
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
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