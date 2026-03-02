document.addEventListener('DOMContentLoaded', async () => {
  const translateToggle = document.getElementById('translateToggle');
  const definitionToggle = document.getElementById('definitionToggle');
  const statusText = document.getElementById('statusText');
  const translateBtn = document.getElementById('translateBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const englishRate = document.getElementById('englishRate');
  const englishRateValue = document.getElementById('englishRateValue');
  const autoAdjustToggle = document.getElementById('autoAdjustToggle');
  const autoAdjustStep = document.getElementById('autoAdjustStep');

  // 加载保存的设置
  async function loadSettings() {
    const result = await chrome.storage.local.get([
      'translateEnabled',
      'definitionEnabled',
      'englishRate',
      'autoAdjustEnabled',
      'autoAdjustStep'
    ]);
    translateToggle.checked = result.translateEnabled || false;
    definitionToggle.checked = result.definitionEnabled || false;

    const rate = typeof result.englishRate === 'number' ? result.englishRate : 60;
    englishRate.value = Math.min(100, Math.max(0, rate));
    englishRateValue.textContent = `${englishRate.value}%`;

    autoAdjustToggle.checked = result.autoAdjustEnabled || false;
    const step = typeof result.autoAdjustStep === 'number' ? result.autoAdjustStep : 10;
    autoAdjustStep.value = step;
    autoAdjustStep.disabled = !autoAdjustToggle.checked;
  }

  // 保存设置
  async function saveSettings() {
    await chrome.storage.local.set({
      translateEnabled: translateToggle.checked,
      definitionEnabled: definitionToggle.checked,
      englishRate: Number(englishRate.value),
      autoAdjustEnabled: autoAdjustToggle.checked,
      autoAdjustStep: Number(autoAdjustStep.value)
    });
  }

  // 显示状态消息
  function showStatus(message, type = 'info') {
    statusText.textContent = message;
    statusText.className = 'status-bar ' + type;
  }

  // 翻译功能开关
  translateToggle.addEventListener('change', async () => {
    await saveSettings();
    showStatus(translateToggle.checked ? '翻译功能已开启' : '翻译功能已关闭', 'success');

    // 通知content script更新状态
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'toggleTranslate',
        enabled: translateToggle.checked
      });
    }
  });

  // 释义功能开关
  definitionToggle.addEventListener('change', async () => {
    await saveSettings();
    showStatus(definitionToggle.checked ? '释义功能已开启' : '释义功能已关闭', 'success');

    // 通知content script更新状态
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'toggleDefinition',
        enabled: definitionToggle.checked
      });
    }
  });

  // 立即翻译按钮
  englishRate.addEventListener('input', () => {
    englishRateValue.textContent = `${englishRate.value}%`;
  });

  englishRate.addEventListener('change', async () => {
    await saveSettings();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'updateEnglishRate',
        rate: Number(englishRate.value)
      });
    }
  });

  autoAdjustToggle.addEventListener('change', async () => {
    autoAdjustStep.disabled = !autoAdjustToggle.checked;
    await saveSettings();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'updateAutoAdjust',
        enabled: autoAdjustToggle.checked,
        step: Number(autoAdjustStep.value)
      });
    }
  });

  autoAdjustStep.addEventListener('change', async () => {
    await saveSettings();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && autoAdjustToggle.checked) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'updateAutoAdjust',
        enabled: true,
        step: Number(autoAdjustStep.value)
      });
    }
  });

  translateBtn.addEventListener('click', async () => {
    if (!translateToggle.checked) {
      translateToggle.checked = true;
      await saveSettings();
    }

    showStatus('正在翻译...', 'info');

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'translateNow' });
        if (response && response.count !== undefined) {
          showStatus(`翻译完成，共翻译 ${response.count} 处`, 'success');
        } else if (response && response.error) {
          showStatus(response.error, 'error');
        } else {
          showStatus('翻译完成', 'success');
        }
      } catch (error) {
        console.error('翻译请求失败:', error);
        showStatus('翻译失败，请刷新页面后重试', 'error');
      }
    }
  });

  // 刷新页面按钮
  refreshBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.reload(tab.id);
      showStatus('页面已刷新', 'success');
    }
  });

  // 初始化
  await loadSettings();
});
