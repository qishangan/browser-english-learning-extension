// 内容脚本 - 英语学习助手

let translateEnabled = false;
let definitionEnabled = false;
let tooltip = null;
let translateTimeout = null;
let englishRate = 60;
let autoAdjustEnabled = false;
let autoAdjustStep = 10;
let lastAutoAdjustAt = 0;
let originalViewEnabled = false;
let toggleBall = null;

const AUTO_ADJUST_MIN_INTERVAL_MS = 10 * 60 * 1000;

// 翻译缓存
const translationCache = new Map();
const translationCacheEnToZh = new Map();
const definitionCache = new Map();
const usedEnglishWords = new Set();

const BAIDU_APP_ID = '20240223001971858';
const BAIDU_SECRET = 'SFRF7kfFrhP0PcCfzHtd';

const CET6_WORDS_LIST = Array.isArray(globalThis.CET6_WORDS) ? globalThis.CET6_WORDS : [];
const READING_COMMON_WORDS_LIST = Array.isArray(globalThis.READING_COMMON_WORDS)
  ? globalThis.READING_COMMON_WORDS
  : [];
const CET6_SET = new Set(CET6_WORDS_LIST.map(word => word.toLowerCase()));
const COMMON_SET = new Set(READING_COMMON_WORDS_LIST.map(word => word.toLowerCase()));
const LOCAL_DICT = (globalThis.LOCAL_DICT && typeof globalThis.LOCAL_DICT === 'object')
  ? globalThis.LOCAL_DICT
  : null;
const ZH_SEGMENTER = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter('zh', { granularity: 'word' })
  : null;
const SIMPLE_EN_WORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'for', 'by', 'from', 'with',
  'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out',
  'against', 'during', 'without', 'before', 'under', 'around', 'among', 'within',
  'across', 'per', 'via', 'and', 'or', 'but', 'nor', 'so', 'yet', 'if', 'then',
  'than', 'that', 'this', 'these', 'those', 'which', 'what', 'who', 'whom',
  'whose', 'when', 'where', 'why', 'how', 'is', 'am', 'are', 'was', 'were',
  'be', 'been', 'being', 'do', 'does', 'did', 'done', 'have', 'has', 'had',
  'will', 'would', 'shall', 'should', 'may', 'might', 'can', 'could', 'must',
  'not', 'no', 'yes', 'it', 'its', 'i', 'you', 'he', 'she', 'we', 'they', 'me',
  'him', 'her', 'us', 'them', 'my', 'your', 'his', 'their', 'our', 'mine',
  'yours', 'hers', 'theirs', 'ours', 'up', 'down', 'off', 'again', 'just',
  'very'
]);

// 初始化
async function init() {
  const result = await chrome.storage.local.get([
    'translateEnabled',
    'definitionEnabled',
    'englishRate',
    'autoAdjustEnabled',
    'autoAdjustStep',
    'lastAutoAdjustAt'
  ]);
  translateEnabled = result.translateEnabled || false;
  definitionEnabled = result.definitionEnabled || false;
  if (Number.isFinite(result.englishRate)) {
    englishRate = Math.min(100, Math.max(0, result.englishRate));
  }
  autoAdjustEnabled = result.autoAdjustEnabled || false;
  if (Number.isFinite(result.autoAdjustStep)) {
    autoAdjustStep = Math.min(100, Math.max(1, result.autoAdjustStep));
  }
  if (Number.isFinite(result.lastAutoAdjustAt)) {
    lastAutoAdjustAt = result.lastAutoAdjustAt;
  }

  // 创建tooltip元素
  createTooltip();
  createToggleBall();
}

// 创建释义tooltip
function createTooltip() {
  tooltip = document.createElement('div');
  tooltip.className = 'ela-tooltip';
  tooltip.innerHTML = `
    <div class="ela-tooltip-word"></div>
    <div class="ela-tooltip-phonetic"></div>
    <div class="ela-tooltip-pos"></div>
    <div class="ela-tooltip-meaning"></div>
    <div class="ela-tooltip-example"></div>
  `;
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);
}

