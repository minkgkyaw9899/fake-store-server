# 🛍️ FakeStore Mock API (Express + TypeScript)

A lightweight mock REST API server built for React Native or frontend testing.  
It provides endpoints for **Products**, **Users**, and **Authentication** — including image uploads, pagination, and JWT security.

---

## 📚 Table of Contents

- [🛍️ FakeStore Mock API (Express + TypeScript)](#️-fakestore-mock-api-express--typescript)
  - [📚 Table of Contents](#-table-of-contents)
  - [⚙️ Setup](#️-setup)
    - [1️⃣ Requirements](#1️⃣-requirements)
    - [2️⃣ Install dependencies](#2️⃣-install-dependencies)
    - [3️⃣ Start the server](#3️⃣-start-the-server)
  - [✨ Features](#-features)
  - [🛣️ API Routes](#️-api-routes)
    - [🔑 Auth Routes](#-auth-routes)
    - [🛍️ Product Routes](#️-product-routes)
    - [👥 User Routes](#-user-routes)
  - [📝 Notes](#-notes)

---

## ⚙️ Setup

### 1️⃣ Requirements

- **Node.js ≥ v22.0.0** (this project uses ES modules + `--experimental-strip-types`)
- npm or yarn package manager

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Start the server

```bash
npm start
```

You should see something like:

```
Server running on http://localhost:8000 || http://192.168.x.x:8000
```

> 💡 Use the **local IP** for testing from a React Native app on your phone.

---

## ✨ Features

✅ **JWT Authentication** — login & protect routes  
✅ **CRUD for Products and Users**  
✅ **Category-based filtering & pagination**  
✅ **Image uploads** via `multer`  
✅ **Auto reset database** from `backup.json` on startup  
✅ **Local IP auto-detection** for device testing  
✅ **Clean, formatted JSON responses**  
✅ **Simple, no external DB needed (JSON file based)**

---

## 🛣️ API Routes

### 🔑 Auth Routes

| Method | Endpoint          | Description                                  | Auth |
| ------ | ----------------- | -------------------------------------------- | ---- |
| `POST` | `/api/auth/login` | Login with username + password (returns JWT) | ❌   |

---

### 🛍️ Product Routes

| Method   | Endpoint                           | Description                                | Auth |
| -------- | ---------------------------------- | ------------------------------------------ | ---- |
| `GET`    | `/api/products`                    | Get paginated product list                 | ✅   |
| `POST`   | `/api/products`                    | Create new product (supports image upload) | ✅   |
| `GET`    | `/api/products/:id`                | Get product by ID                          | ✅   |
| `PATCH`  | `/api/products/:id`                | Update product by ID                       | ✅   |
| `DELETE` | `/api/products/:id`                | Delete product                             | ✅   |
| `GET`    | `/api/products/categories`         | Get all categories                         | ✅   |
| `GET`    | `/api/products/category/:category` | Get products by category                   | ✅   |

---

### 👥 User Routes

| Method   | Endpoint         | Description         | Auth |
| -------- | ---------------- | ------------------- | ---- |
| `GET`    | `/api/users`     | Get paginated users | ✅   |
| `POST`   | `/api/users`     | Create a new user   | ❌   |
| `GET`    | `/api/users/:id` | Get user by ID      | ✅   |
| `PATCH`  | `/api/users/:id` | Update user info    | ✅   |
| `DELETE` | `/api/users/:id` | Delete user         | ✅   |

---

## 📝 Notes

- 🧩 Requires **Node v22.0.0 or later** due to `--experimental-strip-types`
- 🖼️ Uploaded images are stored in `/public/images`
- 📦 Data is saved to `db/db.json`
- 🔄 On startup, `db.json` resets from `backup.json`
- 🔐 Default JWT Secret: `"superSecretK3y"`
- 🧠 Response format:
  ```json
  {
  "meta": { "status": 200, "message": "Success" },
  "data": { ... }
  }
  ```

---
