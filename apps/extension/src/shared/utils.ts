export function injectStyles() {
  if (document.querySelector('#synapse-extension-styles')) return

  const style = document.createElement('style')
  style.id = 'synapse-extension-styles'
  style.textContent = `
    /* Synapse Extension Styles */
    .synapse-extension * {
      box-sizing: border-box;
    }

    .synapse-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .synapse-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .synapse-button:active {
      transform: translateY(0);
    }

    .synapse-input {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .synapse-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .synapse-select {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 14px;
      outline: none;
      cursor: pointer;
      background: white;
    }

    .synapse-select:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .synapse-textarea {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      min-height: 100px;
      outline: none;
    }

    .synapse-textarea:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .synapse-modal {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .synapse-modal-header {
      padding: 20px 20px 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 20px;
    }

    .synapse-modal-body {
      padding: 0 20px 20px;
    }

    .synapse-modal-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .synapse-form-group {
      margin-bottom: 16px;
    }

    .synapse-form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .synapse-tag {
      display: inline-block;
      background: #f3f4f6;
      color: #374151;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin: 2px;
    }

    .synapse-loading {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `

  document.head.appendChild(style)
}

export function getSelectionInfo() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return null
  }

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  return {
    text: selection.toString(),
    range: range,
    rect: rect,
    element: range.commonAncestorContainer,
  }
}

export function createTooltip(element: HTMLElement, text: string) {
  const tooltip = document.createElement('div')
  tooltip.className = 'synapse-tooltip'
  tooltip.textContent = text
  tooltip.style.cssText = `
    position: absolute;
    background: #111827;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10004;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  `

  document.body.appendChild(tooltip)

  const showTooltip = () => {
    const rect = element.getBoundingClientRect()
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px'
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px'
    tooltip.style.opacity = '1'
  }

  const hideTooltip = () => {
    tooltip.style.opacity = '0'
  }

  element.addEventListener('mouseenter', showTooltip)
  element.addEventListener('mouseleave', hideTooltip)

  return {
    remove: () => {
      element.removeEventListener('mouseenter', showTooltip)
      element.removeEventListener('mouseleave', hideTooltip)
      tooltip.remove()
    }
  }
}