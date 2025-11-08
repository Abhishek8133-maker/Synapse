import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { claudeService } from '@/lib/claude'
import { embeddingService } from '@/lib/embeddings'
import { ThoughtModel, vectorSearchModel } from '@synapse/database'
import { CaptureTextRequestSchema } from '@synapse/shared-types'

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

    // Validate request body
    const validationResult = CaptureTextRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { content, context, userSuggestedType } = validationResult.data

    // Use Claude to classify and enrich the content
    const classification = await claudeService.classifyContent(content, context)

    // Override with user suggestion if provided
    if (userSuggestedType) {
      classification.type = userSuggestedType
    }

    // Create the thought
    const thought = await ThoughtModel.create({
      user_id: session.user.id,
      type: classification.type,
      title: classification.title,
      content,
      metadata: {
        ...classification.metadata,
        source_url: context.url,
        source_favicon: context.favicon,
        selected_element: context.selectedElement,
      },
      source_url: context.url,
      source_favicon: context.favicon,
      tags: classification.tags,
    })

    return NextResponse.json({
      success: true,
      data: {
        thought,
        classification,
      },
    })
  } catch (error) {
    console.error('Error capturing text:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}