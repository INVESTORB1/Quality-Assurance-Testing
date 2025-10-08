// Central API base URL for the frontend. Hosts can override by setting window.API_BASE
// Example for deployed site: <script>window.API_BASE = 'https://your-backend.onrender.com';</script>
(function () {
  // If window.API_BASE already set by the hosting page, keep it. Otherwise default to the deployed backend
  // Updated to point at the Render deployment provided by the user.
  if (!window.API_BASE) {
    window.API_BASE = 'https://quality-assurance-testing.onrender.com';
  }
})();
