// ============================================================
// GAMIFICATION SYSTEM
// ============================================================

export const XP_REWARDS = {
  COMPLETE_PRACTICE: 20,
  SPEAK_ONE_MINUTE: 10,
  SPEAK_THREE_MINUTES: 20,
  DAILY_GOAL: 25,
  SEVEN_DAY_STREAK: 50,
  PERSONAL_BEST: 30,
  SCORE_80: 25,
  SCORE_90: 40,
  NEW_CATEGORY: 20,
  ADVANCED_CHALLENGE: 30,
  WEEKLY_GOAL: 75,
};

// ============================================================
// LEVEL TITLES
// ============================================================

export const LEVEL_TITLES = {
  1: "New Speaker",
  2: "Practice Starter",
  3: "Topic Explorer",
  4: "Confident Learner",
  5: "Confident Speaker",
  6: "Conversation Builder",
  7: "Speaking Explorer",
  8: "Voice Builder",
  9: "Fluent Challenger",
  10: "Conversation Master",
  11: "Language Adventurer",
  12: "Fluency Builder",
  13: "Natural Speaker",
  14: "Communication Pro",
  15: "Speaking Expert",
  16: "Fluency Elite",
  17: "Conversation Specialist",
  18: "Language Master",
  19: "Advanced Speaker",
  20: "Speaking Legend",
};

// ============================================================
// MILESTONES
// ============================================================

