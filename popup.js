// Popup script to display sorted bookmarks

let allBookmarks = [];
let bookmarkUsage = {};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadBookmarks();
  setupEventListeners();
});

function setupEventListeners() {
  // Search functionality
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', (e) => {
    filterBookmarks(e.target.value);
  });

  // Clear history button
  const clearButton = document.getElementById('clearHistory');
  clearButton.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear the usage history?')) {
      await chrome.runtime.sendMessage({ action: 'clearHistory' });
      await loadBookmarks();
    }
  });
}

async function loadBookmarks() {
  try {
    console.log('Loading bookmarks...');

    // Load usage data
    const result = await chrome.storage.local.get('bookmarkUsage');
    bookmarkUsage = result.bookmarkUsage || {};
    console.log('Usage data loaded:', bookmarkUsage);

    // Get all bookmarks
    const bookmarkTree = await chrome.bookmarks.getTree();
    console.log('Bookmark tree loaded:', bookmarkTree);

    allBookmarks = [];
    flattenBookmarks(bookmarkTree[0], allBookmarks);
    console.log('Flattened bookmarks count:', allBookmarks.length);

    // Enrich bookmarks with history data
    await enrichBookmarksWithHistory(allBookmarks);
    console.log('Bookmarks enriched with history');

    // Sort by usage
    sortAndDisplayBookmarks(allBookmarks);
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    displayError('Failed to load bookmarks: ' + error.message);
  }
}

async function enrichBookmarksWithHistory(bookmarks) {
  // Check browser history for bookmarks that don't have usage data
  const promises = bookmarks.map(async (bookmark) => {
    if (bookmark.type === 'bookmark' && bookmark.url) {
      // If no usage data exists, check browser history
      if (!bookmarkUsage[bookmark.id]) {
        try {
          const visits = await chrome.history.getVisits({ url: bookmark.url });
          if (visits && visits.length > 0) {
            // Sort visits by time and get the most recent
            visits.sort((a, b) => b.visitTime - a.visitTime);
            const lastVisit = visits[0].visitTime;

            // Store this data (but don't persist it, just use for sorting)
            bookmark.historyLastVisit = lastVisit;
            bookmark.historyVisitCount = visits.length;
          }
        } catch (error) {
          console.error('Error getting history for bookmark:', bookmark.url, error);
        }
      }
    }
  });

  await Promise.all(promises);
}

function flattenBookmarks(node, result, path = []) {
  console.log('Processing node:', node.id, node.title, 'has URL:', !!node.url, 'has children:', !!node.children);

  if (node.url) {
    // It's a bookmark
    result.push({
      ...node,
      type: 'bookmark',
      path: path.join(' > ')
    });
    console.log('Added bookmark:', node.title);
  } else if (node.children || node.id === '0') {
    // It's a folder
    // Add folder to results (except root with id '0')
    if (node.id !== '0' && node.title) {
      result.push({
        ...node,
        type: 'folder',
        path: path.join(' > ')
      });
      console.log('Added folder:', node.title);
    }

    // Process children
    if (node.children) {
      const newPath = node.title && node.id !== '0' ? [...path, node.title] : path;
      for (const child of node.children) {
        flattenBookmarks(child, result, newPath);
      }
    }
  }
}

