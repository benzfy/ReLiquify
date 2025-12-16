// ReLiquify Background Script

const MENU_EXTRACT_COPY = "extract-copy";
const MENU_EXTRACT_DOWNLOAD = "extract-download";
const MENU_SEND_CLOUD = "send-cloud";

// 初始化菜单
chrome.runtime.onInstalled.addListener(() => {
  createMenus();
});

// 监听设置更新
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'settingsUpdated') {
    createMenus();
  }
});

async function createMenus() {
  chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: MENU_EXTRACT_COPY,
    title: "提取并复制 (Copy Markdown)",
    contexts: ["page", "selection"]
  });

  chrome.contextMenus.create({
    id: MENU_EXTRACT_DOWNLOAD,
    title: "提取并下载 (Download Markdown)",
    contexts: ["page", "selection"]
  });

  // 检查是否配置了 API Key，如果配置了则显示"发送到云端"
  const { limhubApiKey } = await chrome.storage.sync.get(["limhubApiKey"]);
  if (limhubApiKey) {
    chrome.contextMenus.create({
      id: MENU_SEND_CLOUD,
      title: "发送到云端 (Send to Cloud)",
      contexts: ["page", "selection"]
    });
  }
}

// 监听菜单点击
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === MENU_EXTRACT_COPY) {
    handleExtractAndCopy(tab);
  } else if (info.menuItemId === MENU_EXTRACT_DOWNLOAD) {
    handleExtractAndDownload(tab);
  } else if (info.menuItemId === MENU_SEND_CLOUD) {
    handleSendCloud(tab);
  }
});

function handleExtractAndCopy(tab) {
  sendMessageToTab(tab.id, { action: "EXTRACT_AND_COPY" });
}

function handleExtractAndDownload(tab) {
  sendMessageToTab(tab.id, { action: "EXTRACT_AND_DOWNLOAD" }, (response) => {
    if (response && response.success) {
       downloadMarkdown(response.markdown, response.title);
    }
  });
}

async function handleSendCloud(tab) {
  try {
    // 1. 获取配置
    const { limhubApiUrl, limhubApiKey } = await chrome.storage.sync.get(['limhubApiUrl', 'limhubApiKey']);
    if (!limhubApiKey) {
      showProgress(tab.id, 'error', '请先配置 API Key');
      return;
    }

    // 2. 提取内容
    showProgress(tab.id, 'info', '正在提取内容...');
    const response = await sendMessageToTab(tab.id, { action: "EXTRACT_CONTENT" });
    
    if (!response || !response.success) {
      throw new Error(response?.error || '提取失败');
    }

    const { markdown, title } = response;

    // 3. 发送请求
    showProgress(tab.id, 'info', '正在上传...');
    
    const baseUrl = (limhubApiUrl || 'https://limhub.xiaoluxue.com').replace(/\/+$/, '');
    const endpoint = `${baseUrl}/api/v1/remixer/tasks`;

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${limhubApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        markdown: markdown,
        custom_instruction: "From ReLiquify Extension"
      })
    });

    if (!apiResponse.ok) {
      throw new Error(`API Error: ${apiResponse.status}`);
    }

    const result = await apiResponse.json();
    const taskId = result.task_id || result.id || (result.data && result.data.task_id) || '未知ID';
    
    // 4. 成功，显示任务进度链接
    const taskPageUrl = `${baseUrl}/remix-tasks`;
    showProgress(tab.id, 'success', `任务创建成功 (ID: ${taskId})`, taskPageUrl);

  } catch (err) {
    console.error(err);
    showProgress(tab.id, 'error', `发送失败: ${err.message}`);
  }
}

// 辅助函数：发送消息（含自动注入 Content Script 逻辑）
async function sendMessageToTab(tabId, message, callback) {
  try {
    // 尝试直接发送
    const response = await chrome.tabs.sendMessage(tabId, message);
    if (callback) callback(response);
    return response;
  } catch (err) {
    // 如果发送失败，可能是 Content Script 未加载
    console.log("Content script not ready, injecting...", err);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["lib/Readability.js", "lib/turndown.js", "content.js"]
      });
      
      // 等待一点时间
      await new Promise(r => setTimeout(r, 100));
      
      const response = await chrome.tabs.sendMessage(tabId, message);
      if (callback) callback(response);
      return response;
    } catch (injectErr) {
      console.error("Injection failed:", injectErr);
      if (callback) callback({ success: false, error: injectErr.message });
      return { success: false, error: injectErr.message };
    }
  }
}

async function showProgress(tabId, status, message, url = '') {
  await sendMessageToTab(tabId, {
    action: "SHOW_PROGRESS",
    status,
    message,
    url
  });
}

function downloadMarkdown(content, title) {
  const safeTitle = sanitizeFilename(title).substring(0, 40);
  const filename = `[RELIQ]${safeTitle}.md`;
  const blob = new Blob([content], { type: 'text/markdown' });
  
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function() {
    const base64data = reader.result;
    chrome.downloads.download({
      url: base64data,
      filename: filename,
      saveAs: false
    });
  };
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '-').trim().substring(0, 50) || 'article';
}
