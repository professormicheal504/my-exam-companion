/* Custom Toast Notification to replace native alert() */
function showToast(message, type = 'success') {
  // Create container if it doesn't exist
  let container = document.getElementById('mec-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'mec-toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Create the toast element
  const toast = document.createElement('div');
  const isError = type === 'error' || message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid');
  
  // Theme styling (MEC theme)
  const bgColor = isError ? '#fef2f2' : '#131212';
  const textColor = isError ? '#2563eb' : '#ffffff';
  const borderColor = isError ? '#fca5a5' : '#374151';
  const icon = isError 
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

  toast.style.cssText = `
    background: ${bgColor};
    color: ${textColor};
    border: 1px solid ${borderColor};
    padding: 14px 20px;
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 12px;
    transform: translateX(120%);
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease;
    pointer-events: auto;
    max-width: 350px;
  `;

  toast.innerHTML = `
    <div style="flex-shrink: 0; display: flex; align-items: center;">${icon}</div>
    <div style="line-height: 1.4;">${message}</div>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 400);
  }, 4000);
}

// Override native alert globally!
window.alert = function(message) {
  showToast(message);
};