function createToggleBall() {
  if (toggleBall) return;
  toggleBall = document.createElement('button');
  toggleBall.className = 'ela-float-toggle';
  toggleBall.type = 'button';
  toggleBall.addEventListener('click', () => {
    setOriginalView(!originalViewEnabled);
  });
  document.body.appendChild(toggleBall);
  updateToggleBallState();
}

function updateToggleBallState() {
  if (!toggleBall) return;
  toggleBall.style.display = translateEnabled ? 'flex' : 'none';
  if (originalViewEnabled) {
    toggleBall.classList.add('ela-float-toggle--original');
    toggleBall.textContent = '\u8bd1\u6587';
  } else {
    toggleBall.classList.remove('ela-float-toggle--original');
    toggleBall.textContent = '\u539f\u6587';
  }
}

function setOriginalView(enabled) {
  originalViewEnabled = enabled;
  document.querySelectorAll('.ela-translated').forEach(el => {
    if (enabled) {
      if (!el.dataset.translatedHtml) {
        el.dataset.translatedHtml = el.innerHTML;
      }
      const original = el.dataset.original || el.textContent;
      el.textContent = original;
    } else if (el.dataset.translatedHtml) {
      el.innerHTML = el.dataset.translatedHtml;
    }
  });
  hideTooltip();
  updateToggleBallState();
}

async function maybeAutoAdjustRate() {
  if (!autoAdjustEnabled) return;
  const now = Date.now();
  if (now - lastAutoAdjustAt < AUTO_ADJUST_MIN_INTERVAL_MS) return;

  const step = Math.min(100, Math.max(1, autoAdjustStep));
  const nextRate = Math.min(100, englishRate + step);
  if (nextRate !== englishRate) {
    englishRate = nextRate;
    lastAutoAdjustAt = now;
    await chrome.storage.local.set({ englishRate, lastAutoAdjustAt });
  }
}

function resetTranslatedNodes() {
  usedEnglishWords.clear();
  document.querySelectorAll('.ela-translated').forEach(el => {
    const original = el.dataset.original || el.title || el.textContent;
    const text = document.createTextNode(original);
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(text, el);
    }
  });
}

function collectTextNodes() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'textarea', 'input', 'code', 'pre'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent.closest && parent.closest('.ela-tooltip, .ela-float-toggle')) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent.classList.contains('ela-translated')) {
          return NodeFilter.FILTER_REJECT;
        }

        if (/[\u4e00-\u9fa5]/.test(node.textContent)) {
          return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  return textNodes;
}

function getMinGapByRate(rate) {
  if (rate >= 0.8) return 1;
  if (rate >= 0.6) return 2;
  if (rate >= 0.4) return 3;
  return 4;
}

function getSimpleWordKeepRate(rate) {
  if (rate >= 0.8) return 0.35;
  if (rate >= 0.6) return 0.25;
  if (rate >= 0.4) return 0.2;
  return 0.1;
}

function extractFirstEnglishWord(text) {
  if (!text) return null;
  const match = text.match(/[A-Za-z]+/);
  if (!match) return null;
  return {
    display: match[0],
    normalized: match[0].toLowerCase()
  };
}

function shouldKeepSimpleWord(word, rate) {
  if (!word) return false;
  if (!SIMPLE_EN_WORDS.has(word) && word.length > 2) return true;
  return Math.random() < getSimpleWordKeepRate(rate);
}

function segmentChineseText(text) {
  if (!ZH_SEGMENTER) {
    const parts = text.match(/[\u4e00-\u9fa5]|[^\u4e00-\u9fa5]+/g) || [text];
    return parts.map(part => ({
      text: part,
      isChineseWord: /[\u4e00-\u9fa5]/.test(part)
    }));
  }

  const segments = [];
  for (const part of ZH_SEGMENTER.segment(text)) {
    const segmentText = part.segment;
    const isChinese = /[\u4e00-\u9fa5]/.test(segmentText);
    segments.push({
      text: segmentText,
      isChineseWord: part.isWordLike && isChinese
    });
  }
  return segments;
}