export const MILESTONES = [
  // ----------------------------------------------------------
  // STREAK
  // ----------------------------------------------------------

  {
    id: "streak-3",
    type: "streak",
    target: 3,
    title: "Getting Started",
    description: "Practice for 3 consecutive days.",
    reward: 25,
    icon: "🔥",
  },

  {
    id: "streak-7",
    type: "streak",
    target: 7,
    title: "Week Warrior",
    description: "Maintain a 7 day speaking streak.",
    reward: 50,
    icon: "🔥",
  },

  {
    id: "streak-10",
    type: "streak",
    target: 10,
    title: "10 Day Champion",
    description: "Keep your streak alive for 10 days.",
    reward: 75,
    icon: "🔥",
  },

  {
    id: "streak-14",
    type: "streak",
    target: 14,
    title: "14 Day Warrior",
    description: "Practice for two weeks without breaking your streak.",
    reward: 100,
    icon: "🔥",
  },

  {
    id: "streak-21",
    type: "streak",
    target: 21,
    title: "21 Day Master",
    description: "Build a powerful 21 day habit.",
    reward: 150,
    icon: "🔥",
  },

  {
    id: "streak-30",
    type: "streak",
    target: 30,
    title: "30 Day Legend",
    description: "Reach a full month of consistency.",
    reward: 250,
    icon: "🔥",
  },

  {
    id: "streak-45",
    type: "streak",
    target: 45,
    title: "Consistency Elite",
    description: "Reach 45 consecutive practice days.",
    reward: 350,
    icon: "🔥",
  },

  {
    id: "streak-60",
    type: "streak",
    target: 60,
    title: "Unstoppable",
    description: "Maintain a 60 day speaking streak.",
    reward: 500,
    icon: "🔥",
  },

  {
    id: "streak-75",
    type: "streak",
    target: 75,
    title: "Speaking Machine",
    description: "Reach 75 consecutive days.",
    reward: 750,
    icon: "🔥",
  },

  {
    id: "streak-100",
    type: "streak",
    target: 100,
    title: "Century Speaker",
    description: "Reach an incredible 100 day streak.",
    reward: 1000,
    icon: "🔥",
  },

  {
    id: "streak-150",
    type: "streak",
    target: 150,
    title: "Elite Speaker",
    description: "Reach 150 consecutive practice days.",
    reward: 1500,
    icon: "🔥",
  },

  {
    id: "streak-200",
    type: "streak",
    target: 200,
    title: "Speaking Veteran",
    description: "Reach 200 consecutive days.",
    reward: 2000,
    icon: "🔥",
  },

  {
    id: "streak-365",
    type: "streak",
    target: 365,
    title: "Year of Speaking",
    description: "Practice every day for an entire year.",
    reward: 5000,
    icon: "👑",
  },

  // ----------------------------------------------------------
  // SESSIONS
  // ----------------------------------------------------------

  {
    id: "sessions-1",
    type: "sessions",
    target: 1,
    title: "First Evaluation",
    description: "Complete your first speaking evaluation.",
    reward: 20,
    icon: "🎤",
  },

  {
    id: "sessions-5",
    type: "sessions",
    target: 5,
    title: "Getting Comfortable",
    description: "Complete 5 speaking sessions.",
    reward: 50,
    icon: "🎤",
  },

  {
    id: "sessions-10",
    type: "sessions",
    target: 10,
    title: "Regular Speaker",
    description: "Complete 10 speaking sessions.",
    reward: 100,
    icon: "🎤",
  },

  {
    id: "sessions-25",
    type: "sessions",
    target: 25,
    title: "Dedicated Speaker",
    description: "Complete 25 speaking sessions.",
    reward: 200,
    icon: "🎤",
  },

  {
    id: "sessions-50",
    type: "sessions",
    target: 50,
    title: "Speaking Habit",
    description: "Complete 50 speaking sessions.",
    reward: 400,
    icon: "🎤",
  },

  {
    id: "sessions-100",
    type: "sessions",
    target: 100,
    title: "Conversation Veteran",
    description: "Complete 100 speaking sessions.",
    reward: 750,
    icon: "🎤",
  },

  {
    id: "sessions-250",
    type: "sessions",
    target: 250,
    title: "Speaking Pro",
    description: "Complete 250 speaking sessions.",
    reward: 1500,
    icon: "🎤",
  },

  {
    id: "sessions-500",
    type: "sessions",
    target: 500,
    title: "Conversation Legend",
    description: "Complete 500 speaking sessions.",
    reward: 3000,
    icon: "👑",
  },

  // ----------------------------------------------------------
  // WORDS
  // ----------------------------------------------------------

  {
    id: "words-100",
    type: "words",
    target: 100,
    title: "First Hundred",
    description: "Speak 100 words.",
    reward: 25,
    icon: "🗣",
  },

  {
    id: "words-500",
    type: "words",
    target: 500,
    title: "Word Collector",
    description: "Speak 500 words.",
    reward: 50,
    icon: "🗣",
  },

  {
    id: "words-1000",
    type: "words",
    target: 1000,
    title: "Word Builder",
    description: "Speak 1,000 words.",
    reward: 100,
    icon: "🗣",
  },

  {
    id: "words-5000",
    type: "words",
    target: 5000,
    title: "Wordsmith",
    description: "Speak 5,000 words.",
    reward: 250,
    icon: "🗣",
  },

  {
    id: "words-10000",
    type: "words",
    target: 10000,
    title: "Voice of Experience",
    description: "Speak 10,000 words.",
    reward: 500,
    icon: "🗣",
  },

  {
    id: "words-25000",
    type: "words",
    target: 25000,
    title: "Language Builder",
    description: "Speak 25,000 words.",
    reward: 1000,
    icon: "🗣",
  },

  {
    id: "words-50000",
    type: "words",
    target: 50000,
    title: "Fluency Machine",
    description: "Speak 50,000 words.",
    reward: 2000,
    icon: "🗣",
  },

  {
    id: "words-100000",
    type: "words",
    target: 100000,
    title: "Master of Words",
    description: "Speak 100,000 words.",
    reward: 5000,
    icon: "👑",
  },

  // ----------------------------------------------------------
  // SCORE
  // ----------------------------------------------------------

  {
    id: "score-60",
    type: "score",
    target: 60,
    title: "Breaking Through",
    description: "Get your first score of 60 or higher.",
    reward: 30,
    icon: "⭐",
  },

  {
    id: "score-70",
    type: "score",
    target: 70,
    title: "Good Speaker",
    description: "Reach a speaking score of 70.",
    reward: 50,
    icon: "⭐",
  },

  {
    id: "score-80",
    type: "score",
    target: 80,
    title: "Strong Speaker",
    description: "Reach a speaking score of 80.",
    reward: 100,
    icon: "⭐",
  },

  {
    id: "score-90",
    type: "score",
    target: 90,
    title: "Excellent Speaker",
    description: "Reach a speaking score of 90.",
    reward: 200,
    icon: "⭐",
  },

  {
    id: "score-95",
    type: "score",
    target: 95,
    title: "Near Perfect",
    description: "Reach a speaking score of 95.",
    reward: 400,
    icon: "⭐",
  },

  {
    id: "score-100",
    type: "score",
    target: 100,
    title: "Perfect Score",
    description: "Achieve a perfect speaking score.",
    reward: 1000,
    icon: "👑",
  },
];

