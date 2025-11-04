// Background script to track bookmark usage

// Listen for bookmark clicks/visits
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await updateBookmarkUsage(tab.url);
  }
});

// Also track when bookmarks are opened from bookmark manager
chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
  if (bookmark.url) {
    await updateBookmarkUsage(bookmark.url);
  }
});

async function updateBookmarkUsage(url) {
  try {
    // Search for bookmark with this URL
    const bookmarks = await chrome.bookmarks.search({ url: url });

    if (bookmarks.length > 0) {
      // Get current usage data
      const result = await chrome.storage.local.get('bookmarkUsage');
      const bookmarkUsage = result.bookmarkUsage || {};

      // Update usage for all matching bookmarks (there could be duplicates)
      for (const bookmark of bookmarks) {
        bookmarkUsage[bookmark.id] = {
          id: bookmark.id,
          lastUsed: Date.now(),
          useCount: (bookmarkUsage[bookmark.id]?.useCount || 0) + 1
        };

        // Also update parent folders
        await updateFolderUsage(bookmark.parentId, bookmarkUsage);
      }

      // Save updated usage data
      await chrome.storage.local.set({ bookmarkUsage });
    }
  } catch (error) {
    console.error('Error updating bookmark usage:', error);
  }
}

async function updateFolderUsage(folderId, bookmarkUsage) {
  if (!folderId || folderId === '0') return;

  try {
    const folder = await chrome.bookmarks.get(folderId);
    if (folder && folder[0]) {
      bookmarkUsage[folderId] = {
        id: folderId,
        lastUsed: Date.now(),
        useCount: (bookmarkUsage[folderId]?.useCount || 0) + 1
      };

      // Recursively update parent folders
      if (folder[0].parentId) {
        await updateFolderUsage(folder[0].parentId, bookmarkUsage);
      }
    }
  } catch (error) {
    console.error('Error updating folder usage:', error);
  }
}

// Function to get last visit time from browser history
async function getLastVisitFromHistory(url) {
  try {
    const visits = await chrome.history.getVisits({ url: url });
    if (visits && visits.length > 0) {
      // Sort by visit time descending and get the most recent
      visits.sort((a, b) => b.visitTime - a.visitTime);
      return visits[0].visitTime;
    }
  } catch (error) {
    console.error('Error getting history for URL:', url, error);
  }
  return null;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'clearHistory') {
    chrome.storage.local.remove('bookmarkUsage', () => {
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'getHistoryData') {
    // Get history data for a bookmark URL
    getLastVisitFromHistory(request.url).then(lastVisit => {
      sendResponse({ lastVisit });
    });
    return true;
  }
});
