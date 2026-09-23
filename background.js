const CF_API_BASE = "https://codeforces.com/api";
const ALARM_NAME = "cf_potd_daily_alarm";
const PROBLEMSET_CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours cache

// Lifecycle Listeners
chrome.runtime.onInstalled.addListener(() => setupDailyAlarm());
chrome.runtime.onStartup.addListener(() => setupDailyAlarm());

function setupDailyAlarm() {
  const now = new Date();
  const next6AM = new Date();
  next6AM.setHours(6, 0, 0, 0);

  if (now.getTime() >= next6AM.getTime()) {
    next6AM.setDate(next6AM.getDate() + 1);
  }

  chrome.alarms.create(ALARM_NAME, {
    when: next6AM.getTime(),
    periodInMinutes: 1440
  });
}

// Click notification to open problem directly
chrome.notifications.onClicked.addListener(async () => {
  const { potd } = await chrome.storage.local.get(["potd"]);
  if (potd && potd.url) {
    chrome.tabs.create({ url: potd.url });
  }
});

// Daily Alarm Handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    const { cfHandle } = await chrome.storage.local.get(["cfHandle"]);
    if (cfHandle) {
      try {
        const problem = await fetchAndAssignPOTD(cfHandle, true);
        if (problem) sendDailyNotification(problem);
      } catch (err) {
        console.error("Daily POTD generation failed:", err);
      }
    }
  }
});

