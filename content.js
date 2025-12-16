// Content Script for ReLiquify
// 使用 IIFE 避免重复声明
(function() {
  // 防止重复初始化
  if (window.__reliquifyLoaded) return;
  window.__reliquifyLoaded = true;

  // --- UI Components ---
  let logsWindowElement = null;
  let hideProgressTimer = null;

  function createLogsWindow() {
    if (logsWindowElement) return logsWindowElement;
    
    logsWindowElement = document.createElement('reliquify-progress');
    logsWindowElement.style.cssText = 'all: initial !important;';
    
    const shadowRoot = logsWindowElement.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      .panel {
        position: fixed;
        bottom: 16px;
        left: 16px;
        z-index: 2147483647;
        width: 260px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(12px);
        border-radius: 10px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.08);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
        font-size: 11px;
        color: rgba(255,255,255,0.9);
        overflow: hidden;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .header {
        background: rgba(255,255,255,0.05);
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      .icon {
        width: 18px;
        height: 18px;
        background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
      }
      .title {
        font-weight: 500;
        font-size: 11px;
        flex: 1;
      }
      .logs {
        padding: 8px 12px;
        max-height: 140px;
        overflow-y: auto;
      }
      .log-item {
        padding: 4px 0;
        display: flex;
        align-items: flex-start;
        gap: 6px;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .log-item:last-child {
        border-bottom: none;
      }
      .log-icon {
        width: 12px;
        height: 12px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        border-radius: 50%;
      }
      .log-icon.info { background: rgba(59, 130, 246, 0.8); }
      .log-icon.success { background: rgba(34, 197, 94, 0.8); }
      .log-icon.error { background: rgba(239, 68, 68, 0.8); }
      .log-text {
        flex: 1;
        line-height: 1.3;
        word-break: break-word;
      }
      a { color: #4ade80; text-decoration: none; }
      a:hover { text-decoration: underline; }
    `;
    shadowRoot.appendChild(style);
    
    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="header">
        <div class="icon">R</div>
        <div class="title">ReLiquify</div>
      </div>
      <div class="logs"></div>
    `;
    shadowRoot.appendChild(panel);
    
    document.documentElement.appendChild(logsWindowElement);
    return logsWindowElement;
  }

  function showProgressInPanel(status, message, url = '') {
    const element = createLogsWindow();
    const shadowRoot = element.shadowRoot;
    const logsContainer = shadowRoot.querySelector('.logs');
    
    if (hideProgressTimer) {
      clearTimeout(hideProgressTimer);
      hideProgressTimer = null;
    }

    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    
    let iconClass = 'info';
    let iconText = '●';
    
    if (status === 'success') {
      iconClass = 'success';
      iconText = '✓';
    } else if (status === 'error') {
      iconClass = 'error';
      iconText = '✗';
    }
    
    logItem.innerHTML = `
      <div class="log-icon ${iconClass}">${iconText}</div>
      <div class="log-text">${message}</div>
    `;
    logsContainer.appendChild(logItem);
    
    if (url && status === 'success') {
      const linkItem = document.createElement('div');
      linkItem.className = 'log-item';
      linkItem.innerHTML = `
        <div class="log-icon success">🔗</div>
        <div class="log-text"><a href="${url}" target="_blank">查看任务进度 →</a></div>
      `;
      logsContainer.appendChild(linkItem);
    }

    logsContainer.scrollTop = logsContainer.scrollHeight;

    if (status === 'success' || status === 'error') {
      hideProgressTimer = setTimeout(() => {
        if (logsWindowElement) {
          logsWindowElement.remove();
          logsWindowElement = null;
        }
      }, 5000);
    }
  }

  // --- Main Message Listener ---
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_CONTENT') {
      extractContent()
        .then(data => sendResponse({ success: true, ...data }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
    
    if (request.action === 'EXTRACT_AND_COPY') {
      extractContent()
        .then(async (data) => {
          try {
            await copyToClipboard(data.markdown);
            showProgressInPanel('success', 'Markdown 已复制到剪贴板');
            sendResponse({ success: true });
          } catch (err) {
            showProgressInPanel('error', '复制失败: ' + err.message);
            sendResponse({ success: false, error: err.message });
          }
        })
        .catch(err => {
          showProgressInPanel('error', '提取失败: ' + err.message);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    if (request.action === 'EXTRACT_AND_DOWNLOAD') {
      extractContent()
        .then(data => {
          sendResponse({ success: true, ...data });
        })
        .catch(err => {
          showProgressInPanel('error', '提取失败: ' + err.message);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    if (request.action === 'SHOW_PROGRESS') {
      showProgressInPanel(request.status, request.message, request.url);
      sendResponse({ success: true });
      return true;
    }
  });

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }

  async function extractContent() {
    if (typeof Readability === 'undefined' || typeof TurndownService === 'undefined') {
      throw new Error('依赖库未加载');
    }

    const documentClone = document.cloneNode(true);
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article) {
      throw new Error('无法识别页面主要内容');
    }

    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });

    const markdown = turndownService.turndown(article.content);
    const finalMarkdown = `# ${article.title}\n\n` + 
      (article.byline ? `*Author: ${article.byline}*\n\n` : '') +
      markdown;

    return {
      title: article.title,
      markdown: finalMarkdown,
      excerpt: article.excerpt
    };
  }
})();