function getWordListInfo(word) {
  const normalized = word.toLowerCase();
  return {
    isCet6: CET6_SET.has(normalized),
    isCommon: COMMON_SET.has(normalized)
  };
}

function appendEnglishTokens(parent, translatedText) {
  const tokens = translatedText.match(/[A-Za-z]+|[^A-Za-z]+/g) || [translatedText];
  tokens.forEach(token => {
    if (/^[A-Za-z]+$/.test(token)) {
      const normalized = token.toLowerCase();
      const wordEl = document.createElement('span');
      wordEl.className = 'ela-word';
      wordEl.textContent = token;
      wordEl.dataset.word = normalized;

      const info = getWordListInfo(normalized);
      if (info.isCet6) {
        wordEl.classList.add('ela-word--cet6');
      } else if (info.isCommon) {
        wordEl.classList.add('ela-word--common');
      }

      parent.appendChild(wordEl);
    } else {
      parent.appendChild(document.createTextNode(token));
    }
  });
}

async function translateTextNode(textNode) {
  if (!textNode || !textNode.parentNode) return false;
  const originalText = textNode.textContent || '';
  const segments = segmentChineseText(originalText);
  if (!segments.some(seg => seg.isChineseWord)) return false;

  const rate = Math.max(0, Math.min(1, englishRate / 100));
  const minGap = getMinGapByRate(rate);
  let skip = 0;
  const selected = [];

  segments.forEach(seg => {
    if (!seg.isChineseWord) return;
    if (skip > 0) {
      skip--;
      return;
    }
    if (Math.random() < rate) {
      selected.push(seg.text);
      skip = minGap;
    }
  });

  if (selected.length === 0) return false;

  const unique = Array.from(new Set(selected));
  const translations = await Promise.all(unique.map(word => translateText(word)));
  const translationMap = new Map();

  unique.forEach((word, index) => {
    const raw = translations[index];
    const normalized = extractFirstEnglishWord(raw);
    if (!normalized) return;
    if (!shouldKeepSimpleWord(normalized.normalized, rate)) return;
    translationMap.set(word, normalized.display);
  });

  if (translationMap.size === 0) return false;

  let translatedSomething = false;
  const span = document.createElement('span');
  span.className = 'ela-translated';
  span.dataset.original = originalText;

  segments.forEach(seg => {
    if (!seg.isChineseWord) {
      span.appendChild(document.createTextNode(seg.text));
      return;
    }

    const translated = translationMap.get(seg.text);
    if (translated) {
      const normalized = translated.toLowerCase();
      if (usedEnglishWords.has(normalized)) {
        span.appendChild(document.createTextNode(seg.text));
        return;
      }
      usedEnglishWords.add(normalized);
      translatedSomething = true;
      appendEnglishTokens(span, translated);
    } else {
      span.appendChild(document.createTextNode(seg.text));
    }
  });

  if (!translatedSomething) return false;
  if (originalViewEnabled) {
    span.dataset.translatedHtml = span.innerHTML;
    span.textContent = originalText;
  }
  const parent = textNode.parentNode;
  if (!parent) return false;
  parent.replaceChild(span, textNode);
  return true;
}

