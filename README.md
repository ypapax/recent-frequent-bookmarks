# Recently Used Bookmarks & History - Chrome Extension

A Chrome extension that shows your **bookmarks AND browsing history** combined and sorted by a smart scoring algorithm, making it easy to quickly access your most frequently and recently visited pages.

## Features

- **Unified View**: Displays both bookmarks and browsing history in one place
- **Smart Scoring Algorithm**: Items are ranked by browser history data:
  - **Visit Frequency** (0-100 points): More visits = higher score
  - **Recency** (0-100 points): Recently visited items score higher
  - Bookmarks and history items are sorted equally based on actual usage

- **Advanced Filtering**: Filter items by:
  - ⭐ **Bookmarks**: Show only bookmarked items
  - 🕐 **History**: Show only browsing history items
  - 🔥 **Frequent**: Show items with 10+ visits
  - ⏱️ **Recent**: Show items visited in the last 7 days

- **Search Functionality**: Quickly find items by title, URL, or folder path

- **Visual Indicators**:
  - Bookmarks have a ⭐ badge and yellow left border
  - History items have a 🕐 badge and gray background
  - Folders have a 📁 icon
  - Visit counts and time ago are displayed

- **Hide Items**:
  - Hover over any item to reveal a hide button (✕)
  - Click to hide unwanted items from the list
  - Hidden items won't appear until you reset settings

- **Management**:
  - **Reset Settings**: Restore all hidden items back to the list

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
     - `history`: To check browser history for visited pages
     - `storage`: To store hidden items
     - `tabs`: To open pages in new tabs

6. **Pin the Extension** (Optional):
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Recently Used Bookmarks"
   - Click the pin icon to keep it visible

## Usage

1. **Click the extension icon** in your Chrome toolbar to open the popup

2. **Browse items** sorted by smart scoring:
   - Items are ranked by visit frequency + recency
   - Bookmarked items get a bonus boost
   - Use filter checkboxes to show/hide bookmarks, history, frequent, or recent items

3. **Search** using the search box at the top

4. **Click an item** to open it in a new tab

5. **Hide items** by hovering and clicking the ✕ button

6. **Reset settings** to restore all hidden items

## How It Works

The extension uses browser history data to rank items:

1. **Browser History**: Reads visit counts and last visit times from Chrome's history
2. **Smart Scoring**: Combines frequency + recency
3. **Fair Sorting**: Bookmarks and history items are sorted equally by actual usage

All data comes from your existing browser history - no additional tracking needed!

## Privacy

No tracking! The extension only reads existing browser data locally:
- Your bookmarks
- Your browser history
- Hidden items (stored locally)

No data is sent to external servers.

## Files Structure

```
recently_used_bookmark/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup interface
├── popup.css          # Popup styling
├── popup.js           # Popup logic and display
└── README.md          # This file
```

## Notes

- The extension uses your existing browser history - no additional tracking
- Hidden items are stored in local Chrome storage
- Folders are always sorted to the bottom of the list

## Browser Compatibility

This extension is designed for Google Chrome and Chromium-based browsers that support Manifest V3.

## License

Free to use and modify for personal use.
