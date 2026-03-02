# English Learning Assistant - Edge浏览器插件规格文档

## 1. 项目概述

- **项目名称**: English Learning Assistant (英语学习助手)
- **项目类型**: Edge浏览器扩展程序
- **核心功能**: 自动将网页中文翻译成英文，鼠标悬停单词显示释义
- **目标用户**: 英语学习者、想要在浏览网页时学习英语的用户

## 2. UI/UX 规格

### 2.1 弹出窗口 (Popup)

**结构**:
- 固定宽度 320px，高度自适应
- 居中圆角设计，圆角半径 12px

**视觉设计**:
- 背景色: `#ffffff`
- 主色调: `#4f46e5` (indigo)
- 次要色: `#f3f4f6`
- 文字颜色: `#1f2937` (主), `#6b7280` (次)
- 阴影: `0 10px 40px rgba(0,0,0,0.15)`
- 字体: `"Segoe UI", "Microsoft YaHei", sans-serif`

**布局**:
- 顶部: Logo + 标题 (32px高度)
- 中部: 功能开关区域
  - 翻译开关 (Toggle)
  - 悬停释义开关 (Toggle)
- 底部: 状态信息和设置按钮

**组件**:
- 开关按钮: 40px x 22px，圆角 11px
- 开启状态: 滑块 `#4f46e5`，轨道 `#e0e7ff`
- 关闭状态: 滑块 `#9ca3af`，轨道 `#f3f4f6`

### 2.2 悬停释义窗口 (Tooltip)

**结构**:
- 固定宽度 200px
- 最大高度 150px
- 圆角半径 8px

**视觉设计**:
- 背景色: `#1f2937` (深色)
- 文字颜色: `#ffffff`
- 边框: 无
- 阴影: `0 4px 12px rgba(0,0,0,0.2)`
- 动画: fadeIn 0.2s ease

**布局**:
- 单词标题: 16px, bold
- 释义内容: 14px, normal
- 例句 (如有): 12px, italic, `#9ca3af`

### 2.3 翻译标记样式

- 翻译后的英文使用虚线下划线 `border-bottom: 2px dashed #4f46e5`
- 鼠标悬停时背景变为 `#e0e7ff`

## 3. 功能规格

### 3.1 核心功能

#### 功能1: 中文转英文翻译
- 自动扫描页面中文文本节点
- 使用免费翻译API (MyMemory API) 进行翻译
- 翻译结果以英文显示，原中文添加虚线下划线标记
- 翻译完成后显示浮动提示: "翻译完成，共翻译 X 处"
- 支持排除特定元素 (script, style, textarea, input等)

#### 功能2: 单词悬停释义
- 监听英文单词的 mouseenter 事件
- 使用免费词典API (Free Dictionary API) 获取释义
- 显示单词、音标、释义和例句
-  tooltip 跟随鼠标位置，避免超出视口

### 3.2 用户交互

- 点击扩展图标打开 popup 面板
- Toggle 开关即时启用/禁用功能
- 功能状态保存在 chrome.storage.local

### 3.3 数据流

```
用户点击扩展图标
       ↓
打开 popup.html
       ↓
读取 chrome.storage.local 中的设置
       ↓
用户切换开关 → 保存设置到 chrome.storage.local
       ↓
content.js 检测设置变化 → 执行对应功能
```

### 3.4 边界情况处理

- 网络请求失败: 显示"网络错误，请稍后重试"
- 无翻译结果: 保留原中文，不显示标记
- API请求防抖: 300ms 延迟避免频繁请求
- 已翻译元素: 添加标记避免重复翻译

## 4. 技术规格

### 4.1 文件结构

```
/english-learning-assistant
  ├── manifest.json          # 扩展配置文件
  ├── popup/
  │   ├── popup.html         # 弹出窗口
  │   ├── popup.css          # 弹出窗口样式
  │   └── popup.js           # 弹出窗口逻辑
  ├── content/
  │   ├── content.js         # 内容脚本
  │   └── content.css        # 注入样式
  ├── background/
  │   └── background.js      # 后台脚本
  └── icons/
      ├── icon16.png         # 16x16 图标
      ├── icon48.png         # 48x48 图标
      └── icon128.png        # 128x128 图标
```

### 4.2 API 端点

- 翻译API: `https://api.mymemory.translated.net/get?q={text}&langpair=zh-CN|en`
- 词典API: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`

### 4.3 权限

- `activeTab`: 访问当前标签页
- `storage`: 本地存储设置
- `scripting`: 注入脚本

## 5. 验收标准

- [ ] 扩展成功安装到Edge浏览器
- [ ] 点击图标显示popup面板
- [ ] 翻译开关可开启/关闭翻译功能
- [ ] 释义开关可开启/关闭悬停释义功能
- [ ] 开启翻译后，页面中文被翻译成英文并添加标记
- [ ] 开启释义后，鼠标悬停英文单词显示释义tooltip
- [ ] 刷新页面后设置保持不变
- [ ] 各个状态有对应的视觉反馈