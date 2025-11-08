import { ExtensionMessage, PageContext } from '@synapse/shared-types'

// Extension background service worker
class BackgroundService {
  constructor() {
    this.setupEventListeners()
    this.setupContextMenus()
  }

  private setupEventListeners() {
    // Listen for keyboard shortcuts
    chrome.commands.onCommand.addListener((command) => {
      this.handleCommand(command)
    })

    // Listen for extension icon click
    chrome.action.onClicked.addListener((tab) => {
      if (tab.id) {
        this.openPopup(tab.id)
      }
    })

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async response
    })
  }

  private setupContextMenus() {
    chrome.runtime.onInstalled.addListener(() => {
      // Create context menu for selected text
      chrome.contextMenus.create({
        id: 'save-selection',
        title: 'Save to Synapse',
        contexts: ['selection'],
      })

      // Create context menu for pages
      chrome.contextMenus.create({
        id: 'save-page',
        title: 'Save page to Synapse',
        contexts: ['page'],
      })

      // Create context menu for images
      chrome.contextMenus.create({
        id: 'save-image',
        title: 'Save image to Synapse',
        contexts: ['image'],
      })
    })

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab)
    })
  }

  private async handleCommand(command: string) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) return

    switch (command) {
      case 'save-selection':
        await this.captureSelectedText(tab.id)
        break
      case 'screenshot':
        await this.captureScreenshot(tab.id, false)
        break
    }
  }

  private async handleContextMenuClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
    if (!tab?.id) return

    switch (info.menuItemId) {
      case 'save-selection':
        if (info.selectionText) {
          await this.saveSelectedText(tab.id, info.selectionText)
        }
        break
      case 'save-page':
        await this.savePage(tab.id, tab.url || '')
        break
      case 'save-image':
        if (info.srcUrl) {
          await this.saveImage(tab.id, info.srcUrl)
        }
        break
    }
  }

  private async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) {
    try {
      switch (message.type) {
        case 'CAPTURE_TEXT':
          const textResult = await this.captureText(
            sender.tab?.id,
            message.data.content,
            message.data.context
          )
          sendResponse({ success: true, data: textResult })
          break

        case 'CAPTURE_SCREENSHOT':
          const screenshotResult = await this.captureScreenshot(
            sender.tab?.id,
            message.data.fullPage
          )
          sendResponse({ success: true, data: screenshotResult })
          break

        case 'CAPTURE_URL':
          const urlResult = await this.captureUrl(
            sender.tab?.id,
            message.data.url,
            message.data.context
          )
          sendResponse({ success: true, data: urlResult })
          break

        case 'GET_PAGE_INFO':
          const pageInfo = await this.getPageInfo(sender.tab?.id)
          sendResponse({ success: true, data: pageInfo })
          break

        default:
          sendResponse({ success: false, error: 'Unknown message type' })
      }
    } catch (error) {
      console.error('Error handling message:', error)
      sendResponse({ success: false, error: 'Internal error' })
    }
  }

  private async openPopup(tabId: number) {
    try {
      // Inject content script if not already injected
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['dist/content.js'],
      })
    } catch (error) {
      console.error('Error opening popup:', error)
    }
  }

  private async captureSelectedText(tabId: number) {
    try {
      // Inject script to get selected text
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.getSelection()?.toString() || '',
      })

      if (result?.result) {
        await this.saveSelectedText(tabId, result.result)
      }
    } catch (error) {
      console.error('Error capturing selected text:', error)
    }
  }

  private async saveSelectedText(tabId: number, selectedText: string) {
    const context = await this.getPageContext(tabId)
    await this.captureText(tabId, selectedText, context)
  }

  private async captureScreenshot(tabId: number, fullPage: boolean = false) {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(undefined, {
        format: 'png',
      })

      const context = await this.getPageContext(tabId)
      await this.sendToAPI('CAPTURE_SCREENSHOT', {
        imageData: dataUrl.replace(/^data:image\/png;base64,/, ''),
        fullPage,
        context,
      })

      // Show success notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: 'Synapse',
        message: 'Screenshot saved successfully!',
      })
    } catch (error) {
      console.error('Error capturing screenshot:', error)
    }
  }

  private async savePage(tabId: number, url: string) {
    const context = await this.getPageContext(tabId)
    await this.captureUrl(tabId, url, context)
  }

  private async saveImage(tabId: number, imageUrl: string) {
    // For now, save as a URL capture
    await this.captureUrl(tabId, imageUrl, {})
  }

  private async captureText(tabId: number, content: string, context: Partial<PageContext>) {
    return await this.sendToAPI('CAPTURE_TEXT', {
      content,
      context: await this.getPageContext(tabId, context),
    })
  }

  private async captureUrl(tabId: number, url: string, context: any) {
    return await this.sendToAPI('CAPTURE_URL', {
      url,
      context: {
        referrer: (await this.getPageContext(tabId)).url,
        ...context,
      },
    })
  }

  private async getPageContext(tabId: number, additionalContext: Partial<PageContext> = {}): Promise<PageContext> {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => ({
          url: window.location.href,
          title: document.title,
          favicon: this.getFavicon(),
          selectedText: window.getSelection()?.toString() || '',
        }),
      })

      return {
        url: result?.result?.url || '',
        title: result?.result?.title || '',
        favicon: result?.result?.favicon || '',
        selectedElement: '',
        author: '',
        publishDate: '',
        selectedText: result?.result?.selectedText || '',
        ...additionalContext,
      }
    } catch (error) {
      console.error('Error getting page context:', error)
      return {
        url: '',
        title: '',
        favicon: '',
        selectedElement: '',
        author: '',
        publishDate: '',
        selectedText: '',
        ...additionalContext,
      }
    }
  }

  private async getPageInfo(tabId?: number) {
    if (!tabId) return null

    try {
      const tab = await chrome.tabs.get(tabId)
      return {
        url: tab.url,
        title: tab.title,
        favicon: tab.favIconUrl,
      }
    } catch (error) {
      console.error('Error getting page info:', error)
      return null
    }
  }

  private async sendToAPI(endpoint: string, data: any) {
    const API_BASE_URL = 'http://localhost:3000/api/capture'

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint.toLowerCase().replace('_', '-')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending to API:', error)
      throw error
    }
  }
}

// Initialize the background service
new BackgroundService()