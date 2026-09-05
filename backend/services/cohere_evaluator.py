# backend/services/cohere_evaluator.py

import os
import json
import re

from dotenv import load_dotenv
import cohere


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

COHERE_API_KEY = os.getenv(
    "COHERE_API_KEY"
)

if not COHERE_API_KEY:
    raise RuntimeError(
        "COHERE_API_KEY is not configured."
    )


# ============================================================
# COHERE CLIENT
# ============================================================

client = cohere.ClientV2(
    api_key=COHERE_API_KEY
)


# ============================================================
# MODEL
# ============================================================

MODEL = "command-a-03-2025"


# ============================================================
# SCORE CLAMP
# ============================================================

def clamp_score(value, default=0):

    try:
        value = int(round(float(value)))
    except (
        TypeError,
        ValueError
    ):
        value = default

    return max(
        0,
        min(100, value)
    )


# ============================================================
# SAFE JSON EXTRACTION
# ============================================================

def extract_json(text):

    if not text:
        raise ValueError(
            "Cohere returned an empty response."
        )

    text = text.strip()

    # --------------------------------------------------------
    # Remove markdown code fences
    # --------------------------------------------------------

    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    text = text.strip()

    # --------------------------------------------------------
    # Direct JSON
    # --------------------------------------------------------

    try:

        return json.loads(text)

    except json.JSONDecodeError:
        pass

    # --------------------------------------------------------
    # Find first JSON object
    # --------------------------------------------------------

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1:
        raise ValueError(
            "No JSON object found in Cohere response."
        )

    json_text = text[
        start:end + 1
    ]

    return json.loads(
        json_text
    )


# ============================================================
# SAFE LIST
# ============================================================

def safe_list(value):

    if isinstance(value, list):
        return value

    return []


# ============================================================
# NORMALIZE GRAMMAR CORRECTIONS
# ============================================================

def normalize_grammar_corrections(
    corrections
):

    if not isinstance(
        corrections,
        list
    ):
        return []

    output = []

    for item in corrections[:5]:

        if not isinstance(
            item,
            dict
        ):
            continue

        original = str(
            item.get(
                "original",
                ""
            )
        ).strip()

        corrected = str(
            item.get(
                "corrected",
                ""
            )
        ).strip()

        explanation = str(
            item.get(
                "explanation",
                ""
            )
        ).strip()

        if not original or not corrected:
            continue

        output.append(
            {
                "original": original,
                "corrected": corrected,
                "explanation": explanation,
            }
        )

    return output


# ============================================================
# NORMALIZE VOCABULARY UPGRADES
# ============================================================

def normalize_vocabulary_upgrades(
    upgrades
):

    if not isinstance(
        upgrades,
        list
    ):
        return []

    output = []

    for item in upgrades[:5]:

        if not isinstance(
            item,
            dict
        ):
            continue

        used = str(
            item.get(
                "used",
                ""
            )
        ).strip()

        better = str(
            item.get(
                "better",
                ""
            )
        ).strip()

        reason = str(
            item.get(
                "reason",
                ""
            )
        ).strip()

        if not used or not better:
            continue

        output.append(
            {
                "used": used,
                "better": better,
                "reason": reason,
            }
        )

    return output


# ============================================================
# BUILD SYSTEM INSTRUCTIONS
# ============================================================

