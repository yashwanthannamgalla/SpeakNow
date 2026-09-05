import { useEffect, useRef, useState } from "react";
import "./App.css";

import Login from "./components/login";
import Signup from "./components/Signup";

const API_BASE_URL = "http://127.0.0.1:8000";

const CATEGORIES = [
  "All",
  "Technology",
  "Education",
  "Student Life",
  "Workplace",
  "Society",
  "Environment",
  "Health & Lifestyle",
  "Entertainment",
  "Travel",
  "General",
];

const DIFFICULTIES = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const LEARNING_GOALS = [
  "Improve Speaking",
  "Prepare for Interviews",
  "Build Vocabulary",
  "Academic English",
  "Daily Conversation",
];

const LEARN_TIME_OPTIONS = [1, 3, 5, 10, 15];
const SPEAK_TIME_OPTIONS = [1, 2, 3, 5, 10];

const SESSION_KEY = "skillenhancer_session";

let cachedSession = undefined;

// ============================================================
// EMPTY PROGRESS
// ============================================================

const createEmptyProgress = () => ({
  streak: 0,
  lastEvaluationDate: null,
  history: [],
});

// ============================================================
// GET USER
// ============================================================

const getInitialUser = () => {
  try {
    const savedUser =
      localStorage.getItem("skillenhancer_user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  } catch {
    return null;
  }
};

// ============================================================
// PROGRESS KEY
// ============================================================

const getProgressKey = (user) => {
  if (!user) {
    return null;
  }

  return `skillenhancer_progress_${
    user.id || user.email
  }`;
};

// ============================================================
// LOAD PROGRESS
// ============================================================

const loadUserProgress = (user) => {
  const key = getProgressKey(user);

  if (!key) {
    return createEmptyProgress();
  }

  try {
    const saved =
      localStorage.getItem(key);

    if (!saved) {
      return createEmptyProgress();
    }

    const parsed = JSON.parse(saved);

    return {
      streak:
        Number(parsed.streak) || 0,

      lastEvaluationDate:
        parsed.lastEvaluationDate || null,

      history:
        Array.isArray(parsed.history)
          ? parsed.history
          : [],
    };
  } catch (error) {
    console.error(
      "Failed to load progress:",
      error
    );

    return createEmptyProgress();
  }
};

// ============================================================
// SAVE USER PROGRESS
// ============================================================

const saveUserProgress = (
  user,
  progressData
) => {
  const key = getProgressKey(user);

  if (!key) {
    return;
  }

  try {
    localStorage.setItem(
      key,
      JSON.stringify(progressData)
    );

    console.log(
      "PROGRESS SAVED:",
      key,
      progressData
    );
  } catch (error) {
    console.error(
      "Failed to save progress:",
      error
    );
  }
};

// ============================================================
// PREFERENCES
// ============================================================

const getPreferencesKey = (user) => {
  if (!user) {
    return null;
  }

  return `skillenhancer_prefs_${
    user.id || user.email
  }`;
};

const loadPreferences = (user) => {
  const key =
    getPreferencesKey(user);

  if (!key) {
    return null;
  }

  try {
    const raw =
      localStorage.getItem(key);

    return raw
      ? JSON.parse(raw)
      : null;
  } catch {
    return null;
  }
};

const savePreferences = (
  user,
  preferences
) => {
  const key =
    getPreferencesKey(user);

  if (!key) {
    return;
  }

  try {
    localStorage.setItem(
      key,
      JSON.stringify(preferences)
    );
  } catch (error) {
    console.error(
      "Failed to save preferences:",
      error
    );
  }
};

// ============================================================
// SESSION
// ============================================================

const getSavedSession = () => {
  if (cachedSession !== undefined) {
    return cachedSession;
  }

  try {
    const raw =
      localStorage.getItem(
        SESSION_KEY
      );

    cachedSession =
      raw
        ? JSON.parse(raw)
        : null;
  } catch {
    cachedSession = null;
  }

  return cachedSession;
};

const clearSavedSession = () => {
  cachedSession = null;

  try {
    localStorage.removeItem(
      SESSION_KEY
    );
  } catch (error) {
    console.error(
      "Failed to clear session:",
      error
    );
  }
};

// ============================================================
// LOCAL DATE
//
// IMPORTANT:
// Do NOT use toISOString() here.
// toISOString() uses UTC and can produce
// the wrong calendar day for India.
// ============================================================

const getLocalDateString = () => {
  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// ============================================================
// DAY DIFFERENCE
// ============================================================

const getDayDifference = (
  previousDate,
  currentDate
) => {
  if (
    !previousDate ||
    !currentDate
  ) {
    return null;
  }

  const previous =
    new Date(
      `${previousDate}T00:00:00`
    );

  const current =
    new Date(
      `${currentDate}T00:00:00`
    );

  return Math.round(
    (
      current.getTime() -
      previous.getTime()
    ) /
      (1000 * 60 * 60 * 24)
  );
};

function App() {
  const initialUser =
    getInitialUser();

  const savedSession =
    getSavedSession();

  const savedPrefs =
    loadPreferences(
      initialUser
    );

  // ============================================================
  // MAIN STATE
  // ============================================================

  const [screen, setScreen] =
    useState(
      () =>
        savedSession?.screen ||
        "home"
    );

  const [isLoggedIn, setIsLoggedIn] =
    useState(
      !!localStorage.getItem(
        "skillenhancer_token"
      )
    );

  const [currentUser, setCurrentUser] =
    useState(
      () => initialUser
    );

  const [authModal, setAuthModal] =
    useState(null);

  const [settingsMessage, setSettingsMessage] =
    useState("");

  const [englishLevel, setEnglishLevel] =
    useState(
      () =>
        initialUser?.english_level ||
        savedPrefs?.englishLevel ||
        "Intermediate"
    );

  const [learningGoal, setLearningGoal] =
    useState(
      () =>
        initialUser?.learning_goal ||
        savedPrefs?.learningGoal ||
        "Improve Speaking"
    );

  const [dailyReminder, setDailyReminder] =
    useState(
      () =>
        savedPrefs?.dailyReminder ??
        false
    );

  const [autoSaveNotes, setAutoSaveNotes] =
    useState(
      () =>
        savedPrefs?.autoSaveNotes ??
        true
    );

  const [showVocabulary, setShowVocabulary] =
    useState(
      () =>
        savedPrefs?.showVocabulary ??
        true
    );

  // ============================================================
  // AUTH
  // ============================================================

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    setAuthModal(null);
    setScreen("home");

    const prefs =
      loadPreferences(user);

    if (prefs) {
      if (prefs.englishLevel) {
        setEnglishLevel(
          prefs.englishLevel
        );
      }

      if (prefs.learningGoal) {
        setLearningGoal(
          prefs.learningGoal
        );
      }

      if (prefs.defaultCategory) {
        setCategory(
          prefs.defaultCategory
        );
      }

      if (prefs.defaultDifficulty) {
        setDifficulty(
          prefs.defaultDifficulty
        );
      }

      if (prefs.defaultMode) {
        setMode(
          prefs.defaultMode
        );
      }

      if (prefs.learningTime) {
        setLearningTime(
          prefs.learningTime
        );

        setLearningRemaining(
          prefs.learningTime
        );
      }

      if (prefs.speakingTime) {
        setSpeakingTime(
          prefs.speakingTime
        );

        setSpeakingRemaining(
          prefs.speakingTime
        );
      }

      setDailyReminder(
        prefs.dailyReminder ??
          false
      );

      setAutoSaveNotes(
        prefs.autoSaveNotes ??
          true
      );

      setShowVocabulary(
        prefs.showVocabulary ??
          true
      );
    } else if (
      user.english_level
    ) {
      setEnglishLevel(
        user.english_level
      );
    }

    if (
      !prefs?.learningGoal &&
      user.learning_goal
    ) {
      setLearningGoal(
        user.learning_goal
      );
    }
  };

  const handleSignup = (user) => {
    handleLogin(user);
  };

  const handleLogout = () => {
    localStorage.removeItem(
      "skillenhancer_token"
    );

    localStorage.removeItem(
      "skillenhancer_user"
    );

    clearSavedSession();

    setCurrentUser(null);
    setIsLoggedIn(false);
    setAuthModal(null);
    setScreen("home");
    setProgress(
      createEmptyProgress()
    );
  };

  const requireLogin = () => {
    if (!isLoggedIn) {
      setAuthModal("login");
      return false;
    }

    return true;
  };

  // ============================================================
  // TOPIC
  // ============================================================

  const [topic, setTopic] =
    useState(
      () =>
        savedSession?.topic ??
        null
    );

  const [category, setCategory] =
    useState(
      () =>
        savedSession?.category ||
        savedPrefs?.defaultCategory ||
        "General"
    );

  const [difficulty, setDifficulty] =
    useState(
      () =>
        savedSession?.difficulty ||
        savedPrefs?.defaultDifficulty ||
        "Intermediate"
    );

  const [loading, setLoading] =
    useState(false);

  const [mode, setMode] =
    useState(
      () =>
        savedSession?.mode ||
        savedPrefs?.defaultMode ||
        "learn"
    );

  // ============================================================
  // EVALUATION
  // ============================================================

  const [isEvaluating, setIsEvaluating] =
    useState(false);

  const [results, setResults] =
    useState(
      () =>
        savedSession?.results ??
        null
    );

  // ============================================================
  // PROGRESS
  // ============================================================

  const [progress, setProgress] =
    useState(() =>
      loadUserProgress(
        initialUser
      )
    );

  // ============================================================
  // TIMERS
  // ============================================================

  const [learningTime, setLearningTime] =
    useState(
      () =>
        savedSession?.learningTime ??
        savedPrefs?.learningTime ??
        5 * 60
    );

  const [speakingTime, setSpeakingTime] =
    useState(
      () =>
        savedSession?.speakingTime ??
        savedPrefs?.speakingTime ??
        2 * 60
    );

  const [learningRemaining, setLearningRemaining] =
    useState(
      () =>
        savedSession?.learningRemaining ??
        savedSession?.learningTime ??
        5 * 60
    );

  const [speakingRemaining, setSpeakingRemaining] =
    useState(
      () =>
        savedSession?.speakingRemaining ??
        savedSession?.speakingTime ??
        2 * 60
    );

  const [learningRunning, setLearningRunning] =
    useState(false);

  const [speakingRunning, setSpeakingRunning] =
    useState(false);

  const learningInterval =
    useRef(null);

  const speakingInterval =
    useRef(null);

  // ============================================================
  // TIMER MENUS
  // ============================================================

  const [
    showLearningOptions,
    setShowLearningOptions,
  ] = useState(false);

  const [
    showSpeakingOptions,
    setShowSpeakingOptions,
  ] = useState(false);

  // ============================================================
  // NOTES
  // ============================================================

  const [notes, setNotes] =
    useState(
      () =>
        savedSession?.notes ||
        ""
    );

  // ============================================================
  // SPEECH
  // ============================================================

  const [transcript, setTranscript] =
    useState(
      () =>
        savedSession?.transcript ||
        ""
    );

  const [
    interimTranscript,
    setInterimTranscript,
  ] = useState("");

  const [isListening, setIsListening] =
    useState(false);

  const [speechSupported, setSpeechSupported] =
    useState(true);

  const recognitionRef =
    useRef(null);

  const transcriptRef =
    useRef(
      savedSession?.transcript ||
        ""
    );

  const shouldListenRef =
    useRef(false);

  const evaluationStartedRef =
    useRef(false);

  const pendingEvaluationRef =
    useRef(false);

  // ============================================================
  // LOAD USER PROGRESS
  //
  // Whenever the logged-in user changes,
  // load ONLY that user's progress.
  // ============================================================

  useEffect(() => {
    if (!currentUser) {
      setProgress(
        createEmptyProgress()
      );

      return;
    }

    const loadedProgress =
      loadUserProgress(
        currentUser
      );

    console.log(
      "LOADED USER PROGRESS:",
      loadedProgress
    );

    setProgress(
      loadedProgress
    );
  }, [currentUser]);

  // ============================================================
  // PERSIST SESSION
  // ============================================================

  useEffect(() => {
    const session = {
      screen,
      topic,
      category,
      difficulty,
      mode,
      notes:
        autoSaveNotes
          ? notes
          : "",
      transcript,
      learningTime,
      speakingTime,
      learningRemaining,
      speakingRemaining,
      results,
    };

    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(session)
      );

      cachedSession =
        session;
    } catch (error) {
      console.error(
        "Failed to save session:",
        error
      );
    }
  }, [
    screen,
    topic,
    category,
    difficulty,
    mode,
    notes,
    transcript,
    learningTime,
    speakingTime,
    learningRemaining,
    speakingRemaining,
    results,
    autoSaveNotes,
  ]);

  // ============================================================
  // PERSIST PREFERENCES
  // ============================================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    savePreferences(
      currentUser,
      {
        englishLevel,
        learningGoal,
        defaultCategory:
          category,
        defaultDifficulty:
          difficulty,
        defaultMode:
          mode,
        learningTime,
        speakingTime,
        dailyReminder,
        autoSaveNotes,
        showVocabulary,
      }
    );
  }, [
    currentUser,
    englishLevel,
    learningGoal,
    category,
    difficulty,
    mode,
    learningTime,
    speakingTime,
    dailyReminder,
    autoSaveNotes,
    showVocabulary,
  ]);

  // ============================================================
  // SAVE PROGRESS
  // ============================================================

  const saveProgress = (
    newProgress
  ) => {
    if (!currentUser) {
      console.warn(
        "Cannot save progress: no logged-in user."
      );

      return;
    }

    const cleanedProgress = {
      streak:
        Number(
          newProgress?.streak
        ) || 0,

      lastEvaluationDate:
        newProgress
          ?.lastEvaluationDate ||
        null,

      history:
        Array.isArray(
          newProgress?.history
        )
          ? newProgress.history
          : [],
    };

    // Update React immediately
    setProgress(
      cleanedProgress
    );

    // Persist to this user's own key
    saveUserProgress(
      currentUser,
      cleanedProgress
    );
  };

  // ============================================================
  // RECORD EVALUATION
  //
  // IMPORTANT:
  // Uses functional React state so it NEVER
  // depends on stale progress.
  //
  // Same day:
  //     streak stays the same
  //
  // Next calendar day:
  //     streak + 1
  //
  // Missed day:
  //     streak resets to 1
  // ============================================================

  const recordEvaluation = (
    evaluationResult
  ) => {
    if (!currentUser) {
      console.warn(
        "Evaluation completed but user is not logged in."
      );

      return;
    }

    const today =
      getLocalDateString();

    setProgress(
      (previousProgress) => {
        const previous =
          previousProgress ||
          createEmptyProgress();

        const lastDate =
          previous.lastEvaluationDate;

        let newStreak =
          Number(
            previous.streak
          ) || 0;

        // ------------------------------------------------------
        // FIRST EVER EVALUATION
        // ------------------------------------------------------

        if (!lastDate) {
          newStreak = 1;
        }

        // ------------------------------------------------------
        // SAME DAY
        // ------------------------------------------------------

        else if (
          lastDate === today
        ) {
          // IMPORTANT:
          // Multiple evaluations today do NOT
          // increase the streak.

          newStreak =
            Math.max(
              1,
              Number(
                previous.streak
              ) || 1
            );
        }

        // ------------------------------------------------------
        // NEW DAY
        // ------------------------------------------------------

        else {
          const difference =
            getDayDifference(
              lastDate,
              today
            );

          if (
            difference === 1
          ) {
            // Consecutive calendar day
            newStreak =
              (Number(
                previous.streak
              ) || 0) + 1;
          } else {
            // Missed one or more days
            newStreak = 1;
          }
        }

        // ------------------------------------------------------
        // CREATE HISTORY ENTRY
        // ------------------------------------------------------

        const entry = {
          id:
            `${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 8)}`,

          date: today,

          topic:
            topic?.topic ||
            "Speaking Challenge",

          category:
            topic?.category ||
            category ||
            "General",

          difficulty:
            topic?.difficulty ||
            difficulty ||
            "Intermediate",

          score:
            Number(
              evaluationResult
                ?.overall_score
            ) || 0,

          wordCount:
            Number(
              evaluationResult
                ?.speech_stats
                ?.word_count
            ) || 0,

          wpm:
            Number(
              evaluationResult
                ?.speech_stats
                ?.estimated_wpm
            ) || 0,
        };

        // ------------------------------------------------------
        // ADD NEW HISTORY ENTRY
        // ------------------------------------------------------

        const oldHistory =
          Array.isArray(
            previous.history
          )
            ? previous.history
            : [];

        const history = [
          entry,
          ...oldHistory,
        ].slice(0, 100);

        // ------------------------------------------------------
        // FINAL PROGRESS
        // ------------------------------------------------------

        const updatedProgress = {
          streak: newStreak,

          lastEvaluationDate:
            today,

          history,
        };

        // ------------------------------------------------------
        // SAVE DIRECTLY
        // ------------------------------------------------------

        saveUserProgress(
          currentUser,
          updatedProgress
        );

        console.log(
          "EVALUATION RECORDED:",
          updatedProgress
        );

        return updatedProgress;
      }
    );
  };

  // ============================================================
  // SETTINGS HELPERS
  // ============================================================

  const showSettingsNotice = (
    message
  ) => {
    setSettingsMessage(
      message
    );

    setTimeout(() => {
      setSettingsMessage("");
    }, 2500);
  };

  const updateUserProfile = (
    updates
  ) => {
    const updatedUser = {
      ...currentUser,
      ...updates,
    };

    setCurrentUser(
      updatedUser
    );

    try {
      localStorage.setItem(
        "skillenhancer_user",
        JSON.stringify(
          updatedUser
        )
      );
    } catch (error) {
      console.error(
        "Failed to update profile:",
        error
      );
    }
  };

  const handleEnglishLevelChange = (
    level
  ) => {
    setEnglishLevel(level);
    setDifficulty(level);

    updateUserProfile({
      english_level:
        level,
    });

    showSettingsNotice(
      "English level updated."
    );
  };

  const handleLearningGoalChange = (
    goal
  ) => {
    setLearningGoal(goal);

    updateUserProfile({
      learning_goal:
        goal,
    });

    showSettingsNotice(
      "Learning goal updated."
    );
  };

  const handleClearProgress = () => {
    const confirmed =
      window.confirm(
        "Clear all evaluation history and reset your streak? This cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    const empty =
      createEmptyProgress();

    saveProgress(empty);

    showSettingsNotice(
      "Progress history cleared."
    );
  };

  const handleResetSession = () => {
    const confirmed =
      window.confirm(
        "Reset your current challenge and return to home?"
      );

    if (!confirmed) {
      return;
    }

    resetChallenge();

    showSettingsNotice(
      "Current session reset."
    );
  };

  const getUserInitials = (
    name
  ) => {
    if (!name) {
      return "?";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0].toUpperCase()
      )
      .join("");
  };

  // ============================================================
  // DAILY STATS
  //
  // todayEvaluations = ARRAY
  // todayEvaluationCount = NUMBER
  //
  // NEVER render todayEvaluations directly.
  // ============================================================

  const todayString =
    getLocalDateString();

  const todayEvaluations =
    Array.isArray(
      progress.history
    )
      ? progress.history.filter(
          (item) =>
            item.date ===
            todayString
        )
      : [];

  const todayEvaluationCount =
    todayEvaluations.length;

  const todayCompleted =
    todayEvaluationCount > 0;

  const totalEvaluations =
    Array.isArray(
      progress.history
    )
      ? progress.history.length
      : 0;

  const averageScore =
    totalEvaluations > 0
      ? Math.round(
          progress.history.reduce(
            (sum, item) =>
              sum +
              (Number(
                item.score
              ) || 0),
            0
          ) /
            totalEvaluations
        )
      : 0;

  // ============================================================
  // RANDOM TOPIC
  // ============================================================

  const generateTopic =
    async () => {
      if (loading) {
        return;
      }

      setLoading(true);

      try {
        const params =
          new URLSearchParams();

        if (
          category &&
          category !== "All"
        ) {
          params.append(
            "category",
            category
          );
        }

        if (
          difficulty &&
          difficulty !== "All"
        ) {
          params.append(
            "difficulty",
            difficulty
          );
        }

        const query =
          params.toString();

        const url = query
          ? `${API_BASE_URL}/api/random-topic?${query}`
          : `${API_BASE_URL}/api/random-topic`;

        const response =
          await fetch(url, {
            method: "GET",
            cache: "no-store",
          });

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const data =
          await response.json();

        console.log(
          "DATABASE TOPIC:",
          data
        );

        if (!data.success) {
          throw new Error(
            data.message ||
              "No topic available"
          );
        }

        setTopic(
          data.topic
        );

        setCategory(
          data.topic.category ||
            "General"
        );

        setDifficulty(
          data.topic.difficulty ||
            "Intermediate"
        );

        setNotes("");
        setTranscript("");

        transcriptRef.current =
          "";

        setInterimTranscript("");

        setResults(null);

        setIsEvaluating(false);

        evaluationStartedRef.current =
          false;

        pendingEvaluationRef.current =
          false;

        setScreen("home");
      } catch (error) {
        console.error(
          "Failed to fetch topic:",
          error
        );

        alert(
          "Couldn't get a topic. Make sure your backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime = (
    seconds
  ) => {
    const min =
      Math.floor(
        seconds / 60
      );

    const sec =
      seconds % 60;

    return `${min}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  // ============================================================
  // SPEECH RECOGNITION
  // ============================================================

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(
        false
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous =
      true;

    recognition.interimResults =
      true;

    recognition.lang =
      "en-US";

    recognition.onresult = (
      event
    ) => {
      let finalText = "";
      let interimText = "";

      for (
        let i =
          event.resultIndex;
        i <
        event.results.length;
        i++
      ) {
        const text =
          event.results[i][0]
            .transcript;

        if (
          event.results[i]
            .isFinal
        ) {
          finalText +=
            text + " ";
        } else {
          interimText +=
            text;
        }
      }

      if (
        finalText.trim()
      ) {
        setTranscript(
          (previous) => {
            const cleaned =
              previous.trim();

            const updated =
              cleaned +
              (cleaned
                ? " "
                : "") +
              finalText.trim();

            transcriptRef.current =
              updated;

            return updated;
          }
        );
      }

      setInterimTranscript(
        interimText
      );
    };

    recognition.onstart = () => {
      setIsListening(
        true
      );
    };

    recognition.onerror = (
      event
    ) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      if (
        event.error ===
          "not-allowed" ||
        event.error ===
          "service-not-allowed"
      ) {
        shouldListenRef.current =
          false;

        setIsListening(
          false
        );

        alert(
          "Microphone permission was denied. Please allow microphone access."
        );
      }
    };

    recognition.onend = () => {
      setIsListening(
        false
      );

      setInterimTranscript(
        ""
      );

      if (
        shouldListenRef.current
      ) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.log(
              "Recognition restart:",
              error
            );
          }
        }, 200);

        return;
      }

      if (
        pendingEvaluationRef.current
      ) {
        pendingEvaluationRef.current =
          false;

        setTimeout(() => {
          evaluateSpeech(
            transcriptRef.current
          );
        }, 150);
      }
    };

    recognitionRef.current =
      recognition;

    return () => {
      shouldListenRef.current =
        false;

      try {
        recognition.stop();
      } catch (error) {
        console.log(error);
      }

      recognitionRef.current =
        null;
    };
  }, []);

  // ============================================================
  // GENERAL CLEANUP
  // ============================================================

  useEffect(() => {
    return () => {
      clearInterval(
        learningInterval.current
      );

      clearInterval(
        speakingInterval.current
      );

      shouldListenRef.current =
        false;

      try {
        recognitionRef.current?.stop();
      } catch (error) {
        console.log(error);
      }
    };
  }, []);

  // ============================================================
  // LEARNING TIMER
  // ============================================================

  useEffect(() => {
    clearInterval(
      learningInterval.current
    );

    if (!learningRunning) {
      return;
    }

    learningInterval.current =
      setInterval(() => {
        setLearningRemaining(
          (previous) => {
            if (previous <= 1) {
              clearInterval(
                learningInterval.current
              );

              setLearningRunning(
                false
              );

              setTimeout(() => {
                startSpeakingPhase();
              }, 300);

              return 0;
            }

            return previous - 1;
          }
        );
      }, 1000);

    return () => {
      clearInterval(
        learningInterval.current
      );
    };
  }, [learningRunning]);

  // ============================================================
  // SPEAKING TIMER
  // ============================================================

  useEffect(() => {
    clearInterval(
      speakingInterval.current
    );

    if (!speakingRunning) {
      return;
    }

    speakingInterval.current =
      setInterval(() => {
        setSpeakingRemaining(
          (previous) => {
            if (previous <= 1) {
              clearInterval(
                speakingInterval.current
              );

              setSpeakingRunning(
                false
              );

              finishSpeaking(
                true
              );

              return 0;
            }

            return previous - 1;
          }
        );
      }, 1000);

    return () => {
      clearInterval(
        speakingInterval.current
      );
    };
  }, [speakingRunning]);

  // ============================================================
  // TIMER SETTINGS
  // ============================================================

  const updateLearningTime = (
    seconds
  ) => {
    setLearningTime(
      seconds
    );

    setLearningRemaining(
      seconds
    );

    setLearningRunning(
      false
    );

    setShowLearningOptions(
      false
    );
  };

  const updateSpeakingTime = (
    seconds
  ) => {
    setSpeakingTime(
      seconds
    );

    setSpeakingRemaining(
      seconds
    );

    setSpeakingRunning(
      false
    );

    setShowSpeakingOptions(
      false
    );
  };

  // ============================================================
  // START CHALLENGE
  // ============================================================

  const startChallenge = () => {
    if (!topic) {
      alert(
        "Generate a topic first."
      );

      return;
    }

    setTranscript("");

    transcriptRef.current =
      "";

    setInterimTranscript("");

    setNotes("");

    setResults(null);

    setIsEvaluating(
      false
    );

    evaluationStartedRef.current =
      false;

    pendingEvaluationRef.current =
      false;

    setLearningRemaining(
      learningTime
    );

    setSpeakingRemaining(
      speakingTime
    );

    if (
      mode === "speak-only"
    ) {
      startSpeakingPhase();
    } else {
      setScreen(
        "learning"
      );

      setLearningRunning(
        true
      );
    }
  };

  // ============================================================
  // START SPEAKING
  // ============================================================

  const startSpeakingPhase =
    () => {
      clearInterval(
        learningInterval.current
      );

      setLearningRunning(
        false
      );

      setSpeakingRemaining(
        speakingTime
      );

      setSpeakingRunning(
        true
      );

      setScreen(
        "speaking"
      );

      setTimeout(() => {
        startListening();
      }, 500);
    };

  // ============================================================
  // LEARNING
  // ============================================================

  const skipLearning = () => {
    clearInterval(
      learningInterval.current
    );

    setLearningRunning(
      false
    );

    startSpeakingPhase();
  };

  const toggleLearningTimer =
    () => {
      setLearningRunning(
        (previous) =>
          !previous
      );
    };

  // ============================================================
  // SPEECH
  // ============================================================

  const startListening = () => {
    if (
      !recognitionRef.current
    ) {
      return;
    }

    shouldListenRef.current =
      true;

    try {
      recognitionRef.current.start();

      setIsListening(
        true
      );
    } catch (error) {
      console.log(
        "Recognition already running."
      );
    }
  };

  const stopListening = () => {
    shouldListenRef.current =
      false;

    if (
      !recognitionRef.current
    ) {
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.log(error);
    }

    setIsListening(
      false
    );

    setInterimTranscript(
      ""
    );
  };

  const toggleSpeaking = () => {
    if (isListening) {
      stopListening();

      setSpeakingRunning(
        false
      );
    } else {
      setSpeakingRunning(
        true
      );

      startListening();
    }
  };

  // ============================================================
  // FINISH SPEAKING
  // ============================================================

  const finishSpeaking = (
    fromTimer = false
  ) => {
    if (
      evaluationStartedRef.current
    ) {
      return;
    }

    clearInterval(
      speakingInterval.current
    );

    setSpeakingRunning(
      false
    );

    shouldListenRef.current =
      false;

    if (
      recognitionRef.current &&
      isListening
    ) {
      pendingEvaluationRef.current =
        true;

      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log(error);
      }

      setIsListening(
        false
      );

      setTimeout(() => {
        if (
          pendingEvaluationRef.current
        ) {
          pendingEvaluationRef.current =
            false;

          evaluateSpeech(
            transcriptRef.current
          );
        }
      }, 1200);

      return;
    }

    evaluateSpeech(
      transcriptRef.current
    );
  };

  // ============================================================
  // EVALUATION
  // ============================================================

  const evaluateSpeech =
    async (
      finalTranscript = transcript
    ) => {
      if (
        evaluationStartedRef.current
      ) {
        return;
      }

      evaluationStartedRef.current =
        true;

      const cleanTranscript =
        finalTranscript.trim();

      // ========================================================
      // NO SPEECH
      // ========================================================

      if (!cleanTranscript) {
        const emptyResult = {
          source: "local",

          overall_score: 0,

          scores: {
            grammar: null,
            vocabulary: 0,
            fluency: 0,
            clarity: 0,
            coherence: null,
            sentence_structure: 0,
            topic_relevance: null,
            naturalness: null,
          },

          speech_stats: {
            word_count: 0,
            estimated_wpm: 0,
            filler_count: 0,
            repetition_count: 0,
          },

          filler_words: [],

          repeated_words: [],

          grammar_corrections: [],

          vocabulary_upgrades: [],

          strengths: [],

          weaknesses: [
            "No speech was captured.",
          ],

          structure_analysis: {
            available: false,
            message:
              "Please try speaking again.",
          },

          coach_feedback:
            "We couldn't capture enough speech to analyze.",

          priority_improvements: [
            "Check your microphone.",
            "Speak clearly.",
          ],

          next_challenge: {
            title: "Try Again",

            description:
              "Speak for at least 30 seconds.",

            duration: 60,

            rules: [],
          },
        };

        setResults(
          emptyResult
        );

        setIsEvaluating(
          false
        );

        setScreen(
          "results"
        );

        // No progress is recorded
        // when no speech was captured.

        return;
      }

      // ========================================================
      // START EVALUATION
      // ========================================================

      setIsEvaluating(
        true
      );

      setScreen(
        "results"
      );

      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/evaluate`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                topic:
                  topic?.topic ||
                  "",

                category:
                  topic?.category ||
                  category ||
                  "",

                difficulty:
                  topic?.difficulty ||
                  difficulty ||
                  "",

                mode,

                target_duration:
                  speakingTime,

                transcript:
                  cleanTranscript,
              }),
            }
          );

        if (!response.ok) {
          throw new Error(
            `Evaluation failed: ${response.status}`
          );
        }

        const result =
          await response.json();

        console.log(
          "EVALUATION RESULT:",
          result
        );

        setResults(
          result
        );

        // ======================================================
        // RECORD SUCCESSFUL EVALUATION
        // ======================================================

        recordEvaluation(
          result
        );
      } catch (error) {
        console.error(
          "Evaluation API error:",
          error
        );

        // ========================================================
        // LOCAL FALLBACK
        // ========================================================

        const words =
          cleanTranscript
            .split(/\s+/)
            .filter(Boolean);

        const lowerWords =
          words.map(
            (word) =>
              word
                .toLowerCase()
                .replace(
                  /[.,!?]/g,
                  ""
                )
          );

        const fillerList = [
          "um",
          "uh",
          "like",
          "actually",
          "basically",
          "you know",
          "i mean",
        ];

        const fillerWords =
          fillerList
            .map((word) => {
              const count =
                lowerWords.filter(
                  (item) =>
                    item ===
                    word
                ).length;

              return {
                word,
                count,
              };
            })
            .filter(
              (item) =>
                item.count > 0
            );

        const fillerCount =
          fillerWords.reduce(
            (sum, item) =>
              sum +
              item.count,
            0
          );

        const wordCount =
          words.length;

        const uniqueWordCount =
          new Set(
            lowerWords
          ).size;

        const vocabularyScore =
          Math.min(
            100,
            Math.round(
              (
                uniqueWordCount /
                Math.max(
                  wordCount,
                  1
                )
              ) *
                130
            )
          );

        const estimatedWpm =
          Math.round(
            wordCount /
              Math.max(
                speakingTime /
                  60,
                0.1
              )
          );

        let fluencyScore =
          75;

        if (
          estimatedWpm >= 90 &&
          estimatedWpm <= 150
        ) {
          fluencyScore =
            88;
        } else if (
          estimatedWpm >= 70 &&
          estimatedWpm < 90
        ) {
          fluencyScore =
            75;
        } else if (
          estimatedWpm > 150 &&
          estimatedWpm <= 180
        ) {
          fluencyScore =
            75;
        } else {
          fluencyScore =
            60;
        }

        fluencyScore -=
          Math.min(
            25,
            fillerCount * 3
          );

        fluencyScore =
          Math.max(
            0,
            fluencyScore
          );

        const overall =
          Math.round(
            vocabularyScore *
              0.4 +
              fluencyScore *
                0.6
          );

        const fallbackResult = {
          source: "local",

          overall_score:
            overall,

          scores: {
            grammar: null,

            vocabulary:
              vocabularyScore,

            fluency:
              fluencyScore,

            clarity: 70,

            coherence: null,

            sentence_structure: 70,

            topic_relevance:
              null,

            naturalness: null,
          },

          speech_stats: {
            word_count:
              wordCount,

            estimated_wpm:
              estimatedWpm,

            filler_count:
              fillerCount,

            repetition_count: 0,
          },

          filler_words:
            fillerWords,

          repeated_words: [],

          grammar_corrections: [],

          vocabulary_upgrades: [],

          strengths: [
            "You completed the speaking challenge.",
          ],

          weaknesses:
            fillerCount > 3
              ? [
                  "Try reducing filler words.",
                ]
              : [
                  "Continue practicing vocabulary variety.",
                ],

          structure_analysis: {
            available: false,

            message:
              "Basic fallback analysis was used.",
          },

          coach_feedback:
            "AI analysis was temporarily unavailable, so basic speech metrics were used.",

          priority_improvements: [
            "Reduce filler words.",
            "Use more varied vocabulary.",
          ],

          next_challenge: {
            title:
              "Keep Practicing",

            description:
              "Speak for 90 seconds and focus on speaking naturally.",

            duration: 90,

            rules: [
              "Avoid unnecessary filler words.",
              "Use varied vocabulary.",
            ],
          },
        };

        setResults(
          fallbackResult
        );

        // ======================================================
        // RECORD FALLBACK EVALUATION
        // ======================================================

        recordEvaluation(
          fallbackResult
        );
      } finally {
        setIsEvaluating(
          false
        );
      }
    };

  // ============================================================
  // RESET
  // ============================================================

  const resetChallenge = () => {
    clearInterval(
      learningInterval.current
    );

    clearInterval(
      speakingInterval.current
    );

    shouldListenRef.current =
      false;

    pendingEvaluationRef.current =
      false;

    evaluationStartedRef.current =
      false;

    try {
      recognitionRef.current?.stop();
    } catch (error) {
      console.log(error);
    }

    setLearningRunning(
      false
    );

    setSpeakingRunning(
      false
    );

    setIsListening(
      false
    );

    setTranscript("");

    transcriptRef.current =
      "";

    setInterimTranscript("");

    setNotes("");

    setResults(null);

    setIsEvaluating(
      false
    );

    setLearningRemaining(
      learningTime
    );

    setSpeakingRemaining(
      speakingTime
    );

    setScreen("home");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="app">

      <div className="noise"></div>

      <div className="glow glow-one"></div>

      <div className="glow glow-two"></div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="header">

        <div
          className="logo"
          onClick={resetChallenge}
        >
          Speak<span>Up</span>
        </div>

        <div className="header-right">

          <div className="streak">

            <span className="streak-dot"></span>

            {isLoggedIn
              ? `${progress.streak || 0} day streak`
              : "Keep practicing"}

          </div>

          {/* PROGRESS */}

          <button
            className="header-button"
            onClick={() => {
              if (!requireLogin()) {
                return;
              }

              setScreen(
                "progress"
              );
            }}
          >
            Progress
          </button>

          {/* SETTINGS */}

          <button
            className="icon-button"
            onClick={() => {
              if (!requireLogin()) {
                return;
              }

              setScreen(
                "settings"
              );
            }}
            title="Settings"
          >
            ⚙
          </button>

          {/* LOGIN / USER */}

          {!isLoggedIn ? (

            <button
              className="login-nav-btn"
              onClick={() =>
                setAuthModal(
                  "login"
                )
              }
            >
              Log in
            </button>

          ) : (

            <div className="user-menu">

              <span className="user-name">
                {currentUser?.name}
              </span>

              <button
                className="logout-nav-btn"
                onClick={
                  handleLogout
                }
              >
                Log out
              </button>

            </div>

          )}

        </div>

      </header>

      {/* ======================================================
          HOME
      ====================================================== */}

      {screen === "home" && (

        <section className="hero">

          <div className="status">

            {loading
              ? "GETTING TOPIC"
              : "READY FOR YOUR NEXT CHALLENGE"}

          </div>

          {/* MODE */}

          <div className="mode-switch">

            <button
              className={
                mode === "learn"
                  ? "mode-active"
                  : ""
              }
              onClick={() =>
                setMode("learn")
              }
            >
              Learn + Speak
            </button>

            <button
              className={
                mode === "speak-only"
                  ? "mode-active"
                  : ""
              }
              onClick={() =>
                setMode(
                  "speak-only"
                )
              }
            >
              Speak Only
            </button>

          </div>

          {/* CATEGORY */}

          <div className="category-row">

            <div className="category-wrapper">

              <button
                className="category"
                onClick={() => {

                  const currentIndex =
                    CATEGORIES.indexOf(
                      category
                    );

                  const nextIndex =
                    (
                      currentIndex +
                      1
                    ) %
                    CATEGORIES.length;

                  setCategory(
                    CATEGORIES[
                      nextIndex
                    ]
                  );

                }}
              >

                <span>
                  ✦
                </span>

                {category}

                <span className="category-arrow">
                  ⌄
                </span>

              </button>

            </div>

          </div>

          {/* TOPIC */}

          <div className="topic-area">

            {topic ? (

              <>

                <p className="topic-label">
                  YOUR NEXT CHALLENGE
                </p>

                <h1>
                  {topic.topic}
                </h1>

                <p className="description">
                  {topic.description}
                </p>

                {topic.questions &&
                  topic.questions.length >
                    0 && (

                    <div className="question-list">

                      {topic.questions.map(
                        (
                          question,
                          index
                        ) => (

                          <div
                            className="question-item"
                            key={index}
                          >

                            <span>
                              0
                              {index + 1}
                            </span>

                            <p>
                              {question}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  )}

              </>

            ) : (

              <>

                <p className="topic-label">
                  READY
                </p>

                <h1>
                  What will you
                  <br />
                  talk about?
                </h1>

                <p className="description">
                  Get a topic, prepare your
                  thoughts, then speak your
                  mind.
                </p>

              </>

            )}

          </div>

          {/* DIFFICULTY */}

          <div className="difficulty">

            <span className="level-label">
              LEVEL
            </span>

            {DIFFICULTIES.map(
              (level) => (

                <button
                  key={level}
                  className={
                    difficulty === level
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setDifficulty(
                      level
                    )
                  }
                >
                  {level}
                </button>

              )
            )}

          </div>

          {/* CONTROLS */}

          <div className="controls">

            <button
              className="primary-button"
              onClick={
                generateTopic
              }
              disabled={loading}
            >

              <span className="refresh-icon">
                ↻
              </span>

              {loading
                ? "Getting Topic..."
                : "Random Topic"}

            </button>

            {/* LEARNING TIMER */}

            {mode === "learn" && (

              <div className="timer-control">

                <button
                  className="timer-main"
                  onClick={() =>
                    setShowLearningOptions(
                      (previous) =>
                        !previous
                    )
                  }
                >

                  <span>
                    LEARN
                  </span>

                  <strong>
                    {formatTime(
                      learningTime
                    )}
                  </strong>

                  <small>
                    ⌄
                  </small>

                </button>

                {showLearningOptions && (

                  <div className="timer-menu">

                    <p>
                      Learning time
                    </p>

                    {[
                      1,
                      3,
                      5,
                      10,
                      15,
                    ].map(
                      (min) => (

                        <button
                          key={min}
                          onClick={() =>
                            updateLearningTime(
                              min * 60
                            )
                          }
                        >
                          {min} min
                        </button>

                      )
                    )}

                    <input
                      type="number"
                      min="1"
                      placeholder="Custom minutes"
                      onKeyDown={(
                        event
                      ) => {

                        if (
                          event.key ===
                          "Enter"
                        ) {

                          const value =
                            Number(
                              event.target
                                .value
                            );

                          if (
                            value > 0
                          ) {

                            updateLearningTime(
                              value * 60
                            );

                          }

                        }

                      }}
                    />

                  </div>

                )}

              </div>

            )}

            {/* SPEAKING TIMER */}

            <div className="timer-control">

              <button
                className="timer-main"
                onClick={() =>
                  setShowSpeakingOptions(
                    (previous) =>
                      !previous
                  )
                }
              >

                <span>
                  SPEAK
                </span>

                <strong>
                  {formatTime(
                    speakingTime
                  )}
                </strong>

                <small>
                  ⌄
                </small>

              </button>

              {showSpeakingOptions && (

                <div className="timer-menu">

                  <p>
                    Speaking time
                  </p>

                  {[
                    1,
                    2,
                    3,
                    5,
                    10,
                  ].map(
                    (min) => (

                      <button
                        key={min}
                        onClick={() =>
                          updateSpeakingTime(
                            min * 60
                          )
                        }
                      >
                        {min} min
                      </button>

                    )
                  )}

                  <input
                    type="number"
                    min="1"
                    placeholder="Custom minutes"
                    onKeyDown={(
                      event
                    ) => {

                      if (
                        event.key ===
                        "Enter"
                      ) {

                        const value =
                          Number(
                            event.target
                              .value
                          );

                        if (
                          value > 0
                        ) {

                          updateSpeakingTime(
                            value * 60
                          );

                        }

                      }

                    }}
                  />

                </div>

              )}

            </div>

          </div>

          {/* START */}

          <button
            className="start-button"
            onClick={
              startChallenge
            }
            disabled={
              !topic ||
              loading
            }
          >

            Start Challenge

            <span>
              →
            </span>

          </button>

          {!topic && (

            <button
              className="generate-first"
              onClick={
                generateTopic
              }
            >
              Generate your first topic
            </button>

          )}

        </section>

      )}

      {/* ======================================================
          LEARNING
      ====================================================== */}

      {screen === "learning" &&
        topic && (

          <section className="challenge-screen">

            <div className="challenge-top">

              <button
                className="back-button"
                onClick={
                  resetChallenge
                }
              >
                ← Exit
              </button>

              <div className="phase-indicator">

                <span className="active">
                  01 Learn
                </span>

                <span>
                  02 Speak
                </span>

                <span>
                  03 Results
                </span>

              </div>

            </div>

            <div className="learning-layout">

              <div className="learning-main">

                <p className="topic-label">
                  PREPARE YOUR THOUGHTS
                </p>

                <h2>
                  {topic.topic}
                </h2>

                <p className="large-description">
                  {topic.description}
                </p>

                <div className="big-timer">

                  <div className="timer-label">
                    PREPARATION TIME
                  </div>

                  <div className="timer-number">
                    {formatTime(
                      learningRemaining
                    )}
                  </div>

                  <div className="timer-progress">

                    <div
                      style={{
                        width: `${
                          learningTime >
                          0
                            ? (
                                learningRemaining /
                                learningTime
                              ) *
                              100
                            : 0
                        }%`,
                      }}
                    />

                  </div>

                  <div className="timer-actions">

                    <button
                      className="pause-button"
                      onClick={
                        toggleLearningTimer
                      }
                    >
                      {learningRunning
                        ? "Pause"
                        : "Resume"}
                    </button>

                    <button
                      className="skip-button"
                      onClick={
                        skipLearning
                      }
                    >
                      Skip to Speak →
                    </button>

                  </div>

                </div>

              </div>

              <aside className="learning-sidebar">

                <div className="side-card">

                  <div className="side-card-title">
                    THINK ABOUT
                  </div>

                  {topic.questions?.map(
                    (
                      question,
                      index
                    ) => (

                      <div
                        className="side-question"
                        key={index}
                      >

                        <span>
                          {index + 1}
                        </span>

                        {question}

                      </div>

                    )
                  )}

                </div>

                {showVocabulary &&
                  topic.useful_vocabulary?.length >
                    0 && (

                    <div className="side-card">

                      <div className="side-card-title">
                        USEFUL VOCABULARY
                      </div>

                      <div className="vocabulary">

                        {topic.useful_vocabulary?.map(
                          (
                            word,
                            index
                          ) => (

                            <span
                              key={index}
                            >
                              {word}
                            </span>

                          )
                        )}

                      </div>

                    </div>

                  )}

                <div className="side-card notes-card">

                  <div className="side-card-title">
                    YOUR NOTES
                  </div>

                  <textarea
                    value={notes}
                    onChange={(
                      event
                    ) =>
                      setNotes(
                        event.target
                          .value
                      )
                    }
                    placeholder="Jot down ideas, examples or words you want to use..."
                  />

                </div>

              </aside>

            </div>

          </section>

        )}

      {/* ======================================================
          SPEAKING
      ====================================================== */}

      {screen === "speaking" &&
        topic && (

          <section className="challenge-screen speaking-screen">

            <div className="challenge-top">

              <button
                className="back-button"
                onClick={() => {

                  stopListening();

                  setSpeakingRunning(
                    false
                  );

                  setScreen(
                    "home"
                  );

                }}
              >
                ← Exit
              </button>

              <div className="phase-indicator">

                <span>
                  01 Learn
                </span>

                <span className="active">
                  02 Speak
                </span>

                <span>
                  03 Results
                </span>

              </div>

            </div>

            <div className="speaking-header">

              <p className="topic-label">
                YOUR TURN
              </p>

              <h2>
                {topic.topic}
              </h2>

              <p>
                Speak naturally. Don't
                worry about mistakes.
                Keep your ideas flowing.
              </p>

            </div>

            <div className="speaking-timer">

              <div className="timer-ring">

                <div className="ring-inner">

                  <span>
                    TIME LEFT
                  </span>

                  <strong>
                    {formatTime(
                      speakingRemaining
                    )}
                  </strong>

                </div>

              </div>

            </div>

            <div
              className={`mic-container ${
                isListening
                  ? "listening"
                  : ""
              }`}
            >

              <div className="mic-pulse"></div>

              <button
                className="mic-button"
                onClick={
                  toggleSpeaking
                }
              >

                {isListening
                  ? "Ⅱ"
                  : "●"}

              </button>

            </div>

            <div className="listening-status">

              <span
                className={
                  isListening
                    ? "status-live"
                    : ""
                }
              ></span>

              {isListening
                ? "Listening..."
                : "Paused"}

            </div>

            {!speechSupported && (

              <div className="speech-warning">

                Your browser doesn't support
                speech recognition. You can
                still type your response below.

              </div>

            )}

            <div className="transcript-card">

              <div className="transcript-header">

                <span>
                  LIVE TRANSCRIPT
                </span>

                <span>

                  {transcript
                    ? `${
                        transcript
                          .trim()
                          .split(
                            /\s+/
                          )
                          .filter(
                            Boolean
                          )
                          .length
                      } words`
                    : "0 words"}

                </span>

              </div>

              <div className="transcript-body">

                {transcript && (
                  <span>
                    {transcript}
                  </span>
                )}

                {interimTranscript && (
                  <span className="interim-text">
                    {" "}
                    {
                      interimTranscript
                    }
                  </span>
                )}

                {!transcript &&
                  !interimTranscript && (
                    <span className="transcript-placeholder">
                      Start speaking and your
                      words will appear here...
                    </span>
                  )}

              </div>

            </div>

            <button
              className="finish-button"
              onClick={() =>
                finishSpeaking(
                  false
                )
              }
              disabled={
                isEvaluating
              }
            >

              Finish & Evaluate

              <span>
                →
              </span>

            </button>

          </section>

        )}

      {/* ======================================================
          RESULTS
      ====================================================== */}

      {screen === "results" && (

        <section className="results-screen">

          <div className="results-header">

            <div>

              <p className="topic-label">
                CHALLENGE COMPLETE
              </p>

              <h2>
                {isEvaluating
                  ? "Analyzing your speaking..."
                  : "Here's how you did."}
              </h2>

              {topic && (
                <p>
                  {topic.topic}
                </p>
              )}

            </div>

            {!isEvaluating && (

              <button
                className="back-button"
                onClick={
                  resetChallenge
                }
              >
                ← New Challenge
              </button>

            )}

          </div>

          {isEvaluating ? (

            <div className="evaluation-loading">

              <div className="loading-orbit"></div>

              <h3>
                Analyzing your speech
              </h3>

              <p>
                Checking grammar,
                vocabulary, fluency,
                clarity and sentence structure...
              </p>

              <div className="analysis-status">

                <span></span>

                AI Coach is working

              </div>

            </div>

          ) : results ? (

            <>

              <div className="analysis-source">

                {results.source ===
                "cohere"
                  ? "AI ANALYSIS · COHERE"
                  : results.source ===
                    "gemini"
                  ? "AI ANALYSIS"
                  : "BASIC ANALYSIS · LOCAL FALLBACK"}

              </div>

              <div className="score-section">

                <div className="overall-score">

                  <span>
                    OVERALL
                  </span>

                  <strong>
                    {results.overall_score ??
                      0}
                  </strong>

                  <small>
                    /100
                  </small>

                </div>

                <div className="score-message">

                  <h3>

                    {(results.overall_score ??
                      0) >= 80
                      ? "Strong work."
                      : (results.overall_score ??
                          0) >= 60
                      ? "Good progress."
                      : "Keep going."}

                  </h3>

                  <p>
                    {results.coach_feedback ||
                      "Keep practicing and continue improving."}
                  </p>

                </div>

              </div>

              <div className="metrics">

                <Metric
                  title="Grammar"
                  score={
                    results.scores
                      ?.grammar
                  }
                />

                <Metric
                  title="Vocabulary"
                  score={
                    results.scores
                      ?.vocabulary
                  }
                />

                <Metric
                  title="Fluency"
                  score={
                    results.scores
                      ?.fluency
                  }
                />

                <Metric
                  title="Clarity"
                  score={
                    results.scores
                      ?.clarity
                  }
                />

                <Metric
                  title="Coherence"
                  score={
                    results.scores
                      ?.coherence
                  }
                />

                <Metric
                  title="Structure"
                  score={
                    results.scores
                      ?.sentence_structure
                  }
                />

              </div>

              <div className="speech-stats">

                <div>
                  <strong>
                    {results.speech_stats
                      ?.word_count ??
                      0}
                  </strong>

                  <span>
                    Words spoken
                  </span>
                </div>

                <div>
                  <strong>
                    {results.speech_stats
                      ?.estimated_wpm ??
                      0}
                  </strong>

                  <span>
                    Estimated WPM
                  </span>
                </div>

                <div>
                  <strong>
                    {results.speech_stats
                      ?.filler_count ??
                      0}
                  </strong>

                  <span>
                    Filler words
                  </span>
                </div>

                <div>
                  <strong>
                    {results.speech_stats
                      ?.repetition_count ??
                      0}
                  </strong>

                  <span>
                    Repetitions
                  </span>
                </div>

              </div>

              <div className="feedback-grid">

                <div className="feedback-card">

                  <h3>
                    What went well
                  </h3>

                  {results.strengths?.length ? (

                    results.strengths.map(
                      (
                        item,
                        index
                      ) => (

                        <div
                          className="feedback-item"
                          key={index}
                        >

                          <span>
                            +
                          </span>

                          {item}

                        </div>

                      )
                    )

                  ) : (

                    <div className="feedback-item">

                      <span>
                        +
                      </span>

                      Keep practicing
                      consistently.

                    </div>

                  )}

                </div>

                <div className="feedback-card">

                  <h3>
                    Work on next
                  </h3>

                  {(
                    results.priority_improvements
                      ?.length
                      ? results.priority_improvements
                      : results.weaknesses || []
                  ).map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        className="feedback-item"
                        key={index}
                      >

                        <span>
                          →
                        </span>

                        {item}

                      </div>

                    )
                  )}

                </div>

              </div>

              {results.filler_words
                ?.length > 0 && (

                <div className="corrections">

                  <div className="section-heading">

                    <div>

                      <p>
                        FLUENCY
                      </p>

                      <h3>
                        Filler words to reduce
                      </h3>

                    </div>

                  </div>

                  <div className="vocabulary">

                    {results.filler_words.map(
                      (
                        item,
                        index
                      ) => (

                        <span
                          key={index}
                        >
                          {item.word} ×
                          {item.count}
                        </span>

                      )
                    )}

                  </div>

                </div>

              )}

              {results.repeated_words
                ?.length > 0 && (

                <div className="corrections">

                  <div className="section-heading">

                    <div>

                      <p>
                        VOCABULARY
                      </p>

                      <h3>
                        Words you repeated
                      </h3>

                    </div>

                  </div>

                  <div className="vocabulary">

                    {results.repeated_words.map(
                      (
                        item,
                        index
                      ) => (

                        <span
                          key={index}
                        >
                          {item.word} ×
                          {item.count}
                        </span>

                      )
                    )}

                  </div>

                </div>

              )}

              {results.grammar_corrections
                ?.length > 0 && (

                <div className="corrections">

                  <div className="section-heading">

                    <div>

                      <p>
                        AI COACH
                      </p>

                      <h3>
                        Make your sentences stronger
                      </h3>

                    </div>

                  </div>

                  {results.grammar_corrections.map(
                    (
                      correction,
                      index
                    ) => (

                      <div
                        className="correction"
                        key={index}
                      >

                        <div>

                          <span>
                            ORIGINAL
                          </span>

                          <p>
                            {
                              correction.original
                            }
                          </p>

                        </div>

                        <div className="arrow">
                          →
                        </div>

                        <div>

                          <span>
                            BETTER
                          </span>

                          <p>
                            {
                              correction.corrected ??
                              correction.better
                            }
                          </p>

                        </div>

                        {correction.explanation && (

                          <div className="correction-explanation">

                            <span>
                              WHY
                            </span>

                            <p>
                              {
                                correction.explanation
                              }
                            </p>

                          </div>

                        )}

                      </div>

                    )
                  )}

                </div>

              )}

              {results.vocabulary_upgrades
                ?.length > 0 && (

                <div className="corrections">

                  <div className="section-heading">

                    <div>

                      <p>
                        VOCABULARY
                      </p>

                      <h3>
                        Upgrade your vocabulary
                      </h3>

                    </div>

                  </div>

                  {results.vocabulary_upgrades.map(
                    (
                      item,
                      index
                    ) => (

                      <div
                        className="correction"
                        key={index}
                      >

                        <div>

                          <span>
                            YOU USED
                          </span>

                          <p>
                            {item.used}
                          </p>

                        </div>

                        <div className="arrow">
                          →
                        </div>

                        <div>

                          <span>
                            TRY
                          </span>

                          <p>
                            {item.better}
                          </p>

                        </div>

                        {item.reason && (

                          <div className="correction-explanation">

                            <span>
                              WHY
                            </span>

                            <p>
                              {item.reason}
                            </p>

                          </div>

                        )}

                      </div>

                    )
                  )}

                </div>

              )}

              {results.next_challenge && (

                <div className="next-challenge-card">

                  <p className="topic-label">
                    YOUR NEXT MOVE
                  </p>

                  <h3>
                    {results.next_challenge.title}
                  </h3>

                  <p>
                    {results.next_challenge.description}
                  </p>

                  {results.next_challenge.rules
                    ?.length > 0 && (

                    <div className="challenge-rules">

                      {results.next_challenge.rules.map(
                        (
                          rule,
                          index
                        ) => (

                          <span
                            key={index}
                          >
                            {rule}
                          </span>

                        )
                      )}

                    </div>

                  )}

                </div>

              )}

              <div className="results-actions">

                <button
                  className="primary-button"
                  onClick={
                    generateTopic
                  }
                  disabled={loading}
                >
                  ↻ Another Topic
                </button>

                <button
                  className="start-button small"
                  onClick={
                    resetChallenge
                  }
                >

                  Practice Again

                  <span>
                    →
                  </span>

                </button>

              </div>

            </>

          ) : (

            <div className="evaluation-loading">

              <h3>
                No evaluation available
              </h3>

              <p>
                Try the speaking challenge again.
              </p>

            </div>

          )}

        </section>

      )}

      {/* ======================================================
          PROGRESS
      ====================================================== */}

      {screen === "progress" && (

        <main className="progress-screen">

          {/* HEADER */}

          <div className="progress-screen-header">

            <div>

              <p className="topic-label">
                YOUR PROGRESS
              </p>

              <h1>
                Keep your speaking streak alive.
              </h1>

              <p>
                Nice work,{" "}
                {currentUser?.name ||
                  "there"}.
                Keep practicing every day to build your confidence.
              </p>

            </div>

            <button
              className="back-button"
              onClick={() =>
                setScreen("home")
              }
            >
              ← Back
            </button>

          </div>

          {/* STAT CARDS */}

          <div className="progress-stats">

            {/* STREAK */}

            <div className="progress-stat-card">

              <div className="progress-stat-label">
                Current streak
              </div>

              <div className="progress-stat-value">
                {progress.streak ||
                  0}
              </div>

              <div className="progress-stat-subtitle">
                {progress.streak ===
                1
                  ? "day"
                  : "days"}
              </div>

            </div>

            {/* TODAY */}

            <div className="progress-stat-card">

              <div className="progress-stat-label">
                Today
              </div>

              <div className="progress-stat-value">
                {todayEvaluationCount}
              </div>

              <div className="progress-stat-subtitle">
                {todayEvaluationCount ===
                1
                  ? "evaluation"
                  : "evaluations"}
              </div>

            </div>

            {/* TOTAL */}

            <div className="progress-stat-card">

              <div className="progress-stat-label">
                Total
              </div>

              <div className="progress-stat-value">
                {totalEvaluations}
              </div>

              <div className="progress-stat-subtitle">
                {totalEvaluations ===
                1
                  ? "evaluation"
                  : "evaluations"}
              </div>

            </div>

            {/* AVERAGE */}

            <div className="progress-stat-card">

              <div className="progress-stat-label">
                Average
              </div>

              <div className="progress-stat-value">
                {averageScore}
              </div>

              <div className="progress-stat-subtitle">
                /100
              </div>

            </div>

          </div>

    {/* DAILY PRACTICE */}

    <section className="daily-practice-card">

      <div className="daily-practice-top">

        <div className="daily-practice-info">

          <span className="daily-practice-eyebrow">
            TODAY'S PRACTICE
          </span>

          <h2>
            Build your speaking habit.
          </h2>

          <p>
            Complete one speaking evaluation today
            to keep your progress moving.
          </p>

        </div>

        <div
          className={
            todayCompleted
              ? "practice-check completed"
              : "practice-check"
          }
        >
          {todayCompleted ? "✓" : "1"}
        </div>

      </div>


      <div className="practice-progress-section">

        <div className="practice-progress-header">

          <span>
            Daily goal
          </span>

          <strong>
            {todayCompleted ? "1 / 1" : "0 / 1"}
          </strong>

        </div>

        <div className="practice-progress-track">

          <div
            className="practice-progress-fill"
            style={{
              width:
                todayCompleted
                  ? "100%"
                  : "0%",
            }}
          />

        </div>

      </div>


      <div className="practice-footer">

        {todayCompleted ? (

          <div className="practice-completed-message">

            <div className="completed-icon">
              ✓
            </div>

            <div>
              <strong>
                Practice complete
              </strong>

              <span>
                Great job — you've done today's speaking practice.
              </span>
            </div>

          </div>

        ) : (

          <div className="practice-start">

            <div className="practice-start-text">

              <strong>
                Ready to speak?
              </strong>

              <span>
                Take a few minutes to practice your English.
              </span>

            </div>

            <button
              className="practice-start-button"
              onClick={() =>
                setScreen("home")
              }
            >
              Start Practice
              <span>→</span>
            </button>

          </div>

        )}

      </div>

    </section>

          {/* RECENT ACTIVITY */}

          <section className="recent-activity">

            <div className="recent-activity-header">

              <div>

                <p className="topic-label">
                  RECENT ACTIVITY
                </p>

                <h2>
                  Your speaking history
                </h2>

              </div>

              {totalEvaluations >
                0 && (

                <span className="activity-count">
                  {totalEvaluations}{" "}
                  {totalEvaluations ===
                  1
                    ? "session"
                    : "sessions"}
                </span>

              )}

            </div>

            {totalEvaluations >
            0 ? (

              <div className="activity-list">

                {progress.history
                  .slice(0, 10)
                  .map(
                    (item) => (

                      <div
                        className="activity-item"
                        key={item.id}
                      >

                        <div className="activity-date">
                          {item.date}
                        </div>

                        <div className="activity-info">

                          <div className="activity-topic">
                            {item.topic}
                          </div>

                          <div className="activity-meta">
                            {item.category ||
                              "General"}

                            {" · "}

                            {item.difficulty ||
                              "Beginner"}

                            {item.wpm
                              ? ` · ${item.wpm} WPM`
                              : ""}
                          </div>

                        </div>

                        <div className="activity-score">

                          {item.score}

                          <span>
                            /100
                          </span>

                        </div>

                      </div>

                    )
                  )}

              </div>

            ) : (

              <div className="no-activity">

                <div className="empty-history-icon">
                  ○
                </div>

                <h3>
                  No evaluations yet.
                </h3>

                <p>
                  Complete your first speaking challenge
                  and your progress will appear here.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    setScreen(
                      "home"
                    )
                  }
                >
                  Start First Evaluation →
                </button>

              </div>

            )}

          </section>

        </main>

      )}

      {/* ======================================================
          SETTINGS
      ====================================================== */}

      {screen === "settings" && (

        <main className="settings-screen">

          <div className="settings-screen-header">

            <div>

              <p className="topic-label">
                SETTINGS
              </p>

              <h1>
                Customize your practice
              </h1>

              <p>
                Manage your profile, defaults, and preferences
                so every session fits how you learn.
              </p>

            </div>

            <button
              className="back-button"
              onClick={() =>
                setScreen("home")
              }
            >
              ← Back
            </button>

          </div>

          {settingsMessage && (

            <div className="settings-notice">
              {settingsMessage}
            </div>

          )}

          <div className="settings-layout">

            {/* PROFILE */}

            <section className="settings-card settings-profile-card">

              <div className="settings-profile-top">

                <div className="settings-avatar">
                  {getUserInitials(
                    currentUser?.name
                  )}
                </div>

                <div className="settings-profile-info">

                  <h2>
                    {currentUser?.name ||
                      "User"}
                  </h2>

                  <p>
                    {currentUser?.email ||
                      "—"}
                  </p>

                  <span className="settings-member-badge">
                    {englishLevel} ·{" "}
                    {learningGoal}
                  </span>

                </div>

              </div>

              <div className="settings-profile-stats">

                <div>

                  <strong>
                    {progress.streak ||
                      0}
                  </strong>

                  <span>
                    Day streak
                  </span>

                </div>

                <div>

                  <strong>
                    {totalEvaluations}
                  </strong>

                  <span>
                    Evaluations
                  </span>

                </div>

                <div>

                  <strong>
                    {averageScore ||
                      "—"}
                  </strong>

                  <span>
                    Avg score
                  </span>

                </div>

              </div>

            </section>

            {/* LEARNING PROFILE */}

            <section className="settings-card">

              <div className="settings-card-header">

                <h2>
                  Learning profile
                </h2>

                <p>
                  Helps tailor topic difficulty and feedback.
                </p>

              </div>

              <div className="settings-field">

                <label>
                  English level
                </label>

                <div className="settings-chip-group">

                  {DIFFICULTIES.map(
                    (level) => (

                      <button
                        key={level}
                        type="button"
                        className={
                          englishLevel ===
                          level
                            ? "settings-chip active"
                            : "settings-chip"
                        }
                        onClick={() =>
                          handleEnglishLevelChange(
                            level
                          )
                        }
                      >
                        {level}
                      </button>

                    )
                  )}

                </div>

              </div>

              <div className="settings-field">

                <label>
                  Learning goal
                </label>

                <select
                  className="settings-select"
                  value={
                    learningGoal
                  }
                  onChange={(
                    event
                  ) =>
                    handleLearningGoalChange(
                      event.target
                        .value
                    )
                  }
                >

                  {LEARNING_GOALS.map(
                    (goal) => (

                      <option
                        key={goal}
                        value={goal}
                      >
                        {goal}
                      </option>

                    )
                  )}

                </select>

              </div>

            </section>

            {/* PRACTICE DEFAULTS */}

            <section className="settings-card">

              <div className="settings-card-header">

                <h2>
                  Practice defaults
                </h2>

                <p>
                  Applied when you start a new challenge.
                </p>

              </div>

              <div className="settings-field">

                <label>
                  Default category
                </label>

                <select
                  className="settings-select"
                  value={category}
                  onChange={(
                    event
                  ) => {

                    setCategory(
                      event.target
                        .value
                    );

                    showSettingsNotice(
                      "Default category saved."
                    );

                  }}
                >

                  {CATEGORIES.filter(
                    (item) =>
                      item !==
                      "All"
                  ).map(
                    (item) => (

                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>

                    )
                  )}

                </select>

              </div>

              <div className="settings-field">

                <label>
                  Default difficulty
                </label>

                <div className="settings-chip-group">

                  {DIFFICULTIES.map(
                    (level) => (

                      <button
                        key={level}
                        type="button"
                        className={
                          difficulty ===
                          level
                            ? "settings-chip active"
                            : "settings-chip"
                        }
                        onClick={() => {

                          setDifficulty(
                            level
                          );

                          showSettingsNotice(
                            "Default difficulty saved."
                          );

                        }}
                      >
                        {level}
                      </button>

                    )
                  )}

                </div>

              </div>

              <div className="settings-field">

                <label>
                  Practice mode
                </label>

                <div className="settings-chip-group">

                  <button
                    type="button"
                    className={
                      mode ===
                      "learn"
                        ? "settings-chip active"
                        : "settings-chip"
                    }
                    onClick={() => {

                      setMode(
                        "learn"
                      );

                      showSettingsNotice(
                        "Practice mode saved."
                      );

                    }}
                  >
                    Learn + Speak
                  </button>

                  <button
                    type="button"
                    className={
                      mode ===
                      "speak-only"
                        ? "settings-chip active"
                        : "settings-chip"
                    }
                    onClick={() => {

                      setMode(
                        "speak-only"
                      );

                      showSettingsNotice(
                        "Practice mode saved."
                      );

                    }}
                  >
                    Speak Only
                  </button>

                </div>

              </div>

              <div className="settings-field-grid">

                <div className="settings-field">

                  <label>
                    Learning time
                  </label>

                  <select
                    className="settings-select"
                    value={
                      learningTime /
                      60
                    }
                    onChange={(
                      event
                    ) => {

                      const seconds =
                        Number(
                          event.target
                            .value
                        ) * 60;

                      updateLearningTime(
                        seconds
                      );

                      showSettingsNotice(
                        "Learning time saved."
                      );

                    }}
                  >

                    {LEARN_TIME_OPTIONS.map(
                      (min) => (

                        <option
                          key={min}
                          value={min}
                        >
                          {min} min
                        </option>

                      )
                    )}

                  </select>

                </div>

                <div className="settings-field">

                  <label>
                    Speaking time
                  </label>

                  <select
                    className="settings-select"
                    value={
                      speakingTime /
                      60
                    }
                    onChange={(
                      event
                    ) => {

                      const seconds =
                        Number(
                          event.target
                            .value
                        ) * 60;

                      updateSpeakingTime(
                        seconds
                      );

                      showSettingsNotice(
                        "Speaking time saved."
                      );

                    }}
                  >

                    {SPEAK_TIME_OPTIONS.map(
                      (min) => (

                        <option
                          key={min}
                          value={min}
                        >
                          {min} min
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>

            </section>

            {/* APP PREFERENCES */}

            <section className="settings-card">

              <div className="settings-card-header">

                <h2>
                  App preferences
                </h2>

                <p>
                  Fine-tune how the app behaves during practice.
                </p>

              </div>

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    Daily practice reminder
                  </strong>

                  <p>
                    Get a nudge to complete one evaluation each day.
                  </p>

                </div>

                <button
                  type="button"
                  className={
                    dailyReminder
                      ? "settings-toggle on"
                      : "settings-toggle"
                  }
                  aria-pressed={
                    dailyReminder
                  }
                  onClick={() => {

                    setDailyReminder(
                      (previous) =>
                        !previous
                    );

                    showSettingsNotice(
                      "Reminder preference saved."
                    );

                  }}
                >
                  <span />
                </button>

              </div>

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    Auto-save notes
                  </strong>

                  <p>
                    Keep your learning notes when you reload the page.
                  </p>

                </div>

                <button
                  type="button"
                  className={
                    autoSaveNotes
                      ? "settings-toggle on"
                      : "settings-toggle"
                  }
                  aria-pressed={
                    autoSaveNotes
                  }
                  onClick={() => {

                    setAutoSaveNotes(
                      (previous) =>
                        !previous
                    );

                    showSettingsNotice(
                      "Notes preference saved."
                    );

                  }}
                >
                  <span />
                </button>

              </div>

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    Show vocabulary hints
                  </strong>

                  <p>
                    Display useful words on topic cards when available.
                  </p>

                </div>

                <button
                  type="button"
                  className={
                    showVocabulary
                      ? "settings-toggle on"
                      : "settings-toggle"
                  }
                  aria-pressed={
                    showVocabulary
                  }
                  onClick={() => {

                    setShowVocabulary(
                      (previous) =>
                        !previous
                    );

                    showSettingsNotice(
                      "Vocabulary preference saved."
                    );

                  }}
                >
                  <span />
                </button>

              </div>

            </section>

            {/* DATA & ACCOUNT */}

            <section className="settings-card settings-danger-card">

              <div className="settings-card-header">

                <h2>
                  Data & account
                </h2>

                <p>
                  Manage your progress and sign out.
                </p>

              </div>

              <div className="settings-action-row">

                <div>

                  <strong>
                    Reset current challenge
                  </strong>

                  <p>
                    Clear notes, transcript, and return to home.
                  </p>

                </div>

                <button
                  type="button"
                  className="settings-secondary-btn"
                  onClick={
                    handleResetSession
                  }
                >
                  Reset session
                </button>

              </div>

              <div className="settings-action-row">

                <div>

                  <strong>
                    Clear progress history
                  </strong>

                  <p>
                    Remove all past evaluations and reset your streak.
                  </p>

                </div>

                <button
                  type="button"
                  className="settings-secondary-btn danger"
                  onClick={
                    handleClearProgress
                  }
                >
                  Clear history
                </button>

              </div>

              <div className="settings-actions">

                <button
                  className="settings-logout"
                  onClick={
                    handleLogout
                  }
                >
                  Log out
                </button>

              </div>

            </section>

          </div>

        </main>

      )}

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="footer">

        <span>
          {difficulty} ·{" "}
          {category}
        </span>

        <span>

          Learn{" "}

          {mode === "learn"
            ? formatTime(
                learningTime
              )
            : "—"}

          {" · "}

          Speak{" "}

          {formatTime(
            speakingTime
          )}

        </span>

      </footer>

      {/* ======================================================
          LOGIN MODAL
      ====================================================== */}

      {authModal ===
        "login" && (

        <Login
          onLogin={
            handleLogin
          }
          onSignup={() =>
            setAuthModal(
              "signup"
            )
          }
          onClose={() =>
            setAuthModal(null)
          }
        />

      )}

      {/* ======================================================
          SIGNUP MODAL
      ====================================================== */}

      {authModal ===
        "signup" && (

        <Signup
          onSignup={
            handleSignup
          }
          onLogin={() =>
            setAuthModal(
              "login"
            )
          }
          onClose={() =>
            setAuthModal(null)
          }
        />

      )}

    </main>
  );
}

// ============================================================
// METRIC COMPONENT
// ============================================================

function Metric({
  title,
  score,
}) {
  const validScore =
    typeof score ===
    "number";

  const safeScore =
    validScore
      ? Math.max(
          0,
          Math.min(
            100,
            score
          )
        )
      : 0;

  return (
    <div className="metric">

      <div className="metric-top">

        <span>
          {title}
        </span>

        <strong>
          {validScore
            ? score
            : "—"}
        </strong>

      </div>

      <div className="metric-bar">

        <div
          style={{
            width: `${safeScore}%`,
          }}
        />

      </div>

    </div>
  );
}

export default App;