// ============================================================
// DEFAULT GAMIFICATION STATE
// ============================================================

export const DEFAULT_GAMIFICATION = {
  totalXp: 0,
  currentLevel: 1,

  totalSessions: 0,
  totalWords: 0,

  bestScore: 0,

  unlockedMilestones: [],

  dailyXp: 0,
  dailyXpDate: null,

  dailyMission: {
    date: null,
    practice: false,
    oneMinute: false,
    score80: false,
    completed: false,
  },

  weekly: {
    weekStart: null,
    sessions: 0,
    xp: 0,
  },

  lastXpAction: null,
};

// ============================================================
// LEVEL HELPERS
// ============================================================

export function getLevel(totalXp = 0) {
  return Math.floor(Math.max(0, totalXp) / 1000) + 1;
}

export function getLevelXp(totalXp = 0) {
  return Math.max(0, totalXp) % 1000;
}

export function getXpToNextLevel(totalXp = 0) {
  const levelXp = getLevelXp(totalXp);

  return levelXp === 0 ? 1000 : 1000 - levelXp;
}

export function getLevelProgress(totalXp = 0) {
  return getLevelXp(totalXp) / 1000 * 100;
}

export function getLevelTitle(level = 1) {
  if (LEVEL_TITLES[level]) {
    return LEVEL_TITLES[level];
  }

  if (level >= 50) {
    return "Speaking Immortal";
  }

  if (level >= 40) {
    return "Fluency Legend";
  }

  if (level >= 30) {
    return "Language Champion";
  }

  if (level >= 20) {
    return "Speaking Legend";
  }

  return "Speaking Explorer";
}

// ============================================================
// DATE HELPERS
// ============================================================