SYSTEM_PROMPT = """
You are the expert English speaking evaluator inside SpeakUp,
an English speaking practice application.

Your job is NOT to blindly reward long answers.

You must evaluate the actual quality of the speaker's English.

You receive:

1. The speaking topic.
2. The difficulty level.
3. The speaking mode.
4. The requested speaking duration.
5. The actual speaking duration.
6. The transcript.
7. Objective statistics calculated independently by Python.

IMPORTANT:

The Python statistics are authoritative for measurable values.

DO NOT invent:
- word count
- unique word count
- WPM
- filler count
- repetition count
- sentence count

Use the supplied statistics.

Your job is to judge things that require language understanding.

Analyze:

GRAMMAR
- subject-verb agreement
- tense consistency
- articles
- prepositions
- pronouns
- verb forms
- incorrect constructions
- sentence completeness
- grammatical consistency

VOCABULARY
- precision
- variety
- appropriateness
- repetition
- overuse of generic words
- natural word combinations
- vocabulary sophistication relative to difficulty

FLUENCY
- whether ideas flow naturally
- whether the transcript shows excessive hesitation/filler patterns
- whether sentences progress naturally
- whether the response feels fragmented

CLARITY
- whether the listener can understand the ideas easily
- whether ideas are expressed clearly
- whether sentences communicate one understandable idea at a time

SENTENCE STRUCTURE
- sentence variety
- simple sentences
- compound sentences
- complex sentences
- sentence fragments
- run-on-like structures
- overly repetitive sentence patterns

COHERENCE
- logical progression
- transitions
- connection between ideas
- whether the answer jumps randomly between ideas

TOPIC RELEVANCE
- whether the speaker actually answers the requested topic
- do not reward unrelated talking

IDEA DEVELOPMENT
- whether claims are explained
- whether reasons are given
- whether examples are used
- whether the answer develops beyond a first sentence

NATURALNESS
- whether the English sounds natural
- awkward phrases
- literal translations
- unnatural word combinations

TASK COMPLETION
Pay close attention to target duration versus actual duration.

A speaker who was asked to speak for 120 seconds but only spoke for
20 seconds has not fully completed the speaking task, even if the
20-second English was grammatically good.

However:

DO NOT simply reward more words.

A long repetitive answer should not receive a higher score than
a shorter but well-developed answer.

DIFFICULTY CALIBRATION:

BEGINNER:
Focus primarily on understandable communication, basic grammar,
basic vocabulary and completing thoughts.

INTERMEDIATE:
Expect connected ideas, examples, better vocabulary,
reasonable sentence variety and more consistent grammar.

ADVANCED:
Expect precise vocabulary, natural phrasing, complex sentence
structures, strong organization, nuanced ideas and very few
grammar problems.

SCORING:

90-100 = excellent
80-89 = very good
70-79 = good
60-69 = developing
40-59 = weak
0-39 = very weak

Do NOT automatically give scores around 60-70.

Give high scores when the transcript genuinely deserves them.

Give lower scores when there is clear evidence of weakness.

Do not invent mistakes.

Only include grammar corrections when the transcript actually
contains a clear error.

Only include vocabulary upgrades when a better alternative is
actually useful.

Keep the review short, specific and useful.

The output MUST be valid JSON.
"""


# ============================================================
# JSON SCHEMA
# ============================================================

RESPONSE_SCHEMA = {

    "type": "object",

    "required": [
        "source",
        "overall_score",
        "scores",
        "speech_stats",
        "filler_words",
        "repeated_words",
        "grammar_corrections",
        "vocabulary_upgrades",
        "review",
    ],

    "properties": {

        "source": {
            "type": "string"
        },

        "overall_score": {
            "type": "integer"
        },

        "scores": {

            "type": "object",

            "required": [
                "grammar",
                "vocabulary",
                "fluency",
                "clarity",
                "sentence_structure",
            ],

            "properties": {

                "grammar": {
                    "type": "integer"
                },

                "vocabulary": {
                    "type": "integer"
                },

                "fluency": {
                    "type": "integer"
                },

                "clarity": {
                    "type": "integer"
                },

                "sentence_structure": {
                    "type": "integer"
                },
            },
        },

        "speech_stats": {

            "type": "object",

            "required": [
                "word_count",
                "unique_words",
                "estimated_wpm",
                "sentence_count",
                "filler_count",
                "repetition_count",
            ],

            "properties": {

                "word_count": {
                    "type": "integer"
                },

                "unique_words": {
                    "type": "integer"
                },

                "estimated_wpm": {
                    "type": "integer"
                },

                "sentence_count": {
                    "type": "integer"
                },

                "filler_count": {
                    "type": "integer"
                },

                "repetition_count": {
                    "type": "integer"
                },
            },
        },

        "filler_words": {

            "type": "array",

            "items": {
                "type": "object",

                "required": [
                    "word",
                    "count",
                ],

                "properties": {

                    "word": {
                        "type": "string"
                    },

                    "count": {
                        "type": "integer"
                    },
                },
            },
        },

        "repeated_words": {

            "type": "array",

            "items": {
                "type": "object",

                "required": [
                    "word",
                    "count",
                ],

                "properties": {

                    "word": {
                        "type": "string"
                    },

                    "count": {
                        "type": "integer"
                    },
                },
            },
        },

        "grammar_corrections": {

            "type": "array",

            "items": {

                "type": "object",

                "required": [
                    "original",
                    "corrected",
                    "explanation",
                ],

                "properties": {

                    "original": {
                        "type": "string"
                    },

                    "corrected": {
                        "type": "string"
                    },

                    "explanation": {
                        "type": "string"
                    },
                },
            },
        },

        "vocabulary_upgrades": {

            "type": "array",

            "items": {

                "type": "object",

                "required": [
                    "used",
                    "better",
                    "reason",
                ],

                "properties": {

                    "used": {
                        "type": "string"
                    },

                    "better": {
                        "type": "string"
                    },

                    "reason": {
                        "type": "string"
                    },
                },
            },
        },

        "review": {
            "type": "string"
        },
    },
}


