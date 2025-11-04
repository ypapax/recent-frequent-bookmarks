// Popup script to display sorted bookmarks and history

let allItems = [];
let bookmarkUrlMap = new Map(); // Map URLs to bookmark IDs
let hiddenItems = new Set(); // Set of hidden URLs

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
});

function setupEventListeners() {
  // Search functionality
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('input', (e) => {
    applyFilters();
  });

  // Filter checkboxes
  const filterCheckboxes = [
    'filterBookmarks',
    'filterHistory',
    'filterFrequent',
    'filterRecent'
  ];

  filterCheckboxes.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        saveFilterStates();
        applyFilters();
      });
    }
  });

  // Reset settings button
  const resetHiddenButton = document.getElementById('resetHidden');
  resetHiddenButton.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all settings?\n\nThis will show all hidden items and reset filters to default.')) {
      await chrome.storage.local.remove(['hiddenItems', 'filterStates']);
      hiddenItems.clear();

      // Reset checkboxes to default (all checked)
      document.getElementById('filterBookmarks').checked = true;
      document.getElementById('filterHistory').checked = true;
      document.getElementById('filterFrequent').checked = true;
      document.getElementById('filterRecent').checked = true;

      applyFilters();
    }
  });
}

async function saveFilterStates() {
  const filterStates = {
    bookmarks: document.getElementById('filterBookmarks').checked,
    history: document.getElementById('filterHistory').checked,
    frequent: document.getElementById('filterFrequent').checked,
    recent: document.getElementById('filterRecent').checked
  };

  await chrome.storage.local.set({ filterStates });
}

async function loadData() {
  try {
    // Load hidden items and filter states
    const result = await chrome.storage.local.get(['hiddenItems', 'filterStates']);
    hiddenItems = new Set(result.hiddenItems || []);

    // Restore filter checkbox states
    if (result.filterStates) {
      document.getElementById('filterBookmarks').checked = result.filterStates.bookmarks ?? true;
      document.getElementById('filterHistory').checked = result.filterStates.history ?? true;
      document.getElementById('filterFrequent').checked = result.filterStates.frequent ?? true;
      document.getElementById('filterRecent').checked = result.filterStates.recent ?? true;
    }

    // Get all bookmarks
    const bookmarkTree = await chrome.bookmarks.getTree();

    const bookmarks = [];
    flattenBookmarks(bookmarkTree[0], bookmarks);

    // Create URL map for quick lookup
    bookmarkUrlMap.clear();
    bookmarks.forEach(bookmark => {
      if (bookmark.url) {
        bookmarkUrlMap.set(bookmark.url, bookmark.id);
      }
    });

    // Get top history items
    const historyItems = await getTopHistoryItems(500); // Get top 500 most visited

    // Merge bookmarks and history
    allItems = mergeBookmarksAndHistory(bookmarks, historyItems);

    // Apply filters (which will also filter out hidden items)
    applyFilters();
  } catch (error) {
    console.error('Error loading data:', error);
    displayError('Failed to load data: ' + error.message);
  }
}

async function getTopHistoryItems(maxResults = 500) {
  try {
    // Get recent history items
    const historyItems = await chrome.history.search({
      text: '',
      maxResults: maxResults,
      startTime: 0
    });

    // Get visit counts for each URL
    const enrichedItems = await Promise.all(
      historyItems.map(async (item) => {
        const visits = await chrome.history.getVisits({ url: item.url });
        return {
          url: item.url,
          title: item.title || item.url,
          visitCount: item.visitCount || visits.length,
          lastVisitTime: item.lastVisitTime,
          visits: visits
        };
      })
    );

    // Filter out items with no visits
    return enrichedItems.filter(item => item.visitCount > 0);
  } catch (error) {
    console.error('Error getting history items:', error);
    return [];
  }
}

