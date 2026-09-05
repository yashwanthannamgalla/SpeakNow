import os
import json
import re

from google import genai


GEMINI_MODEL = "gemini-3.5-flash-lite"


def get_client():
    api_key = os.getenv("GEMINI_API_KEY2")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    return genai.Client(
        api_key=api_key
    )


def extract_json(text: str):
    """
    Extract JSON even if Gemini wraps it
    inside ```json ... ```
    """

    text = text.strip()

    # Remove markdown code fences
    text = re.sub(
        r"^```json\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"^```\s*",
        "",
        text
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    text = text.strip()

    # Find first JSON object if extra text exists
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError(
            "Gemini did not return valid JSON."
        )

    json_text = text[start:end + 1]

    return json.loads(json_text)


async def gemini_evaluate(data: dict):

    client = get_client()

    topic = data.get(
        "topic",
        ""
    )

    category = data.get(
        "category",
        ""
    )

    difficulty = data.get(
        "difficulty",
        ""
    )

    mode = data.get(
        "mode",
        ""
    )

    transcript = data.get(
        "transcript",
        ""
    ).strip()

    # ========================================================
    # GEMINI PROMPT
    # ========================================================

    prompt = f"""
You are an English speaking evaluator.

Analyze the user's spoken English transcript.

Your job is to provide a SHORT, ACCURATE language review.

Do NOT be unnecessarily harsh.

Do NOT give a low score simply because the speech is not perfect.

A fluent and natural response with a few minor mistakes
should still receive a good score.

Evaluate the actual quality of the transcript.

------------------------------------------------------------
CONTEXT
------------------------------------------------------------

Topic:
{topic}

Category:
{category}

Difficulty:
{difficulty}

Speaking mode:
{mode}

Transcript:
{transcript}

------------------------------------------------------------
WHAT TO EVALUATE
------------------------------------------------------------

Evaluate:

1. Grammar accuracy
2. Vocabulary quality and variety
3. Fluency based on the transcript
4. Clarity
5. Sentence structure

Also identify:

6. Filler words
7. Repeated words
8. Important grammar mistakes
9. Useful vocabulary upgrades
10. A short overall review

------------------------------------------------------------
SCORING
------------------------------------------------------------

Use a 0-100 scale.

90-100:
Excellent English. Very natural, accurate and effective.

80-89:
Very good English. Minor mistakes but strong communication.

70-79:
Good English. Some noticeable issues but communication is clear.

60-69:
Developing English. Several issues affect quality.

40-59:
Weak English. Frequent problems affect communication.

0-39:
Very weak English or insufficient speech.

IMPORTANT:

Do not automatically give scores around 60-70.

If the transcript demonstrates strong English,
give it an appropriate 80-95 score.

Minor grammar mistakes should only cause a
small reduction.

Grammar should be judged based on actual mistakes,
not imagined mistakes.

Do not invent grammar mistakes.

Do not invent filler words.

Do not invent repeated words.

------------------------------------------------------------
STATISTICS
------------------------------------------------------------

Calculate these from the transcript:

word_count:
Total number of spoken words.

unique_words:
Number of unique words.

sentence_count:
Approximate number of sentences.

filler_count:
Actual filler words found.

repetition_count:
Meaningful repeated words.

estimated_wpm:
Estimate speaking speed using the target duration.

Target speaking duration:
{data.get("target_duration", 60)} seconds.

Common fillers can include:

um
uh
like
actually
basically
you know
I mean
so
well

Only count them when they are actually being
used as fillers.

Do not count normal uses of words as fillers.

For repeated words:

Ignore common grammatical words such as:

the
a
an
is
are
was
were
to
of
and
in
on
it
I
you
he
she
we
they

Only report meaningful repeated words.

------------------------------------------------------------
GRAMMAR CORRECTIONS
------------------------------------------------------------

Only provide corrections when an actual grammar
problem exists.

Do NOT rewrite correct sentences just to make
them sound different.

Maximum 5 corrections.

Each correction must contain:

original
corrected
explanation

------------------------------------------------------------
VOCABULARY UPGRADES
------------------------------------------------------------

Only suggest upgrades when they are genuinely useful.

Do not replace every normal word with a fancy word.

Maximum 5 suggestions.

Each suggestion must contain:

used
better
reason

------------------------------------------------------------
OVERALL SCORE
------------------------------------------------------------

Calculate overall_score from the quality of:

grammar
vocabulary
fluency
clarity
sentence structure

Do not make overall_score artificially low.

The overall score should reasonably represent
the user's actual English ability demonstrated
in this response.

------------------------------------------------------------
RESPONSE FORMAT
------------------------------------------------------------

RETURN ONLY VALID JSON.

Do not use markdown.

Do not include explanations outside JSON.

Use EXACTLY this structure:

{{
  "source": "gemini",

  "overall_score": 86,

  "scores": {{
    "grammar": 88,
    "vocabulary": 84,
    "fluency": 87,
    "clarity": 89,
    "sentence_structure": 83
  }},

  "speech_stats": {{
    "word_count": 214,
    "unique_words": 137,
    "estimated_wpm": 107,
    "sentence_count": 14,
    "filler_count": 5,
    "repetition_count": 3
  }},

  "filler_words": [
    {{
      "word": "actually",
      "count": 2
    }}
  ],

  "repeated_words": [
    {{
      "word": "important",
      "count": 3
    }}
  ],

  "grammar_corrections": [
    {{
      "original": "He don't like it",
      "corrected": "He doesn't like it",
      "explanation": "Use 'doesn't' with 'he'."
    }}
  ],

  "vocabulary_upgrades": [
    {{
      "used": "very good",
      "better": "excellent",
      "reason": "More precise and natural."
    }}
  ],

  "review": "Your response was clear and well organized. You expressed your ideas naturally, with only a few minor grammar issues."
}}

IMPORTANT:

Return exactly these top-level fields:

source
overall_score
scores
speech_stats
filler_words
repeated_words
grammar_corrections
vocabulary_upgrades
review

Do not add:

strengths
weaknesses
coach_feedback
priority_improvements
next_challenge
structure_analysis
topic_relevance
naturalness

Keep the review short: 1-3 sentences.
"""

    # ========================================================
    # CALL GEMINI
    # ========================================================

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    if not response:
        raise RuntimeError(
            "Gemini returned no response."
        )

    text = response.text

    if not text:
        raise RuntimeError(
            "Gemini returned empty response."
        )

    # ========================================================
    # PARSE JSON
    # ========================================================

    result = extract_json(text)

    # ========================================================
    # VALIDATE / NORMALIZE
    # ========================================================

    result["source"] = "gemini"

    # --------------------------------------------------------
    # Scores
    # --------------------------------------------------------

    scores = result.get(
        "scores",
        {}
    )

    score_fields = [
        "grammar",
        "vocabulary",
        "fluency",
        "clarity",
        "sentence_structure",
    ]

    for field in score_fields:

        value = scores.get(field)

        if not isinstance(
            value,
            (int, float)
        ):

            scores[field] = 0

        else:

            scores[field] = max(
                0,
                min(
                    100,
                    round(value)
                )
            )

    result["scores"] = scores

    # --------------------------------------------------------
    # Overall score
    # --------------------------------------------------------

    overall = result.get(
        "overall_score"
    )

    if not isinstance(
        overall,
        (int, float)
    ):

        overall = round(
            (
                scores["grammar"] * 0.25
                + scores["vocabulary"] * 0.20
                + scores["fluency"] * 0.25
                + scores["clarity"] * 0.15
                + scores["sentence_structure"] * 0.15
            )
        )

    result["overall_score"] = max(
        0,
        min(
            100,
            round(overall)
        )
    )

    # --------------------------------------------------------
    # Speech stats
    # --------------------------------------------------------

    stats = result.get(
        "speech_stats",
        {}
    )

    stat_fields = [
        "word_count",
        "unique_words",
        "estimated_wpm",
        "sentence_count",
        "filler_count",
        "repetition_count",
    ]

    for field in stat_fields:

        value = stats.get(field)

        if not isinstance(
            value,
            (int, float)
        ):

            stats[field] = 0

        else:

            stats[field] = max(
                0,
                round(value)
            )

    result["speech_stats"] = stats

    # --------------------------------------------------------
    # Arrays
    # --------------------------------------------------------

    array_fields = [
        "filler_words",
        "repeated_words",
        "grammar_corrections",
        "vocabulary_upgrades",
    ]

    for field in array_fields:

        if not isinstance(
            result.get(field),
            list
        ):

            result[field] = []

    # --------------------------------------------------------
    # Review
    # --------------------------------------------------------

    if not isinstance(
        result.get("review"),
        str
    ):

        result["review"] = (
            "Your response was analyzed for "
            "grammar, vocabulary, fluency, "
            "clarity and sentence structure."
        )

    # ========================================================
    # RETURN EXACT RESULT
    # ========================================================

    return {
        "source": "gemini",

        "overall_score":
            result["overall_score"],

        "scores": {
            "grammar":
                result["scores"]["grammar"],

            "vocabulary":
                result["scores"]["vocabulary"],

            "fluency":
                result["scores"]["fluency"],

            "clarity":
                result["scores"]["clarity"],

            "sentence_structure":
                result["scores"][
                    "sentence_structure"
                ],
        },

        "speech_stats": {
            "word_count":
                result["speech_stats"][
                    "word_count"
                ],

            "unique_words":
                result["speech_stats"][
                    "unique_words"
                ],

            "estimated_wpm":
                result["speech_stats"][
                    "estimated_wpm"
                ],

            "sentence_count":
                result["speech_stats"][
                    "sentence_count"
                ],

            "filler_count":
                result["speech_stats"][
                    "filler_count"
                ],

            "repetition_count":
                result["speech_stats"][
                    "repetition_count"
                ],
        },

        "filler_words":
            result["filler_words"],

        "repeated_words":
            result["repeated_words"],

        "grammar_corrections":
            result["grammar_corrections"],

        "vocabulary_upgrades":
            result["vocabulary_upgrades"],

        "review":
            result["review"],
    }