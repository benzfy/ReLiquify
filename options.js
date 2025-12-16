document.addEventListener('DOMContentLoaded', () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // 默认值
  const DEFAULT_API_URL = 'https://limhub.xiaoluxue.com';

  // 加载设置
  chrome.storage.sync.get(['limhubApiUrl', 'limhubApiKey'], (items) => {
    apiUrlInput.value = items.limhubApiUrl || DEFAULT_API_URL;
    apiKeyInput.value = items.limhubApiKey || '';
  });

  // 保存设置
  saveBtn.addEventListener('click', () => {
    const apiUrl = apiUrlInput.value.trim().replace(/\/+$/, ''); // 去除末尾斜杠
    const apiKey = apiKeyInput.value.trim();

    chrome.storage.sync.set({
      limhubApiUrl: apiUrl,
      limhubApiKey: apiKey
    }, () => {
      showStatus('设置已保存', 'success');
    });
  });

  function showStatus(text, type) {
    statusDiv.textContent = text;
    statusDiv.className = `status ${type}`;
    setTimeout(() => {
      statusDiv.className = 'status';
      statusDiv.textContent = '';
    }, 2000);
  }
});

