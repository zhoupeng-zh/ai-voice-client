/**
 * 前端应用主逻辑
 */

const API_BASE = '/api';

// DOM 元素
const elements = {
  statusText: document.getElementById('status-text'),
  statusDot: document.getElementById('status-dot'),
  wsUrl: document.getElementById('ws-url'),
  urlParamsList: document.getElementById('url-params-list'),
  addUrlParamBtn: document.getElementById('add-url-param-btn'),
  headersList: document.getElementById('headers-list'),
  addHeaderBtn: document.getElementById('add-header-btn'),
  heartbeatInterval: document.getElementById('heartbeat-interval'),
  heartbeatType: document.getElementById('heartbeat-type'),
  heartbeatMessageGroup: document.getElementById('heartbeat-message-group'),
  heartbeatMessage: document.getElementById('heartbeat-message'),
  heartbeatPanel: document.getElementById('heartbeat-panel'),
  toggleHeartbeatBtn: document.getElementById('toggle-heartbeat-btn'),
  idleTimeout: document.getElementById('idle-timeout'),
  saveConfigBtn: document.getElementById('save-config-btn'),
  connectBtn: document.getElementById('connect-btn'),
  messageFormat: document.getElementById('message-format'),
  customFormatterGroup: document.getElementById('custom-formatter-group'),
  customFormatter: document.getElementById('custom-formatter'),
  setFormatterBtn: document.getElementById('set-formatter-btn'),
  textMessageGroup: document.getElementById('text-message-group'),
  jsonMessageGroup: document.getElementById('json-message-group'),
  jsonFieldsList: document.getElementById('json-fields-list'),
  addJsonFieldBtn: document.getElementById('add-json-field-btn'),
  pasteJsonBtn: document.getElementById('paste-json-btn'),
  pasteJsonArea: document.getElementById('paste-json-area'),
  pasteJsonInput: document.getElementById('paste-json-input'),
  parseJsonBtn: document.getElementById('parse-json-btn'),
  cancelPasteJsonBtn: document.getElementById('cancel-paste-json-btn'),
  messageInput: document.getElementById('message-input'),
  fileInput: document.getElementById('file-input'),
  addFileToParams: document.getElementById('add-file-to-params'),
  toggleAddFileToParams: document.getElementById('toggle-add-file-to-params'),
  fileFieldGroup: document.getElementById('file-field-group'),
  fileFieldName: document.getElementById('file-field-name'),
  fileBase64Encode: document.getElementById('file-base64-encode'),
  fileBase64Label: document.getElementById('file-base64-label'),
  enableFileChunk: document.getElementById('enable-file-chunk'),
  chunkSizeGroup: document.getElementById('chunk-size-group'),
  chunkSize: document.getElementById('chunk-size'),
  chunkTimeGroup: document.getElementById('chunk-time-group'),
  chunkTime: document.getElementById('chunk-time'),
  fileInfo: document.getElementById('file-info'),
  fileTypeInfo: document.getElementById('file-type-info'),
  fileDurationInfo: document.getElementById('file-duration-info'),
  wavHeaderOption: document.getElementById('wav-header-option'),
  removeWavHeader: document.getElementById('remove-wav-header'),
  sendBtn: document.getElementById('send-btn'),
  sendHeartbeatBtn: document.getElementById('send-heartbeat-btn'),
  enableVoiceMode: document.getElementById('enable-voice-mode'),
  voiceModeConfig: document.getElementById('voice-mode-config'),
  voiceStartFieldsList: document.getElementById('voice-start-fields-list'),
  voiceEndFieldsList: document.getElementById('voice-end-fields-list'),
  voiceChunkFieldsList: document.getElementById('voice-chunk-fields-list'),
  addVoiceStartFieldBtn: document.getElementById('add-voice-start-field-btn'),
  addVoiceEndFieldBtn: document.getElementById('add-voice-end-field-btn'),
  addVoiceChunkFieldBtn: document.getElementById('add-voice-chunk-field-btn'),
  voiceChunkSize: document.getElementById('voice-chunk-size'),
  voiceFieldName: document.getElementById('voice-field-name'),
  voiceBase64Encode: document.getElementById('voice-base64-encode'),
  pasteVoiceStartJsonBtn: document.getElementById('paste-voice-start-json-btn'),
  pasteVoiceStartJsonArea: document.getElementById('paste-voice-start-json-area'),
  pasteVoiceStartJsonInput: document.getElementById('paste-voice-start-json-input'),
  parseVoiceStartJsonBtn: document.getElementById('parse-voice-start-json-btn'),
  cancelPasteVoiceStartJsonBtn: document.getElementById('cancel-paste-voice-start-json-btn'),
  pasteVoiceEndJsonBtn: document.getElementById('paste-voice-end-json-btn'),
  pasteVoiceEndJsonArea: document.getElementById('paste-voice-end-json-area'),
  pasteVoiceEndJsonInput: document.getElementById('paste-voice-end-json-input'),
  parseVoiceEndJsonBtn: document.getElementById('parse-voice-end-json-btn'),
  cancelPasteVoiceEndJsonBtn: document.getElementById('cancel-paste-voice-end-json-btn'),
  pasteVoiceChunkJsonBtn: document.getElementById('paste-voice-chunk-json-btn'),
  pasteVoiceChunkJsonArea: document.getElementById('paste-voice-chunk-json-area'),
  pasteVoiceChunkJsonInput: document.getElementById('paste-voice-chunk-json-input'),
  parseVoiceChunkJsonBtn: document.getElementById('parse-voice-chunk-json-btn'),
  cancelPasteVoiceChunkJsonBtn: document.getElementById('cancel-paste-voice-chunk-json-btn'),
  startVoiceBtn: document.getElementById('start-voice-btn'),
  stopVoiceBtn: document.getElementById('stop-voice-btn'),
  voiceStatus: document.getElementById('voice-status'),
  clearMessagesLink: document.getElementById('clear-messages-link'),
  messagesContainer: document.getElementById('messages-container'),
  autoScroll: document.getElementById('auto-scroll'),
  showPingPong: document.getElementById('show-ping-pong'),
  displayFormat: document.getElementById('display-format'),
  jsonWrap: document.getElementById('json-wrap'),
  jsonWrapLabel: document.getElementById('json-wrap-label'),
  fontSize: document.getElementById('font-size'),
  leftPanel: document.getElementById('left-panel'),
  rightPanel: document.getElementById('right-panel'),
  resizer: document.getElementById('resizer')
};

// 状态管理
let statusCheckInterval = null;
let customFormatterFunc = null;
let urlParams = [];
let headers = [];
let jsonFields = []; // JSON 字段列表
let voiceStartFields = []; // 语音开始包字段列表
let voiceEndFields = []; // 语音结束包字段列表
let voiceChunkFields = []; // 语音音频切片包字段列表
let mediaRecorder = null; // 录音器
let audioChunks = []; // 音频数据块
let isRecording = false; // 是否正在录音
let voiceChunkTimer = null; // 音频切片定时器
let eventSource = null;
let frontendWs = null; // 前端到后端的 WebSocket 连接

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  initResizer();
  initKeyValueLists();
  loadConfig();
  startStatusCheck();
  startSSE();
  connectFrontendWebSocket();
  
  // 初始化显示格式相关UI
  if (elements.displayFormat.value === 'json') {
    elements.jsonWrapLabel.style.display = 'inline-block';
  } else {
    elements.jsonWrapLabel.style.display = 'none';
  }
  
  // 初始化消息字体大小
  updateMessageFontSize();
});

/**
 * 初始化事件监听器
 */
