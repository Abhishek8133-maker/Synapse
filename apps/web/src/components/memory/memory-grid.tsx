'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@synapse/ui'
import { Button } from '@synapse/ui'
import { ThoughtType, Thought } from '@synapse/shared-types'
import { formatDate, truncateText } from '@synapse/utils'
import {
  Quote,
  ShoppingBag,
  FileText,
  CheckSquare,
  StickyNote,
  Image,
  Video,
  Heart,
  MoreHorizontal,
} from 'lucide-react'

const MOCK_THOUGHTS: Thought[] = [
  {
    id: '1',
    user_id: 'user-1',
    type: ThoughtType.QUOTE,
    title: 'The best way to predict the future is to invent it',
    content: 'The best way to predict the future is to invent it. We are all inventors of our own future, and we must embrace that responsibility with courage and creativity.',
    metadata: {
      author: 'Alan Kay',
      source: 'Computer Scientist',
      tags: ['innovation', 'future', 'technology'],
    },
    tags: ['innovation', 'future', 'technology'],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    user_id: 'user-1',
    type: ThoughtType.PRODUCT,
    title: 'Nike Air Max 270',
    content: 'Comfortable running shoes with excellent cushioning and modern design. Perfect for daily wear and light exercise.',
    metadata: {
      price: 150.00,
      currency: 'USD',
      brand: 'Nike',
      category: 'footwear',
      images: ['https://example.com/nike-air-max.jpg'],
      tags: ['shoes', 'running', 'nike'],
    },
    tags: ['shoes', 'running', 'nike'],
    created_at: '2024-01-14T15:45:00Z',
    updated_at: '2024-01-14T15:45:00Z',
  },
  {
    id: '3',
    user_id: 'user-1',
    type: ThoughtType.ARTICLE,
    title: 'Attention Is All You Need',
    content: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms...',
    metadata: {
      author: 'Vaswani et al',
      publication: 'NeurIPS 2017',
      word_count: 3200,
      read_time: 12,
      tags: ['machine learning', 'transformers', 'attention'],
    },
    tags: ['machine learning', 'transformers', 'attention'],
    created_at: '2024-01-13T09:20:00Z',
    updated_at: '2024-01-13T09:20:00Z',
  },
  {
    id: '4',
    user_id: 'user-1',
    type: ThoughtType.TODO,
    title: 'Weekend Project Ideas',
    content: 'Build a semantic search engine, create a browser extension for content capture, design a better note-taking interface, implement vector embeddings',
    metadata: {
      subtasks: [
        'Build semantic search engine',
        'Create browser extension',
        'Design note-taking interface',
        'Implement vector embeddings'
      ],
      priority: 'high',
      tags: ['projects', 'development', 'weekend'],
    },
    tags: ['projects', 'development', 'weekend'],
    created_at: '2024-01-12T18:30:00Z',
    updated_at: '2024-01-12T18:30:00Z',
  },
]

const TYPE_CONFIG = {
  [ThoughtType.QUOTE]: {
    icon: Quote,
    bgColor: 'bg-quote',
    borderColor: 'border-yellow-400',
    label: 'Quote',
  },
  [ThoughtType.PRODUCT]: {
    icon: ShoppingBag,
    bgColor: 'bg-product',
    borderColor: 'border-blue-400',
    label: 'Product',
  },
  [ThoughtType.ARTICLE]: {
    icon: FileText,
    bgColor: 'bg-card',
    borderColor: 'border-purple-400',
    label: 'Article',
  },
  [ThoughtType.TODO]: {
    icon: CheckSquare,
    bgColor: 'bg-todo',
    borderColor: 'border-green-400',
    label: 'Todo',
  },
  [ThoughtType.NOTE]: {
    icon: StickyNote,
    bgColor: 'bg-card',
    borderColor: 'border-gray-400',
    label: 'Note',
  },
  [ThoughtType.IMAGE]: {
    icon: Image,
    bgColor: 'bg-card',
    borderColor: 'border-pink-400',
    label: 'Image',
  },
  [ThoughtType.VIDEO]: {
    icon: Video,
    bgColor: 'bg-card',
    borderColor: 'border-red-400',
    label: 'Video',
  },
}

function ThoughtCard({ thought }: { thought: Thought }) {
  const config = TYPE_CONFIG[thought.type]
  const Icon = config.icon

  return (
    <Card className={`thought-card ${config.bgColor} border-l-4 ${config.borderColor} hover:shadow-lg cursor-pointer`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {config.label}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Heart className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-lg leading-tight">{thought.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-sm leading-relaxed">
          {truncateText(thought.content, 150)}
        </CardDescription>

        {/* Metadata */}
        {thought.metadata && (
          <div className="space-y-2">
            {thought.type === ThoughtType.QUOTE && thought.metadata.author && (
              <div className="text-xs text-muted-foreground">
                — {thought.metadata.author}
                {thought.metadata.source && ` • ${thought.metadata.source}`}
              </div>
            )}

            {thought.type === ThoughtType.PRODUCT && thought.metadata.price && (
              <div className="text-sm font-semibold text-blue-600">
                ${thought.metadata.price.toFixed(2)}
                {thought.metadata.brand && ` • ${thought.metadata.brand}`}
              </div>
            )}

            {thought.type === ThoughtType.ARTICLE && thought.metadata.author && (
              <div className="text-xs text-muted-foreground">
                {thought.metadata.author}
                {thought.metadata.publication && ` • ${thought.metadata.publication}`}
                {thought.metadata.read_time && ` • ${thought.metadata.read_time} min read`}
              </div>
            )}

            {thought.type === ThoughtType.TODO && thought.metadata.subtasks && (
              <div className="text-xs text-muted-foreground">
                {thought.metadata.subtasks.length} tasks
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {thought.tags && thought.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {thought.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors"
              >
                {tag}
              </span>
            ))}
            {thought.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors">
                +{thought.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>{formatDate(thought.created_at)}</span>
          {thought.source_url && (
            <a
              href={thought.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              View Source
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function MemoryGrid() {
  const [thoughts] = useState<Thought[]>(MOCK_THOUGHTS)

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-semibold">Recent Thoughts</h2>
          <span className="text-sm text-muted-foreground">
            {thoughts.length} items
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Filter
          </Button>
          <Button variant="outline" size="sm">
            Sort
          </Button>
        </div>
      </div>

      {/* Thoughts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {thoughts.map((thought) => (
          <ThoughtCard key={thought.id} thought={thought} />
        ))}
      </div>

      {/* Empty State */}
      {thoughts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">No thoughts yet</h3>
            <p>Start capturing content to build your visual memory.</p>
          </div>
        </div>
      )}
    </div>
  )
}