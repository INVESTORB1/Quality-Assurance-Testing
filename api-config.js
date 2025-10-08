// Central API base URL for the frontend. Hosts can override by setting window.API_BASE
// This script chooses a sensible default: if you're viewing the page from localhost or file://
// it uses the local backend (http://localhost:4000). Otherwise it defaults to the deployed
// Render backend. You can still override by setting window.API_BASE before this script runs.
(function () {
  if (window.API_BASE) return;
  try {
    const host = (typeof location !== 'undefined' && location.hostname) ? location.hostname : '';
    const proto = (typeof location !== 'undefined' && location.protocol) ? location.protocol : '';
    if (host === 'localhost' || host === '127.0.0.1' || proto === 'file:') {
      window.API_BASE = 'http://localhost:4000';
    } else {
      window.API_BASE = 'https://quality-assurance-testing.onrender.com';
    }
  } catch (err) {
    // fallback to deployed backend
    window.API_BASE = 'https://quality-assurance-testing.onrender.com';
  }
})();
