(function () {
  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return [year, month, day].join("-");
  }

  function getCategories() {
    return window.RandomQuestApp.questCatalog.map(function (quest) {
      return quest.category;
    }).filter(function (category, index, list) {
      return list.indexOf(category) === index;
    });
  }

  function normalizeSettings(state) {
    if (!state.settings.categories.length) {
      state.settings.categories = getCategories();
    }
  }

  function resetExpiredDailyQuests(state) {
    // Старые дневные квесты убираются с главного экрана, но остаются в истории.
    if (state.daily.date && state.daily.date !== getTodayKey()) {
      state.daily = {
        date: "",
        items: []
      };
    }
  }

  function getFilteredQuests(state) {
    normalizeSettings(state);

    return window.RandomQuestApp.questCatalog.filter(function (quest) {
      const difficultyMatch = quest.difficulty === state.settings.difficulty;
      const categoryMatch = state.settings.categories.indexOf(quest.category) !== -1;
      return difficultyMatch && categoryMatch;
    });
  }

  function shuffle(items) {
    const list = items.slice();

    for (let index = list.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const temp = list[index];
      list[index] = list[randomIndex];
      list[randomIndex] = temp;
    }

    return list;
  }

  function findHistoryEntry(state, historyId) {
    return state.history.find(function (item) {
      return item.id === historyId;
    });
  }

  function getDailyQuestEntries(state) {
    return state.daily.items.map(function (item) {
      return findHistoryEntry(state, item.historyId);
    }).filter(Boolean);
  }

  function generateDailyQuests(state) {
    resetExpiredDailyQuests(state);

    if (!window.RandomQuestApp.questCatalog.length) {
      return {
        success: false,
        message: "База квестов не загружена. Проверьте файл с данными."
      };
    }

    const filteredQuests = getFilteredQuests(state);

    if (!filteredQuests.length) {
      return {
        success: false,
        message: "По выбранным фильтрам квесты не найдены. Измените настройки."
      };
    }

    const maxCount = Math.min(3, filteredQuests.length);
    const questCount = Math.floor(Math.random() * maxCount) + 1;
    const selectedQuests = shuffle(filteredQuests).slice(0, questCount);

    // При новой генерации собираем отдельный набор квестов на текущую дату.
    state.daily = {
      date: getTodayKey(),
      items: []
    };

    selectedQuests.forEach(function (quest) {
      const historyEntry = {
        id: window.RandomQuestApp.storage.createId("history"),
        questId: quest.id,
        title: quest.title,
        description: quest.description,
        difficulty: quest.difficulty,
        category: quest.category,
        status: "pending",
        assignedDate: getTodayKey(),
        actionDate: "",
        createdAt: new Date().toISOString()
      };

      state.history.unshift(historyEntry);
      state.daily.items.push({
        historyId: historyEntry.id,
        questId: quest.id,
        status: "pending"
      });
    });

    return {
      success: true,
      message: "Новый набор квестов сформирован.",
      items: getDailyQuestEntries(state)
    };
  }

  function updateQuestStatus(state, historyId, newStatus) {
    const historyEntry = findHistoryEntry(state, historyId);

    if (!historyEntry) {
      return {
        success: false,
        message: "Квест не найден в истории."
      };
    }

    if (historyEntry.status !== "pending") {
      return {
        success: false,
        message: "Статус этого квеста уже был изменён."
      };
    }

    const dailyItem = state.daily.items.find(function (item) {
      return item.historyId === historyId;
    });

    historyEntry.status = newStatus;
    historyEntry.actionDate = getTodayKey();

    if (dailyItem) {
      dailyItem.status = newStatus;
    }

    let reward = null;

    if (newStatus === "completed") {
      reward = window.RandomQuestApp.profileService.handleCompletedQuest(state);
    } else if (newStatus === "skipped") {
      window.RandomQuestApp.profileService.handleSkippedQuest(state);
    }

    return {
      success: true,
      message: newStatus === "completed" ? "Квест отмечен как выполненный." : "Квест пропущен.",
      reward: reward
    };
  }

  window.RandomQuestApp = window.RandomQuestApp || {};
  window.RandomQuestApp.questService = {
    getTodayKey,
    getCategories,
    normalizeSettings,
    resetExpiredDailyQuests,
    getFilteredQuests,
    getDailyQuestEntries,
    generateDailyQuests,
    updateQuestStatus
  };
})();
