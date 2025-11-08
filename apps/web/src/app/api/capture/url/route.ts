import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { claudeService } from '@/lib/claude'
import { ThoughtModel } from '@synapse/database'
import { CaptureUrlRequestSchema } from '@synapse/shared-types'

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
    const validationResult = CaptureUrlRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { url, context } = validationResult.data

    // Fetch page metadata
    const metadata = await fetchPageMetadata(url)

    // Use Claude to classify and extract content
    const classification = await claudeService.classifyContent(
      metadata.description || metadata.title,
      metadata
    )

    // Create the thought
    const thought = await ThoughtModel.create({
      user_id: session.user.id,
      type: classification.type,
      title: classification.title || metadata.title,
      content: metadata.description || metadata.title,
      metadata: {
        ...classification.metadata,
        ...metadata,
        author: metadata.author || classification.metadata.author,
        publication: metadata.siteName || classification.metadata.publication,
      },
      source_url: url,
      source_favicon: metadata.favicon,
      tags: [...(classification.tags || []), ...(metadata.tags || [])],
    })

    return NextResponse.json({
      success: true,
      data: {
        thought,
        metadata,
        classification,
      },
    })
  } catch (error) {
    console.error('Error capturing URL:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function fetchPageMetadata(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SynapseBot/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const html = await response.text()
    const metadata = extractMetadataFromHtml(html, url)

    return metadata
  } catch (error) {
    console.error('Error fetching page metadata:', error)
    return {
      title: new URL(url).hostname,
      description: `Content from ${url}`,
      url,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`,
      tags: [],
    }
  }
}

function extractMetadataFromHtml(html: string, url: string) {
  const title = extractMetaContent(html, 'title') ||
                extractMetaContent(html, 'og:title') ||
                extractTagContent(html, 'title') ||
                'Untitled'

  const description = extractMetaContent(html, 'description') ||
                     extractMetaContent(html, 'og:description') ||
                     ''

  const author = extractMetaContent(html, 'author') ||
                extractMetaContent(html, 'article:author') ||
                ''

  const siteName = extractMetaContent(html, 'og:site_name') ||
                  extractMetaContent(html, 'application-name') ||
                  new URL(url).hostname

  const favicon = extractMetaContent(html, 'og:image') ||
                 `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`

  const images = extractImages(html)
  const tags = extractKeywords(html)

  // Try to detect content type
  let detectedType = 'article'
  if (html.includes('"product"') || html.includes('"price"') || html.includes('"addToCart"')) {
    detectedType = 'product'
  }

  return {
    title,
    description,
    author,
    siteName,
    favicon,
    url,
    images,
    tags,
    detectedType,
  }
}

function extractMetaContent(html: string, property: string): string | null {
  const regex = new RegExp(`<meta[^>]*(?:name|property)=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i')
  const match = html.match(regex)
  return match ? match[1] : null
}

function extractTagContent(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i')
  const match = html.match(regex)
  return match ? match[1].trim() : null
}

function extractImages(html: string): string[] {
  const imageRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi
  const images: string[] = []
  let match

  while ((match = imageRegex.exec(html)) !== null) {
    const src = match[1]
    if (src.startsWith('http') && !src.includes('logo') && !src.includes('icon')) {
      images.push(src)
    }
  }

  return images.slice(0, 5) // Limit to 5 images
}

function extractKeywords(html: string): string[] {
  const keywords = extractMetaContent(html, 'keywords')
  if (!keywords) return []

  return keywords.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
}