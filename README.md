# ⚡ Codeforces POTD

A lightweight, high-performance Chrome Extension (Manifest V3) that delivers a personalized daily competitive programming challenge based on your current Codeforces rating with automated streak tracking.

---

## 🎯 Overview

Consistency is the single most important factor in competitive programming. **Codeforces POTD** automates your daily practice by serving a curated daily problem within your active growth bracket (`Rating` to `Rating + 200`), eliminating decision fatigue and tracking your consistency with an automated daily solve streak.

---

## ✨ Key Features

- **🎯 Targeted Difficulty Bracket:** Automatically fetches your active rating via the Codeforces API and serves problems in your `[Rating, Rating + 200]` zone.
- **🔥 Consecutive Solve Streaks:** Tracks consecutive daily solves automatically when you click **Check Status** after submission.
- **⚡ Performance Optimized:**
  - **Payload Compression:** Strips unnecessary metadata from Codeforces problem sets, reducing storage footprint by ~85% (from ~4MB to ~600KB).
  - **Incremental Syncing:** Caches solved problem IDs locally; only queries your most recent submissions instead of fetching entire account histories.
  - **Debounced Triggers:** Prevents duplicate network requests during site navigation.
- **🔔 Daily Morning Notifications:** Scheduled alarms prompt you at 6:00 AM daily. Clicking the notification opens the problem immediately in a new tab.
- **🎨 Dynamic Rank Theming:** Problem badges automatically match official Codeforces rank divisions (Newbie, Pupil, Specialist, Expert, Master, Grandmaster).
- **🎲 One-Click Reroll:** Instantly draw another unsolved problem in your rating band if you want a different challenge.

---

## 🏗️ Architecture & Flow

```text
               ┌───────────────────────┐
               │    Codeforces API     │
               └──────────┬────────────┘
                          │ (user.info, user.status, problemset.problems)
                          ▼
               ┌───────────────────────┐
               │  background.js (SW)   │ ◄─── chrome.alarms (6:00 AM)
               │  - Incremental Sync   │ ◄─── chrome.tabs (CF Visit Listener)
               │  - Bracket Filtering  │
               └──────────┬────────────┘
                          │ chrome.storage.local (Compressed Cache)
                          ▼
               ┌───────────────────────┐
               │   popup/ (HTML/JS)    │
               │  - Dynamic CF Badges  │
               │  - Flame Streak View  │
               └───────────────────────┘
```

---

## 🎮 How to Use

### 1. Load the Extension in Chrome
1. Open Google Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select your `codeforces-potd` folder.

### 2. Daily Workflow
1. **Set Handle:** Click the **Codeforces POTD** icon in your browser toolbar, enter your Codeforces handle (e.g., `tourist`), and click **Save & Generate POTD**.
2. **Solve the Problem:** Click **Solve on Codeforces** to open and solve the problem directly on the site.
3. **Verify Streak:** Once your submission receives an **Accepted (OK)** verdict, open the extension popup and click **Check Status**. Your streak counter (`🔥`) will automatically increment.
4. **Reroll (Optional):** If you prefer a different challenge within your rating bracket, click **New Problem**