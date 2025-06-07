// Content script - runs on web pages

// Listen for auth token from NovaTrek app
if (window.location.hostname === 'localhost' || window.location.hostname === 'novatrek.app') {
  // Check if we're on the extension auth callback page
  if (window.location.pathname === '/extension-auth') {
    let tokenFound = false;
    
    // Wait for the token to be available
    const checkForToken = setInterval(() => {
      const tokenElement = document.getElementById('extension-auth-token');
      
      if (tokenElement && tokenElement.dataset.token) {
        if (tokenFound) return; // Prevent multiple sends
        tokenFound = true;
        
        clearInterval(checkForToken);
        
        // Extract user info from the page
        const userId = tokenElement.dataset.userId || 'demo-user';
        
        // Send token to extension
        chrome.runtime.sendMessage({
          action: 'authTokenReceived',
          token: tokenElement.dataset.token,
          userId: userId
        });
        
        // Store in extension storage
        chrome.storage.local.set({ 
          authToken: tokenElement.dataset.token,
          userId: userId
        });
        
        // Close this tab after a short delay
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    }, 100);
    
    // Stop checking after 10 seconds
    setTimeout(() => {
      clearInterval(checkForToken);
    }, 10000);
  }
}

// Add floating save button for travel-related content
function detectTravelContent() {
  const pageText = document.body.innerText.toLowerCase();
  const travelKeywords = [
    'hotel', 'restaurant', 'flight', 'travel', 'vacation',
    'trip', 'tourism', 'booking', 'airbnb', 'hostel',
    'attraction', 'museum', 'beach', 'mountain', 'city guide'
  ];
  
  const isTravelContent = travelKeywords.some(keyword => pageText.includes(keyword));
  
  if (isTravelContent) {
    addFloatingSaveButton();
  }
}

// Add floating save button
function addFloatingSaveButton() {
  // Check if button already exists
  if (document.getElementById('novatrek-save-button')) return;
  
  const button = document.createElement('button');
  button.id = 'novatrek-save-button';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
    Save to NovaTrek
  `;
  
  // Style the button
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    background: #000;
    color: white;
    border: none;
    border-radius: 24px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: all 0.2s;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  `;
  
  // Hover effect
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  });
  
  // Click handler
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'save',
      data: {
        url: window.location.href,
        title: document.title,
        type: 'page'
      }
    });
    
    // Visual feedback
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Saved!
    `;
    button.style.background = '#00d000';
    
    // Remove button after 2 seconds
    setTimeout(() => {
      button.remove();
    }, 2000);
  });
  
  document.body.appendChild(button);
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', detectTravelContent);
} else {
  detectTravelContent();
}

// Listen for text selection
let selectionTimeout: number;
document.addEventListener('mouseup', () => {
  clearTimeout(selectionTimeout);
  selectionTimeout = window.setTimeout(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 10) {
      // User selected text, could show a mini save button
      console.log('Text selected:', selection.toString());
    }
  }, 500);
});