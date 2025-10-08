Quick notes — configuring frontend to call deployed backend

The frontend uses a single variable `window.API_BASE` to determine the backend base URL. By default (for local development) it falls back to `http://localhost:4000`.

How to point the live site to your deployed backend:

1) If you deploy the static site (GitHub Pages, Netlify, or similar), set `window.API_BASE` in the HTML pages before any script that calls the API. The easiest way is to edit `index.html` (and other HTML pages) to include a small inline script in the <head> or right after <body>:

<script>
  window.API_BASE = 'https://your-backend.onrender.com';
</script>

This ensures every page has the correct base URL. You can also set the same script in each HTML page or inject it in your CI build.

2) Alternatively, update `api-config.js` to return the deployed URL instead of the localhost fallback. Example:

(function () {
  window.API_BASE = 'https://your-backend.onrender.com';
})();

3) After deploying the backend (e.g., to Render), create the service and set `MONGODB_URI` and `MONGODB_DB` in the service environment variables.

4) Test the live site: open the deployed frontend and perform an action (signup or send message) then check the backend logs or Atlas collections to confirm documents are created.

Security note: Do not commit any secrets (connection strings) to the repository. Set them as env vars in your hosting provider.
