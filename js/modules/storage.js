(function () {
  // Один ключ localStorage хранит всё состояние приложения.
  const STORAGE_KEY = "randomQuestGeneratorState";

  function getDefaultState() {
    return {
      settings: {
        difficulty: "easy",
        categories: [],
        historyFilter: "all"
      },
      profile: {
        name: "Пользователь",
        registeredAt: new Date().toISOString(),
        currentLevel: "Новичок",
        currentStreak: 0,
        rewardCount: 0
      },
      rewards: [],
      history: [],
      daily: {
        date: "",
        items: []
      }
    };
  }

  function loadState() {
    const defaultState = getDefaultState();

    try {
      const rawValue = localStorage.getItem(STORAGE_KEY);
      if (!rawValue) {
        return defaultState;
      }

      const savedState = JSON.parse(rawValue);

      return {
        settings: Object.assign({}, defaultState.settings, savedState.settings || {}),
        profile: Object.assign({}, defaultState.profile, savedState.profile || {}),
        rewards: Array.isArray(savedState.rewards) ? savedState.rewards : [],
        history: Array.isArray(savedState.history) ? savedState.history : [],
        daily: Object.assign({}, defaultState.daily, savedState.daily || {})
      };
    } catch (error) {
      console.error("Не удалось загрузить состояние из localStorage:", error);
      return defaultState;
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error("Не удалось сохранить состояние в localStorage:", error);
      return false;
    }
  }

  function createId(prefix) {
    const randomPart = Math.random().toString(36).slice(2, 9);
    return prefix + "-" + Date.now() + "-" + randomPart;
  }

  window.RandomQuestApp = window.RandomQuestApp || {};
  window.RandomQuestApp.storage = {
    getDefaultState,
    loadState,
    saveState,
    createId
  };
})();