async function requestTranslation(text, from, to, cacheMap) {
  if (!text || !text.trim()) return null;
  const cacheKey = text.trim();
  if (cacheMap.has(cacheKey)) {
    return cacheMap.get(cacheKey);
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'translate',
      text: cacheKey,
      from: from,
      to: to
    });

    if (response && response.result) {
      cacheMap.set(cacheKey, response.result);
      return response.result;
    }
  } catch (error) {
    console.error('\u7ffb\u8bd1\u8bf7\u6c42\u9519\u8bef:', error);
  }

  try {
    const salt = Math.random().toString(36).substring(2, 10);
    const sign = await computeMD5(BAIDU_APP_ID + cacheKey + salt + BAIDU_SECRET);
    const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?appid=${BAIDU_APP_ID}&q=${encodeURIComponent(cacheKey)}&from=${from}&to=${to}&salt=${salt}&sign=${sign}`;

    const directResponse = await fetch(url);
    const data = await directResponse.json();

    if (data.trans_result && data.trans_result.length > 0) {
      const result = data.trans_result[0].dst;
      cacheMap.set(cacheKey, result);
      return result;
    }
    if (data.error_code) {
      console.error('\u7ffb\u8bd1\u5931\u8d25:', data.error_msg || data.error_code);
    }
  } catch (error) {
    console.error('\u7ffb\u8bd1\u8bf7\u6c42\u5931\u8d25:', error);
  }

  cacheMap.set(cacheKey, null);
  return null;
}

async function translateText(text) {
  if (!text || !text.trim() || !/[\u4e00-\u9fa5]/.test(text)) {
    return null;
  }

  return requestTranslation(text, 'zh', 'en', translationCache);
}

async function translateEnglishToChinese(text) {
  return requestTranslation(text, 'en', 'zh', translationCacheEnToZh);
}

function md5(message) {
  const bytes = new TextEncoder().encode(message);
  const words = [];
  for (let i = 0; i < bytes.length; i++) {
    words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  }
  const bitLen = bytes.length * 8;
  words[bitLen >> 5] |= 0x80 << (bitLen % 32);
  const wordCount = (((bitLen + 64) >>> 9) << 4) + 16;
  words[wordCount - 2] = bitLen;
  for (let i = 0; i < wordCount; i++) {
    if (words[i] === undefined) words[i] = 0;
  }

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const add32 = (x, y) => (x + y) >>> 0;
  const rotl = (x, n) => (x << n) | (x >>> (32 - n));
  const cmn = (q, a1, b1, x, s, t) => add32(rotl(add32(add32(a1, q), add32(x, t)), s), b1);
  const ff = (a1, b1, c1, d1, x, s, t) => cmn((b1 & c1) | (~b1 & d1), a1, b1, x, s, t);
  const gg = (a1, b1, c1, d1, x, s, t) => cmn((b1 & d1) | (c1 & ~d1), a1, b1, x, s, t);
  const hh = (a1, b1, c1, d1, x, s, t) => cmn(b1 ^ c1 ^ d1, a1, b1, x, s, t);
  const ii = (a1, b1, c1, d1, x, s, t) => cmn(c1 ^ (b1 | ~d1), a1, b1, x, s, t);

  for (let i = 0; i < words.length; i += 16) {
    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;

    a = ff(a, b, c, d, words[i + 0], 7, 0xd76aa478);
    d = ff(d, a, b, c, words[i + 1], 12, 0xe8c7b756);
    c = ff(c, d, a, b, words[i + 2], 17, 0x242070db);
    b = ff(b, c, d, a, words[i + 3], 22, 0xc1bdceee);
    a = ff(a, b, c, d, words[i + 4], 7, 0xf57c0faf);
    d = ff(d, a, b, c, words[i + 5], 12, 0x4787c62a);
    c = ff(c, d, a, b, words[i + 6], 17, 0xa8304613);
    b = ff(b, c, d, a, words[i + 7], 22, 0xfd469501);
    a = ff(a, b, c, d, words[i + 8], 7, 0x698098d8);
    d = ff(d, a, b, c, words[i + 9], 12, 0x8b44f7af);
    c = ff(c, d, a, b, words[i + 10], 17, 0xffff5bb1);
    b = ff(b, c, d, a, words[i + 11], 22, 0x895cd7be);
    a = ff(a, b, c, d, words[i + 12], 7, 0x6b901122);
    d = ff(d, a, b, c, words[i + 13], 12, 0xfd987193);
    c = ff(c, d, a, b, words[i + 14], 17, 0xa679438e);
    b = ff(b, c, d, a, words[i + 15], 22, 0x49b40821);

    a = gg(a, b, c, d, words[i + 1], 5, 0xf61e2562);
    d = gg(d, a, b, c, words[i + 6], 9, 0xc040b340);
    c = gg(c, d, a, b, words[i + 11], 14, 0x265e5a51);
    b = gg(b, c, d, a, words[i + 0], 20, 0xe9b6c7aa);
    a = gg(a, b, c, d, words[i + 5], 5, 0xd62f105d);
    d = gg(d, a, b, c, words[i + 10], 9, 0x02441453);
    c = gg(c, d, a, b, words[i + 15], 14, 0xd8a1e681);
    b = gg(b, c, d, a, words[i + 4], 20, 0xe7d3fbc8);
    a = gg(a, b, c, d, words[i + 9], 5, 0x21e1cde6);
    d = gg(d, a, b, c, words[i + 14], 9, 0xc33707d6);
    c = gg(c, d, a, b, words[i + 3], 14, 0xf4d50d87);
    b = gg(b, c, d, a, words[i + 8], 20, 0x455a14ed);
    a = gg(a, b, c, d, words[i + 13], 5, 0xa9e3e905);
    d = gg(d, a, b, c, words[i + 2], 9, 0xfcefa3f8);
    c = gg(c, d, a, b, words[i + 7], 14, 0x676f02d9);
    b = gg(b, c, d, a, words[i + 12], 20, 0x8d2a4c8a);

    a = hh(a, b, c, d, words[i + 5], 4, 0xfffa3942);
    d = hh(d, a, b, c, words[i + 8], 11, 0x8771f681);
    c = hh(c, d, a, b, words[i + 11], 16, 0x6d9d6122);
    b = hh(b, c, d, a, words[i + 14], 23, 0xfde5380c);
    a = hh(a, b, c, d, words[i + 1], 4, 0xa4beea44);
    d = hh(d, a, b, c, words[i + 4], 11, 0x4bdecfa9);
    c = hh(c, d, a, b, words[i + 7], 16, 0xf6bb4b60);
    b = hh(b, c, d, a, words[i + 10], 23, 0xbebfbc70);
    a = hh(a, b, c, d, words[i + 13], 4, 0x289b7ec6);
    d = hh(d, a, b, c, words[i + 0], 11, 0xeaa127fa);
    c = hh(c, d, a, b, words[i + 3], 16, 0xd4ef3085);
    b = hh(b, c, d, a, words[i + 6], 23, 0x04881d05);
    a = hh(a, b, c, d, words[i + 9], 4, 0xd9d4d039);
    d = hh(d, a, b, c, words[i + 12], 11, 0xe6db99e5);
    c = hh(c, d, a, b, words[i + 15], 16, 0x1fa27cf8);
    b = hh(b, c, d, a, words[i + 2], 23, 0xc4ac5665);

    a = ii(a, b, c, d, words[i + 0], 6, 0xf4292244);
    d = ii(d, a, b, c, words[i + 7], 10, 0x432aff97);
    c = ii(c, d, a, b, words[i + 14], 15, 0xab9423a7);
    b = ii(b, c, d, a, words[i + 5], 21, 0xfc93a039);
    a = ii(a, b, c, d, words[i + 12], 6, 0x655b59c3);
    d = ii(d, a, b, c, words[i + 3], 10, 0x8f0ccc92);
    c = ii(c, d, a, b, words[i + 10], 15, 0xffeff47d);
    b = ii(b, c, d, a, words[i + 1], 21, 0x85845dd1);
    a = ii(a, b, c, d, words[i + 8], 6, 0x6fa87e4f);
    d = ii(d, a, b, c, words[i + 15], 10, 0xfe2ce6e0);
    c = ii(c, d, a, b, words[i + 6], 15, 0xa3014314);
    b = ii(b, c, d, a, words[i + 13], 21, 0x4e0811a1);
    a = ii(a, b, c, d, words[i + 4], 6, 0xf7537e82);
    d = ii(d, a, b, c, words[i + 11], 10, 0xbd3af235);
    c = ii(c, d, a, b, words[i + 2], 15, 0x2ad7d2bb);
    b = ii(b, c, d, a, words[i + 9], 21, 0xeb86d391);

    a = add32(a, aa);
    b = add32(b, bb);
    c = add32(c, cc);
    d = add32(d, dd);
  }

  const toHexLE = (num) => {
    let out = '';
    for (let i = 0; i < 4; i++) {
      const byte = (num >>> (i * 8)) & 0xff;
      out += byte.toString(16).padStart(2, '0');
    }
    return out;
  };

  return toHexLE(a) + toHexLE(b) + toHexLE(c) + toHexLE(d);
}

async function computeMD5(message) {
  return md5(message);
}

// 扫描并翻译页面中文
async function scanAndTranslate() {
  if (!translateEnabled) return 0;

  await maybeAutoAdjustRate();

  const textNodes = collectTextNodes();
  if (textNodes.length === 0) return 0;

  let translatedCount = 0;
  const concurrency = 5;
  const delayMs = 100;

  for (let i = 0; i < textNodes.length; i += concurrency) {
    const batch = textNodes.slice(i, i + concurrency);

    const results = await Promise.all(
      batch.map(textNode => translateTextNode(textNode))
    );

    results.forEach(result => {
      if (result) translatedCount++;
    });

    if (i + concurrency < textNodes.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  return translatedCount;
}

const PART_OF_SPEECH_MAP = {
  noun: 'n.',
  verb: 'v.',
  adjective: 'adj.',
  adverb: 'adv.',
  preposition: 'prep.',
  conjunction: 'conj.',
  pronoun: 'pron.',
  interjection: 'interj.',
  determiner: 'det.',
  numeral: 'num.'
};

function formatPartOfSpeech(part) {
  if (!part) return '';
  const key = part.toLowerCase();
  return PART_OF_SPEECH_MAP[key] || part;
}

async function getDefinition(word) {
  if (!word) return null;
  const cacheKey = word.toLowerCase();
  if (definitionCache.has(cacheKey)) {
    return definitionCache.get(cacheKey);
  }

  if (LOCAL_DICT && LOCAL_DICT[cacheKey]) {
    const localEntry = LOCAL_DICT[cacheKey];
    const result = {
      word: word,
      phonetic: localEntry.phonetic || '',
      partOfSpeech: localEntry.partOfSpeech || '',
      meaning: localEntry.meaning || '',
      example: localEntry.example || ''
    };
    definitionCache.set(cacheKey, result);
    return result;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'lookupDefinition',
      word: cacheKey
    });

    if (response && response.result) {
      definitionCache.set(cacheKey, response.result);
      return response.result;
    }
  } catch (error) {
    console.error('\u83b7\u53d6\u672c\u5730\u8bcd\u5e93\u91ca\u4e49\u9519\u8bef:', error);
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${cacheKey}`
    );
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      const phonetics = entry.phonetics || [];
      const phonetic = phonetics.find(p => p.text) || phonetics[0];

      let meaningEn = '';
      let exampleEn = '';
      let partOfSpeech = '';

      if (entry.meanings && entry.meanings.length > 0) {
        const firstMeaning = entry.meanings[0];
        partOfSpeech = formatPartOfSpeech(firstMeaning.partOfSpeech || '');
        if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
          meaningEn = firstMeaning.definitions[0].definition;
          exampleEn = firstMeaning.definitions[0].example || '';
        }
      }

      const [meaningZh, exampleZh] = await Promise.all([
        meaningEn ? translateEnglishToChinese(meaningEn) : Promise.resolve(''),
        exampleEn ? translateEnglishToChinese(exampleEn) : Promise.resolve('')
      ]);

      const result = {
        word: entry.word,
        phonetic: phonetic ? phonetic.text : '',
        partOfSpeech: partOfSpeech,
        meaning: meaningZh || meaningEn || '',
        example: exampleZh || ''
      };
      definitionCache.set(cacheKey, result);
      return result;
    }
  } catch (error) {
    console.error('\u83b7\u53d6\u91ca\u4e49\u9519\u8bef:', error);
  }

  definitionCache.set(cacheKey, null);
  return null;
}

