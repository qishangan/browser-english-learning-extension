# English Learning Assistant

A browser extension for immersive English learning while browsing Chinese web pages.

## Overview

This extension helps users gradually turn Chinese page content into English and learn words in context.

## Key Features

- Chinese-to-English page conversion with adjustable `English Rate` (0-100%).
- Supports automatic step-up of the English rate after each translation round.
- One-click translation for the current page from the popup panel.
- Hover definitions for translated English words with tooltip display.
- Floating page switch to toggle between translated view and original Chinese view.
- Built-in local dictionary first, online dictionary fallback when needed.

## Tech Stack

- Manifest V3 extension architecture
- `popup/` for controls and settings UI
- `content/` for page text processing and tooltip interaction
- `background/` service worker for translation and dictionary lookup
- Local dictionary data from `ecdict-stardict-28`
- Translation API: Baidu Translate API
- Online dictionary fallback: Free Dictionary API

## Installation

1. Clone this repository.
2. Install Git LFS (required for large dictionary files).
3. Run `git lfs pull` to fetch `.dict` and `.idx` files.
4. Open Edge/Chrome extension page:
   - Edge: `edge://extensions`
   - Chrome: `chrome://extensions`
5. Enable Developer Mode.
6. Click `Load unpacked` and select this project folder.

## Usage

1. Click the extension icon to open popup.
2. Enable translation and set English rate.
3. Optionally enable auto-adjust and choose step (`5%/10%/20%`).
4. Click `Translate Now` to process the current page.
5. Hover translated English words to view definitions.
6. Use the floating button on page to switch translated/original view.

## Permissions and Privacy

- Permissions: `activeTab`, `storage`, `scripting`, and host access on `<all_urls>`.
- Translation and online fallback dictionary queries may send text/words to external APIs.
- Local dictionary lookup is performed on-device.

## Repository Notes

- Large dictionary assets are tracked by Git LFS.
- Main extension entry: `manifest.json`.
- Current version: `1.0.0`.