function initEventListeners() {
  elements.saveConfigBtn.addEventListener('click', saveConfig);
  elements.connectBtn.addEventListener('click', toggleConnection);
  elements.messageFormat.addEventListener('change', onFormatChange);
  elements.heartbeatType.addEventListener('change', onHeartbeatTypeChange);
  elements.toggleHeartbeatBtn.addEventListener('click', toggleHeartbeat);
  elements.setFormatterBtn.addEventListener('click', setCustomFormatter);
  elements.sendBtn.addEventListener('click', sendMessage);
  elements.sendHeartbeatBtn.addEventListener('click', sendSingleHeartbeat);
  elements.clearMessagesLink.addEventListener('click', (e) => {
    e.preventDefault();
    clearMessages();
  });
  elements.autoScroll.addEventListener('change', () => {
    if (elements.autoScroll.checked) {
      scrollToBottom();
    }
  });
  elements.showPingPong.addEventListener('change', () => {
    loadMessages();
  });
  elements.displayFormat.addEventListener('change', () => {
    // 切换 JSON 换行选项的显示
    if (elements.displayFormat.value === 'json') {
      elements.jsonWrapLabel.style.display = 'inline-block';
    } else {
      elements.jsonWrapLabel.style.display = 'none';
    }
    loadMessages();
  });
  elements.jsonWrap.addEventListener('change', () => {
    loadMessages();
  });
  elements.fontSize.addEventListener('change', () => {
    updateMessageFontSize();
  });
  elements.addUrlParamBtn.addEventListener('click', () => addKeyValueItem('url-param'));
  elements.addHeaderBtn.addEventListener('click', () => addKeyValueItem('header'));
  elements.addJsonFieldBtn.addEventListener('click', () => addJsonFieldItem());
  elements.pasteJsonBtn.addEventListener('click', () => {
    elements.pasteJsonArea.style.display = 'block';
    elements.pasteJsonInput.focus();
  });
  elements.parseJsonBtn.addEventListener('click', parseAndFillJson);
  elements.cancelPasteJsonBtn.addEventListener('click', () => {
    elements.pasteJsonArea.style.display = 'none';
    elements.pasteJsonInput.value = '';
  });
  
  // 监听连接地址输入，自动解析 URL 参数
  elements.wsUrl.addEventListener('blur', parseUrlParams);
  elements.wsUrl.addEventListener('change', parseUrlParams);
  
  // 更新按钮状态显示
  function updateAddFileToParamsButton() {
    const isChecked = elements.addFileToParams.checked;
    if (isChecked) {
      elements.toggleAddFileToParams.textContent = '添加到JSON字段: 开启';
      elements.toggleAddFileToParams.classList.remove('btn-secondary');
      elements.toggleAddFileToParams.classList.add('btn-success');
    } else {
      elements.toggleAddFileToParams.textContent = '添加到JSON字段: 关闭';
      elements.toggleAddFileToParams.classList.remove('btn-success');
      elements.toggleAddFileToParams.classList.add('btn-secondary');
    }
  }
  
  // 监听按钮点击，切换状态
  elements.toggleAddFileToParams.addEventListener('click', () => {
    elements.addFileToParams.checked = !elements.addFileToParams.checked;
    updateAddFileToParamsButton();
    // 触发 change 事件以更新相关UI
    elements.addFileToParams.dispatchEvent(new Event('change'));
  });
  
  // 监听文件添加到参数选项（复选框变化）
  elements.addFileToParams.addEventListener('change', () => {
    updateAddFileToParamsButton();
    if (elements.addFileToParams.checked) {
      elements.fileFieldGroup.style.display = 'block';
      elements.fileBase64Label.style.display = 'inline-block';
    } else {
      elements.fileFieldGroup.style.display = 'none';
      elements.fileBase64Label.style.display = 'none';
    }
  });
  
  // 初始化按钮状态
  updateAddFileToParamsButton();
  
  // 监听文件切片选项
  elements.enableFileChunk.addEventListener('change', () => {
    if (elements.enableFileChunk.checked) {
      checkFileTypeAndShowChunkOptions();
    } else {
      elements.chunkSizeGroup.style.display = 'none';
      elements.chunkTimeGroup.style.display = 'none';
    }
  });
  
  // 监听文件选择，自动检测文件类型
  elements.fileInput.addEventListener('change', () => {
    checkFileType();
  });
  
  // 语音模式相关事件
  elements.enableVoiceMode.addEventListener('change', () => {
    elements.voiceModeConfig.style.display = elements.enableVoiceMode.checked ? 'block' : 'none';
    updateVoiceButtons();
  });
  
  elements.addVoiceStartFieldBtn.addEventListener('click', () => {
    addVoiceFieldItem(voiceStartFields, elements.voiceStartFieldsList, true);
  });
  
  elements.addVoiceEndFieldBtn.addEventListener('click', () => {
    addVoiceFieldItem(voiceEndFields, elements.voiceEndFieldsList, false);
  });
  
  // 开始包JSON粘贴
  elements.pasteVoiceStartJsonBtn.addEventListener('click', () => {
    elements.pasteVoiceStartJsonArea.style.display = 'block';
  });
  
  elements.parseVoiceStartJsonBtn.addEventListener('click', () => {
    parseAndFillVoiceJson(elements.pasteVoiceStartJsonInput.value, voiceStartFields, elements.voiceStartFieldsList);
    elements.pasteVoiceStartJsonArea.style.display = 'none';
    elements.pasteVoiceStartJsonInput.value = '';
  });
  
  elements.cancelPasteVoiceStartJsonBtn.addEventListener('click', () => {
    elements.pasteVoiceStartJsonArea.style.display = 'none';
    elements.pasteVoiceStartJsonInput.value = '';
  });
  
  // 结束包JSON粘贴
  elements.pasteVoiceEndJsonBtn.addEventListener('click', () => {
    elements.pasteVoiceEndJsonArea.style.display = 'block';
  });
  
  elements.parseVoiceEndJsonBtn.addEventListener('click', () => {
    parseAndFillVoiceJson(elements.pasteVoiceEndJsonInput.value, voiceEndFields, elements.voiceEndFieldsList);
    elements.pasteVoiceEndJsonArea.style.display = 'none';
    elements.pasteVoiceEndJsonInput.value = '';
  });
  
  elements.cancelPasteVoiceEndJsonBtn.addEventListener('click', () => {
    elements.pasteVoiceEndJsonArea.style.display = 'none';
    elements.pasteVoiceEndJsonInput.value = '';
  });
  
  // 音频切片包JSON粘贴
  if (elements.pasteVoiceChunkJsonBtn) {
    elements.pasteVoiceChunkJsonBtn.addEventListener('click', () => {
      elements.pasteVoiceChunkJsonArea.style.display = 'block';
    });
  }
  
  if (elements.parseVoiceChunkJsonBtn) {
    elements.parseVoiceChunkJsonBtn.addEventListener('click', () => {
      parseAndFillVoiceJson(elements.pasteVoiceChunkJsonInput.value, voiceChunkFields, elements.voiceChunkFieldsList);
      elements.pasteVoiceChunkJsonArea.style.display = 'none';
      elements.pasteVoiceChunkJsonInput.value = '';
    });
  }
  
  if (elements.cancelPasteVoiceChunkJsonBtn) {
    elements.cancelPasteVoiceChunkJsonBtn.addEventListener('click', () => {
      elements.pasteVoiceChunkJsonArea.style.display = 'none';
      elements.pasteVoiceChunkJsonInput.value = '';
    });
  }
  
  elements.startVoiceBtn.addEventListener('click', startVoiceRecording);
  elements.stopVoiceBtn.addEventListener('click', stopVoiceRecording);
  
  // 初始化语音模式UI
  initVoiceFields();
  updateVoiceButtons();
}

/**
 * 检测文件类型（音频/视频）
 * @param {File} file - 文件对象
 * @returns {Object} 文件类型信息
 */
function detectFileType(file) {
  if (!file) return { isAudio: false, isVideo: false, type: 'other' };
  
  const mimeType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.') + 1);
  
  // 音频类型
  const audioTypes = ['audio', 'mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'];
  // 视频类型
  const videoTypes = ['video', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];
  
  const isAudio = audioTypes.some(type => mimeType.includes(type) || extension === type);
  const isVideo = videoTypes.some(type => mimeType.includes(type) || extension === type);
  
  return {
    isAudio,
    isVideo,
    type: isAudio ? 'audio' : (isVideo ? 'video' : 'other'),
    extension
  };
}

/**
 * 检测文件类型并显示相关信息
 */
async function checkFileType() {
  const file = elements.fileInput.files[0];
  if (!file) {
    elements.fileInfo.style.display = 'none';
    return;
  }
  
  const fileType = detectFileType(file);
  elements.fileTypeInfo.textContent = `类型: ${fileType.type === 'audio' ? '音频' : (fileType.type === 'video' ? '视频' : '其他')} (${fileType.extension || '未知'})`;
  elements.fileInfo.style.display = 'block';
  
  // 如果是 WAV 文件，显示去掉 WAV 头的选项
  if (fileType.isWav) {
    elements.wavHeaderOption.style.display = 'block';
  } else {
    elements.wavHeaderOption.style.display = 'none';
    elements.removeWavHeader.checked = false;
  }
  
  // 如果是音频或视频，尝试获取时长
  if (fileType.isAudio || fileType.isVideo) {
    try {
      const duration = await getMediaDuration(file, fileType.type);
      if (duration) {
        const seconds = Math.floor(duration);
        const ms = Math.floor((duration - seconds) * 1000);
        elements.fileDurationInfo.textContent = `时长: ${seconds}s ${ms}ms (${Math.floor(duration * 1000)}ms)`;
      } else {
        elements.fileDurationInfo.textContent = '';
      }
    } catch (error) {
      console.error('获取媒体时长失败:', error);
      elements.fileDurationInfo.textContent = '';
    }
    
    // 如果已启用切片，显示时间切片选项
    if (elements.enableFileChunk.checked) {
      checkFileTypeAndShowChunkOptions();
    }
  } else {
    elements.fileDurationInfo.textContent = '';
    if (elements.enableFileChunk.checked) {
      elements.chunkTimeGroup.style.display = 'none';
    }
  }
}

/**
 * 获取媒体文件时长
 * @param {File} file - 文件对象
 * @param {string} type - 类型 ('audio' 或 'video')
 * @returns {Promise<number>} 时长（秒）
 */
function getMediaDuration(file, type) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const media = type === 'audio' ? new Audio(url) : document.createElement('video');
    
    media.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(media.duration);
    };
    
    media.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法加载媒体文件'));
    };
    
    media.src = url;
  });
}

/**
 * 根据文件类型显示切片选项
 */
function checkFileTypeAndShowChunkOptions() {
  const file = elements.fileInput.files[0];
  if (!file) {
    elements.chunkSizeGroup.style.display = 'block';
    elements.chunkTimeGroup.style.display = 'none';
    return;
  }
  
  const fileType = detectFileType(file);
  
  if (fileType.isAudio || fileType.isVideo) {
    // 音频/视频：显示时间切片选项
    elements.chunkTimeGroup.style.display = 'block';
    elements.chunkSizeGroup.style.display = 'none'; // 隐藏大小切片
  } else {
    // 其他文件：显示大小切片选项
    elements.chunkSizeGroup.style.display = 'block';
    elements.chunkTimeGroup.style.display = 'none';
  }
}

/**
 * 初始化可拖动分隔条
 */
function initResizer() {
  let isResizing = false;
  let startX = 0;
  let startLeftWidth = 0;
  let startRightWidth = 0;

  elements.resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startLeftWidth = elements.leftPanel.offsetWidth;
    startRightWidth = elements.rightPanel.offsetWidth;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  });

  function handleMouseMove(e) {
    if (!isResizing) return;
    const diff = e.clientX - startX;
    const newLeftWidth = startLeftWidth + diff;
    const newRightWidth = startRightWidth - diff;
    const minWidth = 200;
    
    if (newLeftWidth >= minWidth && newRightWidth >= minWidth) {
      elements.leftPanel.style.width = newLeftWidth + 'px';
      elements.rightPanel.style.width = newRightWidth + 'px';
    }
  }

  function handleMouseUp() {
    isResizing = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }
}

/**
 * 初始化 Key-Value 列表
 */
function initKeyValueLists() {
  // 添加一个默认的空项
  addKeyValueItem('url-param');
  addKeyValueItem('header');
}

/**
 * 初始化 JSON 字段列表
 */
function initJsonFieldsList() {
  // 添加一个默认的空项
  addJsonFieldItem();
}

/**
 * 添加 Key-Value 项
 */
function addKeyValueItem(type) {
  const container = type === 'url-param' ? elements.urlParamsList : elements.headersList;
  const item = document.createElement('div');
  item.className = 'key-value-item';
  item.innerHTML = `
    <input type="text" class="key-input" placeholder="Key" value="">
    <input type="text" class="value-input" placeholder="Value" value="">
    <button type="button" class="btn btn-danger btn-small remove-item-btn">删除</button>
  `;
  
  item.querySelector('.remove-item-btn').addEventListener('click', () => {
    item.remove();
    updateKeyValueData();
  });
  
  item.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updateKeyValueData);
  });
  
  container.appendChild(item);
  updateKeyValueData();
}

/**
 * 添加 JSON 字段项
 */
function addJsonFieldItem() {
  const container = elements.jsonFieldsList;
  const item = document.createElement('div');
  item.className = 'key-value-item';
  item.innerHTML = `
    <input type="text" class="key-input" placeholder="字段名" value="">
    <input type="text" class="value-input" placeholder="字段值" value="">
    <button type="button" class="btn btn-danger btn-small remove-item-btn">删除</button>
  `;
  
  item.querySelector('.remove-item-btn').addEventListener('click', () => {
    item.remove();
    updateJsonFields();
  });
  
  item.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updateJsonFields);
  });
  
  container.appendChild(item);
  updateJsonFields();
}

/**
 * 更新 JSON 字段数据
 */
function updateJsonFields() {
  jsonFields = [];
  elements.jsonFieldsList.querySelectorAll('.key-value-item').forEach(item => {
    const key = item.querySelector('.key-input').value.trim();
    const value = item.querySelector('.value-input').value.trim();
    if (key) {
      jsonFields.push({ key, value });
    }
  });
}

