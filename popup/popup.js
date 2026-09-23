document.addEventListener("DOMContentLoaded", async () => {
  const viewSetup = document.getElementById("view-setup");
  const viewLoading = document.getElementById("view-loading");
  const viewError = document.getElementById("view-error");
  const viewProblem = document.getElementById("view-problem");

  const setupForm = document.getElementById("setup-form");
  const handleInput = document.getElementById("handle-input");
  const userRatingChip = document.getElementById("user-rating-chip");
  const headerHandle = document.getElementById("header-handle");
  const headerRating = document.getElementById("header-rating");

  const streakBadge = document.getElementById("streak-badge");
  const streakCount = document.getElementById("streak-count");

  const problemId = document.getElementById("problem-id");
  const problemTitle = document.getElementById("problem-title");
  const problemRatingBadge = document.getElementById("problem-rating-badge");
  const problemTags = document.getElementById("problem-tags");
  const solvedStatus = document.getElementById("solved-status");
  const bracketInfo = document.getElementById("bracket-info");

  const btnSolve = document.getElementById("btn-solve");
  const btnVerify = document.getElementById("btn-verify");
  const btnReroll = document.getElementById("btn-reroll");
  const btnChangeHandle = document.getElementById("btn-change-handle");
  const btnErrorRetry = document.getElementById("btn-error-retry");
  const errorMessage = document.getElementById("error-message");

  let currentProblem = null;
  let currentHandle = null;

  // Initialize
  const stored = await chrome.storage.local.get(["cfHandle", "streakCount"]);
  if (stored.cfHandle) {
    currentHandle = stored.cfHandle;
    updateStreakDisplay(stored.streakCount || 0);
    loadProblem(currentHandle, false);
  } else {
    showView("setup");
  }

  // Handle Form Submit
  setupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const handle = handleInput.value.trim();
    if (handle) {
      currentHandle = handle;
      loadProblem(currentHandle, true);
    }
  });

  // Re-roll / Manual Refresh
  btnReroll.addEventListener("click", () => {
    if (currentHandle) {
      loadProblem(currentHandle, true);
    }
  });

  // Change Handle Action
  btnChangeHandle.addEventListener("click", () => {
    showView("setup");
    handleInput.value = currentHandle || "";
    handleInput.focus();
  });

  // Retry from Error View
  btnErrorRetry.addEventListener("click", () => {
    if (currentHandle) {
      loadProblem(currentHandle, false);
    } else {
      showView("setup");
    }
  });

  // Verify Solved Status & Update Streak
  btnVerify.addEventListener("click", async () => {
    if (!currentProblem || !currentHandle) return;

    btnVerify.disabled = true;
    btnVerify.textContent = "Checking...";

    chrome.runtime.sendMessage(
      {
        action: "checkStatus",
        handle: currentHandle,
        contestId: currentProblem.contestId,
        index: currentProblem.index
      },
      (res) => {
        btnVerify.disabled = false;
        btnVerify.textContent = "Check Status";

        if (res && res.success && res.isSolved) {
          solvedStatus.classList.remove("hidden");
          solvedStatus.classList.add("flex");
          updateStreakDisplay(res.streak);
        } else {
          alert("No accepted submission found yet. Keep going!");
        }
      }
    );
  });

  function updateStreakDisplay(streak) {
    if (!streakCount || !streakBadge) return; // Prevent null crash
    streakCount.textContent = streak;
    streakBadge.classList.remove("hidden");
    streakBadge.classList.add("flex");
  }

  function loadProblem(handle, forceRefresh) {
    showView("loading");

    chrome.runtime.sendMessage(
      {
        action: "getDailyProblem",
        handle: handle,
        forceRefresh: forceRefresh
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showError(chrome.runtime.lastError.message);
          return;
        }

        if (response && response.success) {
          currentProblem = response.data;
          renderProblem(currentProblem, handle);
          showView("problem");
        } else {
          showError(response ? response.error : "Unknown error occurred.");
        }
      }
    );
  }

  function renderProblem(problem, handle) {
    headerHandle.textContent = handle;
    headerRating.textContent = problem.userRating || "Unrated";
    userRatingChip.classList.remove("hidden");

    problemId.textContent = `${problem.contestId}${problem.index}`;
    problemTitle.textContent = problem.name;

    const rating = problem.rating || 0;
    problemRatingBadge.textContent = rating ? `★ ${rating}` : "Unrated";
    applyRatingStyles(problemRatingBadge, rating);

    problemTags.innerHTML = "";
    (problem.tags || []).forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "text-[9px] bg-slate-700/70 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600/50";
      chip.textContent = tag;
      problemTags.appendChild(chip);
    });

    btnSolve.href = problem.url;
    bracketInfo.textContent = `Target: ${problem.targetMin}-${problem.targetMax}`;

    solvedStatus.classList.add("hidden");
    solvedStatus.classList.remove("flex");
  }

  function applyRatingStyles(el, rating) {
    let bg = "bg-slate-700/40";
    let text = "text-slate-300";
    let border = "border-slate-600";

    if (rating < 1200) {
      bg = "bg-slate-500/20"; text = "text-slate-400"; border = "border-slate-500/30";
    } else if (rating < 1400) {
      bg = "bg-emerald-500/20"; text = "text-emerald-400"; border = "border-emerald-500/30";
    } else if (rating < 1600) {
      bg = "bg-cyan-500/20"; text = "text-cyan-400"; border = "border-cyan-500/30";
    } else if (rating < 1900) {
      bg = "bg-blue-500/20"; text = "text-blue-400"; border = "border-blue-500/30";
    } else if (rating < 2100) {
      bg = "bg-purple-500/20"; text = "text-purple-400"; border = "border-purple-500/30";
    } else if (rating < 2400) {
      bg = "bg-amber-500/20"; text = "text-amber-400"; border = "border-amber-500/30";
    } else {
      bg = "bg-red-500/20"; text = "text-red-400"; border = "border-red-500/30";
    }

    el.className = `text-[10px] font-bold px-2 py-0.5 rounded border ${bg} ${text} ${border}`;
  }

  function showView(view) {
    viewSetup.classList.toggle("hidden", view !== "setup");
    viewLoading.classList.toggle("hidden", view !== "loading");
    viewError.classList.toggle("hidden", view !== "error");
    viewProblem.classList.toggle("hidden", view !== "problem");

    if (view === "setup") {
      if (userRatingChip) userRatingChip.classList.add("hidden");
      if (streakBadge) {
        streakBadge.classList.add("hidden");
        streakBadge.classList.remove("flex");
      }
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    showView("error");
  }
});