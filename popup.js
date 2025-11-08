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
    saveSearchState();
    applyFilters();
  });

  // Filter checkboxes
  const filterCheckboxes = [
    'filterBookmarks',
    'filterHistory',
    'filterFrequent',
    'filterRecent',
    'filterTimeOfDay',
    'groupByTitle',
    'groupByNone',
    'groupByPath',
    'groupByDomain'
  ];

  filterCheckboxes.forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        // Radio buttons handle mutual exclusion automatically
        saveFilterStates();
        applyFilters();
      });
    }
  });

  // Time window dropdown
  const timeWindowSelect = document.getElementById('timeWindow');
  if (timeWindowSelect) {
    timeWindowSelect.addEventListener('change', () => {
      saveFilterStates();
      applyFilters();
    });
  }

  // Settings button
  const settingsButton = document.getElementById('settingsButton');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');

  settingsButton.addEventListener('click', () => {
    settingsModal.classList.add('show');
    loadIgnoredItems();
  });

  closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('show');
  });

  // Close modal when clicking outside
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('show');
    }
  });

  // Unignore all button
  const unignoreAllButton = document.getElementById('unignoreAll');
  unignoreAllButton.addEventListener('click', async () => {
    if (confirm('Are you sure you want to unignore all items?')) {
      hiddenItems.clear();
      await chrome.storage.local.set({ hiddenItems: [] });
      loadIgnoredItems();
      applyFilters();
    }
  });

  // Ignored items search
  const ignoredSearch = document.getElementById('ignoredSearch');
  ignoredSearch.addEventListener('input', () => {
    loadIgnoredItems(ignoredSearch.value);
  });
}

async function saveFilterStates() {
  const filterStates = {
    bookmarks: document.getElementById('filterBookmarks').checked,
    history: document.getElementById('filterHistory').checked,
    sortByFrequent: document.getElementById('filterFrequent').checked,
    sortByRecent: document.getElementById('filterRecent').checked,
    timeOfDay: document.getElementById('filterTimeOfDay').checked,
    timeWindow: document.getElementById('timeWindow').value,
    groupByTitle: document.getElementById('groupByTitle').checked,
    groupByNone: document.getElementById('groupByNone').checked,
    groupByPath: document.getElementById('groupByPath').checked,
    groupByDomain: document.getElementById('groupByDomain').checked
  };

  await chrome.storage.local.set({ filterStates });
}

async function saveSearchState() {
  const searchQuery = document.getElementById('search').value;
  await chrome.storage.local.set({ searchQuery });
}

function loadIgnoredItems(searchFilter = '') {
  const ignoredItemsList = document.getElementById('ignoredItemsList');
  const unignoreAllButton = document.getElementById('unignoreAll');

  if (hiddenItems.size === 0) {
    ignoredItemsList.innerHTML = '<div class="empty-message">No ignored items</div>';
    unignoreAllButton.disabled = true;
    return;
  }

  unignoreAllButton.disabled = false;
  ignoredItemsList.innerHTML = '';

  // Convert Set to array and sort
  const sortedItems = Array.from(hiddenItems).sort();

  // Filter items based on search query
  const searchLower = searchFilter.toLowerCase();
  const filteredItems = sortedItems.filter(item => {
    const itemText = item.startsWith('domain:') ? item.substring(7) : item;
    return itemText.toLowerCase().includes(searchLower);
  });

  if (filteredItems.length === 0) {
    ignoredItemsList.innerHTML = '<div class="empty-message">No matching ignored items</div>';
    return;
  }

  filteredItems.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'ignored-item';

    // Determine item type and display text
    let itemText = item;
    let itemType = 'URL';

    if (item.startsWith('domain:')) {
      itemText = item.substring(7); // Remove 'domain:' prefix
      itemType = 'Domain';
    }

    itemDiv.innerHTML = `
      <div class="ignored-item-text" title="${escapeHtml(itemText)}">${escapeHtml(itemText)}</div>
      <span class="ignored-item-type">${itemType}</span>
      <button class="unignore-button">Unignore</button>
    `;

    const unignoreButton = itemDiv.querySelector('.unignore-button');
    unignoreButton.addEventListener('click', async () => {
      hiddenItems.delete(item);
      await chrome.storage.local.set({ hiddenItems: Array.from(hiddenItems) });
      const currentSearch = document.getElementById('ignoredSearch').value;
      loadIgnoredItems(currentSearch);
      applyFilters();
    });

    ignoredItemsList.appendChild(itemDiv);
  });
}

