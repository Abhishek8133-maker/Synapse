import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ThoughtType } from '@synapse/shared-types'

interface PageContext {
  url: string
  title: string
  favicon?: string
}

function Popup() {
  const [pageContext, setPageContext] = useState<PageContext | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'quick' | 'text' | 'screenshot' | 'url'>('quick')

  useEffect(() => {
    loadPageContext()
  }, [])

  const loadPageContext = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab.id) {
        const context = await getPageInfo(tab.id)
        setPageContext(context)

        // Get selected text from content script
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SELECTED_TEXT' })
          if (response?.selectedText) {
            setSelectedText(response.selectedText)
            setActiveTab('text')
          }
        } catch (error) {
          // Content script might not be loaded, that's okay
        }
      }
    } catch (error) {
      console.error('Error loading page context:', error)
    }
  }

  const getPageInfo = async (tabId: number): Promise<PageContext> => {
    const tab = await chrome.tabs.get(tabId)
    return {
      url: tab.url || '',
      title: tab.title || '',
      favicon: tab.favIconUrl,
    }
  }

  const handleCaptureText = async (content: string, type: ThoughtType, title: string) => {
    if (!pageContext) return

    setIsLoading(true)
    try {
      await chrome.runtime.sendMessage({
        type: 'CAPTURE_TEXT',
        data: {
          content,
          context: {
            url: pageContext.url,
            title: pageContext.title,
            favicon: pageContext.favicon,
          },
          userSuggestedType: type,
        },
      })

      // Show success message
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: 'Synapse',
        message: 'Content saved successfully!',
      })

      window.close()
    } catch (error) {
      console.error('Error capturing text:', error)
      alert('Failed to save content. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptureScreenshot = async (fullPage: boolean = false) => {
    if (!pageContext) return

    setIsLoading(true)
    try {
      await chrome.runtime.sendMessage({
        type: 'CAPTURE_SCREENSHOT',
        data: {
          fullPage,
          context: {
            url: pageContext.url,
            title: pageContext.title,
          },
        },
      })

      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: 'Synapse',
        message: 'Screenshot saved successfully!',
      })

      window.close()
    } catch (error) {
      console.error('Error capturing screenshot:', error)
      alert('Failed to save screenshot. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptureUrl = async () => {
    if (!pageContext) return

    setIsLoading(true)
    try {
      await chrome.runtime.sendMessage({
        type: 'CAPTURE_URL',
        data: {
          url: pageContext.url,
          context: {
            referrer: pageContext.url,
          },
        },
      })

      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: 'Synapse',
        message: 'Page saved successfully!',
      })

      window.close()
    } catch (error) {
      console.error('Error capturing URL:', error)
      alert('Failed to save page. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!pageContext) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', marginBottom: '12px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ width: '350px', minHeight: '400px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ fontSize: '20px' }}>🧠</div>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>Synapse</div>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>
          {pageContext.title.length > 40 ? pageContext.title.substring(0, 40) + '...' : pageContext.title}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('quick')}
          style={{
            flex: 1,
            padding: '12px 8px',
            border: 'none',
            background: activeTab === 'quick' ? '#f3f4f6' : 'white',
            fontSize: '12px',
            cursor: 'pointer',
            borderBottom: activeTab === 'quick' ? '2px solid #667eea' : '2px solid transparent',
          }}
        >
          Quick
        </button>
        <button
          onClick={() => setActiveTab('text')}
          style={{
            flex: 1,
            padding: '12px 8px',
            border: 'none',
            background: activeTab === 'text' ? '#f3f4f6' : 'white',
            fontSize: '12px',
            cursor: 'pointer',
            borderBottom: activeTab === 'text' ? '2px solid #667eea' : '2px solid transparent',
          }}
        >
          Text
        </button>
        <button
          onClick={() => setActiveTab('screenshot')}
          style={{
            flex: 1,
            padding: '12px 8px',
            border: 'none',
            background: activeTab === 'screenshot' ? '#f3f4f6' : 'white',
            fontSize: '12px',
            cursor: 'pointer',
            borderBottom: activeTab === 'screenshot' ? '2px solid #667eea' : '2px solid transparent',
          }}
        >
          Screenshot
        </button>
        <button
          onClick={() => setActiveTab('url')}
          style={{
            flex: 1,
            padding: '12px 8px',
            border: 'none',
            background: activeTab === 'url' ? '#f3f4f6' : 'white',
            fontSize: '12px',
            cursor: 'pointer',
            borderBottom: activeTab === 'url' ? '2px solid #667eea' : '2px solid transparent',
          }}
        >
          URL
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', minHeight: '300px' }}>
        {activeTab === 'quick' && <QuickActionsTab pageContext={pageContext} selectedText={selectedText} onCaptureText={handleCaptureText} />}
        {activeTab === 'text' && <TextCaptureTab selectedText={selectedText} onCapture={handleCaptureText} />}
        {activeTab === 'screenshot' && <ScreenshotCaptureTab onCapture={handleCaptureScreenshot} />}
        {activeTab === 'url' && <UrlCaptureTab pageContext={pageContext} onCapture={handleCaptureUrl} />}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px'
            }}></div>
            <div style={{ fontSize: '14px', color: '#374151' }}>Saving...</div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function QuickActionsTab({ pageContext, selectedText, onCaptureText }: {
  pageContext: PageContext
  selectedText: string
  onCaptureText: (content: string, type: ThoughtType, title: string) => void
}) {
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Quick Actions</h3>

      {selectedText ? (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Selected Text:</div>
          <div style={{
            padding: '8px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            marginBottom: '12px',
            maxHeight: '60px',
            overflow: 'auto',
          }}>
            {selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onCaptureText(selectedText, ThoughtType.QUOTE, selectedText.substring(0, 50))}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              💭 Save as Quote
            </button>
            <button
              onClick={() => onCaptureText(selectedText, ThoughtType.NOTE, selectedText.substring(0, 50))}
              style={{
                padding: '8px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              📝 Save as Note
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
          Select some text on the page to see quick actions.
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Other Actions:</div>
        <button
          onClick={() => onCaptureText(pageContext.title, ThoughtType.ARTICLE, pageContext.title)}
          style={{
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📄 Save Page
        </button>
      </div>
    </div>
  )
}

function TextCaptureTab({ selectedText, onCapture }: {
  selectedText: string
  onCapture: (content: string, type: ThoughtType, title: string) => void
}) {
  const [content, setContent] = useState(selectedText)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ThoughtType>(ThoughtType.NOTE)

  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Save Text</h3>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Type:</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ThoughtType)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        >
          <option value={ThoughtType.NOTE}>📝 Note</option>
          <option value={ThoughtType.QUOTE}>💭 Quote</option>
          <option value={ThoughtType.TODO}>✓ Todo</option>
          <option value={ThoughtType.ARTICLE}>📄 Article</option>
        </select>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title..."
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>Content:</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your content..."
          rows={6}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </div>

      <button
        onClick={() => onCapture(content, type, title || content.substring(0, 50))}
        disabled={!content.trim()}
        style={{
          width: '100%',
          padding: '12px',
          border: 'none',
          borderRadius: '6px',
          background: content.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
          color: content.trim() ? 'white' : '#9ca3af',
          cursor: content.trim() ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        Save to Synapse
      </button>
    </div>
  )
}

function ScreenshotCaptureTab({ onCapture }: {
  onCapture: (fullPage: boolean) => void
}) {
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Capture Screenshot</h3>

      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
        <button
          onClick={() => onCapture(false)}
          style={{
            padding: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '14px',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>📸 Visible Area</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Capture what's currently visible on the screen
          </div>
        </button>

        <button
          onClick={() => onCapture(true)}
          style={{
            padding: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            background: 'white',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '14px',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>📄 Full Page</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Capture the entire webpage (scrolling screenshot)
          </div>
        </button>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f9fafb',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#6b7280',
      }}>
        💡 Tip: You can also use the keyboard shortcut Ctrl+Shift+S (Cmd+Shift+S on Mac) to quickly capture content.
      </div>
    </div>
  )
}

function UrlCaptureTab({ pageContext, onCapture }: {
  pageContext: PageContext
  onCapture: () => void
}) {
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Save URL</h3>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>Current Page:</div>
        <div style={{
          padding: '8px',
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          fontSize: '12px',
          wordBreak: 'break-all',
        }}>
          <div style={{ fontWeight: '500', marginBottom: '4px' }}>{pageContext.title}</div>
          <div style={{ color: '#6b7280' }}>{pageContext.url}</div>
        </div>
      </div>

      <button
        onClick={onCapture}
        style={{
          width: '100%',
          padding: '12px',
          border: 'none',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        Save Current Page
      </button>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#f9fafb',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#6b7280',
      }}>
        📄 This will save the current page URL and automatically extract metadata like title, description, and images.
      </div>
    </div>
  )
}

// Initialize the popup
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Popup />)
}