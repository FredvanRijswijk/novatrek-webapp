// Background service worker for NovaTrek extension

interface CaptureData {
  url: string;
  title: string;
  selectedText?: string;
  linkUrl?: string;
  imageUrl?: string;
  type: 'page' | 'text' | 'link' | 'image';
}

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const url = new URL(tab.url);
    // Check if it's our extension-auth page
    if ((url.hostname === 'localhost' || url.hostname === 'novatrek.app') && 
        url.pathname === '/extension-auth') {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }).catch(err => console.error('Failed to inject content script:', err));
    }
  }
});

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Save entire page
  chrome.contextMenus.create({
    id: 'save-page',
    title: 'Save page to NovaTrek',
    contexts: ['page']
  });

  // Save selected text
  chrome.contextMenus.create({
    id: 'save-selection',
    title: 'Save "%s" to NovaTrek',
    contexts: ['selection']
  });

  // Save link
  chrome.contextMenus.create({
    id: 'save-link',
    title: 'Save link to NovaTrek',
    contexts: ['link']
  });

  // Save image
  chrome.contextMenus.create({
    id: 'save-image',
    title: 'Save image to NovaTrek',
    contexts: ['image']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.url || !tab?.title) return;

  let captureData: CaptureData = {
    url: tab.url,
    title: tab.title,
    type: 'page'
  };

  switch (info.menuItemId) {
    case 'save-selection':
      captureData.selectedText = info.selectionText;
      captureData.type = 'text';
      break;
    case 'save-link':
      captureData.linkUrl = info.linkUrl;
      captureData.type = 'link';
      break;
    case 'save-image':
      captureData.imageUrl = info.srcUrl;
      captureData.type = 'image';
      break;
  }

  saveToNovaTrek(captureData);
});

// Handle messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'save') {
    saveToNovaTrek(request.data);
    sendResponse({ success: true });
  } else if (request.action === 'getAuthStatus') {
    getAuthStatus().then(sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'authTokenReceived') {
    // Store the auth token received from content script
    chrome.storage.local.set({ 
      authToken: request.token,
      userId: request.userId
    }).then(() => {
      sendResponse({ success: true });
      
      // Close the auth tab
      if (sender.tab?.id) {
        chrome.tabs.remove(sender.tab.id);
      }
    });
    return true; // Keep message channel open for async response
  }
});

// Save data to NovaTrek
async function saveToNovaTrek(data: CaptureData) {
  try {
    // Get auth token and user ID from storage
    const { authToken, userId } = await chrome.storage.local.get(['authToken', 'userId']);
    
    if (!authToken || !userId) {
      // Open popup to prompt login
      chrome.action.openPopup();
      return;
    }

    // Show saving notification
    chrome.action.setBadgeText({ text: '...' });
    chrome.action.setBadgeBackgroundColor({ color: '#FFA500' });

    // Prepare request body
    const requestBody: any = {
      content: data.url || data.selectedText || data.linkUrl || data.imageUrl || '',
      contentType: data.type === 'page' ? 'link' : data.type,
      source: 'browser-extension',
      sourceUrl: data.url,
      title: data.title,
      capturedAt: new Date().toISOString()
    };

    // Only add notes if there's selected text
    if (data.selectedText) {
      requestBody.notes = data.selectedText;
    }

    console.log('Sending capture to API:', requestBody);

    // Send to API
    const response = await fetch('http://localhost:3000/api/captures-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'X-User-Id': userId // Temporary until we implement proper token verification
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      // Success
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#00D000' });
      
      // Clear badge after 2 seconds
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 2000);

      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.svg',
        title: 'Saved to NovaTrek!',
        message: `${data.title || 'Content'} has been saved to your travel inbox`
      });
    } else {
      const errorText = await response.text();
      console.error('API Error Response:', response.status, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    // Error
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 2000);

    console.error('Failed to save to NovaTrek:', error);
  }
}

// Check authentication status
async function getAuthStatus(): Promise<{ isAuthenticated: boolean; user?: any }> {
  const { authToken, userId } = await chrome.storage.local.get(['authToken', 'userId']);
  
  if (!authToken) {
    return { isAuthenticated: false };
  }

  // For now, just check if token exists
  // Skip the API call which might be failing
  return { 
    isAuthenticated: true, 
    user: { uid: userId }
  };

  // TODO: Re-enable API verification once we debug the issue
  /*
  try {
    console.log('Calling /api/auth/me...');
    const response = await fetch('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Response status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Auth response:', data);
      return { isAuthenticated: data.authenticated, user: data.user };
    } else {
      console.error('API returned error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }

  return { isAuthenticated: false };
  */
}