# Chrome Web Store Publishing Checklist

## 🎯 Before You Start

### 1. Create Icons
You need to create icon images in these sizes:
- [ ] 16x16 pixels (icon16.png)
- [ ] 48x48 pixels (icon48.png)
- [ ] 128x128 pixels (icon128.png)

**Save them in:** `icons/` folder in your extension directory

**Icon Design Tips:**
- Use a simple, recognizable symbol (bookmark + clock/history theme)
- Make it visible on both light and dark backgrounds
- Use PNG format with transparency
- Tools: Figma, Canva, or even Photoshop

### 2. Create Screenshots
Take 1-5 screenshots of your extension in action:
- [ ] Screenshot showing the main popup with bookmarks/history
- [ ] Screenshot showing grouping by domain/path/title
- [ ] Screenshot showing time-of-day highlighting
- [ ] Screenshot showing the Settings modal
- [ ] (Optional) Screenshot showing filters in action

**Dimensions:** 1280x800 or 640x400 pixels
**Format:** PNG or JPEG
**Tip:** Use Chrome's screenshot tool or a screen capture tool

### 3. Host Privacy Policy
- [ ] Upload PRIVACY_POLICY.md to a publicly accessible URL:
  - Option 1: GitHub Pages (create a GitHub repo and enable Pages)
  - Option 2: Your personal website
  - Option 3: Use a service like Pastebin or Gist
- [ ] Copy the URL for later

## 📝 Chrome Web Store Developer Account

### 4. Register as Chrome Web Store Developer
1. [ ] Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. [ ] Sign in with your Google account
3. [ ] Pay one-time $5 registration fee
4. [ ] Complete developer profile

## 📦 Package Your Extension

### 5. Create ZIP File
1. [ ] Create a folder with only these files:
   ```
   recent-frequent-bookmarks/
   ├── manifest.json
   ├── popup.html
   ├── popup.css
   ├── popup.js
   ├── icons/
   │   ├── icon16.png
   │   ├── icon48.png
   │   └── icon128.png
   └── README.md (optional)
   ```
2. [ ] Select all files and create ZIP archive
3. [ ] Name it: `recently-used-bookmarks-v1.2.zip`

**⚠️ Important:** Do NOT include:
- .git folder
- node_modules
- .DS_Store
- PUBLISHING_CHECKLIST.md
- Any test files

## 🚀 Submit to Chrome Web Store

### 6. Fill Out Store Listing
Go to Chrome Web Store Developer Dashboard and click "New Item"

**Product Details:**
- [ ] **Name:** Recently Used Bookmarks & History
- [ ] **Summary:** (280 chars max)
  ```
  Quick access to your most used bookmarks and history with smart scoring, time-of-day highlighting, and powerful grouping options. Find what you need faster!
  ```
- [ ] **Description:** (detailed, see template below)
- [ ] **Category:** Productivity
- [ ] **Language:** English (or your language)

**Store Listing Assets:**
- [ ] Upload 128x128 icon
- [ ] Upload 1-5 screenshots
- [ ] (Optional) Add promo images

**Privacy:**
- [ ] **Privacy Policy URL:** [paste your hosted privacy policy URL]
- [ ] **Permissions Justification:**
  - bookmarks: Required to display user's bookmarks
  - history: Required to show visit counts and patterns
  - storage: Required to save user preferences

**Distribution:**
- [ ] Select visibility: Public
- [ ] Select regions: All regions (or specific countries)

### 7. Submit for Review
- [ ] Click "Submit for Review"
- [ ] Wait 1-3 days for Google review
- [ ] Respond to any review feedback if needed

## 📊 After Publication

### 8. Monitor and Improve
- [ ] Share link with friends/colleagues for initial feedback
- [ ] Monitor reviews in Chrome Web Store
- [ ] Track usage statistics in Developer Dashboard
- [ ] Iterate based on user feedback

---

## 📄 Description Template for Store Listing

Use this template for the detailed description:

```
🚀 RECENTLY USED BOOKMARKS & HISTORY

Instantly access your most frequently and recently visited bookmarks and web pages with powerful sorting, grouping, and time-of-day highlighting.

✨ KEY FEATURES

📊 Smart Scoring Algorithm
- Items ranked by visit frequency + recency
- See what you actually use, not just what you saved

🕒 Time-of-Day Highlighting
- Highlights pages you typically visit at the current time
- Adjustable time window (±1h to ±11h)
- Perfect for daily routines

📦 Flexible Grouping
- Group by Domain, Path, or Title
- Collapsible groups for clean organization
- Quick hide/unhide options

🔍 Advanced Filtering
- Filter by Bookmarks or History
- Sort by Frequent or Recent
- Powerful search functionality
- Persistent search state

⚙️ Privacy First
- All data processed locally on your device
- No external servers or tracking
- No data collection or sharing
- Open source code

🎯 WHO IS THIS FOR?

Perfect for power users who:
- Have lots of bookmarks
- Visit the same sites regularly
- Want quick access to frequently used pages
- Need to find bookmarks by usage patterns

🔐 PERMISSIONS

- Bookmarks: To display your bookmarks
- History: To show visit counts and patterns
- Storage: To save your preferences

All data stays on your device. No tracking. No external servers.

📝 OPEN SOURCE

View the code and contribute on GitHub: [your-github-url]

💬 SUPPORT

Questions or issues? Contact us at [your-email] or create an issue on GitHub.
```

---

## 🎨 Icon Creation Ideas

If you need help creating icons, here are some concepts:
1. **Bookmark + Clock** - Combines bookmark symbol with clock face
2. **Star + History** - Star (bookmark) with circular arrow (history)
3. **Layered Pages** - Stacked pages with highlighted top page
4. **Time Graph** - Simple line graph showing usage over time

You can use free tools:
- Figma (free, web-based)
- Canva (free templates)
- GIMP (free, like Photoshop)
- Online icon generators

---

## ✅ Final Checks Before Submitting

- [ ] Test extension in fresh Chrome profile
- [ ] All features working correctly
- [ ] No console errors
- [ ] Icons displaying properly
- [ ] Screenshots are clear and representative
- [ ] Privacy policy is accessible
- [ ] Description is clear and compelling
- [ ] Version number is correct in manifest.json

Good luck with your publication! 🎉
