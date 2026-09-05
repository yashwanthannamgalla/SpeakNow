# backend/services/local_evaluator.py

import re
import math
from collections import Counter


# ============================================================
# CONFIGURATION
# ============================================================

FILLER_PHRASES = [
    "you know",
    "i mean",
    "sort of",
    "kind of",
    "a lot of",
    "you see",
]

FILLER_WORDS = [
    "um",
    "uh",
    "like",
    "actually",
    "basically",
]

WEAK_WORDS = {
    "good",
    "bad",
    "nice",
    "thing",
    "things",
    "stuff",
    "very",
    "really",
    "big",
    "small",
    "important",
    "interesting",
    "great",
    "many",
    "some",
    "lot",
}

STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "being", "to", "of", "and", "or", "but", "if", "then",
    "in", "on", "at", "for", "with", "from", "by", "about",
    "as", "into", "through", "during", "before", "after",
    "above", "below", "between", "under", "over",

    "this", "that", "these", "those",
    "it", "its", "they", "them", "their", "there",
    "he", "him", "his",
    "she", "her",
    "we", "us", "our",
    "i", "me", "my", "mine",
    "you", "your", "yours",

    "do", "does", "did",
    "have", "has", "had",
    "can", "could",
    "will", "would",
    "shall", "should",
    "may", "might", "must",

    "not", "no", "yes",
    "so", "than", "too",
    "also", "just",
}


CONNECTORS = {
    "because",
    "therefore",
    "however",
    "although",
    "though",
    "while",
    "whereas",
    "moreover",
    "furthermore",
    "besides",
    "first",
    "second",
    "finally",
    "overall",
    "for example",
    "for instance",
    "in addition",
    "as a result",
    "on the other hand",
    "in my opinion",
    "personally",
    "especially",
}


# ============================================================
# BASIC TEXT PROCESSING
# ============================================================

