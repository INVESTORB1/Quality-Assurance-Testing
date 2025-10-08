# Backend (QA Testing)

This backend uses simple file-based JSON storage by default. It can optionally use MongoDB when `MONGODB_URI` is set.

Quick start

1. Install dependencies

   npm install

2. (Optional) Create `.env` from `.env.example` and set `MONGODB_URI` (and `MONGODB_DB` if you want a custom DB name).

3. Start the server

   npm start

Notes on MongoDB

- If `MONGODB_URI` is set, the app will connect to MongoDB and use three collections: `users`, `messages`, `interactions`.
- If the Mongo connection fails, the server will still start and use the local JSON files (`users.json`, `messages.json`, `interactions.json`).

Deploying to MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user and whitelist your IP (or allow access from anywhere for testing)
3. Copy the connection string and place it in `.env` as `MONGODB_URI`