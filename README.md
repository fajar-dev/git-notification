# Git Notification for Google Chat

webhook bridge to send GitHub and BitBucket push notifications to Google Chat spaces.

## Features

- **GitHub Integration**: Supports push events with repository details, branch info, and commit data.
- **BitBucket Integration**: Supports push events with workspace, project, and commit hash.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- A Google Chat Webhook URL

## Setup

1. **Install dependencies**:

   ```bash
   bun install
   ```

2. **Configure Environment**:
   Create a `.env` file (copy from `.env.dist` if available) and add your Google Chat Webhook:

   ```env
   PORT=4000
   GOOGLE_CHAT_WEBHOOK=https://chat.googleapis.com/v1/spaces/...
   ```

3. **Run the server**:
   ```bash
   bun run dev
   ```

## Webhook Endpoints

- **GitHub**: `POST /webhook/github`
- **BitBucket**: `POST /webhook/bitbucket`
