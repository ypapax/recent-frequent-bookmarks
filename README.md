# Recent & Frequent Bookmarks - Chrome Extension

Quick access to your **most recent and frequently used bookmarks** with smart sorting, time-of-day highlighting, and powerful search. A productivity-focused bookmark manager for Chrome.

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue)](https://chrome.google.com/webstore)
[![Privacy Policy](https://img.shields.io/badge/Privacy-First-green)](https://github.com/ypapax/recent-frequent-bookmarks/blob/master/PRIVACY_POLICY.md)

## Why Recent & Frequent?

Stop scrolling through endless bookmark folders. This extension shows you the bookmarks and pages you **actually use**, sorted by frequency and recency. Perfect for power users who want instant access to their workflow.

## Key Features

### 🚀 Smart Usage-Based Sorting
- **Visit Frequency Scoring** (0-100 points): More visits = higher ranking
- **Recency Scoring** (0-100 points): Recently accessed pages appear first
- Combined scoring algorithm ranks items by actual usage, not creation date

### 🕒 Time-of-Day Highlighting
- Automatically highlights bookmarks you typically visit at the current time
- Adjustable time window: ±1h to ±11h
- Shows time difference for quick context
- Perfect for daily routines and scheduled tasks

### 📦 Flexible Grouping Options
- **Group by Domain**: See all items from the same website together
- **Group by Path**: Organize by URL path structure
- **Group by Title**: Cluster similarly named bookmarks
- Collapsible groups with expandable "show more" functionality

### 🔍 Powerful Filtering & Search
- Filter by: Bookmarks, History, Frequent (10+ visits), Recent (last 7 days)
- Instant search across titles, URLs, and folder paths
- Search state persists between sessions

### 🎯 Smart Management
- Hide individual URLs or entire domains
- Settings panel to manage ignored items
- One-click "Unignore All" functionality
- No permanent deletion - everything is recoverable

### 🔒 Privacy First
- **100% local processing** - no data leaves your device
- No external servers, no tracking, no analytics
- Open source code you can audit
- Only accesses data you already have in Chrome

## Perfect For

- **Developers**: Quick access to documentation, repos, and tools
- **Researchers**: Manage frequently visited research sites
- **Power Users**: Anyone with 50+ bookmarks who wants faster access
- **Daily Routines**: Access time-specific bookmarks automatically
- **Productivity**: Reduce time searching for frequently used sites

## Installation

### From Chrome Web Store (Recommended)
[Coming soon - publishing in progress]

### Developer Installation
1. Download or clone this extension from your local folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the extension folder

## How It Works

1. **Reads Your Browser History**: Accesses visit counts and timestamps (locally)
2. **Calculates Smart Scores**: Combines frequency and recency into a single ranking
3. **Displays Sorted Results**: Shows your most-used bookmarks and sites first
4. **Learns Your Patterns**: Time-of-day feature adapts to your browsing habits

All processing happens **locally in your browser** - no data is sent anywhere.

## Permissions Explained

- `bookmarks`: Read your bookmarks to display them
- `history`: Check visit counts and times for ranking
- `storage`: Save your preferences and hidden items locally
- `tabs`: Open bookmarks in new tabs when clicked

## Screenshots

[Screenshots will be added here]

## Privacy & Security

Read our [Privacy Policy](PRIVACY_POLICY.md)

**What we DON'T do:**
- ❌ No data collection
- ❌ No external servers
- ❌ No tracking or analytics
- ❌ No ads
- ❌ No third-party sharing

## Keywords

bookmark manager, chrome extension, recent bookmarks, frequent sites, quick access bookmarks, productivity tool, browser history, smart bookmarks, bookmark organizer, time-based bookmarks, usage-based sorting, bookmark search, browser productivity, chrome productivity, bookmark filters

## Technical Details

- **Manifest Version**: V3 (latest Chrome standard)
- **Framework**: Vanilla JavaScript
- **Browser Support**: Chrome, Edge, Brave (Chromium-based)
- **Performance**: Lightweight, no background processes
- **Storage**: Chrome local storage API

## Contributing

Found a bug or have a feature request? [Open an issue](https://github.com/ypapax/recent-frequent-bookmarks/issues)

## Author

Created by **Maxim Yefremov**

- GitHub: [@ypapax](https://github.com/ypapax)
- Issues: [Create Issue](https://github.com/ypapax/recent-frequent-bookmarks/issues)

## License

Free to use and modify for personal use.

## Version History

- **v1.2** - Current version with time-of-day highlighting, grouping, and settings panel
- **v1.0** - Initial release with basic sorting and filtering

---

⭐ **Like this extension?** Please star the repo and leave a review on the Chrome Web Store!

🐛 **Found a bug?** [Report it here](https://github.com/ypapax/recent-frequent-bookmarks/issues)

📧 **Questions?** Check our [Privacy Policy](PRIVACY_POLICY.md) or create an issue
