import { useMemo, useState } from "react";

// ============================================================
// MILESTONE DEFINITIONS
// ============================================================

const MILESTONE_DEFINITIONS = {
  streak: [
    { target: 3, xp: 25 },
    { target: 7, xp: 50 },
    { target: 14, xp: 100 },
    { target: 30, xp: 200 },
    { target: 50, xp: 350 },
    { target: 75, xp: 500 },
    { target: 100, xp: 750 },
    { target: 150, xp: 1000 },
    { target: 200, xp: 1500 },
    { target: 365, xp: 2500 },
    { target: 500, xp: 4000 },
    { target: 750, xp: 6000 },
    { target: 1000, xp: 10000 },
  ],

  sessions: [
    { target: 1, xp: 25 },
    { target: 5, xp: 50 },
    { target: 10, xp: 75 },
    { target: 25, xp: 150 },
    { target: 50, xp: 300 },
    { target: 100, xp: 600 },
    { target: 250, xp: 1500 },
    { target: 500, xp: 3000 },
    { target: 1000, xp: 7500 },
  ],

  words: [
    { target: 100, xp: 25 },
    { target: 500, xp: 50 },
    { target: 1000, xp: 75 },
    { target: 2500, xp: 125 },
    { target: 5000, xp: 200 },
    { target: 10000, xp: 300 },
    { target: 25000, xp: 600 },
    { target: 50000, xp: 1000 },
    { target: 100000, xp: 2000 },
    { target: 250000, xp: 4000 },
    { target: 500000, xp: 7500 },
  ],

  bestScore: [
    { target: 60, xp: 50 },
    { target: 70, xp: 75 },
    { target: 75, xp: 100 },
    { target: 80, xp: 150 },
    { target: 85, xp: 200 },
    { target: 90, xp: 300 },
    { target: 95, xp: 500 },
    { target: 100, xp: 1000 },
  ],

  averageScore: [
    { target: 70, xp: 75 },
    { target: 75, xp: 125 },
    { target: 80, xp: 200 },
    { target: 85, xp: 300 },
    { target: 90, xp: 500 },
    { target: 95, xp: 750 },
  ],
};

// ============================================================
// SAFE NUMBER
// ============================================================

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

// ============================================================
// EXTRACT SCORE FROM HISTORY ITEM
// ============================================================

const getHistoryScore = (item) => {
  if (!item || typeof item !== "object") {
    return 0;
  }

  const possibleScores = [
    item.score,
    item.overall_score,
    item.overallScore,
    item.evaluation?.overall_score,
    item.evaluation?.overallScore,
    item.evaluation?.score,
    item.result?.overall_score,
    item.result?.overallScore,
    item.result?.score,
  ];

  for (const value of possibleScores) {
    const score = Number(value);

    if (
      Number.isFinite(score) &&
      score >= 0
    ) {
      return score;
    }
  }

  return 0;
};

// ============================================================
// EXTRACT WORD COUNT FROM HISTORY ITEM
// ============================================================

const getHistoryWordCount = (item) => {
  if (!item || typeof item !== "object") {
    return 0;
  }

  const possibleCounts = [
    item.wordCount,
    item.word_count,
    item.words,
    item.wordsSpoken,
    item.totalWords,
    item.evaluation?.wordCount,
    item.evaluation?.word_count,
    item.evaluation?.words,
  ];

  for (const value of possibleCounts) {
    const count = Number(value);

    if (
      Number.isFinite(count) &&
      count >= 0
    ) {
      return count;
    }
  }

  return 0;
};

// ============================================================
// GET NEXT MILESTONE
// ============================================================

const getNextMilestone = (
  value,
  milestones
) => {
  const safeValue = toNumber(value);

  const next = milestones.find(
    (milestone) =>
      safeValue < milestone.target
  );

  if (next) {
    return next;
  }

  const last =
    milestones[milestones.length - 1];

  if (!last) {
    return {
      target: safeValue + 1,
      xp: 100,
    };
  }

  let increment;

  if (last.target < 100) {
    increment = Math.max(
      25,
      Math.round(last.target * 0.5)
    );
  } else if (last.target < 500) {
    increment = 100;
  } else {
    increment = 500;
  }

  const nextTarget =
    last.target + increment;

  return {
    target: nextTarget,
    xp: Math.max(
      100,
      Math.round(nextTarget / 2)
    ),
  };
};