function mergeBookmarksAndHistory(bookmarks, historyItems) {
  const merged = [];
  const processedUrls = new Set();

  // Process bookmarks first
  bookmarks.forEach(bookmark => {
    if (bookmark.type === 'folder') {
      // Add folders as-is
      merged.push({
        ...bookmark,
        isBookmark: true,
        isFolder: true
      });
    } else if (bookmark.url) {
      // Mark bookmark URLs as processed
      processedUrls.add(bookmark.url);

      // Find matching history item for this bookmark
      const historyItem = historyItems.find(h => h.url === bookmark.url);

      merged.push({
        ...bookmark,
        isBookmark: true,
        isFolder: false,
        visitCount: historyItem?.visitCount || 0,
        lastVisitTime: historyItem?.lastVisitTime || bookmark.dateAdded
      });
    }
  });

  // Add history items that are NOT bookmarks
  historyItems.forEach(historyItem => {
    if (!processedUrls.has(historyItem.url)) {
      merged.push({
        id: 'history-' + historyItem.url,
        url: historyItem.url,
        title: historyItem.title,
        type: 'history',
        isBookmark: false,
        isFolder: false,
        visitCount: historyItem.visitCount,
        lastVisitTime: historyItem.lastVisitTime
      });
    }
  });

  return merged;
}