export function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWeekStart() {
  const date = new Date();

  const day = date.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diff);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayNumber = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${dayNumber}`;
}

// ============================================================
// NORMALIZE STATE
// ============================================================

export function normalizeGamification(data = {}) {
  const merged = {
    ...DEFAULT_GAMIFICATION,
    ...data,
  };

  merged.totalXp = Number(merged.totalXp) || 0;

  merged.currentLevel = getLevel(merged.totalXp);

  merged.totalSessions = Number(merged.totalSessions) || 0;

  merged.totalWords = Number(merged.totalWords) || 0;

  merged.bestScore = Number(merged.bestScore) || 0;

  merged.unlockedMilestones = Array.isArray(
    merged.unlockedMilestones
  )
    ? merged.unlockedMilestones
    : [];

  merged.dailyMission = {
    ...DEFAULT_GAMIFICATION.dailyMission,
    ...(merged.dailyMission || {}),
  };

  merged.weekly = {
    ...DEFAULT_GAMIFICATION.weekly,
    ...(merged.weekly || {}),
  };

  return merged;
}

// ============================================================
// XP CALCULATION
// ============================================================

export function getPracticeXp(durationSeconds = 0) {
  if (durationSeconds >= 180) {
    return XP_REWARDS.SPEAK_THREE_MINUTES;
  }

  if (durationSeconds >= 60) {
    return XP_REWARDS.SPEAK_ONE_MINUTE;
  }

  return 0;
}

// ============================================================
// MILESTONE VALUE
// ============================================================

export function getMilestoneValue(milestone, gamification) {
  switch (milestone.type) {
    case "streak":
      return Number(gamification.streak || 0);

    case "sessions":
      return Number(gamification.totalSessions || 0);

    case "words":
      return Number(gamification.totalWords || 0);

    case "score":
      return Number(gamification.bestScore || 0);

    default:
      return 0;
  }
}

// ============================================================
// CHECK MILESTONES
// ============================================================

export function getNewMilestones(gamification) {
  return MILESTONES.filter((milestone) => {
    const alreadyUnlocked =
      gamification.unlockedMilestones.includes(milestone.id);

    const value = getMilestoneValue(
      milestone,
      gamification
    );

    return !alreadyUnlocked && value >= milestone.target;
  });
}

// ============================================================
// NEXT STREAK MILESTONE
// ============================================================

export function getNextStreakMilestone(gamification) {
  const streak = Number(gamification.streak || 0);

  return (
    MILESTONES
      .filter(
        (milestone) =>
          milestone.type === "streak" &&
          !gamification.unlockedMilestones.includes(
            milestone.id
          ) &&
          milestone.target > streak
      )
      .sort((a, b) => a.target - b.target)[0] || null
  );
}

// ============================================================
// NEXT MILESTONES
// ============================================================

export function getNextMilestones(
  gamification,
  limit = 5
) {
  return MILESTONES
    .filter(
      (milestone) =>
        !gamification.unlockedMilestones.includes(
          milestone.id
        )
    )
    .map((milestone) => ({
      ...milestone,
      current: getMilestoneValue(
        milestone,
        gamification
      ),
    }))
    .sort((a, b) => {
      const aDistance = Math.max(
        0,
        a.target - a.current
      );

      const bDistance = Math.max(
        0,
        b.target - b.current
      );

      return aDistance - bDistance;
    })
    .slice(0, limit);
}

// ============================================================
// ADD XP
// ============================================================

export function addXp(gamification, amount, action = "") {
  const current = normalizeGamification(gamification);

  const safeAmount = Math.max(0, Number(amount) || 0);

  const oldLevel = getLevel(current.totalXp);

  const newTotalXp =
    current.totalXp + safeAmount;

  const newLevel = getLevel(newTotalXp);

  return {
    ...current,

    totalXp: newTotalXp,

    currentLevel: newLevel,

    lastXpAction: {
      action,
      amount: safeAmount,
      timestamp: Date.now(),
      levelUp: newLevel > oldLevel,
    },
  };
}

// ============================================================
// DAILY MISSION
// ============================================================

export function resetDailyMissionIfNeeded(gamification) {
  const today = getLocalDate();

  const current = normalizeGamification(gamification);

  if (current.dailyMission.date === today) {
    return current;
  }

  return {
    ...current,

    dailyXp: 0,

    dailyXpDate: today,

    dailyMission: {
      date: today,
      practice: false,
      oneMinute: false,
      score80: false,
      completed: false,
    },
  };
}

// ============================================================
// COMPLETE DAILY MISSION
// ============================================================

export function updateDailyMission(
  gamification,
  updates = {}
) {
  const current =
    resetDailyMissionIfNeeded(gamification);

  const mission = {
    ...current.dailyMission,
    ...updates,
  };

  const completed =
    mission.practice &&
    mission.oneMinute &&
    mission.score80;

  return {
    ...current,

    dailyMission: {
      ...mission,
      completed,
    },
  };
}

// ============================================================
// WEEKLY DATA
// ============================================================

export function resetWeeklyIfNeeded(gamification) {
  const current = normalizeGamification(gamification);

  const currentWeek = getWeekStart();

  if (current.weekly.weekStart === currentWeek) {
    return current;
  }

  return {
    ...current,

    weekly: {
      weekStart: currentWeek,
      sessions: 0,
      xp: 0,
    },
  };
}

// ============================================================
// MILESTONE REWARDS
// ============================================================

export function applyMilestones(gamification) {
  const current = normalizeGamification(gamification);

  const unlocked = getNewMilestones(current);

  if (unlocked.length === 0) {
    return {
      gamification: current,
      unlocked: [],
      bonusXp: 0,
    };
  }

  const bonusXp = unlocked.reduce(
    (total, milestone) =>
      total + Number(milestone.reward || 0),
    0
  );

  const newUnlockedIds = [
    ...current.unlockedMilestones,
    ...unlocked.map(
      (milestone) => milestone.id
    ),
  ];

  const updated = addXp(
    {
      ...current,
      unlockedMilestones: newUnlockedIds,
    },
    bonusXp,
    "milestone"
  );

  return {
    gamification: updated,
    unlocked,
    bonusXp,
  };
}

// ============================================================
// FORMAT XP
// ============================================================

export function formatXp(value = 0) {
  return Number(value || 0).toLocaleString();
}