// ============================================================
// GET COMPLETED MILESTONES
// ============================================================

const getCompletedMilestones = (
  value,
  milestones,
  type
) => {
  const safeValue = toNumber(value);

  return milestones
    .filter(
      (milestone) =>
        safeValue >= milestone.target
    )
    .map((milestone) => ({
      id: `${type}-${milestone.target}`,
      type,
      target: milestone.target,
      xp: milestone.xp,
    }));
};

// ============================================================
// COMPONENT
// ============================================================

export default function Progress({
  progress = {},
  currentUser,
  onStartPractice,
  onBack,
}) {
  const [
    showMilestoneHistory,
    setShowMilestoneHistory,
  ] = useState(false);

  const gamification =
    progress?.gamification &&
    typeof progress.gamification === "object"
      ? progress.gamification
      : {};

  // ============================================================
  // HISTORY
  // ============================================================

  const history = Array.isArray(
    progress.history
  )
    ? progress.history
    : Array.isArray(gamification.history)
    ? gamification.history
    : [];

  // ============================================================
  // HISTORY-DERIVED STATISTICS
  // ============================================================

  const historyStats = useMemo(() => {
    const validScores = history
      .map(getHistoryScore)
      .filter(
        (score) =>
          Number.isFinite(score) &&
          score > 0
      );

    const calculatedAverage =
      validScores.length > 0
        ? validScores.reduce(
            (sum, score) =>
              sum + score,
            0
          ) / validScores.length
        : 0;

    const calculatedBest =
      validScores.length > 0
        ? Math.max(...validScores)
        : 0;

    const calculatedWords =
      history.reduce(
        (sum, item) =>
          sum + getHistoryWordCount(item),
        0
      );

    return {
      sessions: history.length,
      averageScore:
        calculatedAverage,
      bestScore:
        calculatedBest,
      words:
        calculatedWords,
    };
  }, [history]);

  // ============================================================
  // CORE VALUES
  // ============================================================

  const streak = Math.max(
    0,
    toNumber(
      progress.streak ??
        gamification.streak ??
        0
    )
  );

  const totalSessions = Math.max(
    0,
    toNumber(
      progress.totalSessions ??
        gamification.totalSessions ??
        progress.sessions ??
        progress.completedSessions ??
        historyStats.sessions
    )
  );

  const totalXp = Math.max(
    0,
    toNumber(
      progress.totalXp ??
        gamification.totalXp ??
        0
    )
  );

  const totalWords = Math.max(
    0,
    toNumber(
      progress.totalWords ??
        gamification.totalWords ??
        progress.wordsSpoken ??
        progress.totalWordsSpoken ??
        historyStats.words
    )
  );

  // ============================================================
  // AVERAGE SCORE
  // ============================================================

  const storedAverageScore = toNumber(
    progress.averageScore ??
      progress.avgScore ??
      gamification.averageScore ??
      0
  );

  const averageScore =
    storedAverageScore > 0
      ? storedAverageScore
      : historyStats.averageScore;

  // ============================================================
  // BEST SCORE
  // ============================================================

  const storedBestScore = toNumber(
    progress.bestScore ??
      progress.personalBest ??
      gamification.bestScore ??
      0
  );

  const bestScore =
    storedBestScore > 0
      ? storedBestScore
      : historyStats.bestScore;

  const weeklyXp = Math.max(
    0,
    toNumber(
      progress.weeklyXp ??
        gamification.weeklyXp ??
        0
    )
  );

  // ============================================================
  // TODAY
  // ============================================================

  const todayKey = useMemo(() => {
    const today = new Date();

    return [
      today.getFullYear(),
      String(
        today.getMonth() + 1
      ).padStart(2, "0"),
      String(
        today.getDate()
      ).padStart(2, "0"),
    ].join("-");
  }, []);

  const historyTodayCount = useMemo(() => {
    return history.filter((item) => {
      const rawDate =
        item?.date ||
        item?.timestamp ||
        item?.createdAt;

      if (!rawDate) {
        return false;
      }

      const date = new Date(rawDate);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return false;
      }

      const key = [
        date.getFullYear(),
        String(
          date.getMonth() + 1
        ).padStart(2, "0"),
        String(
          date.getDate()
        ).padStart(2, "0"),
      ].join("-");

      return key === todayKey;
    }).length;
  }, [history, todayKey]);

  const dailyGoal = Math.max(
    1,
    toNumber(
      progress.dailyGoal ??
        gamification.dailyGoal ??
        1
    )
  );

  const storedDailyCompleted =
    toNumber(
      progress.dailyCompleted ??
        progress.todayCompleted ??
        gamification.dailyCompleted ??
        0
    );

  const dailyCompleted = Math.max(
    historyTodayCount,
    storedDailyCompleted
  );

  const dailyProgress = Math.min(
    100,
    Math.round(
      (dailyCompleted /
        dailyGoal) *
        100
    )
  );

  // ============================================================
  // USER NAME
  // ============================================================

  const displayName =
    currentUser?.name?.split(" ")[0] ||
    currentUser?.username?.split(" ")[0] ||
    "there";

  // ============================================================
  // FORMAT NUMBER
  // ============================================================

  const formatNumber = (number) => {
    return toNumber(
      number
    ).toLocaleString();
  };

  // ============================================================
  // PROGRESS PERCENTAGE
  // ============================================================

  const getPercentage = (
    value,
    target
  ) => {
    if (!target) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (toNumber(value) /
            toNumber(target)) *
            100
        )
      )
    );
  };

  // ============================================================
  // NEXT MILESTONES
  // ============================================================

  const nextStreak =
    getNextMilestone(
      streak,
      MILESTONE_DEFINITIONS.streak
    );

  const nextSessions =
    getNextMilestone(
      totalSessions,
      MILESTONE_DEFINITIONS.sessions
    );

  const nextWords =
    getNextMilestone(
      totalWords,
      MILESTONE_DEFINITIONS.words
    );

  const nextBestScore =
    getNextMilestone(
      bestScore,
      MILESTONE_DEFINITIONS.bestScore
    );

  const nextAverageScore =
    getNextMilestone(
      averageScore,
      MILESTONE_DEFINITIONS.averageScore
    );

  // ============================================================
  // MILESTONE HISTORY
  // ============================================================

  const completedMilestones = [
    ...getCompletedMilestones(
      streak,
      MILESTONE_DEFINITIONS.streak,
      "streak"
    ),

    ...getCompletedMilestones(
      totalSessions,
      MILESTONE_DEFINITIONS.sessions,
      "sessions"
    ),

    ...getCompletedMilestones(
      totalWords,
      MILESTONE_DEFINITIONS.words,
      "words"
    ),

    ...getCompletedMilestones(
      bestScore,
      MILESTONE_DEFINITIONS.bestScore,
      "best-score"
    ),

    ...getCompletedMilestones(
      averageScore,
      MILESTONE_DEFINITIONS.averageScore,
      "average-score"
    ),
  ];

  // ============================================================
  // CURRENT REMARK
  // ============================================================

  const getMomentum = () => {
    if (totalSessions === 0) {
      return {
        title:
          "Your first session starts your baseline.",
        description:
          "Complete one speaking session and your progress will begin to take shape.",
      };
    }

    if (dailyCompleted === 0) {
      return {
        title:
          "You haven't practiced today yet.",
        description:
          "A short speaking session is enough to keep your routine moving.",
      };
    }

    const streakRemaining =
      nextStreak.target - streak;

    if (
      streakRemaining > 0 &&
      streakRemaining <= 3
    ) {
      return {
        title:
          `You're close to ${nextStreak.target} days.`,
        description:
          `${streakRemaining} more ${
            streakRemaining === 1
              ? "day"
              : "days"
          } to reach your next streak milestone.`,
      };
    }

    const sessionRemaining =
      nextSessions.target -
      totalSessions;

    if (
      sessionRemaining > 0 &&
      sessionRemaining <= 2
    ) {
      return {
        title:
          "Your next session milestone is close.",
        description:
          `${sessionRemaining} more ${
            sessionRemaining === 1
              ? "session"
              : "sessions"
          } to reach ${formatNumber(
            nextSessions.target
          )}.`,
      };
    }

    const averageRemaining =
      nextAverageScore.target -
      averageScore;

    if (
      averageScore > 0 &&
      averageRemaining > 0 &&
      averageRemaining <= 3
    ) {
      return {
        title:
          "Your average score is close to the next benchmark.",
        description:
          `You're averaging ${Math.round(
            averageScore
          )}%. Keep practicing to reach ${nextAverageScore.target}%.`,
      };
    }

    if (
      averageScore >= 85 &&
      bestScore >= 90
    ) {
      return {
        title:
          "Your speaking performance is becoming consistent.",
        description:
          "Your stronger scores are starting to become part of your normal performance.",
      };
    }

    if (bestScore >= 85) {
      return {
        title:
          "You're pushing your personal best higher.",
        description:
          `Your best score is ${Math.round(
            bestScore
          )}%. Keep building toward your next benchmark.`,
      };
    }

    if (averageScore >= 75) {
      return {
        title:
          "Your consistency is starting to show.",
        description:
          `You're averaging ${Math.round(
            averageScore
          )}%. Keep practicing to raise that baseline.`,
      };
    }

    return {
      title:
        "You're building the habit first.",
      description:
        "Regular practice gives you a stronger foundation for improving your speaking quality.",
    };
  };

  const momentum = getMomentum();

  // ============================================================
  // MILESTONE TITLE
  // ============================================================

  const getMilestoneTitle = (
    milestone
  ) => {
    if (
      milestone.type ===
      "streak"
    ) {
      return `${formatNumber(
        milestone.target
      )} Day Streak`;
    }

    if (
      milestone.type ===
      "sessions"
    ) {
      return `${formatNumber(
        milestone.target
      )} Sessions`;
    }

    if (
      milestone.type ===
      "words"
    ) {
      return `${formatNumber(
        milestone.target
      )} Words Spoken`;
    }

    if (
      milestone.type ===
      "best-score"
    ) {
      return `${milestone.target}% Best Score`;
    }

    if (
      milestone.type ===
      "average-score"
    ) {
      return `${milestone.target}% Average Score`;
    }

    return "Milestone";
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="progress-screen">

      <div className="progress-container">

        {/* ======================================================
            BACK BUTTON
        ====================================================== */}

        <button
          className="progress-back-button"
          onClick={onBack}
          type="button"
        >
          ← Back
        </button>

        {/* ======================================================
            HEADER
        ====================================================== */}

        <section className="progress-header">

          <div>

            <p className="progress-eyebrow">
              YOUR PROGRESS
            </p>

            <h1>
              Keep building,
              <br />
              <span>
                {displayName}.
              </span>
            </h1>

            <p className="progress-intro">
              Your speaking progress, practice
              and next goals in one place.
            </p>

          </div>

        </section>

        {/* ======================================================
            HERO PROGRESS
        ====================================================== */}

        <section className="progress-hero-card">

          <div className="hero-streak">

            <span className="hero-label">
              CURRENT STREAK
            </span>

            <div className="hero-streak-value">
              {formatNumber(streak)}

              <span>
                {streak === 1
                  ? "day"
                  : "days"}
              </span>
            </div>

            <p>
              {streak === 0
                ? "Start a streak today."
                : "Keep your routine going."}
            </p>

          </div>

          <div className="hero-divider" />

          <div className="hero-xp">

            <span className="hero-label">
              TOTAL XP
            </span>

            <div className="hero-xp-value">
              {formatNumber(totalXp)}
            </div>

            <p>
              {weeklyXp > 0
                ? `${formatNumber(
                    weeklyXp
                  )} XP this week`
                : "Keep practicing to earn XP"}
            </p>

          </div>

        </section>

        {/* ======================================================
            TODAY
        ====================================================== */}

        <section className="daily-practice-card">

          <div className="daily-practice-top">

            <div className="daily-practice-info">

              <span className="daily-practice-eyebrow">
                TODAY
              </span>

              <h2>
                {dailyCompleted >=
                dailyGoal
                  ? "Today's practice is complete."
                  : "Keep today's practice simple."}
              </h2>

              <p>
                {dailyCompleted >=
                dailyGoal
                  ? "You've done what you needed to do today."
                  : "One focused speaking session is enough to keep your progress moving."}
              </p>

            </div>

            <div className="practice-check">
              {dailyCompleted >=
              dailyGoal
                ? "DONE"
                : "NEXT"}
            </div>

          </div>

          <div className="practice-progress-section">

            <div className="practice-progress-header">

              <span>
                {formatNumber(
                  dailyCompleted
                )}{" "}
                of{" "}
                {formatNumber(
                  dailyGoal
                )}{" "}
                session
                {dailyGoal !== 1
                  ? "s"
                  : ""}
              </span>

              <strong>
                {dailyProgress}%
              </strong>

            </div>

            <div className="practice-progress-track">

              <div
                className="practice-progress-fill"
                style={{
                  width: `${dailyProgress}%`,
                }}
              />

            </div>

          </div>

          <div className="practice-footer">

            <div className="practice-start-text">

              {dailyCompleted >=
              dailyGoal
                ? "Daily goal complete."
                : "A short session is all you need."}

            </div>

            {dailyCompleted >=
            dailyGoal ? (

              <div className="practice-completed-message">

                <span className="completed-icon">
                  ✓
                </span>

                Completed today

              </div>

            ) : (

              <button
                className="practice-start-button"
                onClick={
                  onStartPractice
                }
                type="button"
              >
                Start practice
              </button>

            )}

          </div>

        </section>

        {/* ======================================================
            NEXT MILESTONE
        ====================================================== */}

        <section className="next-milestone-section">

          <div className="section-heading">

            <div>

              <p>
                NEXT MILESTONE
              </p>

              <h3>
                Something worth reaching
              </h3>

            </div>

          </div>

          <div className="next-milestone-card">

            <div className="next-milestone-top">

              <div>

                <span className="next-milestone-label">
                  STREAK
                </span>

                <h2>
                  {formatNumber(
                    nextStreak.target
                  )}{" "}
                  Day Streak
                </h2>

              </div>

              <div className="next-milestone-xp">
                +
                {formatNumber(
                  nextStreak.xp
                )}{" "}
                XP
              </div>

            </div>

            <div className="next-milestone-progress">

              <div className="next-milestone-numbers">

                <span>
                  {formatNumber(
                    streak
                  )}{" "}
                  days
                </span>

                <span>
                  {formatNumber(
                    nextStreak.target
                  )}{" "}
                  days
                </span>

              </div>

              <div className="next-milestone-track">

                <div
                  className="next-milestone-fill"
                  style={{
                    width: `${getPercentage(
                      streak,
                      nextStreak.target
                    )}%`,
                  }}
                />

              </div>

            </div>

            <div className="next-milestone-footer">

              <span>
                {formatNumber(
                  Math.max(
                    0,
                    nextStreak.target -
                      streak
                  )
                )}{" "}
                {nextStreak.target -
                  streak ===
                1
                  ? "day"
                  : "days"}{" "}
                to go
              </span>

              <span>
                Keep your streak alive
              </span>

            </div>

          </div>

        </section>

        {/* ======================================================
            SPEAKING OVERVIEW
        ====================================================== */}

        <section className="speaking-overview">

          <div className="section-heading">

            <div>

              <p>
                SPEAKING OVERVIEW
              </p>

              <h3>
                Your numbers
              </h3>

            </div>

          </div>

          <div className="overview-grid">

            <div className="overview-item">

              <span>
                SESSIONS
              </span>

              <strong>
                {formatNumber(
                  totalSessions
                )}
              </strong>

              <p>
                completed
              </p>

            </div>

            <div className="overview-item">

              <span>
                WORDS
              </span>

              <strong>
                {formatNumber(
                  totalWords
                )}
              </strong>

              <p>
                spoken
              </p>

            </div>

            <div className="overview-item">

              <span>
                AVERAGE
              </span>

              <strong>
                {averageScore > 0
                  ? `${Math.round(
                      averageScore
                    )}%`
                  : "—"}
              </strong>

              <p>
                speaking score
              </p>

            </div>

            <div className="overview-item">

              <span>
                BEST
              </span>

              <strong>
                {bestScore > 0
                  ? `${Math.round(
                      bestScore
                    )}%`
                  : "—"}
              </strong>

              <p>
                personal best
              </p>

            </div>

          </div>

        </section>

        {/* ======================================================
            MOMENTUM
        ====================================================== */}

        <section className="progress-insight-card">

          <div className="progress-insight-marker">
            <span />
          </div>

          <div className="progress-insight-content">

            <span className="progress-insight-label">
              RIGHT NOW
            </span>

            <h3>
              {momentum.title}
            </h3>

            <p>
              {momentum.description}
            </p>

          </div>

        </section>

        {/* ======================================================
            OTHER NEXT TARGETS
        ====================================================== */}

        <section className="other-goals-section">

          <div className="section-heading">

            <div>

              <p>
                OTHER GOALS
              </p>

              <h3>
                What you're working toward
              </h3>

            </div>

          </div>

          <div className="other-goals-list">

            {/* SESSIONS */}

            <div className="goal-row">

              <div className="goal-row-info">

                <div className="goal-row-title">
                  Sessions
                </div>

                <div className="goal-row-description">
                  {formatNumber(
                    totalSessions
                  )}{" "}
                  /{" "}
                  {formatNumber(
                    nextSessions.target
                  )}
                </div>

              </div>

              <div className="goal-row-reward">
                +
                {formatNumber(
                  nextSessions.xp
                )}{" "}
                XP
              </div>

            </div>

            {/* WORDS */}

            <div className="goal-row">

              <div className="goal-row-info">

                <div className="goal-row-title">
                  Words spoken
                </div>

                <div className="goal-row-description">
                  {formatNumber(
                    totalWords
                  )}{" "}
                  /{" "}
                  {formatNumber(
                    nextWords.target
                  )}
                </div>

              </div>

              <div className="goal-row-reward">
                +
                {formatNumber(
                  nextWords.xp
                )}{" "}
                XP
              </div>

            </div>

            {/* BEST SCORE */}

            <div className="goal-row">

              <div className="goal-row-info">

                <div className="goal-row-title">
                  Best score
                </div>

                <div className="goal-row-description">
                  {bestScore > 0
                    ? Math.round(
                        bestScore
                      )
                    : 0}
                  % /{" "}
                  {nextBestScore.target}%
                </div>

              </div>

              <div className="goal-row-reward">
                +
                {formatNumber(
                  nextBestScore.xp
                )}{" "}
                XP
              </div>

            </div>

            {/* AVERAGE SCORE */}

            <div className="goal-row">

              <div className="goal-row-info">

                <div className="goal-row-title">
                  Average score
                </div>

                <div className="goal-row-description">
                  {averageScore > 0
                    ? Math.round(
                        averageScore
                      )
                    : 0}
                  % /{" "}
                  {nextAverageScore.target}%
                </div>

              </div>

              <div className="goal-row-reward">
                +
                {formatNumber(
                  nextAverageScore.xp
                )}{" "}
                XP
              </div>

            </div>

          </div>

        </section>

        {/* ======================================================
            MILESTONE HISTORY
        ====================================================== */}

        <section className="achievements-section">

          <button
            className="milestones-toggle"
            onClick={() =>
              setShowMilestoneHistory(
                (previous) =>
                  !previous
              )
            }
            type="button"
          >

            <span>
              {showMilestoneHistory
                ? "Hide milestone history"
                : "View milestone history"}
            </span>

            <span
              className={
                showMilestoneHistory
                  ? "milestones-arrow open"
                  : "milestones-arrow"
              }
            />

          </button>

          {showMilestoneHistory && (

            <div className="achievements-list milestone-history">

              {completedMilestones.length >
              0 ? (

                completedMilestones
                  .slice()
                  .reverse()
                  .map(
                    (milestone) => (
                      <div
                        className="achievement-card unlocked"
                        key={
                          milestone.id
                        }
                      >

                        <div className="achievement-status">
                          <span />
                        </div>

                        <div className="achievement-info">

                          <div className="achievement-title-row">

                            <h4>
                              {getMilestoneTitle(
                                milestone
                              )}
                            </h4>

                            <span>
                              Completed
                            </span>

                          </div>

                          <p>
                            Milestone reached.
                          </p>

                          <div className="achievement-meta">

                            <span className="achievement-xp">
                              +
                              {formatNumber(
                                milestone.xp
                              )}{" "}
                              XP
                            </span>

                          </div>

                        </div>

                      </div>
                    )
                  )

              ) : (

                <div className="speaking-hints-empty">

                  <span>
                    —
                  </span>

                  <p>
                    Your milestone history
                    will appear here as you
                    progress.
                  </p>

                </div>

              )}

            </div>

          )}

        </section>

        {/* ======================================================
            RECENT PRACTICE
        ====================================================== */}

        <section className="recent-activity">

          <div className="recent-activity-header">

            <div>

              <p>
                RECENT PRACTICE
              </p>

              <h3>
                Your latest sessions
              </h3>

            </div>

            <span className="activity-count">
              {history.length}
            </span>

          </div>

          {history.length > 0 ? (

            <div className="activity-list">

              {[...history]
                .reverse()
                .slice(0, 5)
                .map(
                  (item, index) => {

                    const score =
                      getHistoryScore(
                        item
                      );

                    const topic =
                      item?.topic ||
                      item?.title ||
                      item?.name ||
                      "Speaking practice";

                    const rawDate =
                      item?.date ||
                      item?.timestamp ||
                      item?.createdAt ||
                      "";

                    let formattedDate =
                      "Recent";

                    if (rawDate) {

                      const date =
                        new Date(
                          rawDate
                        );

                      if (
                        !Number.isNaN(
                          date.getTime()
                        )
                      ) {
                        formattedDate =
                          date.toLocaleDateString(
                            undefined,
                            {
                              month:
                                "short",
                              day:
                                "numeric",
                            }
                          );
                      }

                    }

                    return (
                      <div
                        className="activity-item"
                        key={`${rawDate}-${index}`}
                      >

                        <div className="activity-date">
                          {formattedDate}
                        </div>

                        <div className="activity-info">

                          <div className="activity-topic">
                            {topic}
                          </div>

                          <div className="activity-meta">
                            Speaking session
                          </div>

                        </div>

                        <div className="activity-score">

                          {score > 0
                            ? `${Math.round(
                                score
                              )}%`
                            : "—"}

                        </div>

                      </div>
                    );
                  }
                )}

            </div>

          ) : (

            <div className="no-activity">

              <div className="empty-history-icon">
                <span />
              </div>

              <div>

                <h4>
                  No practice yet.
                </h4>

                <p>
                  Complete your first
                  speaking session and
                  your history will appear
                  here.
                </p>

              </div>

            </div>

          )}

        </section>

        {/* ======================================================
            BOTTOM
        ====================================================== */}

        <section className="progress-bottom-message">

          <div className="bottom-message-line" />

          <p>
            Keep practicing.
            <br />
            Let the progress speak for itself.
          </p>

        </section>

      </div>

    </main>
  );
}