<div align="center">

# ⚡ Codeforces POTD

**A high-performance Chrome extension that generates a daily, rating-targeted competitive programming challenge with automated streak tracking.**

[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Codeforces API](https://img.shields.io/badge/API-Codeforces-1F8ACB?style=flat-square&logo=codeforces&logoColor=white)](https://codeforces.com/apiHelp)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/Siddharth-devsih/codeforces-potd/pulls)

</div>

---

## 🎯 Overview

Consistency is the single most important factor in competitive programming. **Codeforces POTD** automates your daily practice by serving a curated daily problem within your active growth bracket (`Rating` to `Rating + 200`), tracking your consistency with an automated daily solve streak.

---

## ✨ Key Features

- **🎯 Targeted Difficulty Bracket:** Automatically reads your current rating via the Codeforces REST API and serves problems in your `[R, R + 200]` zone.
- **🔥 Consecutive Solve Streaks:** Tracks consecutive solve days automatically when you click **Check Status** after submission.
- **⚡ Built for Performance:**
  - **Payload Compression:** Strips unneeded metadata from CF problem sets, slashing storage usage by **~85%** (from ~4MB to ~600KB).
  - **Incremental Syncing:** Caches solved problem IDs locally; only queries your most recent submissions instead of fetching entire account histories.
  - **Debounced Triggers:** Prevents duplicate network requests during site navigation.
- **🔔 Actionable System Notifications:** Scheduled alarms prompt you at 6:00 AM daily. Clicking the alert opens the challenge immediately in a new tab.
- **🎨 Dynamic Rank Theming:** Problem badges automatically match official Codeforces rank divisions (Newbie, Pupil, Specialist, Expert, Master, Grandmaster).
- **🎲 One-Click Reroll:** Instantly draw another unsolved problem in your rating band if you need a different topic.

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