async function loadData() {
  try {
    // Load hidden items, filter states, and search query
    const result = await chrome.storage.local.get(['hiddenItems', 'filterStates', 'searchQuery']);
    hiddenItems = new Set(result.hiddenItems || []);

    // Restore filter checkbox states
    if (result.filterStates) {
      document.getElementById('filterBookmarks').checked = result.filterStates.bookmarks ?? true;
      document.getElementById('filterHistory').checked = result.filterStates.history ?? true;
      document.getElementById('filterFrequent').checked = result.filterStates.sortByFrequent ?? true;
      document.getElementById('filterRecent').checked = result.filterStates.sortByRecent ?? false;
      document.getElementById('filterTimeOfDay').checked = result.filterStates.timeOfDay ?? false;
      document.getElementById('timeWindow').value = result.filterStates.timeWindow ?? '1';
      document.getElementById('groupByTitle').checked = result.filterStates.groupByTitle ?? false;
      document.getElementById('groupByNone').checked = result.filterStates.groupByNone ?? true;
      document.getElementById('groupByPath').checked = result.filterStates.groupByPath ?? false;
      document.getElementById('groupByDomain').checked = result.filterStates.groupByDomain ?? false;
    }

    // Restore search query
    if (result.searchQuery) {
      document.getElementById('search').value = result.searchQuery;
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
        lastVisitTime: historyItem?.lastVisitTime || bookmark.dateAdded,
        visits: historyItem?.visits || []
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
        lastVisitTime: historyItem.lastVisitTime,
        visits: historyItem.visits || []
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

function calculateScores(item) {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Folders get minimal scores (sort to bottom)
  if (item.isFolder) {
    return { frequencyScore: 0, recencyScore: 0 };
  }

  // Visit frequency score (0-100 points)
  const visitCount = item.visitCount || 0;
  const frequencyScore = Math.min(100, visitCount * 2); // 2 points per visit, max 100

  // Recency score (0-100 points)
  const lastVisit = item.lastVisitTime || item.dateAdded || 0;
  const daysSinceVisit = (now - lastVisit) / ONE_DAY;
  let recencyScore = 0;
  if (daysSinceVisit < 1) recencyScore = 100;
  else if (daysSinceVisit < 7) recencyScore = 80;
  else if (daysSinceVisit < 30) recencyScore = 60;
  else if (daysSinceVisit < 90) recencyScore = 40;
  else if (daysSinceVisit < 180) recencyScore = 20;
  else recencyScore = 10;

  return { frequencyScore, recencyScore };
}

// Check if item matches current time of day (±N hour window based on selection)
function matchesCurrentTimeOfDay(item) {
  if (!item.visits || item.visits.length === 0) {
    return false;
  }

  // Get selected time window in hours
  const timeWindowHours = parseInt(document.getElementById('timeWindow')?.value || '1');
  const timeWindowMinutes = timeWindowHours * 60;

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Count visits within ±N hours of current time
  let matchingVisits = 0;
  item.visits.forEach(visit => {
    const visitDate = new Date(visit.visitTime);
    const visitHour = visitDate.getHours();
    const visitMinute = visitDate.getMinutes();
    const visitTimeInMinutes = visitHour * 60 + visitMinute;

    // Check if within ±N hours (with wrap-around for midnight)
    const diff = Math.abs(currentTimeInMinutes - visitTimeInMinutes);
    const wrapDiff = 1440 - diff; // 1440 = 24 hours in minutes
    const minDiff = Math.min(diff, wrapDiff);

    if (minDiff <= timeWindowMinutes) {
      matchingVisits++;
    }
  });

  // Consider it a match if at least 1 visit or 20% of visits were around this time
  return matchingVisits >= 1 || (matchingVisits / item.visits.length) >= 0.2;
}

// Get the minimum time difference in minutes for an item's visits from current time
function getMinTimeDifference(item) {
  if (!item.visits || item.visits.length === 0) {
    return Infinity;
  }

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  let minDiff = Infinity;
  item.visits.forEach(visit => {
    const visitDate = new Date(visit.visitTime);
    const visitHour = visitDate.getHours();
    const visitMinute = visitDate.getMinutes();
    const visitTimeInMinutes = visitHour * 60 + visitMinute;

    // Check with wrap-around for midnight
    const diff = Math.abs(currentTimeInMinutes - visitTimeInMinutes);
    const wrapDiff = 1440 - diff; // 1440 = 24 hours in minutes
    const timeDiff = Math.min(diff, wrapDiff);

    if (timeDiff < minDiff) {
      minDiff = timeDiff;
    }
  });

  return minDiff;
}

// Format time difference for display
function formatTimeDifference(minutes) {
  if (minutes === 0) {
    return 'now';
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours > 0) {
    // Don't show minutes when we have hours
    return `~${hours}h`;
  }
  return `~${mins}m`;
}

function sortAndDisplayItems(items, primarySortByFrequent = true) {
  // Calculate scores for all items
  items.forEach(item => {
    const scores = calculateScores(item);
    item.frequencyScore = scores.frequencyScore;
    item.recencyScore = scores.recencyScore;
  });

  // Sort with primary and secondary criteria
  const sorted = items.sort((a, b) => {
    // Folders go to bottom
    if (a.isFolder && !b.isFolder) return 1;
    if (b.isFolder && !a.isFolder) return -1;

    // Primary sort criterion
    const aPrimary = primarySortByFrequent ? a.frequencyScore : a.recencyScore;
    const bPrimary = primarySortByFrequent ? b.frequencyScore : b.recencyScore;

    if (bPrimary !== aPrimary) {
      return bPrimary - aPrimary;
    }

    // Secondary sort criterion (the opposite of primary)
    const aSecondary = primarySortByFrequent ? a.recencyScore : a.frequencyScore;
    const bSecondary = primarySortByFrequent ? b.recencyScore : b.frequencyScore;

    if (bSecondary !== aSecondary) {
      return bSecondary - aSecondary;
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

  // Check if grouping is enabled
  const groupByDomain = document.getElementById('groupByDomain')?.checked || false;
  const groupByPath = document.getElementById('groupByPath')?.checked || false;
  const groupByTitle = document.getElementById('groupByTitle')?.checked || false;

  if (groupByDomain || groupByPath || groupByTitle) {
    // Group items by domain, path, or title
    const groups = new Map();

    items.forEach(item => {
      if (item.isFolder) {
        // Folders go to a special group
        if (!groups.has('_folders')) {
          groups.set('_folders', []);
        }
        groups.get('_folders').push(item);
      } else if (item.url || item.title) {
        let groupKey;
        if (groupByTitle) {
          groupKey = item.title || 'Untitled';
        } else if (groupByPath) {
          groupKey = getPathWithoutQuery(item.url);
        } else {
          groupKey = getDomain(item.url);
        }

        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey).push(item);
      }
    });

    // Display groups
    groups.forEach((groupItems, groupKey) => {
      if (groupKey === '_folders') {
        groupItems.forEach(item => {
          const element = createItemElement(item);
          container.appendChild(element);
        });
      } else {
        // If time-of-day highlighting is enabled, prioritize items with smallest time difference
        const showTimeOfDay = document.getElementById('filterTimeOfDay')?.checked || false;
        if (showTimeOfDay) {
          // Sort by minimum time difference (smallest first)
          groupItems.sort((a, b) => {
            const aMinDiff = getMinTimeDifference(a);
            const bMinDiff = getMinTimeDifference(b);
            return aMinDiff - bMinDiff;
          });
        }

        // Only show the top item (first item = highest score or time match)
        const topItem = groupItems[0];
        const otherCount = groupItems.length - 1;

        // Create header with expand/collapse functionality
        const header = document.createElement('div');
        header.className = 'domain-header';
        let icon = '🌐';
        if (groupByTitle) {
          icon = '📝';
        } else if (groupByPath) {
          icon = '🔗';
        }
        header.innerHTML = `
          <span class="domain-name">${icon} ${escapeHtml(groupKey)}</span>
          <span class="domain-count">${otherCount > 0 ? `+${otherCount} more` : ''}</span>
          <span class="expand-icon">${otherCount > 0 ? '▼' : ''}</span>
          <button class="group-hide-button" title="Hide this group">✕</button>
        `;

        // Add hide button functionality for the group
        const groupHideButton = header.querySelector('.group-hide-button');
        groupHideButton.addEventListener('click', async (e) => {
          e.stopPropagation();
          const message = `Are you sure you want to hide all items in this group?\n\nYou can restore them later by clicking "Settings".`;
          if (confirm(message)) {
            // Hide all items in this group
            groupItems.forEach(item => {
              if (item.url) {
                hiddenItems.add(item.url);
              } else if (item.id) {
                hiddenItems.add(item.id);
              }
            });
            // Save to storage
            await chrome.storage.local.set({
              hiddenItems: Array.from(hiddenItems)
            });
            // Re-apply filters to remove the items from view
            applyFilters();
          }
        });

        // Create collapsible container for all items
        const groupContainer = document.createElement('div');
        groupContainer.className = 'domain-group';

        // Add top item
        const topElement = createItemElement(topItem);
        topElement.classList.add('top-item');
        groupContainer.appendChild(topElement);

        // Add other items (collapsed by default)
        if (otherCount > 0) {
          const otherItemsContainer = document.createElement('div');
          otherItemsContainer.className = 'other-items collapsed';

          groupItems.slice(1).forEach(item => {
            const element = createItemElement(item);
            element.classList.add('other-item');
            otherItemsContainer.appendChild(element);
          });

          groupContainer.appendChild(otherItemsContainer);

          // Toggle expansion on header click
          header.style.cursor = 'pointer';
          header.addEventListener('click', () => {
            const isCollapsed = otherItemsContainer.classList.contains('collapsed');
            otherItemsContainer.classList.toggle('collapsed');
            const expandIcon = header.querySelector('.expand-icon');
            expandIcon.textContent = isCollapsed ? '▲' : '▼';
          });
        }

        container.appendChild(header);
        container.appendChild(groupContainer);
      }
    });
  } else {
    // Normal ungrouped display
    items.forEach(item => {
      const element = createItemElement(item);
      container.appendChild(element);
    });
  }
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
  const showTimeOfDay = document.getElementById('filterTimeOfDay')?.checked || false;
  const isTimeMatch = showTimeOfDay && matchesCurrentTimeOfDay(item);

  if (visitCount > 0 && lastVisit) {
    const timeAgo = getTimeAgo(lastVisit);
    const visitTime = formatVisitTime(lastVisit);

    // Calculate time difference and add it if time-of-day is enabled
    let timeDisplay = visitTime;
    if (showTimeOfDay) {
      const minDiff = getMinTimeDifference(item);
      if (minDiff !== Infinity) {
        const diffText = formatTimeDifference(minDiff);
        if (isTimeMatch) {
          timeDisplay = `<strong>${visitTime} (${diffText})</strong>`;
        } else {
          timeDisplay = `${visitTime} (${diffText})`;
        }
      }
    } else if (isTimeMatch) {
      timeDisplay = `<strong>${visitTime}</strong>`;
    }

    metaText = `${visitCount} visit${visitCount > 1 ? 's' : ''} • ${timeAgo} • ${timeDisplay}`;
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
    const domain = getDomain(item.url);

    div.innerHTML = `
      <img class="bookmark-favicon" src="${favicon}" alt="" onerror="this.style.display='none'">
      <div class="bookmark-content">
        <div class="bookmark-title">${badge}${escapeHtml(item.title)}</div>
        <div class="bookmark-url">${escapeHtml(item.url)}</div>
        <div class="bookmark-meta">${metaText}</div>
      </div>
      <div class="hide-menu">
        <button class="hide-button" title="Hide options">✕</button>
        <div class="hide-dropdown">
          <div class="hide-option" data-type="url">Hide this URL</div>
          <div class="hide-option" data-type="domain">Hide all from ${escapeHtml(domain)}</div>
        </div>
      </div>
    `;

    const hideMenu = div.querySelector('.hide-menu');
    const hideButton = div.querySelector('.hide-button');
    const hideDropdown = div.querySelector('.hide-dropdown');
    const hideOptions = div.querySelectorAll('.hide-option');

    hideButton.addEventListener('click', (e) => {
      e.stopPropagation();
      hideDropdown.classList.toggle('show');
    });

    hideOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = option.dataset.type;
        if (type === 'url') {
          hideItem(item.url, 'url');
        } else if (type === 'domain') {
          hideItem(domain, 'domain');
        }
        hideDropdown.classList.remove('show');
      });
    });

    div.addEventListener('click', (e) => {
      if (!hideMenu.contains(e.target)) {
        chrome.tabs.create({ url: item.url });
        window.close();
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      hideDropdown.classList.remove('show');
    });
  }

  return div;
}

async function hideItem(itemId, type = 'url') {
  // Ask for confirmation
  const message = type === 'domain'
    ? `Are you sure you want to hide all items from this domain?\n\nYou can restore them later by clicking "Settings".`
    : `Are you sure you want to hide this item?\n\nYou can restore it later by clicking "Settings".`;

  if (!confirm(message)) {
    return;
  }

  // Add to hidden items set with type prefix
  const hiddenKey = type === 'domain' ? `domain:${itemId}` : itemId;
  hiddenItems.add(hiddenKey);

  // Save to storage
  await chrome.storage.local.set({
    hiddenItems: Array.from(hiddenItems)
  });

  // Re-apply filters to remove the item from view
  applyFilters();
}

function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

function getPathWithoutQuery(url) {
  try {
    const urlObj = new URL(url);
    // Return domain + pathname (without query string or hash)
    return urlObj.hostname + urlObj.pathname;
  } catch {
    return url;
  }
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
  const sortByFrequent = document.getElementById('filterFrequent').checked;

  let filtered = allItems.filter(item => {
    // Filter out hidden items (URL, folder, or domain)
    if (item.url && hiddenItems.has(item.url)) return false;
    if (item.id && hiddenItems.has(item.id)) return false; // For folders

    // Check if domain is hidden
    if (item.url) {
      const domain = getDomain(item.url);
      if (hiddenItems.has(`domain:${domain}`)) return false;
    }

    // Apply type filters
    if (item.isBookmark && !item.isFolder && !showBookmarks) return false;
    if (item.type === 'history' && !showHistory) return false;

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

  // Sort items with the selected primary sort criterion
  // If sortByFrequent is true, sort by frequency first (then recency)
  // If sortByFrequent is false (sortByRecent), sort by recency first (then frequency)
  sortAndDisplayItems(filtered, sortByFrequent);
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

function formatVisitTime(timestamp) {
  const date = new Date(timestamp);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutesStr} ${ampm}`;
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
