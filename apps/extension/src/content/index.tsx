import { createRoot } from 'react-dom/client'
import { ContentScript } from './components/ContentScript'
import { injectStyles } from '../shared/utils'

// Main content script entry point
class ContentScriptManager {
  private root: any = null
  private container: HTMLElement | null = null
  private floatingButton: HTMLElement | null = null

  constructor() {
    this.init()
  }

  private init() {
    // Inject CSS styles
    injectStyles()

    // Create and inject floating action button
    this.createFloatingButton()

    // Set up text selection listener
    this.setupTextSelectionListener()

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts()
  }

  private createFloatingButton() {
    this.floatingButton = document.createElement('div')
    this.floatingButton.id = 'synapse-floating-button'
    this.floatingButton.innerHTML = `
      <button
        id="synapse-fab"
        title="Save to Synapse (Ctrl+Shift+S)"
        style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          opacity: 0;
          transform: scale(0.8);
        "
      >
        🧠
      </button>
    `

    document.body.appendChild(this.floatingButton)

    const button = this.floatingButton.querySelector('#synapse-fab') as HTMLButtonElement
    if (button) {
      button.addEventListener('click', () => {
        this.handleButtonClick()
      })

      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)'
        button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
      })

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)'
        button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
      })
    }

    // Show button after a delay
    setTimeout(() => {
      if (button) {
        button.style.opacity = '1'
        button.style.transform = 'scale(1)'
      }
    }, 2000)
  }

  private setupTextSelectionListener() {
    let selectionTimeout: number

    document.addEventListener('mouseup', () => {
      clearTimeout(selectionTimeout)
      selectionTimeout = setTimeout(() => {
        this.handleTextSelection()
      }, 100)
    })

    document.addEventListener('keyup', () => {
      clearTimeout(selectionTimeout)
      selectionTimeout = setTimeout(() => {
        this.handleTextSelection()
      }, 100)
    })
  }

  private setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+S or Cmd+Shift+S for quick save
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault()
        this.handleQuickSave()
      }
    })
  }

  private handleTextSelection() {
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim()

    if (selectedText && selectedText.length > 3) {
      this.showQuickActionButtons(selection)
    } else {
      this.hideQuickActionButtons()
    }
  }

  private showQuickActionButtons(selection: Selection | null) {
    // Remove existing quick action buttons
    this.hideQuickActionButtons()

    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    const quickActions = document.createElement('div')
    quickActions.id = 'synapse-quick-actions'
    quickActions.innerHTML = `
      <div style="
        position: fixed;
        top: ${rect.top - 50}px;
        left: ${rect.left + rect.width / 2 - 100}px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 8px;
        display: flex;
        gap: 8px;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
      ">
        <button class="synapse-action-btn" data-action="quote" style="
          padding: 6px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          color: #374151;
          cursor: pointer;
          font-size: 12px;
          white-space: nowrap;
        ">💭 Quote</button>
        <button class="synapse-action-btn" data-action="todo" style="
          padding: 6px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          color: #374151;
          cursor: pointer;
          font-size: 12px;
          white-space: nowrap;
        ">✓ Todo</button>
        <button class="synapse-action-btn" data-action="note" style="
          padding: 6px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: white;
          color: #374151;
          cursor: pointer;
          font-size: 12px;
          white-space: nowrap;
        ">📝 Note</button>
      </div>
    `

    document.body.appendChild(quickActions)

    // Add event listeners to action buttons
    quickActions.querySelectorAll('.synapse-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = (e.target as HTMLElement).dataset.action
        this.saveSelectedText(action as any)
        this.hideQuickActionButtons()
        selection?.removeAllRanges()
      })

      btn.addEventListener('mouseenter', (e) => {
        ;(e.target as HTMLElement).style.background = '#f3f4f6'
      })

      btn.addEventListener('mouseleave', (e) => {
        ;(e.target as HTMLElement).style.background = 'white'
      })
    })

    // Hide quick actions when clicking outside
    setTimeout(() => {
      document.addEventListener('click', this.hideQuickActionButtons, { once: true })
    }, 100)
  }

  private hideQuickActionButtons() {
    const existing = document.getElementById('synapse-quick-actions')
    if (existing) {
      existing.remove()
    }
  }

  private handleButtonClick() {
    const selectedText = window.getSelection()?.toString().trim()

    if (selectedText) {
      this.showCaptureDialog(selectedText)
    } else {
      this.showCaptureDialog('')
    }
  }

  private handleQuickSave() {
    const selectedText = window.getSelection()?.toString().trim()

    if (selectedText) {
      this.saveSelectedText()
    } else {
      this.saveCurrentPage()
    }
  }

  private showCaptureDialog(selectedText: string) {
    // Create modal overlay
    const overlay = document.createElement('div')
    overlay.id = 'synapse-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    // Create React root for the capture dialog
    const container = document.createElement('div')
    container.id = 'synapse-capture-container'
    overlay.appendChild(container)

    document.body.appendChild(overlay)

    // Close overlay when clicking background
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeCaptureDialog()
      }
    })

    // Render React component
    this.root = createRoot(container)
    this.root.render(
      React.createElement(ContentScript, {
        selectedText,
        pageContext: this.getPageContext(),
        onClose: () => this.closeCaptureDialog(),
        onSave: (data: any) => this.handleSave(data),
      })
    )
  }

  private closeCaptureDialog() {
    const overlay = document.getElementById('synapse-overlay')
    if (overlay) {
      overlay.remove()
    }

    if (this.root) {
      this.root.unmount()
      this.root = null
    }
  }

  private getPageContext() {
    return {
      url: window.location.href,
      title: document.title,
      favicon: this.getFavicon(),
      selectedText: window.getSelection()?.toString() || '',
    }
  }

  private getFavicon(): string {
    const link = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (link && link.href) return link.href

    // Try to get from default location
    return `${window.location.protocol}//${window.location.hostname}/favicon.ico`
  }

  private async saveSelectedText(userSuggestedType?: string) {
    const selectedText = window.getSelection()?.toString().trim()

    if (!selectedText) return

    try {
      await chrome.runtime.sendMessage({
        type: 'CAPTURE_TEXT',
        data: {
          content: selectedText,
          context: {
            ...this.getPageContext(),
            selectedElement: this.getSelectedElementInfo(),
          },
          userSuggestedType,
        },
      })

      this.showSuccessNotification()
    } catch (error) {
      console.error('Error saving selected text:', error)
      this.showErrorNotification()
    }
  }

  private async saveCurrentPage() {
    try {
      await chrome.runtime.sendMessage({
        type: 'CAPTURE_URL',
        data: {
          url: window.location.href,
          context: this.getPageContext(),
        },
      })

      this.showSuccessNotification()
    } catch (error) {
      console.error('Error saving current page:', error)
      this.showErrorNotification()
    }
  }

  private async handleSave(data: any) {
    try {
      await chrome.runtime.sendMessage(data)
      this.closeCaptureDialog()
      this.showSuccessNotification()
    } catch (error) {
      console.error('Error saving:', error)
      this.showErrorNotification()
    }
  }

  private getSelectedElementInfo(): string {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return ''

    const range = selection.getRangeAt(0)
    const container = range.commonAncestorContainer
    const element = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement

    return (element as any)?.tagName?.toLowerCase() || ''
  }

  private showSuccessNotification() {
    this.showNotification('✅ Saved to Synapse', 'success')
  }

  private showErrorNotification() {
    this.showNotification('❌ Failed to save', 'error')
  }

  private showNotification(message: string, type: 'success' | 'error') {
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10003;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      animation: slideIn 0.3s ease;
    `
    notification.textContent = message

    // Add animation keyframes
    if (!document.querySelector('#synapse-animations')) {
      const style = document.createElement('style')
      style.id = 'synapse-animations'
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `
      document.head.appendChild(style)
    }

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease reverse'
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }
}

// Initialize the content script
new ContentScriptManager()