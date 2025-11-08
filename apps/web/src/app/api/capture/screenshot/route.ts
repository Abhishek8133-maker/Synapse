import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ThoughtModel } from '@synapse/database'
import { CaptureScreenshotRequestSchema, ThoughtType } from '@synapse/shared-types'

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
    const validationResult = CaptureScreenshotRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { imageData, fullPage, context } = validationResult.data

    // For now, we'll store the base64 image directly
    // In production, you'd want to upload this to a file storage service
    const imageUrl = await storeImage(imageData)

    // Create the thought with basic metadata
    const thought = await ThoughtModel.create({
      user_id: session.user.id,
      type: ThoughtType.IMAGE,
      title: `Screenshot from ${new URL(context.url).hostname}`,
      content: `Screenshot captured from ${context.title}`,
      metadata: {
        image_url: imageUrl,
        full_page: fullPage,
        source_url: context.url,
        screenshot_type: fullPage ? 'full_page' : 'visible_area',
        dimensions: await getImageDimensions(imageData),
      },
      source_url: context.url,
      source_favicon: context.favicon,
      tags: ['screenshot', 'image'],
    })

    return NextResponse.json({
      success: true,
      data: {
        thought,
        imageUrl,
      },
    })
  } catch (error) {
    console.error('Error capturing screenshot:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function storeImage(imageData: string): Promise<string> {
  // In a real implementation, you would:
  // 1. Upload to S3/Cloudinary/Cloud Storage
  // 2. Return the public URL
  // 3. Store the image data efficiently

  // For now, we'll simulate this with a data URL
  const timestamp = Date.now()
  return `data:image/png;base64,${imageData.substring(0, 100)}...truncated[${timestamp}]`
}

async function getImageDimensions(imageData: string): Promise<{ width: number; height: number }> {
  try {
    // This is a simplified version - in practice you'd use a proper image processing library
    // For now, we'll return default dimensions
    return { width: 1920, height: 1080 }
  } catch (error) {
    console.error('Error getting image dimensions:', error)
    return { width: 0, height: 0 }
  }
}