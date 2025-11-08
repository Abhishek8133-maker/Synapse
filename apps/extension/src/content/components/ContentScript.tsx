import React, { useState, useEffect } from 'react'
import { ThoughtType } from '@synapse/shared-types'

interface ContentScriptProps {
  selectedText: string
  pageContext: {
    url: string
    title: string
    favicon?: string
  }
  onClose: () => void
  onSave: (data: any) => void
}

export function ContentScript({ selectedText, pageContext, onClose, onSave }: ContentScriptProps) {
  const [content, setContent] = useState(selectedText)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ThoughtType>(ThoughtType.NOTE)
  const [tags, setTags] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (selectedText && !title) {
      setTitle(generateTitleFromContent(selectedText))
      setType(detectContentType(selectedText))
    }
  }, [selectedText, title])

  const generateTitleFromContent = (text: string): string => {
    if (!text) return 'Untitled'

    const maxLength = 80
    let title = text.substring(0, maxLength)
    if (text.length > maxLength) {
      const lastSpace = title.lastIndexOf(' ')
      title = lastSpace > 0 ? title.substring(0, lastSpace) + '...' : title + '...'
    }
    return title
  }

  const detectContentType = (text: string): ThoughtType => {
    const lowerText = text.toLowerCase()

    // Check for quotes
    if (text.match(/^["']/) || lowerText.includes('said') || lowerText.includes('according to')) {
      return ThoughtType.QUOTE
    }

    // Check for todos
    if (lowerText.includes('todo') || lowerText.includes('task') || text.match(/^[-*+]\s/)) {
      return ThoughtType.TODO
    }

    // Check for URLs
    if (text.match(/^https?:\/\//)) {
      return ThoughtType.ARTICLE
    }

    return ThoughtType.NOTE
  }

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Please enter some content')
      return
    }

    setIsLoading(true)

    try {
      const data = {
        type: 'CAPTURE_TEXT',
        data: {
          content: content.trim(),
          context: {
            url: pageContext.url,
            title: pageContext.title,
            favicon: pageContext.favicon,
            selectedElement: '',
          },
          userSuggestedType: type,
        },
      }

      await onSave(data)
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (quickType: ThoughtType) => {
    setType(quickType)
    if (!title) {
      setTitle(generateTitleFromContent(content))
    }
  }

  return (
    <div className="synapse-extension">
      <div className="synapse-modal">
        <div className="synapse-modal-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="synapse-modal-title">Save to Synapse</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        </div>

        <div className="synapse-modal-body">
          {/* Quick Action Buttons */}
          {selectedText && (
            <div style={{ marginBottom: '16px' }}>
              <div className="synapse-form-label">Quick Classification:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleQuickAction(ThoughtType.QUOTE)}
                  className="synapse-button"
                  style={{
                    background: type === ThoughtType.QUOTE ? '#667eea' : '#f3f4f6',
                    color: type === ThoughtType.QUOTE ? 'white' : '#374151',
                    padding: '6px 12px',
                    fontSize: '12px',
                  }}
                >
                  💭 Quote
                </button>
                <button
                  onClick={() => handleQuickAction(ThoughtType.TODO)}
                  className="synapse-button"
                  style={{
                    background: type === ThoughtType.TODO ? '#667eea' : '#f3f4f6',
                    color: type === ThoughtType.TODO ? 'white' : '#374151',
                    padding: '6px 12px',
                    fontSize: '12px',
                  }}
                >
                  ✓ Todo
                </button>
                <button
                  onClick={() => handleQuickAction(ThoughtType.NOTE)}
                  className="synapse-button"
                  style={{
                    background: type === ThoughtType.NOTE ? '#667eea' : '#f3f4f6',
                    color: type === ThoughtType.NOTE ? 'white' : '#374151',
                    padding: '6px 12px',
                    fontSize: '12px',
                  }}
                >
                  📝 Note
                </button>
                <button
                  onClick={() => handleQuickAction(ThoughtType.ARTICLE)}
                  className="synapse-button"
                  style={{
                    background: type === ThoughtType.ARTICLE ? '#667eea' : '#f3f4f6',
                    color: type === ThoughtType.ARTICLE ? 'white' : '#374151',
                    padding: '6px 12px',
                    fontSize: '12px',
                  }}
                >
                  📄 Article
                </button>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="synapse-form-group">
            <label className="synapse-form-label">Title:</label>
            <input
              type="text"
              className="synapse-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
              style={{ width: '100%' }}
            />
          </div>

          {/* Content Type */}
          <div className="synapse-form-group">
            <label className="synapse-form-label">Type:</label>
            <select
              className="synapse-select"
              value={type}
              onChange={(e) => setType(e.target.value as ThoughtType)}
              style={{ width: '100%' }}
            >
              <option value={ThoughtType.NOTE}>📝 Note</option>
              <option value={ThoughtType.QUOTE}>💭 Quote</option>
              <option value={ThoughtType.TODO}>✓ Todo</option>
              <option value={ThoughtType.ARTICLE}>📄 Article</option>
              <option value={ThoughtType.PRODUCT}>🛍️ Product</option>
            </select>
          </div>

          {/* Content */}
          <div className="synapse-form-group">
            <label className="synapse-form-label">Content:</label>
            <textarea
              className="synapse-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your content..."
              rows={6}
              style={{ width: '100%' }}
            />
          </div>

          {/* Tags */}
          <div className="synapse-form-group">
            <label className="synapse-form-label">Tags (comma-separated):</label>
            <input
              type="text"
              className="synapse-input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3..."
              style={{ width: '100%' }}
            />
          </div>

          {/* Advanced Options Toggle */}
          <div className="synapse-form-group">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                fontSize: '12px',
                textDecoration: 'underline',
              }}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div style={{
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '6px',
              marginBottom: '16px',
            }}>
              <div className="synapse-form-group">
                <label className="synapse-form-label">Source URL:</label>
                <input
                  type="url"
                  className="synapse-input"
                  value={pageContext.url}
                  readOnly
                  style={{ width: '100%', background: '#f3f4f6' }}
                />
              </div>

              <div className="synapse-form-group">
                <label className="synapse-form-label">Page Title:</label>
                <input
                  type="text"
                  className="synapse-input"
                  value={pageContext.title}
                  readOnly
                  style={{ width: '100%', background: '#f3f4f6' }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              className="synapse-button"
              style={{
                background: '#f3f4f6',
                color: '#374151',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !content.trim()}
              className="synapse-button"
              style={{
                opacity: (isLoading || !content.trim()) ? 0.5 : 1,
                cursor: (isLoading || !content.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="synapse-loading"></div>
                  Saving...
                </span>
              ) : (
                'Save to Synapse'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}