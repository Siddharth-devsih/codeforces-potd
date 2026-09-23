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
Markdown
---

## 🚀 Installation & Setup

1. **Clone or Download the Repository:**
   ```bash
   git clone https://github.com/Siddharth-devsih/codeforces-potd.git
Open Extensions in Chrome:

Go to chrome://extensions in your address bar.

Enable Developer mode using the toggle in the top-right corner.

Load the Extension:

Click the Load unpacked button in the top-left corner.

Select the codeforces-potd folder.

🎮 How to Use
Initial Setup: Click the Codeforces POTD icon in your browser toolbar, enter your Codeforces handle (e.g., tourist), and click Save & Generate POTD.

Solve the Daily Problem: Click Solve on Codeforces to open the problem directly and submit your solution.

Verify & Build Your Streak: After getting an Accepted (OK) verdict, reopen the extension popup and click Check Status. Your streak counter (🔥) will increment for the day.

Reroll (Optional): If you want a different problem within your rating bracket, click New Problem.

🛠️ Tech Stack & APIs
Chrome Manifest V3 APIs: chrome.storage.local, chrome.alarms, chrome.notifications, chrome.tabs

Codeforces REST Endpoints: user.info, user.status, problemset.problems

📄 License
This project is licensed under the MIT License.


---

### How to Save it:
1. Click the green **Commit changes...** button at the top right of your screen.
2. Click **Commit changes** in the small dialog box that appears.
3. Return to the main page of your repository—your README will now show the complete installation and usage instructions.