# ============================================================
# USER PROMPT
# ============================================================

def build_prompt(
    data,
    local_result
):

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
        "Intermediate"
    )

    mode = data.get(
        "mode",
        ""
    )

    target_duration = data.get(
        "target_duration",
        60
    )

    actual_duration = data.get(
        "actual_duration"
    )

    transcript = data.get(
        "transcript",
        ""
    )

    stats = local_result.get(
        "speech_stats",
        {}
    )

    filler_words = local_result.get(
        "filler_words",
        []
    )

    repeated_words = local_result.get(
        "repeated_words",
        []
    )

    # ========================================================
    # IMPORTANT:
    #
    # We explicitly tell Cohere that these are calculated
    # values and must not be changed.
    # ========================================================

    prompt = f"""
Evaluate this English speaking response.

========================
TASK INFORMATION
========================

Topic:
{topic}

Category:
{category}

Difficulty:
{difficulty}

Mode:
{mode}

Target speaking duration:
{target_duration} seconds

Actual speaking duration:
{actual_duration} seconds

========================
OBJECTIVE PYTHON ANALYSIS
========================

These values were calculated independently by the SpeakUp
analysis engine.

You MUST preserve these values exactly.

Word count:
{stats.get("word_count", 0)}

Unique words:
{stats.get("unique_words", 0)}

Estimated WPM:
{stats.get("estimated_wpm", 0)}

Sentence count:
{stats.get("sentence_count", 0)}

Filler count:
{stats.get("filler_count", 0)}

Repetition count:
{stats.get("repetition_count", 0)}

Detected filler words:
{json.dumps(filler_words, ensure_ascii=False)}

Detected repeated words:
{json.dumps(repeated_words, ensure_ascii=False)}

========================
TRANSCRIPT
========================

{transcript}

========================
EVALUATION INSTRUCTIONS
========================

Now evaluate the response.

Consider the relationship between:

target duration = {target_duration} seconds

actual duration = {actual_duration} seconds

Do NOT assume that a short transcript is good merely because
its grammar is acceptable.

If the user stopped very early, recognize incomplete task
development in the overall evaluation.

At the same time, do not punish a response merely because it
contains fewer words if the actual speaking duration is also
short and the answer was otherwise appropriate.

Evaluate the quality of the English actually present.

For grammar corrections:

Only report genuine errors.

For vocabulary upgrades:

Only report meaningful improvements.

For the review:

Give a concise, specific assessment mentioning the most
important strength and the most important improvement.

Return ONLY the required JSON object.
"""

    return prompt


# ============================================================
# COHERE REQUEST
# ============================================================

