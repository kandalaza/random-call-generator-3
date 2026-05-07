(function () {
  // Награды выдаются за серии 3, 5 и 7 выполненных квестов подряд.
  const rewardMilestones = {
    3: {
      title: "Первая звезда",
      description: "Серия из 3 выполненных квестов подряд.",
      icon: "★"
    },
    5: {
      title: "Стабильный рост",
      description: "Серия из 5 выполненных квестов подряд.",
      icon: "⭐"
    },
    7: {
      title: "Мастер вызовов",
      description: "Серия из 7 выполненных квестов подряд.",
      icon: "🌟"
    }
  };

  function getCompletedCount(history) {
    return history.filter(function (item) {
      return item.status === "completed";
    }).length;
  }

  function getCompletionPercent(history) {
    if (!history.length) {
      return 0;
    }

    return Math.round((getCompletedCount(history) / history.length) * 100);
  }

  function getLevelByCompletedCount(completedCount) {
    if (completedCount >= 10) {
      return "Эксперт";
    }

    if (completedCount >= 5) {
      return "Практик";
    }

    return "Новичок";
  }

  function syncProfile(state) {
    const completedCount = getCompletedCount(state.history);
    state.profile.currentLevel = getLevelByCompletedCount(completedCount);
    state.profile.rewardCount = state.rewards.length;
  }

  function getStats(state) {
    const completedCount = getCompletedCount(state.history);

    return {
      completedCount: completedCount,
      completionPercent: getCompletionPercent(state.history),
      currentStreak: state.profile.currentStreak,
      rewardCount: state.rewards.length,
      totalQuests: state.history.length
    };
  }

  function addRewardIfNeeded(state) {
    const milestoneData = rewardMilestones[state.profile.currentStreak];

    if (!milestoneData) {
      syncProfile(state);
      return null;
    }

    const reward = {
      id: window.RandomQuestApp.storage.createId("reward"),
      streak: state.profile.currentStreak,
      title: milestoneData.title,
      description: milestoneData.description,
      icon: milestoneData.icon,
      earnedAt: new Date().toISOString()
    };

    state.rewards.unshift(reward);
    syncProfile(state);
    return reward;
  }

  function handleCompletedQuest(state) {
    state.profile.currentStreak += 1;
    syncProfile(state);
    return addRewardIfNeeded(state);
  }

  function handleSkippedQuest(state) {
    state.profile.currentStreak = 0;
    syncProfile(state);
  }

  window.RandomQuestApp = window.RandomQuestApp || {};
  window.RandomQuestApp.profileService = {
    rewardMilestones,
    syncProfile,
    getStats,
    handleCompletedQuest,
    handleSkippedQuest
  };
})();
