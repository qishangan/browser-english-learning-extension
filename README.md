# English Learning Assistant | 英语学习助手

A browser extension for immersive English learning while browsing Chinese web pages.

一个用于浏览中文网页时进行沉浸式英语学习的浏览器插件。

## Overview | 项目简介

This extension helps users gradually turn Chinese page content into English and learn words in context.

该插件会把页面中的中文内容按比例替换为英文，并在阅读场景中帮助用户学习单词。

## Key Features | 核心功能

- Chinese-to-English page conversion with adjustable `English Rate` (0-100%).
- Supports automatic step-up of the English rate after each translation round.
- One-click translation for the current page from the popup panel.
- Hover definitions for translated English words with tooltip display.
- Floating page switch to toggle between translated view and original Chinese view.
- Built-in local dictionary first, online dictionary fallback when needed.

- 中文页面英文化，支持 `English Rate`（0-100%）比例控制。
- 支持每轮翻译后自动提升英文化比例（自动调节）。
- Popup 面板支持一键“立即翻译”当前页面。
- 鼠标悬停英文词可显示词义 tooltip。
- 页面内悬浮按钮可在“译文/原文”视图间切换。
- 词典查询优先本地词典，必要时回退到在线词典。

## Tech Stack | 技术实现

- Manifest V3 extension architecture
- `popup/` for controls and settings UI
- `content/` for page text processing and tooltip interaction
- `background/` service worker for translation and dictionary lookup
- Local dictionary data from `ecdict-stardict-28`
- Translation API: Baidu Translate API
- Online dictionary fallback: Free Dictionary API

- 基于 Manifest V3 架构
- `popup/`：控制面板与设置 UI
- `content/`：页面文本处理与悬停交互
- `background/`：翻译和词典查询后台服务
- 本地词典数据来源：`ecdict-stardict-28`
- 翻译接口：百度翻译 API
- 在线词典兜底：Free Dictionary API

## Installation | 安装方式

1. Clone this repository.
2. Install Git LFS (required for large dictionary files).
3. Run `git lfs pull` to fetch `.dict` and `.idx` files.
4. Open Edge/Chrome extension page:
   - Edge: `edge://extensions`
   - Chrome: `chrome://extensions`
5. Enable Developer Mode.
6. Click `Load unpacked` and select this project folder.

1. 克隆本仓库。
2. 安装 Git LFS（词典大文件必需）。
3. 执行 `git lfs pull` 拉取 `.dict`、`.idx` 文件。
4. 打开 Edge/Chrome 扩展管理页：
   - Edge: `edge://extensions`
   - Chrome: `chrome://extensions`
5. 打开“开发者模式”。
6. 点击“加载已解压的扩展程序”，选择本项目目录。

## Usage | 使用说明

1. Click the extension icon to open popup.
2. Enable translation and set English rate.
3. Optionally enable auto-adjust and choose step (`5%/10%/20%`).
4. Click `Translate Now` to process the current page.
5. Hover translated English words to view definitions.
6. Use the floating button on page to switch translated/original view.

1. 点击插件图标打开 popup。
2. 开启翻译并设置英文化比例。
3. 可选开启自动调节，并设置档位（`5%/10%/20%`）。
4. 点击“立即翻译”处理当前页面。
5. 鼠标悬停英文词查看释义。
6. 使用页面悬浮按钮在译文/原文间切换。

## Permissions & Privacy | 权限与隐私

- Permissions: `activeTab`, `storage`, `scripting`, and host access on `<all_urls>`.
- Translation and online fallback dictionary queries may send text/words to external APIs.
- Local dictionary lookup is performed on-device.

- 权限：`activeTab`、`storage`、`scripting`，以及 `<all_urls>` 页面访问。
- 翻译和在线兜底词典查询会将文本/单词发送到外部 API。
- 本地词典查询在本机完成。

## Repository Notes | 仓库说明

- Large dictionary assets are tracked by Git LFS.
- Main extension entry: `manifest.json`.
- Current version: `1.0.0`.

- 仓库中的大词典文件由 Git LFS 管理。
- 插件入口文件：`manifest.json`。
- 当前版本：`1.0.0`。

## License | 许可证

No license file is currently included.

当前仓库暂未附带许可证文件。

