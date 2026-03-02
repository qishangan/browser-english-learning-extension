// 后台脚本 - 英语学习助手

// 百度翻译API配置
const BAIDU_APP_ID = '20240223001971858';
const BAIDU_SECRET = 'SFRF7kfFrhP0PcCfzHtd';

// MD5 for Baidu API (SubtleCrypto does not support MD5 in Edge).
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

const DICT_IFO_PATH = 'ecdict-stardict-28/stardict-ecdict-2.4.2/stardict-ecdict-2.4.2.ifo';
const DICT_IDX_PATH = 'ecdict-stardict-28/stardict-ecdict-2.4.2/stardict-ecdict-2.4.2.idx';
const DICT_DATA_PATH = 'ecdict-stardict-28/stardict-ecdict-2.4.2/stardict-ecdict-2.4.2.dict';

let dictIndexBuffer = null;
let dictIndexBytes = null;
let dictDataBuffer = null;
let dictEntryOffsets = null;
let dictEntryCount = 0;
let dictLoadPromise = null;
const dictDecoder = new TextDecoder('utf-8');

function parseIfoWordCount(text) {
  const match = text.match(/^wordcount=(\d+)/m);
  if (!match) return 0;
  const count = Number.parseInt(match[1], 10);
  return Number.isFinite(count) ? count : 0;
}

function buildEntryOffsets(indexBytes, expectedCount) {
  const useTyped = Number.isFinite(expectedCount) && expectedCount > 0;
  const offsets = useTyped ? new Uint32Array(expectedCount) : [];
  let pos = 0;
  let count = 0;

  while (pos < indexBytes.length) {
    if (useTyped) {
      if (count < offsets.length) {
        offsets[count] = pos;
      }
    } else {
      offsets.push(pos);
    }
    count++;

    while (pos < indexBytes.length && indexBytes[pos] !== 0) {
      pos++;
    }
    pos += 1;
    if (pos + 8 > indexBytes.length) break;
    pos += 8;
  }

  return { offsets, count };
}

async function ensureDictionaryLoaded() {
  if (dictEntryOffsets && dictIndexBytes && dictDataBuffer) return;
  if (dictLoadPromise) return dictLoadPromise;

  dictLoadPromise = (async () => {
    const ifoUrl = chrome.runtime.getURL(DICT_IFO_PATH);
    const idxUrl = chrome.runtime.getURL(DICT_IDX_PATH);
    const dictUrl = chrome.runtime.getURL(DICT_DATA_PATH);

    const [ifoRes, idxRes, dictRes] = await Promise.all([
      fetch(ifoUrl),
      fetch(idxUrl),
      fetch(dictUrl)
    ]);

    if (!ifoRes.ok || !idxRes.ok || !dictRes.ok) {
      throw new Error('Failed to load local dictionary files.');
    }

    const ifoText = await ifoRes.text();
    const expectedCount = parseIfoWordCount(ifoText);

    dictIndexBuffer = await idxRes.arrayBuffer();
    dictIndexBytes = new Uint8Array(dictIndexBuffer);
    dictDataBuffer = await dictRes.arrayBuffer();

    const offsetsInfo = buildEntryOffsets(dictIndexBytes, expectedCount);
    dictEntryOffsets = offsetsInfo.offsets;
    dictEntryCount = offsetsInfo.count;
  })().catch(error => {
    console.error('Local dictionary load failed:', error);
    dictLoadPromise = null;
    throw error;
  });

  return dictLoadPromise;
}

function readUint32BE(bytes, offset) {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

function readIndexEntryAt(index) {
  const entryOffset = dictEntryOffsets[index];
  let end = entryOffset;
  while (end < dictIndexBytes.length && dictIndexBytes[end] !== 0) {
    end++;
  }
  const word = dictDecoder.decode(dictIndexBytes.subarray(entryOffset, end));
  const dataOffset = readUint32BE(dictIndexBytes, end + 1);
  const dataSize = readUint32BE(dictIndexBytes, end + 5);
  return { word, dataOffset, dataSize };
}

function findIndexEntry(word) {
  const target = word.toLowerCase();
  let low = 0;
  let high = dictEntryCount - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const entry = readIndexEntryAt(mid);
    const entryKey = entry.word.toLowerCase();

    if (entryKey === target) {
      return entry;
    }
    if (entryKey < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return null;
}

function parseDictEntry(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return null;

  let phonetic = '';
  const posList = [];
  const meaningLines = [];

  for (const line of lines) {
    if (!phonetic) {
      const match = line.match(/\[([^\]]+)\]/);
      if (match) {
        phonetic = match[1];
      }
    }

    const posMatch = line.match(/^([A-Za-z]{1,5}\.)\s*(.+)$/);
    if (posMatch) {
      const pos = posMatch[1];
      const meaning = posMatch[2].trim();
      if (meaning) {
        meaningLines.push(`${pos} ${meaning}`);
      }
      if (!posList.includes(pos)) {
        posList.push(pos);
      }
    }
  }

  if (!meaningLines.length) {
    for (const line of lines) {
      if (/\[[^\]]+\]/.test(line)) continue;
      if (/^\(.*\)$/.test(line)) continue;
      meaningLines.push(line);
      break;
    }
  }

  if (!meaningLines.length) return null;

  return {
    phonetic,
    partOfSpeech: posList.join(' / '),
    meaning: meaningLines.join('; ')
  };
}

async function lookupLocalDefinition(word) {
  const target = (word || '').trim().toLowerCase();
  if (!target) return null;

  await ensureDictionaryLoaded();
  const entry = findIndexEntry(target);
  if (!entry) return null;

  const slice = new Uint8Array(dictDataBuffer, entry.dataOffset, entry.dataSize);
  const text = dictDecoder.decode(slice);
  const parsed = parseDictEntry(text);
  if (!parsed) return null;

  return {
    word: entry.word,
    phonetic: parsed.phonetic || '',
    partOfSpeech: parsed.partOfSpeech || '',
    meaning: parsed.meaning || '',
    example: ''
  };
}

// 百度翻译函数
async function baiduTranslate(text, from = 'zh', to = 'en') {
  const salt = Math.random().toString(36).substring(2, 10);
  const sign = await computeMD5(BAIDU_APP_ID + text + salt + BAIDU_SECRET);

  const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?appid=${BAIDU_APP_ID}&q=${encodeURIComponent(text)}&from=${from}&to=${to}&salt=${salt}&sign=${sign}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('百度翻译响应:', data);

    if (data.trans_result && data.trans_result.length > 0) {
      return data.trans_result[0].dst;
    }
    if (data.error_code) {
      console.error('百度翻译错误:', data.error_msg || data.error_code);
    }
    return null;
  } catch (error) {
    console.error('翻译请求错误:', error);
    return null;
  }
}

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      translateEnabled: false,
      definitionEnabled: true,
      englishRate: 60,
      autoAdjustEnabled: false,
      autoAdjustStep: 10,
      lastAutoAdjustAt: 0
    });
  }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // 标签页加载完成后，内容脚本会自动根据存储的设置执行
  }
});

// 监听内容脚本的翻译请求
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'translate') {
    const from = message.from || 'zh';
    const to = message.to || 'en';
    baiduTranslate(message.text, from, to).then(result => {
      sendResponse({ result: result });
    });
    return true;
  }

  if (message.type === 'lookupDefinition') {
    lookupLocalDefinition(message.word).then(result => {
      sendResponse({ result: result });
    }).catch(error => {
      console.error('Local dictionary lookup failed:', error);
      sendResponse({ result: null });
    });
    return true;
  }
});