/**
 * 递归设置嵌套对象字段（支持点号分隔的路径）
 * @param {Object} obj - 目标对象
 * @param {string} path - 字段路径（如 "user.profile.avatar"）
 * @param {*} value - 要设置的值
 */
function setNestedField(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  // 遍历路径的每一部分（除了最后一个）
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!key) continue; // 跳过空键
    
    // 如果当前键不存在或不是对象，创建新对象
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null || Array.isArray(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }
  
  // 设置最后一个键的值
  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }
}

/**
 * 递归展开嵌套对象为扁平化的字段列表（支持嵌套字段）
 * @param {Object} obj - 要展开的对象
 * @param {string} prefix - 当前路径前缀（用于递归）
 * @param {Array} result - 结果数组，格式: [{key: string, value: string}]
 */
function flattenNestedObject(obj, prefix = '', result = []) {
  if (typeof obj !== 'object' || obj === null) {
    // 基本类型，直接添加
    const key = prefix || 'value';
    const valueStr = typeof obj === 'string' ? obj : JSON.stringify(obj);
    result.push({ key, value: valueStr });
    return result;
  }
  
  if (Array.isArray(obj)) {
    // 数组类型，作为JSON字符串处理
    const key = prefix || 'value';
    result.push({ key, value: JSON.stringify(obj) });
    return result;
  }
  
  // 对象类型，递归展开
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const fullPath = prefix ? `${prefix}.${key}` : key;
    
    // 如果是嵌套对象或数组，递归展开
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattenNestedObject(value, fullPath, result);
    } else {
      // 基本类型或数组，直接添加
      let valueStr;
      if (typeof value === 'object' && value !== null) {
        // 数组或其他对象，JSON字符串化
        valueStr = JSON.stringify(value);
      } else {
        valueStr = String(value);
      }
      result.push({ key: fullPath, value: valueStr });
    }
  });
  
  return result;
}

/**
 * 解析 JSON 文本并填充到字段列表
 */
function parseAndFillJson() {
  try {
    const jsonText = elements.pasteJsonInput.value.trim();
    if (!jsonText) {
      showError('请输入 JSON 文本');
      return;
    }
    
    // 解析 JSON
    const jsonObj = JSON.parse(jsonText);
    
    if (typeof jsonObj !== 'object' || jsonObj === null || Array.isArray(jsonObj)) {
      showError('JSON 必须是一个对象（不能是数组或基本类型）');
      return;
    }
    
    // 清空现有字段
    elements.jsonFieldsList.innerHTML = '';
    jsonFields = [];
    
    // 递归展开嵌套对象
    const flattenedFields = flattenNestedObject(jsonObj);
    
    // 添加所有展开的字段
    flattenedFields.forEach(({ key, value }) => {
      addJsonFieldItemWithValue(key, value);
    });
    
    // 隐藏粘贴区域
    elements.pasteJsonArea.style.display = 'none';
    elements.pasteJsonInput.value = '';
    
    showSuccess(`成功解析并填充 ${flattenedFields.length} 个字段（包含嵌套字段）`);
  } catch (error) {
    if (error instanceof SyntaxError) {
      showError('JSON 格式错误: ' + error.message);
    } else {
      showError('解析失败: ' + error.message);
    }
  }
}

/**
 * 添加 JSON 字段项（带初始值）
 * @param {string} key - 字段名
 * @param {string} value - 字段值
 */
function addJsonFieldItemWithValue(key = '', value = '') {
  const container = elements.jsonFieldsList;
  const item = document.createElement('div');
  item.className = 'key-value-item';
  item.innerHTML = `
    <input type="text" class="key-input" placeholder="字段名" value="${escapeHtml(key)}">
    <input type="text" class="value-input" placeholder="字段值" value="${escapeHtml(value)}">
    <button type="button" class="btn btn-danger btn-small remove-item-btn">删除</button>
  `;
  
  item.querySelector('.remove-item-btn').addEventListener('click', () => {
    item.remove();
    updateJsonFields();
  });
  
  item.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', updateJsonFields);
  });
  
  container.appendChild(item);
  updateJsonFields();
}

/**
 * HTML 转义（防止 XSS）
 * @param {string} text - 要转义的文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 更新 Key-Value 数据
 */
function updateKeyValueData() {
  // 更新 URL 参数
  urlParams = [];
  elements.urlParamsList.querySelectorAll('.key-value-item').forEach(item => {
    const key = item.querySelector('.key-input').value.trim();
    const value = item.querySelector('.value-input').value.trim();
    if (key) {
      urlParams.push({ key, value });
    }
  });

  // 更新请求头
  headers = [];
  elements.headersList.querySelectorAll('.key-value-item').forEach(item => {
    const key = item.querySelector('.key-input').value.trim();
    const value = item.querySelector('.value-input').value.trim();
    if (key) {
      headers.push({ key, value });
    }
  });
}

/**
 * 构建完整 URL（包含参数）
 */
function buildFullUrl(baseUrl) {
  if (!baseUrl) return baseUrl;
  if (urlParams.length === 0) return baseUrl;
  
  const url = new URL(baseUrl);
  urlParams.forEach(param => {
    if (param.key) {
      url.searchParams.append(param.key, param.value || '');
    }
  });
  return url.toString();
}

/**
 * 加载配置
 */
async function loadConfig() {
  try {
    const response = await fetch(`${API_BASE}/status`);
    const result = await response.json();
    if (result.success) {
      const config = result.data.config;
      elements.wsUrl.value = config.url || '';
      
      // 加载 URL 参数
      if (config.urlParams) {
        urlParams = config.urlParams;
        elements.urlParamsList.innerHTML = '';
        urlParams.forEach(param => {
          addKeyValueItem('url-param');
          const items = elements.urlParamsList.querySelectorAll('.key-value-item');
          const lastItem = items[items.length - 1];
          lastItem.querySelector('.key-input').value = param.key || '';
          lastItem.querySelector('.value-input').value = param.value || '';
        });
      }
      
      // 加载请求头
      if (config.headers) {
        headers = Object.entries(config.headers).map(([key, value]) => ({ key, value }));
        elements.headersList.innerHTML = '';
        headers.forEach(header => {
          addKeyValueItem('header');
          const items = elements.headersList.querySelectorAll('.key-value-item');
          const lastItem = items[items.length - 1];
          lastItem.querySelector('.key-input').value = header.key || '';
          lastItem.querySelector('.value-input').value = header.value || '';
        });
      }
      
      // 时间单位转换：毫秒转秒
      elements.idleTimeout.value = Math.floor((config.idleTimeout || 300000) / 1000);
      
      updateStatus(result.data.state);
      
      // 根据显示格式显示/隐藏 JSON 换行选项
      if (elements.displayFormat.value === 'json') {
        elements.jsonWrapLabel.style.display = 'inline-block';
      } else {
        elements.jsonWrapLabel.style.display = 'none';
      }
      
      // 如果已连接，加载心跳配置
      if (result.data.state === 'OPEN') {
        setTimeout(() => {
          elements.heartbeatInterval.value = Math.floor((config.heartbeatInterval || 30000) / 1000);
          elements.heartbeatType.value = config.heartbeatType || 'message';
          elements.heartbeatMessage.value = config.heartbeatMessage || 'ping';
          onHeartbeatTypeChange();
          // 更新心跳按钮状态
          updateHeartbeatButton(result.data.heartbeatRunning || false);
        }, 100);
      }
    }
  } catch (error) {
    showError('加载配置失败: ' + error.message);
  }
}

/**
 * 保存配置
 */
async function saveConfig() {
  try {
    updateKeyValueData();
    
    // 构建请求头对象
    const headersObj = {};
    headers.forEach(header => {
      if (header.key) {
        headersObj[header.key] = header.value || '';
      }
    });

    // 时间单位转换：秒转毫秒
    const config = {
      url: elements.wsUrl.value.trim(),
      urlParams: urlParams,
      headers: headersObj,
      idleTimeout: parseInt(elements.idleTimeout.value) * 1000
    };

    // 如果心跳面板显示，则包含心跳配置
    if (elements.heartbeatPanel.style.display !== 'none') {
      config.heartbeatInterval = parseInt(elements.heartbeatInterval.value) * 1000;
      config.heartbeatType = elements.heartbeatType.value;
      config.heartbeatMessage = elements.heartbeatType.value === 'message' ? elements.heartbeatMessage.value.trim() : null;
    }

    const response = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const result = await response.json();
    if (result.success) {
      showSuccess('配置已保存');
    } else {
      showError('保存配置失败: ' + (result.errors?.join(', ') || result.error));
    }
  } catch (error) {
    showError('保存配置失败: ' + error.message);
  }
}

/**
 * 切换连接状态（连接/断开）
 */
async function toggleConnection() {
  const isConnected = elements.connectBtn.textContent === '断开';
  if (isConnected) {
    await disconnect();
  } else {
    await connect();
  }
}

/**
 * 连接 WebSocket
 */
