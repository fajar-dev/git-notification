# Git Notification for Google Chat

A lightweight webhook bridge built with **Bun** and **Hono** to send GitHub and BitBucket push notifications to specific Google Chat spaces based on a query parameter.

## ✨ Features

- **Multi-Space Support**: Route notifications to different Google Chat spaces using the `?space=` query parameter.
- **GitHub Integration**: Supports push events with repository details, branch info, and commit data.
- **BitBucket Integration**: Supports push events with workspace, project, and commit hash.
- **Rich Card Notifications**: Sends structured cards with clickable links and highlighted information.

---

## 🚀 Setup & Installation

### 1. Prerequisites
- [Bun](https://bun.sh/) runtime installed.

### 2. Install Dependencies
```bash
bun install
```

### 3. Configure Environment
Create a `.env` file in the root directory and add your Google Chat Webhook URLs:

```env
PORT=4000

# Default space (fallback)
GOOGLE_CHAT_WEBHOOK=https://chat.googleapis.com/v1/spaces/...

# Business space (space=bis)
BIS_GOOGLE_CHAT_WEBHOOK=https://chat.googleapis.com/v1/spaces/...

# HRIS space (space=hris)
HRIS_GOOGLE_CHAT_WEBHOOK=https://chat.googleapis.com/v1/spaces/...
```

### 4. Run the Server
For development:
```bash
bun run dev
```

For production:
```bash
bun run start
```

---

## 🔗 Webhook Configuration

Add the following URLs as webhooks in your repository settings.

### 🐙 GitHub
- **Payload URL**: `http://your-domain.com/webhook/github?space=[space_name]`
- **Content type**: `application/json`
- **Events**: Just the `push` event.

### 🔵 BitBucket
- **URL**: `http://your-domain.com/webhook/bitbucket?space=[space_name]`
- **Events**: Repository `push`.

### 🧭 Available Space Parameters:
| Space Name | Webhook Used |
| :--- | :--- |
| `bis` | `BIS_GOOGLE_CHAT_WEBHOOK` |
| `hris` | `HRIS_GOOGLE_CHAT_WEBHOOK` |
| (undefined) | `GOOGLE_CHAT_WEBHOOK` |

---

## 🛠️ Tech Stack
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Notification**: Google Chat Card API