// Messaging Handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDailyProblem") {
    handleGetDailyProblem(request.handle, request.forceRefresh)
      .then((data) => sendResponse({ success: true, data }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === "checkStatus") {
    handleCheckStatus(request.handle, request.contestId, request.index)
      .then((result) => sendResponse({ success: true, ...result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleGetDailyProblem(handle, forceRefresh = false) {
  const today = new Date().toISOString().slice(0, 10);
  const { potd, potdDate, cfHandle } = await chrome.storage.local.get([
    "potd",
    "potdDate",
    "cfHandle"
  ]);

  if (!forceRefresh && potd && potdDate === today && cfHandle === handle) {
    return potd;
  }

  return await fetchAndAssignPOTD(handle, forceRefresh);
}

// Core Logic with Incremental Sync
async function fetchAndAssignPOTD(handle, forceNew = false) {
  const today = new Date().toISOString().slice(0, 10);

  // 1. Fetch user rating
  const userRes = await fetch(`${CF_API_BASE}/user.info?handles=${encodeURIComponent(handle)}`);
  const userData = await userRes.json();
  if (userData.status !== "OK") throw new Error(userData.comment || "User not found.");

  const userRating = userData.result[0].rating || 800;
  const minRating = userRating;
  const maxRating = userRating + 200;

  // 2. Incremental Solved Sync
  const solvedSet = await getUpdatedSolvedSet(handle);

  // 3. Get compressed problem set
  const problems = await getCachedProblemset();

  // 4. In-place filter
  const eligible = [];
  for (let i = 0; i < problems.length; i++) {
    const p = problems[i];
    if (p.rating >= minRating && p.rating <= maxRating) {
      if (!solvedSet.has(`${p.contestId}-${p.index}`)) {
        eligible.push(p);
      }
    }
  }

  if (eligible.length === 0) {
    throw new Error(`No unsolved problems found in bracket ${minRating}-${maxRating}.`);
  }

  const pick = eligible[Math.floor(Math.random() * eligible.length)];
  const potdPayload = {
    ...pick,
    targetMin: minRating,
    targetMax: maxRating,
    userRating,
    url: `https://codeforces.com/problemset/problem/${pick.contestId}/${pick.index}`,
    fetchedAt: Date.now()
  };

  await chrome.storage.local.set({
    cfHandle: handle,
    potd: potdPayload,
    potdDate: today
  });

  return potdPayload;
}

// Incremental solver set manager (avoids redownloading thousands of submissions)
async function getUpdatedSolvedSet(handle) {
  const { solvedMap = {}, lastSyncedHandle } = await chrome.storage.local.get([
    "solvedMap",
    "lastSyncedHandle"
  ]);

  const isSameUser = lastSyncedHandle === handle;
  const solvedSet = new Set(isSameUser ? Object.keys(solvedMap) : []);
  
  const count = isSameUser && solvedSet.size > 0 ? 100 : 5000;
  const res = await fetch(`${CF_API_BASE}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`);
  const data = await res.json();

  if (data.status === "OK") {
    data.result.forEach((sub) => {
      if (sub.verdict === "OK" && sub.problem?.contestId) {
        const key = `${sub.problem.contestId}-${sub.problem.index}`;
        solvedSet.add(key);
        solvedMap[key] = 1;
      }
    });

    await chrome.storage.local.set({
      solvedMap: solvedMap,
      lastSyncedHandle: handle
    });
  }

  return solvedSet;
}

// Stripped Problemset Cache (saves ~80% memory)
async function getCachedProblemset() {
  const { cachedProblems, cachedProblemsTimestamp } = await chrome.storage.local.get([
    "cachedProblems",
    "cachedProblemsTimestamp"
  ]);

  if (cachedProblems && cachedProblemsTimestamp && Date.now() - cachedProblemsTimestamp < PROBLEMSET_CACHE_TTL_MS) {
    return cachedProblems;
  }

  const res = await fetch(`${CF_API_BASE}/problemset.problems`);
  const data = await res.json();

  if (data.status !== "OK") {
    if (cachedProblems) return cachedProblems;
    throw new Error(data.comment || "Could not load problemset.");
  }

  const stripped = data.result.problems
    .filter((p) => p.rating && p.contestId && p.index)
    .map((p) => ({
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      rating: p.rating,
      tags: p.tags || []
    }));

  await chrome.storage.local.set({
    cachedProblems: stripped,
    cachedProblemsTimestamp: Date.now()
  });

  return stripped;
}

async function checkProblemStatus(handle, contestId, index) {
  const res = await fetch(`${CF_API_BASE}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=25`);
  const data = await res.json();
  if (data.status !== "OK") return false;

  return data.result.some(
    (sub) =>
      sub.verdict === "OK" &&
      sub.problem?.contestId === Number(contestId) &&
      sub.problem?.index === index
  );
}

async function handleCheckStatus(handle, contestId, index) {
  const isSolved = await checkProblemStatus(handle, contestId, index);
  const { streakCount = 0, lastSolvedDate } = await chrome.storage.local.get([
    "streakCount",
    "lastSolvedDate"
  ]);

  if (!isSolved) {
    return { isSolved: false, streak: streakCount };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (lastSolvedDate === today) {
    return { isSolved: true, streak: streakCount };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let newStreak = 1;

  if (lastSolvedDate === yesterday) {
    newStreak = streakCount + 1;
  }

  await chrome.storage.local.set({
    streakCount: newStreak,
    lastSolvedDate: today
  });

  return { isSolved: true, streak: newStreak };
}

function sendDailyNotification(problem) {
  chrome.notifications.create("potd_daily", {
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title: "Codeforces POTD Ready!",
    message: `Today's Challenge: ${problem.name} [★ ${problem.rating}] (Click to open)`,
    priority: 2
  });
}

// Debounced visit listener for codeforces.com
let lastTabCheck = 0;
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url?.startsWith("https://codeforces.com")) return;

  const now = Date.now();
  if (now - lastTabCheck < 5000) return;
  lastTabCheck = now;

  const currentHour = new Date().getHours();
  if (currentHour < 6) return;

  const today = new Date().toISOString().slice(0, 10);
  const { cfHandle, lastVisitAlertDate } = await chrome.storage.local.get([
    "cfHandle",
    "lastVisitAlertDate"
  ]);

  if (cfHandle && lastVisitAlertDate !== today) {
    try {
      const problem = await handleGetDailyProblem(cfHandle, false);
      const isSolved = await checkProblemStatus(cfHandle, problem.contestId, problem.index);

      if (!isSolved) {
        sendDailyNotification(problem);
        if (chrome.action?.openPopup) chrome.action.openPopup().catch(() => {});
        await chrome.storage.local.set({ lastVisitAlertDate: today });
      }
    } catch (err) {
      console.error("Tab check error:", err);
    }
  }
});