async function connect() {
  try {
    await saveConfig();
    updateKeyValueData();
    
    // 构建完整 URL
    const baseUrl = elements.wsUrl.value.trim();
    const fullUrl = buildFullUrl(baseUrl);
    
    const response = await fetch(`${API_BASE}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: fullUrl })
    });
    
    const result = await response.json();
    if (result.success) {
      showSuccess('正在连接...');
      updateStatus('CONNECTING');
    } else {
      showError('连接失败: ' + result.error);
    }
  } catch (error) {
    showError('连接失败: ' + error.message);
  }
}

/**
 * 断开连接
 */
async function disconnect() {
  try {
    const response = await fetch(`${API_BASE}/disconnect`, { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      showSuccess('已断开连接');
      updateStatus('CLOSED');
      updateHeartbeatButton(false);
    } else {
      showError('断开连接失败: ' + result.error);
    }
  } catch (error) {
    showError('断开连接失败: ' + error.message);
  }
}

/**
 * 更新心跳按钮状态
 * @param {boolean} isRunning - 心跳是否运行中
 */
function updateHeartbeatButton(isRunning) {
  if (isRunning) {
    elements.toggleHeartbeatBtn.textContent = '停止心跳';
    elements.toggleHeartbeatBtn.className = 'btn btn-danger';
  } else {
    elements.toggleHeartbeatBtn.textContent = '启动心跳';
    elements.toggleHeartbeatBtn.className = 'btn btn-success';
  }
}

/**
 * 切换心跳状态（启动/停止）
 */
async function toggleHeartbeat() {
  try {
    // 先获取当前状态
    const statusResponse = await fetch(`${API_BASE}/status`);
    const statusResult = await statusResponse.json();
    
    if (!statusResult.success) {
      showError('获取心跳状态失败');
      return;
    }
    
    const isRunning = statusResult.data.heartbeatRunning || false;
    
    if (isRunning) {
      // 当前运行中，执行停止
      await stopHeartbeat();
    } else {
      // 当前未运行，执行启动
      await startHeartbeat();
    }
  } catch (error) {
    showError('切换心跳状态失败: ' + error.message);
  }
}

/**
 * 启动心跳
 */
async function startHeartbeat() {
  try {
    // 先保存心跳配置
    updateKeyValueData();
    const headersObj = {};
    headers.forEach(header => {
      if (header.key) {
        headersObj[header.key] = header.value || '';
      }
    });

    const config = {
      url: elements.wsUrl.value.trim(),
      urlParams: urlParams,
      headers: headersObj,
      heartbeatInterval: parseInt(elements.heartbeatInterval.value) * 1000,
      heartbeatType: elements.heartbeatType.value,
      heartbeatMessage: elements.heartbeatType.value === 'message' ? elements.heartbeatMessage.value.trim() : null,
      idleTimeout: parseInt(elements.idleTimeout.value) * 1000
    };

    // 更新心跳配置
    const configResponse = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const configResult = await configResponse.json();
    if (!configResult.success) {
      showError('更新心跳配置失败: ' + (configResult.errors?.join(', ') || configResult.error));
      return;
    }

    // 启动心跳
    const response = await fetch(`${API_BASE}/heartbeat/start`, { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      showSuccess('心跳已启动');
      updateHeartbeatButton(true);
    } else {
      showError('启动心跳失败: ' + result.error);
    }
  } catch (error) {
    showError('启动心跳失败: ' + error.message);
  }
}

/**
 * 停止心跳
 */
async function stopHeartbeat() {
  try {
    const response = await fetch(`${API_BASE}/heartbeat/stop`, { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      showSuccess('心跳已停止');
      updateHeartbeatButton(false);
    } else {
      showError('停止心跳失败: ' + result.error);
    }
  } catch (error) {
    showError('停止心跳失败: ' + error.message);
  }
}

/**
 * 更新状态显示
 */
function updateStatus(state) {
  // 更新语音按钮状态
  updateVoiceButtons();
  const statusMap = {
    'OPEN': { text: '已连接', class: 'status-open' },
    'CONNECTING': { text: '连接中', class: 'status-connecting' },
    'CLOSING': { text: '断开中', class: 'status-connecting' },
    'CLOSED': { text: '未连接', class: 'status-closed' }
  };

  const status = statusMap[state] || statusMap['CLOSED'];
  elements.statusText.textContent = status.text;
  elements.statusDot.className = `status-dot ${status.class}`;

  const isConnected = state === 'OPEN';
  
  // 根据连接状态切换按钮文本和样式
  if (isConnected) {
    elements.connectBtn.textContent = '断开';
    elements.connectBtn.className = 'btn btn-danger';
  } else {
    elements.connectBtn.textContent = '连接';
    elements.connectBtn.className = 'btn btn-success';
  }
  
  elements.connectBtn.disabled = state === 'CONNECTING';
  elements.sendBtn.disabled = !isConnected;
  
  if (isConnected) {
    elements.heartbeatPanel.style.display = 'block';
    elements.sendHeartbeatBtn.disabled = false;
    // 获取心跳状态并更新按钮
    fetch(`${API_BASE}/status`)
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data.heartbeatRunning !== undefined) {
          updateHeartbeatButton(result.data.heartbeatRunning);
        }
      })
      .catch(() => {
        // 忽略错误，使用默认状态
        updateHeartbeatButton(false);
      });
  } else {
    elements.heartbeatPanel.style.display = 'none';
    elements.sendHeartbeatBtn.disabled = true;
    updateHeartbeatButton(false);
  }
}

/**
 * 从连接地址解析 URL 参数
 */
function parseUrlParams() {
  const urlStr = elements.wsUrl.value.trim();
  if (!urlStr) {
    return;
  }

  try {
    // 尝试解析 URL
    let url;
    let protocol = '';
    
    // 检测协议
    if (urlStr.startsWith('wss://')) {
      protocol = 'wss://';
      url = new URL(urlStr);
    } else if (urlStr.startsWith('ws://')) {
      protocol = 'ws://';
      url = new URL(urlStr);
    } else {
      // 如果没有协议，尝试添加 ws://
      protocol = 'ws://';
      url = new URL('ws://' + urlStr);
    }

    // 获取 URL 中的查询参数
    const searchParams = url.searchParams;
    if (searchParams.size > 0) {
      // 检查是否有现有参数
      const hasExistingParams = urlParams.length > 0 && urlParams.some(p => p.key);
      if (hasExistingParams) {
        if (!confirm('检测到 URL 中包含参数，是否解析并替换现有参数？')) {
          return;
        }
      }

      // 清空现有的 URL 参数列表
      urlParams = [];
      elements.urlParamsList.innerHTML = '';

      // 添加解析到的参数
      searchParams.forEach((value, key) => {
        urlParams.push({ key, value });
        addKeyValueItem('url-param');
        const items = elements.urlParamsList.querySelectorAll('.key-value-item');
        const lastItem = items[items.length - 1];
        lastItem.querySelector('.key-input').value = key;
        lastItem.querySelector('.value-input').value = value;
      });

      // 从 URL 中移除查询参数，只保留基础 URL
      url.search = '';
      let baseUrl = url.host + url.pathname;
      if (url.port && ((protocol === 'ws://' && url.port !== '80') || (protocol === 'wss://' && url.port !== '443'))) {
        baseUrl = url.hostname + ':' + url.port + url.pathname;
      } else {
        baseUrl = url.hostname + url.pathname;
      }
      
      // 更新输入框，保留协议
      elements.wsUrl.value = protocol + baseUrl;
    }
  } catch (error) {
    console.error('解析 URL 参数失败:', error);
  }
}

/**
 * 开始状态检查
 */
function startStatusCheck() {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
  }
  statusCheckInterval = setInterval(async () => {
    try {
      const response = await fetch(`${API_BASE}/status`);
      const result = await response.json();
      if (result.success) {
        updateStatus(result.data.state);
        // SSE 会实时推送消息，这里只加载历史消息（如果需要）
        if (!eventSource || eventSource.readyState !== EventSource.OPEN) {
          loadMessages();
        }
      }
    } catch (error) {
      console.error('状态检查失败:', error);
    }
  }, 5000); // 降低轮询频率，因为 SSE 会实时推送
}

/**
 * 心跳类型变化
 */
function onHeartbeatTypeChange() {
  const type = elements.heartbeatType.value;
  elements.heartbeatMessageGroup.style.display = type === 'message' ? 'block' : 'none';
}

/**
 * 格式选择变化
 */
function onFormatChange() {
  const format = elements.messageFormat.value;
  elements.customFormatterGroup.style.display = format === 'custom' ? 'block' : 'none';
  
  // 根据格式显示/隐藏相应的输入方式
  if (format === 'json') {
    elements.textMessageGroup.style.display = 'none';
    elements.jsonMessageGroup.style.display = 'block';
  } else {
    elements.textMessageGroup.style.display = 'block';
    elements.jsonMessageGroup.style.display = 'none';
  }
}

/**
 * 设置自定义格式化函数
 */
async function setCustomFormatter() {
  try {
    const formatterCode = elements.customFormatter.value.trim();
    if (!formatterCode) {
      showError('请输入格式化函数');
      return;
    }

    const formatter = new Function('data', 'options', formatterCode);
    try {
      formatter('test', {});
    } catch (error) {
      showError('格式化函数测试失败: ' + error.message);
      return;
    }

    customFormatterFunc = formatter;
    showSuccess('自定义格式化函数已设置');
  } catch (error) {
    showError('设置格式化函数失败: ' + error.message);
  }
}

/**
 * 发送单次心跳
 */
/**
 * 连接前端到后端的 WebSocket（用于发送心跳命令）
 */
function connectFrontendWebSocket() {
  // 获取当前协议和主机
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  try {
    frontendWs = new WebSocket(wsUrl);
    
    frontendWs.onopen = () => {
      console.log('[前端 WebSocket] 已连接到服务器');
    };
    
    frontendWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'heartbeat' && message.action === 'result') {
          if (message.success) {
            showSuccess('心跳已发送');
          } else {
            showError('发送心跳失败: ' + (message.error || '未知错误'));
          }
        }
      } catch (error) {
        console.error('[前端 WebSocket] 解析消息失败:', error);
      }
    };
    
    frontendWs.onerror = (error) => {
      console.error('[前端 WebSocket] 连接错误:', error);
    };
    
    frontendWs.onclose = () => {
      console.log('[前端 WebSocket] 连接已关闭，3秒后重连...');
      // 3秒后重连
      setTimeout(() => {
        if (!frontendWs || frontendWs.readyState === WebSocket.CLOSED) {
          connectFrontendWebSocket();
        }
      }, 3000);
    };
  } catch (error) {
    console.error('[前端 WebSocket] 连接失败:', error);
    // 如果 WebSocket 连接失败，回退到 HTTP API
    console.warn('[前端 WebSocket] 回退到 HTTP API');
  }
}

/**
 * 发送单次心跳
 */
async function sendSingleHeartbeat() {
  // 优先使用 WebSocket 发送
  if (frontendWs && frontendWs.readyState === WebSocket.OPEN) {
    try {
      frontendWs.send(JSON.stringify({
        type: 'heartbeat',
        action: 'send'
      }));
      return;
    } catch (error) {
      console.error('[前端 WebSocket] 发送失败，回退到 HTTP API:', error);
    }
  }
  
  // 回退到 HTTP API
  try {
    const response = await fetch(`${API_BASE}/heartbeat/send`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 检查响应状态
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
    }
    
    // 检查 Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`服务器返回了非 JSON 响应: ${text.substring(0, 100)}`);
    }
    
    const result = await response.json();
    if (result.success) {
      showSuccess('心跳已发送');
    } else {
      showError('发送心跳失败: ' + (result.error || '未知错误'));
    }
  } catch (error) {
    showError('发送心跳失败: ' + error.message);
  }
}

/**
 * 发送消息
 */
async function sendMessage() {
  try {
    const message = elements.messageInput.value.trim();
    const file = elements.fileInput.files[0];
    const format = elements.messageFormat.value;

    // 检查是否有内容
    const hasJsonFields = format === 'json' && jsonFields.length > 0;
    const hasTextMessage = format !== 'json' && message;
    const hasFile = !!file;
    
    if (!hasJsonFields && !hasTextMessage && !hasFile) {
      showError('请输入消息、添加JSON字段或选择文件');
      return;
    }

    if (file) {
      // 如果选择添加到JSON字段
      if (elements.addFileToParams.checked && format === 'json') {
        // 读取文件并编码
        const reader = new FileReader();
        const fileType = detectFileType(file);
        const removeWavHeader = fileType.isWav && elements.removeWavHeader.checked;
        
        reader.onload = async (e) => {
          try {
            let fileData;
            let actualFileSize = file.size;
            
            if (elements.fileBase64Encode.checked) {
              // Base64 编码（支持大文件）
              const arrayBuffer = e.target.result;
              let bytes = new Uint8Array(arrayBuffer);
              
              // 如果要去掉 WAV 头，跳过前 44 字节
              if (removeWavHeader) {
                const wavHeaderSize = 44;
                bytes = bytes.slice(wavHeaderSize);
                actualFileSize = bytes.length;
              }
              
              let binary = '';
              // 分块处理，避免堆栈溢出
              for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              fileData = btoa(binary);
            } else {
              // 文本内容
              if (removeWavHeader) {
                // 对于文本模式，也去掉 WAV 头
                const arrayBuffer = e.target.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                const wavHeaderSize = 44;
                const dataWithoutHeader = uint8Array.slice(wavHeaderSize);
                fileData = new TextDecoder().decode(dataWithoutHeader);
                actualFileSize = dataWithoutHeader.length;
              } else {
                fileData = e.target.result;
              }
            }
            
            // 构建消息对象
            let messageObj = {};
            
            // 如果格式是JSON，从JSON字段列表构建对象
            if (format === 'json') {
              jsonFields.forEach(field => {
                // 尝试解析值为JSON，如果失败则作为字符串
                let fieldValue;
                try {
                  fieldValue = JSON.parse(field.value);
                } catch {
                  fieldValue = field.value;
                }
                
                // 如果字段名包含点号，使用递归方式添加嵌套字段
                if (field.key.includes('.')) {
                  setNestedField(messageObj, field.key, fieldValue);
                } else {
                  // 简单字段，直接设置
                  messageObj[field.key] = fieldValue;
                }
              });
            } else if (message) {
              // 非JSON格式，使用文本消息
              try {
                messageObj = JSON.parse(message);
              } catch {
                messageObj = { message: message };
              }
            }
            
            // 获取文件字段名（默认为"file"）
            const fileFieldName = elements.fileFieldName.value.trim() || 'file';
            
            // 只保存Base64数据，不包含额外信息
            // 如果字段名包含点号，使用递归方式添加嵌套字段
            if (fileFieldName.includes('.')) {
              setNestedField(messageObj, fileFieldName, fileData);
            } else {
              // 简单字段，直接设置Base64数据
              messageObj[fileFieldName] = fileData;
            }
            
            const response = await fetch(`${API_BASE}/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                data: messageObj,
                format: 'json'
              })
            });
            
            const result = await response.json();
            if (result.success) {
              const successMsg = removeWavHeader ? '文件已添加到参数并发送（已去掉 WAV 头）' : '文件已添加到参数并发送';
              showSuccess(successMsg);
              elements.fileInput.value = '';
              elements.messageInput.value = '';
            } else {
              showError('发送失败: ' + result.error);
            }
          } catch (error) {
            showError('处理文件失败: ' + error.message);
          }
        };
        
        // 读取文件
        if (elements.fileBase64Encode.checked) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
      } else {
        // 检查是否启用文件切片
        if (elements.enableFileChunk && elements.enableFileChunk.checked) {
          // 使用文件切片发送
          await sendFileAsChunks(file, message, format);
        } else {
          // 原有的文件发送逻辑
          // 处理去掉 WAV 头的情况
          const fileType = detectFileType(file);
          const removeWavHeader = fileType.isWav && elements.removeWavHeader.checked;
          
          if (removeWavHeader) {
            // 读取文件并去掉 WAV 头
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const wavHeaderSize = 44;
            const dataWithoutHeader = uint8Array.slice(wavHeaderSize);
            
            // 创建新的 Blob（去掉头后的数据）
            const blob = new Blob([dataWithoutHeader], { type: file.type });
            const fileWithoutHeader = new File([blob], file.name, { type: file.type });
            
            const formData = new FormData();
            formData.append('file', fileWithoutHeader);
            formData.append('format', format);
            if (message) {
              formData.append('metadata', JSON.stringify({ message }));
            }

            const response = await fetch(`${API_BASE}/send-file`, {
              method: 'POST',
              body: formData
            });

            const result = await response.json();
            if (result.success) {
              showSuccess('文件已发送（已去掉 WAV 头）');
              elements.fileInput.value = '';
              elements.messageInput.value = '';
            } else {
              showError('发送失败: ' + result.error);
            }
          } else {
            // 原有的文件发送逻辑
            const formData = new FormData();
            formData.append('file', file);
            formData.append('format', format);
            if (message) {
              formData.append('metadata', JSON.stringify({ message }));
            }

            const response = await fetch(`${API_BASE}/send-file`, {
              method: 'POST',
              body: formData
            });

            const result = await response.json();
            if (result.success) {
              showSuccess('文件已发送');
              elements.fileInput.value = '';
              elements.messageInput.value = '';
            } else {
              showError('发送失败: ' + result.error);
            }
          }
        }
      }
    } else {
      // 没有文件，发送文本或JSON消息
      let dataToSend;
      
      if (format === 'json') {
        // JSON格式：从字段列表构建对象
        const messageObj = {};
        jsonFields.forEach(field => {
          // 尝试解析值为JSON，如果失败则作为字符串
          let fieldValue;
          try {
            fieldValue = JSON.parse(field.value);
          } catch {
            fieldValue = field.value;
          }
          
          // 如果字段名包含点号，使用递归方式添加嵌套字段
          if (field.key.includes('.')) {
            setNestedField(messageObj, field.key, fieldValue);
          } else {
            // 简单字段，直接设置
            messageObj[field.key] = fieldValue;
          }
        });
        dataToSend = Object.keys(messageObj).length > 0 ? messageObj : null;
      } else {
        // 文本格式：使用输入框内容
        dataToSend = message || null;
      }
      
      if (!dataToSend) {
        showError('请输入消息或添加JSON字段');
        return;
      }
      
      const response = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataToSend,
          format: format === 'custom' ? 'text' : format
        })
      });

      const result = await response.json();
      if (result.success) {
        showSuccess('消息已发送');
        elements.messageInput.value = '';
        // 清空JSON字段（可选，根据需求决定）
        // elements.jsonFieldsList.innerHTML = '';
        // jsonFields = [];
      } else {
        showError('发送失败: ' + result.error);
      }
    }

    // SSE 会实时推送消息，不需要手动加载
    // loadMessages();
  } catch (error) {
    showError('发送消息失败: ' + error.message);
  }
}

