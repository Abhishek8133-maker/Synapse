import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { embeddingService } from '@/lib/embeddings'
import { ThoughtModel, vectorSearchModel } from '@synapse/database'
import { ThoughtSchema } from '@synapse/shared-types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') as any
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)

    const thoughts = await ThoughtModel.findByUserId(session.user.id, {
      limit,
      offset,
      type,
      tags,
    })

    return NextResponse.json({
      success: true,
      data: thoughts,
    })
  } catch (error) {
    console.error('Error fetching thoughts:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const validationResult = ThoughtSchema.omit({
      id: true,
      user_id: true,
      created_at: true,
      updated_at: true,
    }).safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const thought = await ThoughtModel.create({
      user_id: session.user.id,
      ...validationResult.data,
    })

    return NextResponse.json({
      success: true,
      data: thought,
    })
  } catch (error) {
    console.error('Error creating thought:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}