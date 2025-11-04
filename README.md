# Recently Used Bookmarks - Chrome Extension

A Chrome extension that displays your bookmarks and bookmark folders sorted by recently used, making it easy to quickly access your most frequently visited bookmarks.

## Features

- **Smart Sorting**: Bookmarks are sorted by multiple criteria in priority order:
  1. Extension-tracked clicks (when you click bookmarks through the extension)
  2. Browser history visits (checks your actual browsing history)
  3. Creation date (newest first)
  4. Alphabetical (fallback)

- **Shows Both Bookmarks and Folders**: View both individual bookmarks and bookmark folders
- **Search Functionality**: Quickly find bookmarks by title, URL, or folder path
- **Visual Indicators**:
  - Displays usage count and last used time
  - Shows whether data comes from extension tracking, browser history, or creation date
  - Different styling for folders vs bookmarks
- **Clear History**: Option to clear usage tracking data

## Installation

Since this is an unpacked extension, follow these steps to install:

1. **Clone or Download** this repository to your local machine

2. **Open Chrome Extensions Page**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Or click the three dots menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**:
   - Click "Load unpacked" button
   - Navigate to the folder containing the extension files
   - Select the folder and click "Select"

5. **Grant Permissions**:
   - The extension will request permissions for:
     - `bookmarks`: To read your bookmarks
     - `history`: To check browser history for visited bookmarks
     - `storage`: To store usage tracking data
     - `tabs`: To open bookmarks in new tabs

6. **Pin the Extension** (Optional):
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Recently Used Bookmarks"
   - Click the pin icon to keep it visible

## Usage

1. **Click the extension icon** in your Chrome toolbar to open the popup

2. **Browse your bookmarks** sorted by recently used:
   - Bookmarks you've clicked through the extension appear first
   - Bookmarks you've visited (from browser history) appear next
   - Newly created bookmarks appear after that

3. **Search bookmarks** using the search box at the top

4. **Click a bookmark** to open it in a new tab

5. **Click a folder** to open Chrome's bookmark manager at that folder

6. **Clear history** using the "Clear History" button to reset usage tracking (note: browser history data will still be used)

## How It Works

The extension uses three sources of data to determine bookmark usage:

1. **Extension Tracking**: Tracks when you open bookmarks through the extension popup
2. **Browser History**: Checks Chrome's history to see when you last visited each bookmarked URL
3. **Creation Date**: Uses the bookmark's creation timestamp as a fallback

This multi-layered approach ensures that even if you haven't used the extension much, your bookmarks are still sorted meaningfully based on your actual browsing behavior.

## Privacy

All usage tracking data is stored locally in Chrome's storage. No data is sent to external servers. The extension only reads:
- Your bookmarks
- Browser history for bookmarked URLs only
- Local usage tracking data

## Files Structure

```
recently_used_bookmark/
├── manifest.json       # Extension configuration
├── background.js       # Background script for tracking usage
├── popup.html         # Extension popup interface
├── popup.css          # Popup styling
├── popup.js           # Popup logic and display
└── README.md          # This file
```

## Icons

Note: This extension currently references icon files (icon16.png, icon48.png, icon128.png) that need to be created. You can:
- Create simple bookmark icons using any image editor
- Use free icon resources
- Or temporarily comment out the icon references in manifest.json

## Browser Compatibility

This extension is designed for Google Chrome and Chromium-based browsers that support Manifest V3.

## License

Free to use and modify for personal use.