function sortAndDisplayBookmarks(bookmarks) {
  // Sort bookmarks by multiple criteria:
  // 1. Extension-tracked usage (clicks)
  // 2. Browser history visits
  // 3. Creation date (dateAdded)
  const sorted = bookmarks.sort((a, b) => {
    const aUsage = bookmarkUsage[a.id];
    const bUsage = bookmarkUsage[b.id];

    // Priority 1: Extension-tracked usage data
    if (aUsage && bUsage) {
      // First compare by last used time
      if (aUsage.lastUsed !== bUsage.lastUsed) {
        return bUsage.lastUsed - aUsage.lastUsed;
      }
      // Then by use count
      return bUsage.useCount - aUsage.useCount;
    }

    // If only one has extension usage data, prioritize it
    if (aUsage) return -1;
    if (bUsage) return 1;

    // Priority 2: Browser history data (for bookmarks only)
    if (a.type === 'bookmark' && b.type === 'bookmark') {
      const aHistoryTime = a.historyLastVisit || 0;
      const bHistoryTime = b.historyLastVisit || 0;

      if (aHistoryTime && bHistoryTime) {
        if (aHistoryTime !== bHistoryTime) {
          return bHistoryTime - aHistoryTime;
        }
        // Compare by visit count if times are equal
        return (b.historyVisitCount || 0) - (a.historyVisitCount || 0);
      }

      if (aHistoryTime) return -1;
      if (bHistoryTime) return 1;
    }

    // Priority 3: Creation date (dateAdded)
    if (a.dateAdded && b.dateAdded) {
      return b.dateAdded - a.dateAdded;
    }

    // Fallback: alphabetically
    return a.title.localeCompare(b.title);
  });

  displayBookmarks(sorted);
}

function displayBookmarks(bookmarks) {
  const container = document.getElementById('bookmarksList');

  if (bookmarks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No bookmarks found</h3>
        <p>Start using your bookmarks to see them here</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  bookmarks.forEach(bookmark => {
    const item = createBookmarkElement(bookmark);
    container.appendChild(item);
  });
}

function createBookmarkElement(bookmark) {
  const div = document.createElement('div');
  div.className = `bookmark-item ${bookmark.type}`;

  const usage = bookmarkUsage[bookmark.id];
  let metaText = '';

  if (usage) {
    // Extension tracked usage
    const timeAgo = getTimeAgo(usage.lastUsed);
    metaText = `Used ${usage.useCount} time${usage.useCount > 1 ? 's' : ''} • ${timeAgo}`;
  } else if (bookmark.historyLastVisit) {
    // Browser history data
    const timeAgo = getTimeAgo(bookmark.historyLastVisit);
    metaText = `Visited ${bookmark.historyVisitCount} time${bookmark.historyVisitCount > 1 ? 's' : ''} • ${timeAgo}`;
  } else if (bookmark.dateAdded) {
    // Creation date fallback
    const timeAgo = getTimeAgo(bookmark.dateAdded);
    metaText = `Created ${timeAgo}`;
  } else {
    metaText = 'No usage data';
  }

  if (bookmark.type === 'folder') {
    div.innerHTML = `
      <span class="folder-icon">📁</span>
      <div class="bookmark-content">
        <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
        <div class="bookmark-url">${bookmark.path ? escapeHtml(bookmark.path) : 'Folder'}</div>
      </div>
      <div class="bookmark-meta">${metaText}</div>
    `;

    div.addEventListener('click', () => {
      openFolder(bookmark.id);
    });
  } else {
    const favicon = getFaviconUrl(bookmark.url);

    div.innerHTML = `
      <img class="bookmark-favicon" src="${favicon}" alt="" onerror="this.style.display='none'">
      <div class="bookmark-content">
        <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
        <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
      </div>
      <div class="bookmark-meta">${metaText}</div>
    `;

    div.addEventListener('click', () => {
      chrome.tabs.create({ url: bookmark.url });
      window.close();
    });
  }

  return div;
}

function openFolder(folderId) {
  chrome.tabs.create({ url: `chrome://bookmarks/?id=${folderId}` });
  window.close();
}

function getFaviconUrl(url) {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return '';
  }
}

function filterBookmarks(query) {
  if (!query.trim()) {
    sortAndDisplayBookmarks(allBookmarks);
    return;
  }

  const lowerQuery = query.toLowerCase();
  const filtered = allBookmarks.filter(bookmark => {
    return (
      bookmark.title.toLowerCase().includes(lowerQuery) ||
      (bookmark.url && bookmark.url.toLowerCase().includes(lowerQuery)) ||
      bookmark.path.toLowerCase().includes(lowerQuery)
    );
  });

  sortAndDisplayBookmarks(filtered);
}

function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function displayError(message) {
  const container = document.getElementById('bookmarksList');
  container.innerHTML = `
    <div class="empty-state">
      <h3>Error</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}