function showTooltip(x, y, data) {
  if (!tooltip) return;

  const wordEl = tooltip.querySelector('.ela-tooltip-word');
  const phoneticEl = tooltip.querySelector('.ela-tooltip-phonetic');
  const posEl = tooltip.querySelector('.ela-tooltip-pos');
  const meaningEl = tooltip.querySelector('.ela-tooltip-meaning');
  const exampleEl = tooltip.querySelector('.ela-tooltip-example');

  wordEl.textContent = data.word;
  phoneticEl.textContent = data.phonetic || '';
  posEl.textContent = data.partOfSpeech || '';
  posEl.style.display = data.partOfSpeech ? 'block' : 'none';
  meaningEl.textContent = data.meaning || '\u672a\u627e\u5230\u91ca\u4e49';
  exampleEl.textContent = data.example ? `\u4f8b\uff1a${data.example}` : '';
  exampleEl.style.display = data.example ? 'block' : 'none';

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = x + 15;
  let top = y + 15;

  if (left + 220 > viewportWidth) {
    left = x - 225;
  }
  if (top + 150 > viewportHeight) {
    top = y - 160;
  }

  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.style.display = 'block';
}

function hideTooltip() {
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

// 处理单词悬停
let hoverTimeout = null;
async function handleWordHover(event) {
  if (!definitionEnabled) return;

  const target = event.target;
  if (!target || !target.closest) return;
  const wordEl = target.closest('.ela-word');
  if (!wordEl) return;

  const rawWord = wordEl.dataset.word || wordEl.textContent || '';
  const word = rawWord.toLowerCase();
  if (!word) return;

  clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(async () => {
    const definition = await getDefinition(word);
    if (definition) {
      showTooltip(event.pageX, event.pageY, definition);
    }
  }, 300);
}

function handleMouseLeave(event) {
  clearTimeout(hoverTimeout);
  hideTooltip();
}

// 处理鼠标移动
function handleMouseMove(event) {
  if (tooltip && tooltip.style.display === 'block') {
    const x = event.pageX;
    const y = event.pageY;
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x + 15;
    let top = y + 15;

    if (left + 220 > viewportWidth) {
      left = x - 225;
    }
    if (top + 150 > viewportHeight) {
      top = y - 160;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'toggleTranslate') {
    translateEnabled = message.enabled;
    if (!translateEnabled) {
      originalViewEnabled = false;
      updateToggleBallState();
      resetTranslatedNodes();
      sendResponse({ count: 0 });
      return;
    }

    originalViewEnabled = false;
    updateToggleBallState();
    resetTranslatedNodes();
    scanAndTranslate().then(count => {
      sendResponse({ count: count || 0 });
    });
    return true;
  }

  if (message.type === 'toggleDefinition') {
    definitionEnabled = message.enabled;
    if (!definitionEnabled) {
      hideTooltip();
    }
  }

  if (message.type === 'updateEnglishRate') {
    if (Number.isFinite(message.rate)) {
      englishRate = Math.min(100, Math.max(0, message.rate));
    }
    if (translateEnabled) {
      resetTranslatedNodes();
      scanAndTranslate().then(count => {
        sendResponse({ count: count || 0 });
      });
      return true;
    }
  }

  if (message.type === 'updateAutoAdjust') {
    autoAdjustEnabled = !!message.enabled;
    if (Number.isFinite(message.step)) {
      autoAdjustStep = Math.min(100, Math.max(1, message.step));
    }
  }

  if (message.type === 'translateNow') {
    translateEnabled = true;
    originalViewEnabled = false;
    updateToggleBallState();
    resetTranslatedNodes();
    scanAndTranslate().then(count => {
      sendResponse({ count: count || 0 });
    });
    return true;
  }
});

init().then(() => {
  // 如果翻译已启用，页面加载后自动翻译
  if (translateEnabled) {
    setTimeout(() => {
      scanAndTranslate();
    }, 1000);
  }
});

// 监听鼠标事件用于单词释义
document.addEventListener('mouseover', handleWordHover);
document.addEventListener('mouseout', handleMouseLeave);
document.addEventListener('mousemove', handleMouseMove);