function flattenBookmarks(node, result, path = []) {
  if (node.url) {
    // It's a bookmark
    result.push({
      ...node,
      type: 'bookmark',
      path: path.join(' > ')
    });
  } else if (node.children || node.id === '0') {
    // It's a folder
    // Add folder to results (except root with id '0')
    if (node.id !== '0' && node.title) {
      result.push({
        ...node,
        type: 'folder',
        path: path.join(' > ')
      });
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

function calculateScore(item, useFrequency = true, useRecency = true) {
  let score = 0;
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Folders get minimal score (sort to bottom)
  if (item.isFolder) {
    return 0;
  }

  // Component 1: Visit frequency (0-100 points) - only if enabled
  let frequencyScore = 0;
  if (useFrequency) {
    const visitCount = item.visitCount || 0;
    frequencyScore = Math.min(100, visitCount * 2); // 2 points per visit, max 100
  }

  // Component 2: Recency score (0-100 points) - only if enabled
  let recencyScore = 0;
  if (useRecency) {
    const lastVisit = item.lastVisitTime || item.dateAdded || 0;
    const daysSinceVisit = (now - lastVisit) / ONE_DAY;
    if (daysSinceVisit < 1) recencyScore = 100;
    else if (daysSinceVisit < 7) recencyScore = 80;
    else if (daysSinceVisit < 30) recencyScore = 60;
    else if (daysSinceVisit < 90) recencyScore = 40;
    else if (daysSinceVisit < 180) recencyScore = 20;
    else recencyScore = 10;
  }

  // Component 3: Bookmark bonus (50 points)
  const bookmarkBonus = item.isBookmark && !item.isFolder ? 50 : 0;

  score = frequencyScore + recencyScore + bookmarkBonus;

  return score;
}

function sortAndDisplayItems(items, useFrequency = true, useRecency = true) {
  // Calculate scores for all items based on active filters
  items.forEach(item => {
    item.score = calculateScore(item, useFrequency, useRecency);
  });

  // Sort by score (highest first)
  const sorted = items.sort((a, b) => {
    // Folders go to bottom
    if (a.isFolder && !b.isFolder) return 1;
    if (b.isFolder && !a.isFolder) return -1;

    // Otherwise sort by score
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Tie breaker: alphabetically
    return a.title.localeCompare(b.title);
  });

  displayItems(sorted);
}

function displayItems(items) {
  const container = document.getElementById('bookmarksList');

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>No items found</h3>
        <p>Start browsing to see your history here</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  items.forEach(item => {
    const element = createItemElement(item);
    container.appendChild(element);
  });
}

function createItemElement(item) {
  const div = document.createElement('div');

  // Determine item class
  let itemClass = 'bookmark-item';
  if (item.isFolder) {
    itemClass += ' folder';
  } else if (item.isBookmark) {
    itemClass += ' bookmark';
  } else {
    itemClass += ' history';
  }
  div.className = itemClass;

  // Build metadata text
  let metaText = '';
  const visitCount = item.visitCount || 0;
  const lastVisit = item.lastVisitTime || item.dateAdded || 0;

  if (visitCount > 0 && lastVisit) {
    const timeAgo = getTimeAgo(lastVisit);
    metaText = `${visitCount} visit${visitCount > 1 ? 's' : ''} • ${timeAgo}`;
  } else if (item.dateAdded) {
    const timeAgo = getTimeAgo(item.dateAdded);
    metaText = `Created ${timeAgo}`;
  }

  // Add badge for item type
  let badge = '';
  if (item.isBookmark && !item.isFolder) {
    badge = '<span class="badge bookmark-badge">⭐</span>';
  } else if (item.type === 'history') {
    badge = '<span class="badge history-badge">🕐</span>';
  }

  if (item.isFolder) {
    div.innerHTML = `
      <span class="folder-icon">📁</span>
      <div class="bookmark-content">
        <div class="bookmark-title">${escapeHtml(item.title)}</div>
        <div class="bookmark-url">${item.path ? escapeHtml(item.path) : 'Folder'}</div>
      </div>
      <div class="bookmark-meta">${metaText}</div>
      <button class="hide-button" title="Hide this folder">✕</button>
    `;

    const hideButton = div.querySelector('.hide-button');
    hideButton.addEventListener('click', (e) => {
      e.stopPropagation();
      hideItem(item.id);
    });

    div.addEventListener('click', () => {
      openFolder(item.id);
    });
  } else {
    const favicon = getFaviconUrl(item.url);

    div.innerHTML = `
      <img class="bookmark-favicon" src="${favicon}" alt="" onerror="this.style.display='none'">
      <div class="bookmark-content">
        <div class="bookmark-title">${badge}${escapeHtml(item.title)}</div>
        <div class="bookmark-url">${escapeHtml(item.url)}</div>
      </div>
      <div class="bookmark-meta">${metaText}</div>
      <button class="hide-button" title="Hide this item">✕</button>
    `;

    const hideButton = div.querySelector('.hide-button');
    hideButton.addEventListener('click', (e) => {
      e.stopPropagation();
      hideItem(item.url);
    });

    div.addEventListener('click', () => {
      chrome.tabs.create({ url: item.url });
      window.close();
    });
  }

  return div;
}

async function hideItem(itemId) {
  // Ask for confirmation
  if (!confirm('Are you sure you want to hide this item?\n\nYou can restore it later by clicking "Reset Settings".')) {
    return;
  }

  // Add to hidden items set
  hiddenItems.add(itemId);

  // Save to storage
  await chrome.storage.local.set({
    hiddenItems: Array.from(hiddenItems)
  });

  // Re-apply filters to remove the item from view
  applyFilters();
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

function applyFilters() {
  const searchQuery = document.getElementById('search').value.trim().toLowerCase();
  const showBookmarks = document.getElementById('filterBookmarks').checked;
  const showHistory = document.getElementById('filterHistory').checked;
  const showFrequent = document.getElementById('filterFrequent').checked;
  const showRecent = document.getElementById('filterRecent').checked;

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const FREQUENT_THRESHOLD = 10; // 10+ visits = frequent

  let filtered = allItems.filter(item => {
    // Filter out hidden items
    if (item.url && hiddenItems.has(item.url)) return false;
    if (item.id && hiddenItems.has(item.id)) return false; // For folders

    // Apply type filters
    if (item.isBookmark && !item.isFolder && !showBookmarks) return false;
    if (item.type === 'history' && !showHistory) return false;

    // Apply frequency/recency filters
    const visitCount = item.visitCount || 0;
    const lastVisit = item.lastVisitTime || item.dateAdded || 0;
    const daysSinceVisit = (Date.now() - lastVisit) / ONE_DAY;

    const isFrequent = visitCount >= FREQUENT_THRESHOLD;
    const isRecent = daysSinceVisit < 7; // Last 7 days

    // If filtering by frequent or recent
    if (!showFrequent && !showRecent) {
      // Both unchecked - show nothing that would need these filters
      if (!item.isFolder && visitCount === 0) return false;
    } else if (!showFrequent && showRecent) {
      // Only recent
      if (!item.isFolder && !isRecent) return false;
    } else if (showFrequent && !showRecent) {
      // Only frequent
      if (!item.isFolder && !isFrequent) return false;
    }
    // If both checked, show all (no additional filtering)

    // Apply search query
    if (searchQuery) {
      return (
        item.title.toLowerCase().includes(searchQuery) ||
        (item.url && item.url.toLowerCase().includes(searchQuery)) ||
        (item.path && item.path.toLowerCase().includes(searchQuery))
      );
    }

    return true;
  });

  // Pass the filter states to sorting so it knows which scoring components to use
  sortAndDisplayItems(filtered, showFrequent, showRecent);
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
