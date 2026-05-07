(function () {
  const app = window.RandomQuestApp;
  const state = app.storage.loadState();
  const categories = app.questService.getCategories();

  app.questService.normalizeSettings(state);
  app.questService.resetExpiredDailyQuests(state);
  app.profileService.syncProfile(state);
  app.storage.saveState(state);

  function persistAndRender(message, type) {
    app.storage.saveState(state);
    app.ui.render(state);

    if (message) {
      app.ui.showToast(message, type);
    }
  }

  function handleGenerate() {
    const result = app.questService.generateDailyQuests(state);

    if (!result.success) {
      persistAndRender(result.message, "error");
      return;
    }

    persistAndRender(result.message, "success");
    app.ui.switchScreen("home");
  }

  function handleSettingsSave(settings) {
    if (!settings.categories.length) {
      app.ui.showToast("Выберите хотя бы одну категорию.", "warning");
      return;
    }

    state.settings.difficulty = settings.difficulty;
    state.settings.categories = settings.categories;
    state.daily = {
      date: "",
      items: []
    };

    persistAndRender("Настройки сохранены. Можно получить новый набор квестов.", "success");
  }

  function handleProfileSave(name) {
    const normalizedName = name.trim();

    if (!normalizedName) {
      app.ui.showToast("Имя не должно быть пустым.", "warning");
      return;
    }

    state.profile.name = normalizedName;
    persistAndRender("Имя профиля сохранено.", "success");
  }

  function handleQuestAction(historyId, action) {
    const result = app.questService.updateQuestStatus(state, historyId, action);

    if (!result.success) {
      app.ui.showToast(result.message, "warning");
      return;
    }

    let message = result.message;

    if (result.reward) {
      message += " Получена награда: " + result.reward.title + ".";
    }

    persistAndRender(message, action === "completed" ? "success" : "warning");
  }

  function handleHistoryFilterChange(filter) {
    state.settings.historyFilter = filter;
    persistAndRender("", "info");
  }

  app.ui.init({
    categories: categories,
    onGenerate: handleGenerate,
    onSettingsSave: handleSettingsSave,
    onProfileSave: handleProfileSave,
    onQuestAction: handleQuestAction,
    onHistoryFilterChange: handleHistoryFilterChange
  });

  app.ui.render(state);
})();