def normalize_text(text):
    if not text:
        return ""

    text = str(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def tokenize(text):
    return re.findall(r"\b[a-zA-Z]+(?:'[a-zA-Z]+)?\b", text.lower())


def split_sentences(text):
    """
    Transcript may not contain punctuation.

    We therefore use punctuation when available and fall back
    to heuristic sentence boundaries.
    """

    text = normalize_text(text)

    if not text:
        return []

    punctuation_sentences = re.split(r"[.!?]+", text)
    punctuation_sentences = [
        s.strip()
        for s in punctuation_sentences
        if s.strip()
    ]

    # If punctuation exists, trust it.
    if len(punctuation_sentences) > 1:
        return punctuation_sentences

    words = tokenize(text)

    if not words:
        return []

    # Speech transcript often has no punctuation.
    # Approximate sentence boundaries every 12-20 words.
    sentences = []

    current = []

    boundary_words = {
        "because",
        "but",
        "however",
        "therefore",
        "although",
        "so",
        "finally",
        "overall",
    }

    for word in words:
        current.append(word)

        if len(current) >= 12 and word in boundary_words:
            sentences.append(" ".join(current))
            current = []

        elif len(current) >= 20:
            sentences.append(" ".join(current))
            current = []

    if current:
        sentences.append(" ".join(current))

    return sentences


# ============================================================
# FILLERS
# ============================================================

def count_fillers(text):
    text_lower = normalize_text(text).lower()

    counts = {}

    # Multi-word fillers
    for filler in FILLER_PHRASES:
        pattern = rf"\b{re.escape(filler)}\b"
        count = len(re.findall(pattern, text_lower))

        if count:
            counts[filler] = count

    # Single-word fillers
    for filler in FILLER_WORDS:
        pattern = rf"\b{re.escape(filler)}\b"
        count = len(re.findall(pattern, text_lower))

        if count:
            counts[filler] = count

    return counts


# ============================================================
# REPETITION
# ============================================================

def get_repeated_words(words):
    meaningful = [
        word
        for word in words
        if word not in STOP_WORDS and len(word) > 2
    ]

    counts = Counter(meaningful)

    repeated = []

    for word, count in counts.most_common():
        if count >= 3:
            repeated.append({
                "word": word,
                "count": count,
            })

    return repeated[:10]


def get_repeated_phrases(words):
    """
    Detect repeated 2-word and 3-word phrases.
    """

    phrases = []

    for n in (2, 3):
        for i in range(len(words) - n + 1):
            phrase = tuple(words[i:i + n])

            if all(word in STOP_WORDS for word in phrase):
                continue

            phrases.append(" ".join(phrase))

    counts = Counter(phrases)

    repeated = []

    for phrase, count in counts.most_common():
        if count >= 2:
            repeated.append({
                "phrase": phrase,
                "count": count,
            })

    return repeated[:10]


# ============================================================
# VOCABULARY
# ============================================================

def vocabulary_metrics(words):
    if not words:
        return {
            "unique_words": 0,
            "lexical_diversity": 0,
            "lexical_density": 0,
            "weak_word_count": 0,
        }

    unique_words = len(set(words))

    lexical_diversity = unique_words / len(words)

    meaningful_words = [
        word
        for word in words
        if word not in STOP_WORDS
    ]

    lexical_density = (
        len(meaningful_words) / len(words)
        if words
        else 0
    )

    weak_word_count = sum(
        1 for word in words
        if word in WEAK_WORDS
    )

    return {
        "unique_words": unique_words,
        "lexical_diversity": lexical_diversity,
        "lexical_density": lexical_density,
        "weak_word_count": weak_word_count,
    }


def vocabulary_score(words):
    if not words:
        return 20

    metrics = vocabulary_metrics(words)

    diversity = metrics["lexical_diversity"]
    density = metrics["lexical_density"]

    # Diversity
    if diversity >= 0.72:
        diversity_score = 96
    elif diversity >= 0.64:
        diversity_score = 91
    elif diversity >= 0.57:
        diversity_score = 86
    elif diversity >= 0.50:
        diversity_score = 80
    elif diversity >= 0.44:
        diversity_score = 73
    elif diversity >= 0.38:
        diversity_score = 66
    elif diversity >= 0.32:
        diversity_score = 58
    else:
        diversity_score = 48

    # Lexical density
    if density >= 0.65:
        density_score = 95
    elif density >= 0.57:
        density_score = 89
    elif density >= 0.50:
        density_score = 82
    elif density >= 0.43:
        density_score = 74
    else:
        density_score = 64

    score = (
        diversity_score * 0.65
        + density_score * 0.35
    )

    weak_ratio = metrics["weak_word_count"] / max(len(words), 1)

    if weak_ratio > 0.12:
        score -= 7
    elif weak_ratio > 0.08:
        score -= 4

    return round(max(0, min(100, score)))


# ============================================================
# SENTENCE ANALYSIS
# ============================================================

def sentence_metrics(sentences):
    if not sentences:
        return {
            "sentence_count": 0,
            "avg_length": 0,
            "short_sentences": 0,
            "long_sentences": 0,
            "fragments": 0,
            "run_on_like": 0,
        }

    lengths = [
        len(tokenize(sentence))
        for sentence in sentences
    ]

    short_sentences = sum(
        1 for length in lengths
        if length <= 4
    )

    long_sentences = sum(
        1 for length in lengths
        if length >= 35
    )

    fragments = 0

    for sentence in sentences:
        words = tokenize(sentence)

        if 1 <= len(words) <= 4:
            fragments += 1

    run_on_like = sum(
        1 for length in lengths
        if length >= 45
    )

    return {
        "sentence_count": len(sentences),
        "avg_length": round(sum(lengths) / len(lengths), 2),
        "short_sentences": short_sentences,
        "long_sentences": long_sentences,
        "fragments": fragments,
        "run_on_like": run_on_like,
    }


def sentence_structure_score(sentences):
    metrics = sentence_metrics(sentences)

    count = metrics["sentence_count"]

    if count == 0:
        return 20

    avg = metrics["avg_length"]

    # Reasonable spoken English sentence length.
    if 8 <= avg <= 24:
        score = 88
    elif 6 <= avg <= 30:
        score = 80
    elif 4 <= avg <= 35:
        score = 70
    else:
        score = 58

    # Sentence variety
    lengths = [
        len(tokenize(sentence))
        for sentence in sentences
    ]

    if len(lengths) >= 3:
        variation = max(lengths) - min(lengths)

        if variation >= 12:
            score += 5
        elif variation <= 3:
            score -= 6

    # Fragments
    fragment_ratio = (
        metrics["fragments"] / count
        if count
        else 0
    )

    if fragment_ratio > 0.4:
        score -= 12
    elif fragment_ratio > 0.25:
        score -= 7

    # Very long sentences
    score -= min(
        10,
        metrics["run_on_like"] * 3
    )

    return round(max(0, min(100, score)))


# ============================================================
# BASIC GRAMMAR SIGNALS
# ============================================================

def grammar_pattern_analysis(text):
    """
    This is NOT intended to replace Gemini grammar analysis.

    It detects common patterns that are useful as local signals.
    """

    text_lower = normalize_text(text).lower()

    issues = []

    patterns = [
        (
            r"\b(he|she|it)\s+(don't|dont)\b",
            "Subject–verb agreement: use 'doesn't' with he, she, or it."
        ),
        (
            r"\b(i|you|we|they)\s+(doesn't|doesnt)\b",
            "Subject–verb agreement: use 'don't' with I, you, we, or they."
        ),
        (
            r"\b(he|she|it)\s+(have)\b",
            "Subject–verb agreement: use 'has' with he, she, or it."
        ),
        (
            r"\b(i|you|we|they)\s+(has)\b",
            "Subject–verb agreement: use 'have' with I, you, we, or they."
        ),
        (
            r"\b(he|she|it)\s+(were)\b",
            "Possible verb agreement issue: 'was' is normally used with he, she, or it."
        ),
        (
            r"\b(i)\s+(is|are)\b",
            "Use 'am' with 'I'."
        ),
    ]

    for pattern, explanation in patterns:
        matches = re.findall(pattern, text_lower)

        for _ in matches:
            issues.append({
                "explanation": explanation
            })

    return issues


def grammar_score_local(text, sentences):
    """
    Conservative grammar estimate.

    Gemini should still be the authority for actual grammar
    corrections.
    """

    words = tokenize(text)

    if not words:
        return 20

    issues = grammar_pattern_analysis(text)

    issue_rate = len(issues) / max(len(sentences), 1)

    score = 88

    if issue_rate >= 1:
        score -= 20
    elif issue_rate >= 0.5:
        score -= 12
    elif issue_rate > 0:
        score -= 7

    # Fragment-heavy responses are usually grammatically weaker.
    sentence_data = sentence_metrics(sentences)

    if sentence_data["fragments"] > 0:
        fragment_ratio = (
            sentence_data["fragments"]
            / max(sentence_data["sentence_count"], 1)
        )

        score -= round(fragment_ratio * 15)

    return round(max(0, min(100, score)))


# ============================================================
# FLUENCY
# ============================================================

def calculate_wpm(word_count, actual_duration):
    if actual_duration is None:
        return 0

    try:
        actual_duration = float(actual_duration)
    except (TypeError, ValueError):
        return 0

    if actual_duration <= 0:
        return 0

    return round(
        word_count / (actual_duration / 60)
    )


def fluency_score(
    word_count,
    wpm,
    filler_count,
    repeated_phrase_count,
    actual_duration,
):
    if word_count == 0:
        return 10

    # WPM baseline
    if 110 <= wpm <= 155:
        score = 94
    elif 95 <= wpm < 110 or 155 < wpm <= 170:
        score = 88
    elif 80 <= wpm < 95 or 170 < wpm <= 185:
        score = 79
    elif 65 <= wpm < 80 or 185 < wpm <= 205:
        score = 68
    elif 45 <= wpm < 65:
        score = 57
    else:
        score = 45

    # Filler penalty
    filler_rate = filler_count / max(word_count, 1)

    if filler_rate >= 0.10:
        score -= 18
    elif filler_rate >= 0.07:
        score -= 12
    elif filler_rate >= 0.04:
        score -= 7
    elif filler_rate >= 0.02:
        score -= 3

    # Repeated phrases
    score -= min(
        10,
        repeated_phrase_count * 2
    )

    return round(max(0, min(100, score)))


# ============================================================
# COHERENCE
# ============================================================

def connector_analysis(text):
    text_lower = normalize_text(text).lower()

    found = []

    for connector in CONNECTORS:
        if re.search(
            rf"\b{re.escape(connector)}\b",
            text_lower
        ):
            found.append(connector)

    return found


def coherence_score(text, sentences):
    if not sentences:
        return 20

    connectors = connector_analysis(text)

    score = 65

    # More connected discourse usually indicates better organization.
    if len(connectors) >= 5:
        score += 25
    elif len(connectors) >= 3:
        score += 18
    elif len(connectors) >= 1:
        score += 10

    sentence_data = sentence_metrics(sentences)

    if sentence_data["sentence_count"] >= 5:
        score += 5

    if sentence_data["fragments"] >= 3:
        score -= 12

    return round(max(0, min(100, score)))


# ============================================================
# RESPONSE DEVELOPMENT
# ============================================================

def development_score(
    word_count,
    actual_duration,
    target_duration,
    sentences,
):
    """
    Measures whether the speaker developed their response
    rather than merely saying a short statement.
    """

    score = 50

    # Word-count contribution
    if word_count >= 180:
        score += 25
    elif word_count >= 120:
        score += 20
    elif word_count >= 80:
        score += 14
    elif word_count >= 50:
        score += 7

    # Sentence development
    sentence_count = len(sentences)

    if sentence_count >= 10:
        score += 15
    elif sentence_count >= 7:
        score += 12
    elif sentence_count >= 5:
        score += 8
    elif sentence_count <= 2:
        score -= 12

    # Target completion
    if target_duration and actual_duration:
        completion = actual_duration / target_duration

        if completion >= 0.90:
            score += 10
        elif completion >= 0.70:
            score += 5
        elif completion < 0.30:
            score -= 20
        elif completion < 0.50:
            score -= 12

    return round(max(0, min(100, score)))


# ============================================================
# TASK COMPLETION
# ============================================================

def task_completion_score(
    target_duration,
    actual_duration,
    word_count,
    difficulty,
):
    """
    Duration matters, but we do NOT simply reward more speech.

    A response must be long enough to reasonably complete the task.
    """

    if not target_duration:
        target_duration = 60

    if not actual_duration:
        actual_duration = 0

    completion_ratio = (
        actual_duration / target_duration
        if target_duration > 0
        else 1
    )

    # Duration component
    if completion_ratio >= 0.90:
        duration_score = 100
    elif completion_ratio >= 0.75:
        duration_score = 90
    elif completion_ratio >= 0.60:
        duration_score = 80
    elif completion_ratio >= 0.45:
        duration_score = 68
    elif completion_ratio >= 0.30:
        duration_score = 52
    elif completion_ratio >= 0.15:
        duration_score = 35
    else:
        duration_score = 20

    # Expected speaking volume.
    # Normal conversational speaking ≈ 100-150 WPM.
    expected_min_words = target_duration / 60 * 85
    expected_good_words = target_duration / 60 * 115

    if word_count >= expected_good_words:
        volume_score = 100
    elif word_count >= expected_min_words:
        volume_score = 85
    elif word_count >= expected_min_words * 0.70:
        volume_score = 68
    elif word_count >= expected_min_words * 0.40:
        volume_score = 50
    else:
        volume_score = 30

    # Difficulty affects expectations.
    if difficulty == "Advanced":
        volume_score -= 3

    elif difficulty == "Beginner":
        volume_score += 3

    return round(
        max(
            0,
            min(
                100,
                duration_score * 0.65
                + volume_score * 0.35
            )
        )
    )


# ============================================================
# RELEVANCE SIGNAL
# ============================================================

def relevance_score(text, topic):
    """
    Local lexical relevance signal.

    Gemini should make the final semantic relevance decision.
    """

    if not topic:
        return 75

    topic_words = {
        word
        for word in tokenize(topic)
        if word not in STOP_WORDS
        and len(word) > 3
    }

    response_words = set(tokenize(text))

    if not topic_words:
        return 75

    overlap = len(
        topic_words.intersection(response_words)
    )

    ratio = overlap / len(topic_words)

    if ratio >= 0.60:
        return 95
    elif ratio >= 0.40:
        return 88
    elif ratio >= 0.25:
        return 78
    elif ratio >= 0.10:
        return 65
    else:
        return 45


# ============================================================
# DIFFICULTY CALIBRATION
# ============================================================

def difficulty_adjustment(
    score,
    difficulty,
    word_count,
):
    """
    Prevents beginner responses from being judged too harshly
    while keeping advanced responses demanding.
    """

    if difficulty == "Beginner":

        if word_count < 30:
            score -= 5

        elif word_count >= 100:
            score += 3

    elif difficulty == "Intermediate":

        if word_count < 50:
            score -= 5

    elif difficulty == "Advanced":

        if word_count < 80:
            score -= 8

    return max(0, min(100, score))


# ============================================================
# OVERALL SCORE
# ============================================================

def calculate_overall(
    grammar,
    vocabulary,
    fluency,
    clarity,
    sentence_structure,
    task_completion,
    development,
    coherence,
    relevance,
    difficulty,
):
    """
    Internal model.

    The five visible scores remain:
        grammar
        vocabulary
        fluency
        clarity
        sentence_structure

    Additional quality signals influence the final score.
    """

    language_score = (
        grammar * 0.22
        + vocabulary * 0.18
        + fluency * 0.20
        + clarity * 0.15
        + sentence_structure * 0.10
    )

    communication_score = (
        task_completion * 0.06
        + development * 0.04
        + coherence * 0.03
        + relevance * 0.02
    )

    overall = (
        language_score
        + communication_score
    )

    overall = difficulty_adjustment(
        overall,
        difficulty,
        0,
    )

    return round(
        max(0, min(100, overall))
    )


# ============================================================
# REVIEW GENERATION
# ============================================================

def generate_local_review(
    word_count,
    actual_duration,
    target_duration,
    grammar,
    vocabulary,
    fluency,
    clarity,
    sentence_structure,
    task_completion,
    development,
    coherence,
    filler_count,
    repeated_count,
):
    observations = []
    improvements = []

    # --------------------------------------------------------
    # Completion
    # --------------------------------------------------------

    if target_duration and actual_duration:
        completion = actual_duration / target_duration

        if completion < 0.30:
            observations.append(
                "Your response was much shorter than the requested speaking time."
            )
            improvements.append(
                "Try developing your answer with reasons, examples, and details."
            )

        elif completion < 0.60:
            observations.append(
                "You started developing the answer but stopped well before the target time."
            )
            improvements.append(
                "Extend your ideas instead of ending after the first point."
            )

        elif completion >= 0.90:
            observations.append(
                "You used the requested speaking time effectively."
            )

    # --------------------------------------------------------
    # Grammar
    # --------------------------------------------------------

    if grammar >= 90:
        observations.append(
            "Your grammar was consistently strong."
        )
    elif grammar >= 80:
        observations.append(
            "Your grammar was generally accurate with some room for refinement."
        )
    elif grammar >= 70:
        improvements.append(
            "Focus on making your grammar more consistent."
        )
    else:
        improvements.append(
            "Work on sentence accuracy and basic grammar patterns."
        )

    # --------------------------------------------------------
    # Vocabulary
    # --------------------------------------------------------

    if vocabulary >= 90:
        observations.append(
            "You used a varied vocabulary."
        )
    elif vocabulary >= 80:
        observations.append(
            "Your vocabulary was reasonably varied."
        )
    else:
        improvements.append(
            "Try replacing repeated or very general words with more precise alternatives."
        )

    # --------------------------------------------------------
    # Fluency
    # --------------------------------------------------------

    if filler_count >= 8:
        improvements.append(
            "Reduce filler words such as 'um', 'uh', 'like', and 'actually'."
        )

    if fluency < 70:
        improvements.append(
            "Aim for smoother, more continuous speech."
        )

    # --------------------------------------------------------
    # Structure
    # --------------------------------------------------------

    if sentence_structure < 70:
        improvements.append(
            "Build clearer and more varied sentences instead of relying on short fragments."
        )

    # --------------------------------------------------------
    # Development
    # --------------------------------------------------------

    if development < 65:
        improvements.append(
            "Support your main idea with explanations or examples."
        )

    # --------------------------------------------------------
    # Coherence
    # --------------------------------------------------------

    if coherence < 70:
        improvements.append(
            "Use transitions such as 'because', 'however', 'for example', and 'therefore' to connect ideas."
        )

    # --------------------------------------------------------
    # Repetition
    # --------------------------------------------------------

    if repeated_count >= 3:
        improvements.append(
            "Avoid repeating the same important words too frequently."
        )

    if not observations:
        observations.append(
            "Your response showed a reasonable level of spoken English."
        )

    review = " ".join(observations[:3])

    if improvements:
        review += " " + " ".join(improvements[:3])

    return review


# ============================================================
# MAIN EVALUATOR
# ============================================================

def local_evaluate(data):
    """
    Main local evaluation engine.

    Expected input:

    {
        "topic": "...",
        "category": "...",
        "difficulty": "Beginner",
        "mode": "...",
        "transcript": "...",
        "target_duration": 120,
        "actual_duration": 96
    }
    """

    transcript = normalize_text(
        data.get("transcript", "")
    )

    topic = data.get("topic", "")

    difficulty = (
        data.get("difficulty")
        or "Intermediate"
    )

    target_duration = data.get(
        "target_duration",
        60
    )

    actual_duration = data.get(
        "actual_duration"
    )

    # --------------------------------------------------------
    # Backward compatibility
    # --------------------------------------------------------

    if actual_duration is None:
        actual_duration = target_duration

    try:
        target_duration = float(target_duration)
    except (TypeError, ValueError):
        target_duration = 60

    try:
        actual_duration = float(actual_duration)
    except (TypeError, ValueError):
        actual_duration = 0

    # --------------------------------------------------------
    # Empty response
    # --------------------------------------------------------

    if not transcript:

        return {
            "source": "local",
            "overall_score": 0,

            "scores": {
                "grammar": 0,
                "vocabulary": 0,
                "fluency": 0,
                "clarity": 0,
                "sentence_structure": 0,
            },

            "speech_stats": {
                "word_count": 0,
                "unique_words": 0,
                "estimated_wpm": 0,
                "sentence_count": 0,
                "filler_count": 0,
                "repetition_count": 0,
            },

            "filler_words": [],
            "repeated_words": [],

            "grammar_corrections": [],
            "vocabulary_upgrades": [],

            "review": (
                "No speech was detected. Try speaking for the "
                "requested duration and develop your answer."
            ),
        }

    # ========================================================
    # RAW METRICS
    # ========================================================

    words = tokenize(transcript)

    sentences = split_sentences(transcript)

    word_count = len(words)

    unique_words = len(set(words))

    wpm = calculate_wpm(
        word_count,
        actual_duration,
    )

    filler_counts = count_fillers(transcript)

    filler_count = sum(
        filler_counts.values()
    )

    repeated_words = get_repeated_words(words)

    repeated_phrases = get_repeated_phrases(words)

    repeated_count = len(repeated_words)

    sentence_data = sentence_metrics(
        sentences
    )

    vocabulary_data = vocabulary_metrics(
        words
    )

    # ========================================================
    # SCORE COMPONENTS
    # ========================================================

    vocab_score = vocabulary_score(words)

    grammar = grammar_score_local(
        transcript,
        sentences,
    )

    fluency = fluency_score(
        word_count,
        wpm,
        filler_count,
        len(repeated_phrases),
        actual_duration,
    )

    sentence_structure = sentence_structure_score(
        sentences
    )

    coherence = coherence_score(
        transcript,
        sentences,
    )

    development = development_score(
        word_count,
        actual_duration,
        target_duration,
        sentences,
    )

    task_completion = task_completion_score(
        target_duration,
        actual_duration,
        word_count,
        difficulty,
    )

    relevance = relevance_score(
        transcript,
        topic,
    )

    # Clarity combines sentence quality + coherence.
    clarity = round(
        sentence_structure * 0.55
        + coherence * 0.45
    )

    # ========================================================
    # OVERALL
    # ========================================================

    overall = calculate_overall(
        grammar=grammar,
        vocabulary=vocab_score,
        fluency=fluency,
        clarity=clarity,
        sentence_structure=sentence_structure,
        task_completion=task_completion,
        development=development,
        coherence=coherence,
        relevance=relevance,
        difficulty=difficulty,
    )

    # Strong quality but extremely incomplete answer
    # should not receive an unrealistically high final score.
    if task_completion < 35:
        overall = min(
            overall,
            55
        )

    elif task_completion < 50:
        overall = min(
            overall,
            68
        )

    elif task_completion < 65:
        overall = min(
            overall,
            78
        )

    # ========================================================
    # REVIEW
    # ========================================================

    review = generate_local_review(
        word_count=word_count,
        actual_duration=actual_duration,
        target_duration=target_duration,
        grammar=grammar,
        vocabulary=vocab_score,
        fluency=fluency,
        clarity=clarity,
        sentence_structure=sentence_structure,
        task_completion=task_completion,
        development=development,
        coherence=coherence,
        filler_count=filler_count,
        repeated_count=repeated_count,
    )

    # ========================================================
    # RETURN CONTRACT
    # ========================================================

    return {
        "source": "local",

        "overall_score": overall,

        "scores": {
            "grammar": grammar,
            "vocabulary": vocab_score,
            "fluency": fluency,
            "clarity": clarity,
            "sentence_structure": sentence_structure,
        },

        "speech_stats": {
            "word_count": word_count,

            "unique_words": unique_words,

            "estimated_wpm": wpm,

            "sentence_count": sentence_data[
                "sentence_count"
            ],

            "filler_count": filler_count,

            "repetition_count": repeated_count,
        },

        "filler_words": [
            {
                "word": word,
                "count": count,
            }
            for word, count
            in sorted(
                filler_counts.items(),
                key=lambda x: x[1],
                reverse=True,
            )
        ],

        "repeated_words": repeated_words,

        "grammar_corrections": [],

        "vocabulary_upgrades": [],

        "review": review,
    }