/**
 * 将文件切分成多个片段并循环发送
 * @param {File} file - 要发送的文件
 * @param {string} message - 附加消息
 * @param {string} format - 消息格式
 */
async function sendFileAsChunks(file, message, format) {
  try {
    // 检测文件类型
    const fileType = detectFileType(file);
    let chunkSizeBytes;
    let totalChunks;
    let duration = null; // 媒体时长（秒）
    let chunkTimeMs = null; // 每个切片的时间（毫秒）
    
    // 检查是否是音频/视频文件，并且时间切片选项可见
    const isMedia = fileType.isAudio || fileType.isVideo;
    let useTimeChunking = isMedia && elements.chunkTimeGroup && elements.chunkTimeGroup.style.display !== 'none';
    
    if (useTimeChunking) {
      // 时间切片模式（音频/视频）
      try {
        duration = await getMediaDuration(file, fileType.type);
        if (!duration || duration <= 0) {
          throw new Error('无法获取媒体时长或时长无效');
        }
        
        chunkTimeMs = parseInt(elements.chunkTime.value) || 1000;
        const durationMs = duration * 1000; // 转换为毫秒
        
        // 计算总切片数（基于时间）
        totalChunks = Math.ceil(durationMs / chunkTimeMs);
        
        // 根据时间计算每个切片的字节大小（近似值）
        const estimatedBytesPerMs = file.size / durationMs;
        chunkSizeBytes = Math.ceil(chunkTimeMs * estimatedBytesPerMs);
        chunkSizeBytes = Math.max(chunkSizeBytes, 1024); // 最小1KB
        
        showSuccess(`开始发送${fileType.type === 'audio' ? '音频' : '视频'}文件（按时间切片），共 ${totalChunks} 个切片（每片 ${chunkTimeMs}ms，约 ${Math.round(chunkSizeBytes / 1024)}KB）...`);
      } catch (error) {
        console.warn('获取媒体时长失败，回退到大小切片:', error);
        showError('获取媒体时长失败，使用大小切片模式: ' + error.message);
        // 回退到大小切片
        const chunkSizeKB = parseInt(elements.chunkSize.value) || 64;
        chunkSizeBytes = chunkSizeKB * 1024;
        totalChunks = Math.ceil(file.size / chunkSizeBytes);
        useTimeChunking = false;
        showSuccess(`开始发送文件，共 ${totalChunks} 个切片...`);
      }
    } else {
      // 大小切片模式（普通文件或音频/视频但未启用时间切片）
      const chunkSizeKB = parseInt(elements.chunkSize.value) || 64;
      chunkSizeBytes = chunkSizeKB * 1024;
      totalChunks = Math.ceil(file.size / chunkSizeBytes);
      showSuccess(`开始发送文件，共 ${totalChunks} 个切片（每片 ${chunkSizeKB}KB）...`);
    }
    
    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // 检查是否需要去掉 WAV 头（前 44 字节）
    const removeWavHeader = fileType.isWav && elements.removeWavHeader.checked;
    const wavHeaderSize = 44; // WAV 标准头部大小
    const dataStartOffset = removeWavHeader ? wavHeaderSize : 0;
    const dataSize = file.size - dataStartOffset;
    
    // 如果去掉 WAV 头，重新计算切片数量
    if (removeWavHeader && dataSize > 0) {
      totalChunks = Math.ceil(dataSize / chunkSizeBytes);
      showSuccess(`开始发送文件（已去掉 WAV 头），共 ${totalChunks} 个切片...`);
    }
    
    // 验证切片数量
    if (totalChunks <= 0) {
      throw new Error('切片数量计算错误，无法发送文件');
    }
    
    if (totalChunks === 1) {
      console.warn('[文件切片] 文件较小，只有 1 个切片，将作为单个切片发送');
    }
    
    // 循环发送每个切片
    console.log(`[文件切片] 开始循环发送，共 ${totalChunks} 个切片，切片大小: ${chunkSizeBytes} 字节，数据起始偏移: ${dataStartOffset}，数据大小: ${dataSize}`);
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      let start, end, chunkData;
      
      if (useTimeChunking && duration && chunkTimeMs) {
        // 时间切片模式：根据时间计算切片位置
        const startTimeMs = chunkIndex * chunkTimeMs;
        const endTimeMs = Math.min(startTimeMs + chunkTimeMs, duration * 1000);
        
        // 根据时间比例计算字节位置（近似值）
        const startRatio = startTimeMs / (duration * 1000);
        const endRatio = endTimeMs / (duration * 1000);
        
        start = dataStartOffset + Math.floor(startRatio * dataSize);
        end = dataStartOffset + Math.floor(endRatio * dataSize);
        end = Math.min(end, dataStartOffset + dataSize);
        
        chunkData = uint8Array.slice(start, end);
        
        console.log(`[文件切片] 正在发送切片 ${chunkIndex + 1}/${totalChunks}，时间: ${startTimeMs}ms - ${endTimeMs}ms，位置: ${start} - ${end}，大小: ${chunkData.length} 字节`);
      } else {
        // 大小切片模式：按固定大小切片
        start = dataStartOffset + chunkIndex * chunkSizeBytes;
        end = Math.min(start + chunkSizeBytes, dataStartOffset + dataSize);
        chunkData = uint8Array.slice(start, end);
        
        console.log(`[文件切片] 正在发送切片 ${chunkIndex + 1}/${totalChunks}，起始位置: ${start}，结束位置: ${end}，大小: ${chunkData.length} 字节`);
      }
      
      // 如果切片为空，跳过
      if (chunkData.length === 0) {
        console.warn(`[文件切片] 切片 ${chunkIndex + 1} 为空，跳过`);
        continue;
      }
      
      // 将切片转换为 Base64（分块处理，避免堆栈溢出）
      let binary = '';
      for (let i = 0; i < chunkData.length; i++) {
        binary += String.fromCharCode(chunkData[i]);
      }
      const base64Chunk = btoa(binary);
      
      try {
        // 构建JSON消息对象，将切片数据作为字段值
        let messageObj = {};
        
        // 如果格式是JSON，从JSON字段列表构建对象
        if (format === 'json') {
          jsonFields.forEach(field => {
            // 尝试解析值为JSON，如果失败则作为字符串
            let fieldValue;
            try {
              fieldValue = JSON.parse(field.value);
            } catch {
              fieldValue = field.value;
            }
            
            // 如果字段名包含点号，使用递归方式添加嵌套字段
            if (field.key.includes('.')) {
              setNestedField(messageObj, field.key, fieldValue);
            } else {
              // 简单字段，直接设置
              messageObj[field.key] = fieldValue;
            }
          });
        } else if (message) {
          // 非JSON格式，使用文本消息
          try {
            messageObj = JSON.parse(message);
          } catch {
            messageObj = { message: message };
          }
        }
        
        // 如果使用时间切片，添加时间信息
        if (useTimeChunking && duration && chunkTimeMs) {
          const startTimeMs = chunkIndex * chunkTimeMs;
          const endTimeMs = Math.min(startTimeMs + chunkTimeMs, duration * 1000);
          messageObj.timeInfo = {
            startTime: startTimeMs,      // 开始时间（毫秒）
            endTime: endTimeMs,          // 结束时间（毫秒）
            duration: duration * 1000,   // 总时长（毫秒）
            chunkIndex: chunkIndex,      // 当前切片索引
            totalChunks: totalChunks     // 总切片数
          };
        }
        
        // 获取文件字段名（默认为"file"），将切片数据添加到该字段
        const fileFieldName = elements.fileFieldName.value.trim() || 'file';
        
        // 将切片的base64数据添加到JSON字段中
        if (fileFieldName.includes('.')) {
          setNestedField(messageObj, fileFieldName, base64Chunk);
        } else {
          messageObj[fileFieldName] = base64Chunk;
        }
        
        // 以JSON格式发送
        const response = await fetch(`${API_BASE}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: messageObj,  // 发送JSON对象，包含原有字段和切片数据
            format: 'json'    // 使用JSON格式
          })
        });
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(`切片 ${chunkIndex + 1}/${totalChunks} 发送失败: ${result.error}`);
        }
        
        // 显示进度
        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        let progressMsg = `文件切片发送中... ${chunkIndex + 1}/${totalChunks} (${progress}%)`;
        
        // 如果是时间切片，显示时间信息
        if (useTimeChunking && duration && chunkTimeMs) {
          const startTimeMs = chunkIndex * chunkTimeMs;
          const endTimeMs = Math.min(startTimeMs + chunkTimeMs, duration * 1000);
          progressMsg += ` [${startTimeMs}ms - ${endTimeMs}ms]`;
        }
        
        console.log(`[文件切片] 切片 ${chunkIndex + 1}/${totalChunks} 发送成功，进度: ${progress}%`);
        
        // 更新UI显示进度（可选）
        if (chunkIndex === 0 || (chunkIndex + 1) % Math.max(1, Math.floor(totalChunks / 10)) === 0 || chunkIndex === totalChunks - 1) {
          showSuccess(progressMsg);
        }
        
        // 添加小延迟，避免发送过快
        if (chunkIndex < totalChunks - 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        console.error(`[文件切片] 切片 ${chunkIndex + 1}/${totalChunks} 发送失败:`, error);
        throw error;
      }
    }
    
    showSuccess(`文件已成功发送，共 ${totalChunks} 个切片`);
    elements.fileInput.value = '';
    elements.messageInput.value = '';
  } catch (error) {
    console.error('[文件切片发送] 错误:', error);
    showError('文件切片发送失败: ' + error.message);
  }
}

/**
 * 启动 Server-Sent Events 连接
 */
function startSSE() {
  if (eventSource) {
    eventSource.close();
  }

  eventSource = new EventSource(`${API_BASE}/events`);

  eventSource.onopen = () => {
    console.log('SSE 连接已建立');
  };

  eventSource.addEventListener('message', (e) => {
    try {
      const message = JSON.parse(e.data);
      // 实时添加消息到界面
      addMessageToDisplay(message);
    } catch (error) {
      console.error('解析 SSE 消息失败:', error);
    }
  });

  eventSource.addEventListener('status', (e) => {
    try {
      const data = JSON.parse(e.data);
      updateStatus(data.state);
    } catch (error) {
      console.error('解析 SSE 状态失败:', error);
    }
  });

  eventSource.addEventListener('error', (e) => {
    try {
      const data = JSON.parse(e.data);
      showError(data.message);
    } catch (error) {
      console.error('解析 SSE 错误失败:', error);
    }
  });

  eventSource.onerror = (error) => {
    console.error('SSE 连接错误:', error);
    // 3 秒后重连
    setTimeout(() => {
      if (eventSource && eventSource.readyState === EventSource.CLOSED) {
        startSSE();
      }
    }, 3000);
  };
}

/**
 * 添加消息到显示
 */
function addMessageToDisplay(message) {
  const container = elements.messagesContainer;
  const displayFormat = elements.displayFormat.value;
  const showPingPong = elements.showPingPong.checked;

  // 检查是否需要显示（支持大小写不敏感）
  const msgType = (message.type || '').toLowerCase();
  const msgData = String(message.data || '').toLowerCase().trim();
  
  // 检查是否为ping/pong消息（通过type或data内容）
  const isPingPong = msgType === 'ping' || msgType === 'pong' || 
                     msgData === 'ping' || msgData === 'pong';
  
  if ((isPingPong || message.type === 'heartbeat') && !showPingPong) {
    return;
  }

  const item = document.createElement('div');
  let typeClass = message.type;
  
  if (message.type === 'sent' || message.type === 'heartbeat') {
    typeClass = 'sent';
  } else if (message.type === 'received') {
    typeClass = 'received';
  } else if (message.type === 'ping' || message.type === 'pong') {
    typeClass = message.type;
  } else if (message.type === 'open') {
    typeClass = 'open';
  } else if (message.type === 'close') {
    typeClass = 'close';
  } else if (message.type === 'error') {
    typeClass = 'error';
  }
  
  item.className = `message-item ${typeClass}`;

  const time = new Date(message.timestamp).toLocaleString('zh-CN');
  const timeSpan = document.createElement('span');
  timeSpan.className = 'message-time';
  
  let typeLabel = '';
  if (message.type === 'ping') {
    typeLabel = '[PING] ';
  } else if (message.type === 'pong') {
    typeLabel = '[PONG] ';
  } else if (message.type === 'heartbeat') {
    typeLabel = '[心跳] ';
  } else if (message.type === 'sent') {
    typeLabel = '[发送] ';
  } else if (message.type === 'received') {
    typeLabel = '[接收] ';
  } else if (message.type === 'open') {
    typeLabel = '[连接] ';
  } else if (message.type === 'close') {
    typeLabel = '[断开] ';
  } else if (message.type === 'error') {
    typeLabel = '[错误] ';
  }
  
  timeSpan.textContent = `[${time}] ${typeLabel}`;

  const content = document.createElement('div');
  content.className = 'message-content';
  // 应用当前字体大小
  const fontSize = elements.fontSize.value + 'px';
  content.style.fontSize = fontSize;
  
  if (displayFormat === 'json' && !message.isBinary) {
    try {
      let parsed;
      if (typeof message.data === 'string') {
        // 尝试解析字符串为 JSON
        try {
          parsed = JSON.parse(message.data);
        } catch (e) {
          // 如果解析失败，直接使用原字符串
          parsed = message.data;
        }
      } else if (typeof message.data === 'object' && message.data !== null) {
        // 如果已经是对象，直接使用
        parsed = message.data;
      } else {
        // 其他类型，直接使用
        parsed = message.data;
      }
      
      // 使用可折叠的JSON渲染
      const jsonWrap = elements.jsonWrap.checked;
      renderCollapsibleJson(content, parsed, jsonWrap);
      content.classList.add('json');
    } catch (error) {
      // 如果格式化失败，显示原始数据
      content.textContent = String(message.data);
    }
  } else if (message.isBinary) {
    content.textContent = `[二进制数据: ${message.data.length || 0} 字节]`;
  } else {
    content.textContent = String(message.data);
  }

  item.appendChild(timeSpan);
  item.appendChild(content);
  container.appendChild(item);

  if (elements.autoScroll.checked) {
    scrollToBottom();
  }
}

/**
 * 加载消息
 */
async function loadMessages() {
  try {
    const response = await fetch(`${API_BASE}/messages`);
    const result = await response.json();
    if (result.success) {
      displayMessages(result.data);
    }
  } catch (error) {
    console.error('加载消息失败:', error);
  }
}

/**
 * 显示消息
 */
function displayMessages(messages) {
  const container = elements.messagesContainer;
  const displayFormat = elements.displayFormat.value;
  const showPingPong = elements.showPingPong.checked;
  container.innerHTML = '';

  // 过滤消息（支持大小写不敏感）
  const filteredMessages = messages.filter(msg => {
    const msgType = (msg.type || '').toLowerCase();
    const msgData = String(msg.data || '').toLowerCase().trim();
    
    // 检查是否为ping/pong消息（通过type或data内容）
    const isPingPong = msgType === 'ping' || msgType === 'pong' || 
                       msgData === 'ping' || msgData === 'pong';
    
    if (isPingPong || msg.type === 'heartbeat') {
      return showPingPong;
    }
    return true;
  });

  filteredMessages.forEach(msg => {
    const item = document.createElement('div');
    let typeClass = msg.type;
    
    // 根据消息类型设置样式
    if (msg.type === 'sent' || msg.type === 'heartbeat') {
      typeClass = 'sent';
    } else if (msg.type === 'received') {
      typeClass = 'received';
    } else if (msg.type === 'ping' || msg.type === 'pong') {
      typeClass = msg.type;
    } else if (msg.type === 'open') {
      typeClass = 'open';
    } else if (msg.type === 'close') {
      typeClass = 'close';
    } else if (msg.type === 'error') {
      typeClass = 'error';
    }
    
    item.className = `message-item ${typeClass}`;

    const time = new Date(msg.timestamp).toLocaleString('zh-CN');
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    
    // 添加消息类型标签
    let typeLabel = '';
    if (msg.type === 'ping') {
      typeLabel = '[PING] ';
    } else if (msg.type === 'pong') {
      typeLabel = '[PONG] ';
    } else if (msg.type === 'heartbeat') {
      typeLabel = '[心跳] ';
    } else if (msg.type === 'sent') {
      typeLabel = '[发送] ';
    } else if (msg.type === 'received') {
      typeLabel = '[接收] ';
    } else if (msg.type === 'open') {
      typeLabel = '[连接] ';
    } else if (msg.type === 'close') {
      typeLabel = '[断开] ';
    } else if (msg.type === 'error') {
      typeLabel = '[错误] ';
    }
    
    timeSpan.textContent = `[${time}] ${typeLabel}`;

    const content = document.createElement('div');
    content.className = 'message-content';
    // 应用当前字体大小
    const fontSize = elements.fontSize.value + 'px';
    content.style.fontSize = fontSize;
    
    if (displayFormat === 'json' && !msg.isBinary) {
      try {
        let parsed;
        if (typeof msg.data === 'string') {
          // 尝试解析字符串为 JSON
          try {
            parsed = JSON.parse(msg.data);
          } catch (e) {
            // 如果解析失败，直接使用原字符串
            parsed = msg.data;
          }
        } else {
          // 如果已经是对象，直接使用
          parsed = msg.data;
        }
        // 使用可折叠的JSON渲染
        const jsonWrap = elements.jsonWrap.checked;
        renderCollapsibleJson(content, parsed, jsonWrap);
        content.classList.add('json');
      } catch (error) {
        // 如果格式化失败，显示原始数据
        content.textContent = String(msg.data);
      }
    } else if (msg.isBinary) {
      content.textContent = `[二进制数据: ${msg.data.length} 字节]`;
    } else {
      content.textContent = String(msg.data);
    }

    item.appendChild(timeSpan);
    item.appendChild(content);
    container.appendChild(item);
  });

  if (elements.autoScroll.checked) {
    scrollToBottom();
  }
}

/**
 * 渲染可折叠的JSON
 * @param {HTMLElement} container - 容器元素
 * @param {*} data - 要渲染的数据
 * @param {boolean} wrap - 是否换行
 * @param {number} indent - 缩进级别
 */
function renderCollapsibleJson(container, data, wrap = true, indent = 0) {
  const indentStr = wrap ? '  '.repeat(indent) : '';
  const isLongValue = (value) => {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return str.length > 80 || str.includes('\n');
  };
  
  if (data === null) {
    container.textContent = 'null';
    return;
  }
  
  if (typeof data !== 'object') {
    // 基本类型
    const valueStr = typeof data === 'string' ? JSON.stringify(data) : String(data);
    if (isLongValue(data) && wrap) {
      // 长值：折叠显示
      const wrapper = document.createElement('span');
      wrapper.className = 'json-value-collapsible';
      
      const preview = document.createElement('span');
      preview.className = 'json-value-preview';
      const previewText = valueStr.length > 100 ? valueStr.substring(0, 100) + '...' : valueStr;
      preview.textContent = previewText;
      
      const full = document.createElement('span');
      full.className = 'json-value-full';
      full.style.display = 'none';
      full.textContent = valueStr;
      
      const toggle = document.createElement('span');
      toggle.className = 'json-toggle';
      toggle.textContent = '▶';
      toggle.style.cursor = 'pointer';
      toggle.style.marginRight = '4px';
      toggle.style.userSelect = 'none';
      
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = full.style.display !== 'none';
        full.style.display = isExpanded ? 'none' : 'inline';
        preview.style.display = isExpanded ? 'inline' : 'none';
        toggle.textContent = isExpanded ? '▶' : '▼';
      });
      
      wrapper.appendChild(toggle);
      wrapper.appendChild(preview);
      wrapper.appendChild(full);
      container.appendChild(wrapper);
    } else {
      container.textContent = valueStr;
    }
    return;
  }
  
  if (Array.isArray(data)) {
    // 数组
    if (data.length === 0) {
      container.textContent = '[]';
      return;
    }
    
    const bracketOpen = document.createElement('span');
    bracketOpen.textContent = '[';
    container.appendChild(bracketOpen);
    
    if (wrap) {
      container.appendChild(document.createTextNode('\n'));
    }
    
    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'json-items';
    itemsContainer.style.marginLeft = wrap ? `${(indent + 1) * 20}px` : '0';
    
    data.forEach((item, index) => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'json-item';
      
      if (wrap) {
        itemWrapper.style.marginBottom = '2px';
      }
      
      const isComplex = typeof item === 'object' && item !== null;
      if (isComplex) {
        // 复杂对象：可折叠
        const toggle = document.createElement('span');
        toggle.className = 'json-toggle';
        toggle.textContent = '▶';
        toggle.style.cursor = 'pointer';
        toggle.style.marginRight = '4px';
        toggle.style.userSelect = 'none';
        
        const preview = document.createElement('span');
        preview.className = 'json-preview';
        preview.textContent = Array.isArray(item) ? `Array(${item.length})` : `Object(${Object.keys(item).length})`;
        preview.style.color = '#9ca3af';
        preview.style.marginLeft = '4px';
        
        const full = document.createElement('span');
        full.className = 'json-full';
        full.style.display = 'none';
        renderCollapsibleJson(full, item, wrap, indent + 1);
        
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          const isExpanded = full.style.display !== 'none';
          full.style.display = isExpanded ? 'none' : 'block';
          preview.style.display = isExpanded ? 'inline' : 'none';
          toggle.textContent = isExpanded ? '▶' : '▼';
        });
        
        itemWrapper.appendChild(toggle);
        itemWrapper.appendChild(preview);
        itemWrapper.appendChild(full);
      } else {
        // 简单值
        renderCollapsibleJson(itemWrapper, item, wrap, indent + 1);
      }
      
      if (index < data.length - 1) {
        itemWrapper.appendChild(document.createTextNode(','));
      }
      
      itemsContainer.appendChild(itemWrapper);
    });
    
    container.appendChild(itemsContainer);
    
    if (wrap) {
      container.appendChild(document.createTextNode('\n' + indentStr));
    }
    
    const bracketClose = document.createElement('span');
    bracketClose.textContent = ']';
    container.appendChild(bracketClose);
    return;
  }
  
  // 对象
  const keys = Object.keys(data);
  if (keys.length === 0) {
    container.textContent = '{}';
    return;
  }
  
  const braceOpen = document.createElement('span');
  braceOpen.textContent = '{';
  container.appendChild(braceOpen);
  
  if (wrap) {
    container.appendChild(document.createTextNode('\n'));
  }
  
  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'json-items';
  itemsContainer.style.marginLeft = wrap ? `${(indent + 1) * 20}px` : '0';
  
  keys.forEach((key, index) => {
    const itemWrapper = document.createElement('div');
    itemWrapper.className = 'json-item';
    
    if (wrap) {
      itemWrapper.style.marginBottom = '2px';
    }
    
    // 键名
    const keySpan = document.createElement('span');
    keySpan.className = 'json-key';
    keySpan.textContent = JSON.stringify(key) + ': ';
    keySpan.style.color = '#60a5fa';
    itemWrapper.appendChild(keySpan);
    
    // 值
    const value = data[key];
    const isComplex = typeof value === 'object' && value !== null;
    const isLong = isLongValue(value);
    
    if (isComplex || (isLong && wrap)) {
      // 复杂对象或长值：可折叠
      const toggle = document.createElement('span');
      toggle.className = 'json-toggle';
      toggle.textContent = '▶';
      toggle.style.cursor = 'pointer';
      toggle.style.marginRight = '4px';
      toggle.style.userSelect = 'none';
      
      const preview = document.createElement('span');
      preview.className = 'json-preview';
      if (isComplex) {
        preview.textContent = Array.isArray(value) ? `Array(${value.length})` : `Object(${Object.keys(value).length})`;
      } else {
        const valueStr = typeof value === 'string' ? JSON.stringify(value) : String(value);
        preview.textContent = valueStr.length > 100 ? valueStr.substring(0, 100) + '...' : valueStr;
      }
      preview.style.color = '#9ca3af';
      preview.style.marginLeft = '4px';
      
      const full = document.createElement('span');
      full.className = 'json-full';
      full.style.display = 'none';
      if (isComplex) {
        renderCollapsibleJson(full, value, wrap, indent + 1);
      } else {
        full.textContent = typeof value === 'string' ? JSON.stringify(value) : String(value);
      }
      
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = full.style.display !== 'none';
        full.style.display = isExpanded ? 'none' : (isComplex ? 'block' : 'inline');
        preview.style.display = isExpanded ? 'inline' : 'none';
        toggle.textContent = isExpanded ? '▶' : '▼';
      });
      
      itemWrapper.insertBefore(toggle, keySpan);
      itemWrapper.appendChild(preview);
      itemWrapper.appendChild(full);
    } else {
      // 简单值
      renderCollapsibleJson(itemWrapper, value, wrap, indent);
    }
    
    if (index < keys.length - 1) {
      itemWrapper.appendChild(document.createTextNode(','));
    }
    
    itemsContainer.appendChild(itemWrapper);
  });
  
  container.appendChild(itemsContainer);
  
  if (wrap) {
    container.appendChild(document.createTextNode('\n' + indentStr));
  }
  
  const braceClose = document.createElement('span');
  braceClose.textContent = '}';
  container.appendChild(braceClose);
}

/**
 * 滚动到底部
 */
function scrollToBottom() {
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

/**
 * 更新消息字体大小
 */
function updateMessageFontSize() {
  const fontSize = elements.fontSize.value + 'px';
  elements.messagesContainer.style.fontSize = fontSize;
  
  // 更新所有已显示的消息
  const messageItems = elements.messagesContainer.querySelectorAll('.message-content');
  messageItems.forEach(item => {
    item.style.fontSize = fontSize;
  });
}

/**
 * 清空消息
 */
async function clearMessages() {
  if (!confirm('确定要清空所有消息吗？')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/messages`, { method: 'DELETE' });
    const result = await response.json();
    if (result.success) {
      showSuccess('消息已清空');
      elements.messagesContainer.innerHTML = '';
    }
  } catch (error) {
    showError('清空消息失败: ' + error.message);
  }
}

/**
 * 显示错误消息
 */
function showError(message) {
  showMessage(message, 'error');
}

/**
 * 显示成功消息
 */
function showSuccess(message) {
  showMessage(message, 'success');
}

/**
 * 显示消息
 */
function showMessage(message, type) {
  const container = elements.messagesContainer;
  const msgDiv = document.createElement('div');
  msgDiv.className = `${type}-message`;
  msgDiv.textContent = message;
  container.insertBefore(msgDiv, container.firstChild);

  setTimeout(() => {
    msgDiv.remove();
  }, 5000);
}

// 定期加载消息（仅在 SSE 未连接时）
setInterval(() => {
  if (!eventSource || eventSource.readyState !== EventSource.OPEN) {
    loadMessages();
  }
}, 5000);

/**
 * 解析并填充语音JSON字段
 */
function parseAndFillVoiceJson(jsonText, fieldsList, container) {
  try {
    if (!jsonText || !jsonText.trim()) {
      showError('请输入 JSON 文本');
      return;
    }
    
    // 解析 JSON
    const jsonObj = JSON.parse(jsonText.trim());
    
    if (typeof jsonObj !== 'object' || jsonObj === null || Array.isArray(jsonObj)) {
      showError('JSON 必须是一个对象（不能是数组或基本类型）');
      return;
    }
    
    // 清空现有字段
    container.innerHTML = '';
    fieldsList.length = 0;
    
    // 递归展开嵌套对象
    const flattenedFields = flattenNestedObject(jsonObj);
    
    // 添加所有展开的字段
    flattenedFields.forEach(({ key, value }) => {
      addVoiceFieldItemWithValue(fieldsList, container, key, value);
    });
    
    showSuccess(`成功解析并填充 ${flattenedFields.length} 个字段（包含嵌套字段）`);
  } catch (error) {
    if (error instanceof SyntaxError) {
      showError('JSON 格式错误: ' + error.message);
    } else {
      showError('解析失败: ' + error.message);
    }
  }
}

/**
 * 添加语音字段项（带初始值）
 */
function addVoiceFieldItemWithValue(fieldsList, container, key, value) {
  const fieldId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const field = { id: fieldId, key: key, value: value };
  fieldsList.push(field);
  
  const item = document.createElement('div');
  item.className = 'key-value-item';
  item.id = fieldId;
  item.innerHTML = `
    <input type="text" class="key-input" placeholder="字段名" value="${escapeHtml(key)}">
    <input type="text" class="value-input" placeholder="字段值" value="${escapeHtml(value)}">
    <button type="button" class="btn btn-small btn-danger remove-btn">删除</button>
  `;
  
  const keyInput = item.querySelector('.key-input');
  const valueInput = item.querySelector('.value-input');
  const removeBtn = item.querySelector('.remove-btn');
  
  keyInput.addEventListener('input', () => {
    field.key = keyInput.value;
  });
  
  valueInput.addEventListener('input', () => {
    field.value = valueInput.value;
  });
  
  removeBtn.addEventListener('click', () => {
    const index = fieldsList.findIndex(f => f.id === fieldId);
    if (index > -1) {
      fieldsList.splice(index, 1);
    }
    item.remove();
  });
  
  container.appendChild(item);
}

/**
 * HTML转义函数
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 初始化语音字段列表
 */
function initVoiceFields() {
  // 初始化开始包、结束包和音频切片包字段列表
  if (voiceStartFields.length === 0 && elements.voiceStartFieldsList) {
    addVoiceFieldItem(voiceStartFields, elements.voiceStartFieldsList, true);
  }
  if (voiceEndFields.length === 0 && elements.voiceEndFieldsList) {
    addVoiceFieldItem(voiceEndFields, elements.voiceEndFieldsList, false);
  }
  if (voiceChunkFields.length === 0 && elements.voiceChunkFieldsList) {
    addVoiceFieldItem(voiceChunkFields, elements.voiceChunkFieldsList, 'chunk');
  }
}

/**
 * 添加语音字段项
 */
function addVoiceFieldItem(fieldsList, container, fieldType) {
  const typeStr = fieldType === true ? 'start' : (fieldType === false ? 'end' : 'chunk');
  const fieldId = `voice_${typeStr}_${Date.now()}`;
  const field = { id: fieldId, key: '', value: '' };
  fieldsList.push(field);
  
  const item = document.createElement('div');
  item.className = 'key-value-item';
  item.id = fieldId;
  item.innerHTML = `
    <input type="text" class="key-input" placeholder="字段名" value="${field.key}">
    <input type="text" class="value-input" placeholder="字段值" value="${field.value}">
    <button type="button" class="btn btn-small btn-danger remove-btn">删除</button>
  `;
  
  const keyInput = item.querySelector('.key-input');
  const valueInput = item.querySelector('.value-input');
  const removeBtn = item.querySelector('.remove-btn');
  
  keyInput.addEventListener('input', () => {
    field.key = keyInput.value;
  });
  
  valueInput.addEventListener('input', () => {
    field.value = valueInput.value;
  });
  
  removeBtn.addEventListener('click', () => {
    const index = fieldsList.findIndex(f => f.id === fieldId);
    if (index > -1) {
      fieldsList.splice(index, 1);
    }
    item.remove();
  });
  
  container.appendChild(item);
}

/**
 * 更新语音按钮状态
 */
function updateVoiceButtons() {
  const isConnected = elements.statusText.textContent.includes('已连接');
  const canStart = isConnected && !isRecording && elements.enableVoiceMode.checked;
  const canStop = isRecording;
  
  if (elements.startVoiceBtn) elements.startVoiceBtn.disabled = !canStart;
  if (elements.stopVoiceBtn) elements.stopVoiceBtn.disabled = !canStop;
}

/**
 * 构建并发送JSON包
 */
async function sendVoicePacket(fields, audioData = null) {
  try {
    const messageObj = {};
    
    // 添加配置的字段
    fields.forEach(field => {
      if (field.key) {
        let fieldValue;
        try {
          fieldValue = JSON.parse(field.value);
        } catch {
          fieldValue = field.value;
        }
        
        if (field.key.includes('.')) {
          setNestedField(messageObj, field.key, fieldValue);
        } else {
          messageObj[field.key] = fieldValue;
        }
      }
    });
    
    // 如果有音频数据，添加到指定字段
    if (audioData !== null) {
      const fieldName = elements.voiceFieldName.value.trim() || 'audio';
      let audioValue = audioData;
      
      // 根据Base64编码选项处理音频数据
      if (elements.voiceBase64Encode.checked) {
        // 如果已经是Base64字符串，直接使用；否则需要编码
        if (typeof audioData === 'string') {
          audioValue = audioData; // 假设已经是Base64
        } else {
          // 如果是Blob，转换为Base64
          const arrayBuffer = await audioData.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          audioValue = btoa(binary);
        }
      } else {
        // 不编码，直接使用原始数据（需要转换为字符串）
        if (audioData instanceof Blob) {
          audioValue = await audioData.text();
        } else {
          audioValue = String(audioData);
        }
      }
      
      if (fieldName.includes('.')) {
        setNestedField(messageObj, fieldName, audioValue);
      } else {
        messageObj[fieldName] = audioValue;
      }
    }
    
    const response = await fetch(`${API_BASE}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: messageObj,
        format: 'json'
      })
    });
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || '发送失败');
    }
    
    return true;
  } catch (error) {
    console.error('[语音包发送] 错误:', error);
    throw error;
  }
}

/**
 * 开始语音录制
 */
async function startVoiceRecording() {
  try {
    // 检查浏览器支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('浏览器不支持录音功能');
    }
    
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // 创建 MediaRecorder
    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    };
    
    // 尝试使用 WebM，如果不支持则使用默认格式
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        delete options.mimeType;
      }
    }
    
    mediaRecorder = new MediaRecorder(stream, options);
    audioChunks = [];
    
    // 监听数据可用事件（流式发送，不阻塞）
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // 使用音频切片包的字段配置，如果未配置则使用开始包的配置
        const fieldsToUse = voiceChunkFields.length > 0 ? voiceChunkFields : voiceStartFields;
        
        // 异步发送，不等待完成，实现真正的流式发送
        sendVoicePacket(fieldsToUse, event.data).then(() => {
          console.log('[语音录制] 音频切片已发送，大小:', event.data.size, '字节');
        }).catch((error) => {
          console.error('[语音录制] 发送音频切片失败:', error);
        });
      }
    };
    
    // 监听停止事件
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      isRecording = false;
      updateVoiceButtons();
      if (elements.voiceStatus) {
        elements.voiceStatus.textContent = '录音已停止';
        elements.voiceStatus.style.color = '#666';
      }
    };
    
    // 监听错误事件
    mediaRecorder.onerror = (event) => {
      console.error('[语音录制] 错误:', event.error);
      showError('录音错误: ' + event.error.message);
    };
    
    // 发送开始包
    try {
      await sendVoicePacket(voiceStartFields);
      console.log('[语音录制] 开始包已发送');
    } catch (error) {
      console.error('[语音录制] 发送开始包失败:', error);
      showError('发送开始包失败: ' + error.message);
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    
    // 开始录音，根据切片大小设置实时发送间隔
    const chunkSizeKB = parseInt(elements.voiceChunkSize.value) || 16;
    const audioBitsPerSecond = options.audioBitsPerSecond || 128000;
    // 根据音频比特率计算时间间隔（毫秒）
    // 公式：timeslice (ms) = (chunkSizeKB * 8 * 1024 * 1000) / audioBitsPerSecond
    // 对于 128000 bps：16 KB ≈ 1000ms，1 KB ≈ 62.5ms
    const timeslice = Math.max(100, Math.round((chunkSizeKB * 8 * 1024 * 1000) / audioBitsPerSecond));
    
    console.log(`[语音录制] 切片大小: ${chunkSizeKB} KB, 时间间隔: ${timeslice} ms`);
    mediaRecorder.start(timeslice); // 按时间切片，实时发送音频流
    isRecording = true;
    updateVoiceButtons();
    if (elements.voiceStatus) {
      elements.voiceStatus.textContent = '🎤 正在录音...';
      elements.voiceStatus.style.color = '#e74c3c';
    }
    
    showSuccess('语音录制已开始');
  } catch (error) {
    console.error('[语音录制] 启动失败:', error);
    showError('启动录音失败: ' + error.message);
    isRecording = false;
    updateVoiceButtons();
  }
}

/**
 * 停止语音录制
 */
async function stopVoiceRecording() {
  try {
    if (!mediaRecorder || !isRecording) {
      return;
    }
    
    // 停止录音
    mediaRecorder.stop();
    
    // 发送结束包
    try {
      await sendVoicePacket(voiceEndFields);
      console.log('[语音录制] 结束包已发送');
      showSuccess('语音录制已停止，结束包已发送');
    } catch (error) {
      console.error('[语音录制] 发送结束包失败:', error);
      showError('发送结束包失败: ' + error.message);
    }
  } catch (error) {
    console.error('[语音录制] 停止失败:', error);
    showError('停止录音失败: ' + error.message);
  }
}
