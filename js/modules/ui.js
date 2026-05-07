(function () {
  const difficultyLabels = {
    easy: "Лёгкий",
    medium: "Средний",
    hard: "Сложный"
  };

  const statusLabels = {
    pending: "Ожидает",
    completed: "Выполнен",
    skipped: "Пропущен"
  };

  let dom = {};
  let config = {};
  let toastTimer = null;

  function init(options) {
    config = options;
    dom = {
      welcomeMessage: document.getElementById("welcome-message"),
      headerStreak: document.getElementById("header-streak"),
      headerPercent: document.getElementById("header-percent"),
      headerRewards: document.getElementById("header-rewards"),
      questList: document.getElementById("quest-list"),
      dailyNote: document.getElementById("daily-note"),
      generateButton: document.getElementById("generate-quests-button"),
      settingsForm: document.getElementById("settings-form"),
      difficultySelect: document.getElementById("difficulty-select"),
      categoryFilters: document.getElementById("category-filters"),
      profileForm: document.getElementById("profile-form"),
      profileNameInput: document.getElementById("profile-name-input"),
      profileDate: document.getElementById("profile-date"),
      profileLevel: document.getElementById("profile-level"),
      profileStreak: document.getElementById("profile-streak"),
      profileRewardCount: document.getElementById("profile-reward-count"),
      profileCompletedCount: document.getElementById("profile-completed-count"),
      profilePercent: document.getElementById("profile-percent"),
      rewardSummary: document.getElementById("reward-summary"),
      rewardList: document.getElementById("reward-list"),
      historyFilter: document.getElementById("history-filter"),
      historyTableBody: document.getElementById("history-table-body"),
      screenButtons: Array.from(document.querySelectorAll(".tab-button")),
      screens: Array.from(document.querySelectorAll(".screen")),
      toast: document.getElementById("toast")
    };

    bindEvents();
  }

  function bindEvents() {
    dom.screenButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        switchScreen(button.dataset.screen);
      });
    });

    dom.generateButton.addEventListener("click", function () {
      config.onGenerate();
    });

    dom.settingsForm.addEventListener("submit", function (event) {
      event.preventDefault();
      const selectedCategories = Array.from(
        dom.categoryFilters.querySelectorAll('input[type="checkbox"]:checked')
      ).map(function (checkbox) {
        return checkbox.value;
      });

      config.onSettingsSave({
        difficulty: dom.difficultySelect.value,
        categories: selectedCategories
      });
    });

    dom.profileForm.addEventListener("submit", function (event) {
      event.preventDefault();
      config.onProfileSave(dom.profileNameInput.value);
    });

    dom.historyFilter.addEventListener("change", function () {
      config.onHistoryFilterChange(dom.historyFilter.value);
    });

    dom.questList.addEventListener("click", function (event) {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) {
        return;
      }

      config.onQuestAction(actionButton.dataset.historyId, actionButton.dataset.action);
    });
  }

  function switchScreen(screenName) {
    dom.screenButtons.forEach(function (button) {
      const isActive = button.dataset.screen === screenName;
      button.classList.toggle("active", isActive);
    });

    dom.screens.forEach(function (screen) {
      const isActive = screen.id === "screen-" + screenName;
      screen.classList.toggle("active", isActive);
    });
  }

  function renderCategories(categories, selectedCategories) {
    dom.categoryFilters.innerHTML = categories.map(function (category) {
      const isChecked = selectedCategories.indexOf(category) !== -1;
      return (
        '<label class="checkbox-card">' +
        '<input type="checkbox" value="' + category + '"' + (isChecked ? " checked" : "") + " />" +
        "<span>" + capitalize(category) + "</span>" +
        "</label>"
      );
    }).join("");
  }

  function renderQuestList(quests) {
    if (!quests.length) {
      dom.questList.innerHTML =
        '<div class="empty-state">Пока нет активных квестов на сегодня. Нажмите "Получить квест" или измените настройки генерации.</div>';
      return;
    }

    dom.questList.innerHTML = quests.map(function (quest) {
      const isPending = quest.status === "pending";

      return (
        '<article class="quest-card ' + quest.status + '">' +
        '<div class="quest-head">' +
        '<h3 class="quest-title">' + quest.title + "</h3>" +
        '<span class="status-badge status-' + quest.status + '">' + statusLabels[quest.status] + "</span>" +
        "</div>" +
        '<p class="quest-description">' + quest.description + "</p>" +
        '<div class="quest-meta">' +
        '<span class="meta-badge">' + difficultyLabels[quest.difficulty] + "</span>" +
        '<span class="meta-badge">' + capitalize(quest.category) + "</span>" +
        '<span class="meta-badge">Назначен: ' + formatDate(quest.assignedDate) + "</span>" +
        "</div>" +
        '<div class="quest-actions">' +
        '<button class="primary-button" data-action="completed" data-history-id="' + quest.id + '"' + (isPending ? "" : " disabled") + ">Выполнить</button>" +
        '<button class="ghost-button" data-action="skipped" data-history-id="' + quest.id + '"' + (isPending ? "" : " disabled") + ">Пропустить</button>" +
        "</div>" +
        "</article>"
      );
    }).join("");
  }

  function renderProfile(state) {
    const stats = window.RandomQuestApp.profileService.getStats(state);

    dom.welcomeMessage.textContent =
      "Здравствуйте, " +
      state.profile.name +
      ". Сегодня можно получить новые задания, отслеживать серию и собирать награды.";

    dom.profileNameInput.value = state.profile.name;
    dom.profileDate.textContent = formatDate(state.profile.registeredAt);
    dom.profileLevel.textContent = state.profile.currentLevel;
    dom.profileStreak.textContent = stats.currentStreak;
    dom.profileRewardCount.textContent = stats.rewardCount;
    dom.profileCompletedCount.textContent = stats.completedCount;
    dom.profilePercent.textContent = stats.completionPercent + "%";
    dom.headerStreak.textContent = stats.currentStreak;
    dom.headerPercent.textContent = stats.completionPercent + "%";
    dom.headerRewards.textContent = stats.rewardCount;
    dom.rewardSummary.textContent = stats.rewardCount + " достижений";

    if (!state.rewards.length) {
      dom.rewardList.innerHTML =
        '<div class="empty-state">Пока наград нет. Выполните серию из 3, 5 или 7 квестов подряд.</div>';
      return;
    }

    dom.rewardList.innerHTML = state.rewards.map(function (reward) {
      return (
        '<article class="reward-card">' +
        '<div class="reward-icon">' + reward.icon + "</div>" +
        "<h4>" + reward.title + "</h4>" +
        "<p>" + reward.description + "</p>" +
        '<p class="helper-text">Получено: ' + formatDate(reward.earnedAt) + "</p>" +
        "</article>"
      );
    }).join("");
  }

  function renderHistory(state) {
    dom.historyFilter.value = state.settings.historyFilter || "all";

    let historyItems = state.history.slice();

    if (state.settings.historyFilter && state.settings.historyFilter !== "all") {
      historyItems = historyItems.filter(function (item) {
        return item.status === state.settings.historyFilter;
      });
    }

    if (!historyItems.length) {
      dom.historyTableBody.innerHTML =
        '<tr><td colspan="5">История пока пуста. Сгенерируйте первые квесты.</td></tr>';
      return;
    }

    dom.historyTableBody.innerHTML = historyItems.map(function (item) {
      return (
        "<tr>" +
        "<td>" + item.title + "</td>" +
        "<td>" + difficultyLabels[item.difficulty] + "</td>" +
        "<td>" + capitalize(item.category) + "</td>" +
        '<td><span class="status-badge status-' + item.status + '">' + statusLabels[item.status] + "</span></td>" +
        "<td>" + (item.actionDate ? formatDate(item.actionDate) : "—") + "</td>" +
        "</tr>"
      );
    }).join("");
  }

  function renderSettings(state) {
    dom.difficultySelect.value = state.settings.difficulty;
    renderCategories(config.categories, state.settings.categories);
  }

  function renderDailyNote(state) {
    if (state.daily.date === window.RandomQuestApp.questService.getTodayKey() && state.daily.items.length) {
      dom.dailyNote.textContent =
        "Квесты на сегодня уже сформированы. Вы можете выполнить их или изменить настройки и получить новый набор.";
      return;
    }

    dom.dailyNote.textContent = "Нажмите кнопку, чтобы сформировать новый набор квестов.";
  }

  function render(state) {
    // Один общий рендер обновляет все экраны после любого действия пользователя.
    renderSettings(state);
    renderProfile(state);
    renderQuestList(window.RandomQuestApp.questService.getDailyQuestEntries(state));
    renderHistory(state);
    renderDailyNote(state);
  }

  function showToast(message, type) {
    dom.toast.textContent = message;
    dom.toast.className = "toast visible toast-" + (type || "info");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      dom.toast.className = "toast";
    }, 2500);
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parts = value.split("-");
      return [parts[2], parts[1], parts[0]].join(".");
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("ru-RU");
  }

  function capitalize(text) {
    if (!text) {
      return "";
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  window.RandomQuestApp = window.RandomQuestApp || {};
  window.RandomQuestApp.ui = {
    init,
    render,
    showToast,
    switchScreen
  };
})();