async def cohere_evaluate(
    data,
    local_result
):

    prompt = build_prompt(
        data,
        local_result
    )

    # ========================================================
    # CALL COHERE
    #
    # ClientV2 chat is synchronous in the SDK, so this function
    # remains async for compatibility with FastAPI.
    # ========================================================

    response = client.chat(

        model=MODEL,

        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],

        temperature=0.15,

        max_tokens=2500,

        response_format={
            "type": "json_object",
            "schema": RESPONSE_SCHEMA,
        },
    )

    # ========================================================
    # EXTRACT RESPONSE TEXT
    # ========================================================

    text = ""

    try:

        for content in (
            response.message.content
        ):

            if getattr(
                content,
                "type",
                None
            ) == "text":

                text += (
                    content.text
                )

    except Exception:

        text = ""

    # Some SDK versions expose text differently.
    if not text:

        text = getattr(
            response,
            "text",
            ""
        )

    if not text:

        raise ValueError(
            "Cohere returned no evaluation text."
        )

    # ========================================================
    # PARSE JSON
    # ========================================================

    result = extract_json(
        text
    )

    if not isinstance(
        result,
        dict
    ):
        raise ValueError(
            "Cohere evaluation is not a JSON object."
        )

    # ========================================================
    # FORCE SOURCE
    # ========================================================

    result["source"] = "cohere"

    # ========================================================
    # SCORES
    # ========================================================

    scores = result.get(
        "scores",
        {}
    )

    if not isinstance(
        scores,
        dict
    ):
        scores = {}

    grammar = clamp_score(
        scores.get(
            "grammar"
        ),
        0
    )

    vocabulary = clamp_score(
        scores.get(
            "vocabulary"
        ),
        0
    )

    fluency = clamp_score(
        scores.get(
            "fluency"
        ),
        0
    )

    clarity = clamp_score(
        scores.get(
            "clarity"
        ),
        0
    )

    sentence_structure = clamp_score(
        scores.get(
            "sentence_structure"
        ),
        0
    )

    # ========================================================
    # SCORE SANITY CHECK
    # ========================================================

    result["scores"] = {

        "grammar": grammar,

        "vocabulary": vocabulary,

        "fluency": fluency,

        "clarity": clarity,

        "sentence_structure":
            sentence_structure,
    }

    # ========================================================
    # SPEECH STATS
    #
    # NEVER TRUST AI TO CHANGE THESE.
    #
    # Python is authoritative.
    # ========================================================

    local_stats = local_result.get(
        "speech_stats",
        {}
    )

    result["speech_stats"] = {

        "word_count": int(
            local_stats.get(
                "word_count",
                0
            )
        ),

        "unique_words": int(
            local_stats.get(
                "unique_words",
                0
            )
        ),

        "estimated_wpm": int(
            local_stats.get(
                "estimated_wpm",
                0
            )
        ),

        "sentence_count": int(
            local_stats.get(
                "sentence_count",
                0
            )
        ),

        "filler_count": int(
            local_stats.get(
                "filler_count",
                0
            )
        ),

        "repetition_count": int(
            local_stats.get(
                "repetition_count",
                0
            )
        ),
    }

    # ========================================================
    # FILLERS
    #
    # Python is authoritative.
    # ========================================================

    result["filler_words"] = (
        local_result.get(
            "filler_words",
            []
        )
    )

    # ========================================================
    # REPETITIONS
    #
    # Python is authoritative.
    # ========================================================

    result["repeated_words"] = (
        local_result.get(
            "repeated_words",
            []
        )
    )

    # ========================================================
    # GRAMMAR CORRECTIONS
    # ========================================================

    result["grammar_corrections"] = (
        normalize_grammar_corrections(
            result.get(
                "grammar_corrections",
                []
            )
        )
    )

    # ========================================================
    # VOCABULARY UPGRADES
    # ========================================================

    result["vocabulary_upgrades"] = (
        normalize_vocabulary_upgrades(
            result.get(
                "vocabulary_upgrades",
                []
            )
        )
    )

    # ========================================================
    # REVIEW
    # ========================================================

    review = result.get(
        "review",
        ""
    )

    if not isinstance(
        review,
        str
    ):
        review = ""

    review = review.strip()

    if not review:

        review = local_result.get(
            "review",
            "Your response has been evaluated."
        )

    result["review"] = review

    # ========================================================
    # OVERALL SCORE
    #
    # We do not blindly trust an arbitrary overall number.
    #
    # Calculate it from the five AI scores and then apply
    # task-completion awareness from the local analyzer.
    # ========================================================

    base_score = (

        grammar * 0.22

        + vocabulary * 0.20

        + fluency * 0.20

        + clarity * 0.18

        + sentence_structure * 0.20
    )

    overall = round(
        base_score
    )

    # --------------------------------------------------------
    # Task completion adjustment
    # --------------------------------------------------------

    target_duration = data.get(
        "target_duration",
        60
    )

    actual_duration = data.get(
        "actual_duration"
    )

    if (
        actual_duration is not None
        and target_duration
    ):

        try:

            completion = (
                float(actual_duration)
                / float(target_duration)
            )

            # Very short completion.
            if completion < 0.20:

                overall = min(
                    overall,
                    50
                )

            elif completion < 0.35:

                overall = min(
                    overall,
                    62
                )

            elif completion < 0.50:

                overall = min(
                    overall,
                    72
                )

            elif completion < 0.65:

                overall = min(
                    overall,
                    80
                )

        except (
            TypeError,
            ValueError,
            ZeroDivisionError
        ):
            pass

    result["overall_score"] = clamp_score(
        overall
    )

    # ========================================================
    # FINAL EXACT RESPONSE SHAPE
    # ========================================================

    return {

        "source": "cohere",

        "overall_score":
            result["overall_score"],

        "scores":
            result["scores"],

        "speech_stats":
            result["speech_stats"],

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