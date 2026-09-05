import os
import json
import argparse
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv
from google import genai
from google.genai import types


# ============================================================
# CONFIG
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")

MODEL = "gemini-3.5-flash-lite"

TOPICS_FILE = BASE_DIR / "topics.json"


# ============================================================
# GENERATION SETTINGS
# ============================================================

CATEGORIES = [
    "Technology",
    "Education",
    "Student Life",
    "Workplace",
    "Society",
    "Environment",
    "Health & Lifestyle",
    "Entertainment",
    "Travel",
    "General"
]

TOPICS_PER_CATEGORY = 20


# ============================================================
# GEMINI CLIENT
# ============================================================

if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY not found in .env"
    )

client = genai.Client(
    api_key=API_KEY
)

print("✓ Gemini initialized")
print(f"✓ Model: {MODEL}")


# ============================================================
# LOAD TOPICS
# ============================================================

def load_topics():

    if not TOPICS_FILE.exists():
        return []

    try:

        with open(
            TOPICS_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

        if isinstance(data, list):
            return data

        if isinstance(data, dict):

            if isinstance(
                data.get("topics"),
                list
            ):
                return data["topics"]

        return []

    except Exception as error:

        print(
            f"⚠ Failed to load topics.json: {error}"
        )

        return []


# ============================================================
# SAVE TOPICS
# ============================================================

def save_topics(topics):

    temp_file = TOPICS_FILE.with_suffix(".tmp")

    with open(
        temp_file,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            topics,
            file,
            indent=2,
            ensure_ascii=False
        )

        file.write("\n")

    os.replace(
        temp_file,
        TOPICS_FILE
    )


# ============================================================
# NORMALIZE TITLE
# ============================================================

def normalize_title(title):

    return (
        str(title)
        .strip()
        .lower()
        .replace("?", "")
        .replace(".", "")
        .replace("!", "")
    )


# ============================================================
# BUILD PROMPT
# ============================================================

def build_prompt(category):

    return f"""
You are an expert English speaking coach.

Create exactly 20 UNIQUE English speaking topics
for the category:

{category}

Difficulty distribution:

- 6 Beginner
- 8 Intermediate
- 6 Advanced

BEGINNER:
- Simple vocabulary
- Familiar situations
- Easy to explain
- Suitable for English learners

INTERMEDIATE:
- Requires opinions
- Requires explanations
- Some comparison or reasoning
- Everyday knowledge

ADVANCED:
- Requires deeper reasoning
- Arguments and counterarguments
- More abstract ideas
- Requires detailed explanation

IMPORTANT:

1. Every topic must be unique.

2. Topics should be interesting for:
   - college students
   - young adults
   - English learners

3. Topics should allow the user to speak
   for approximately 1-5 minutes.

4. Avoid extremely generic topics such as:
   - Tell me about yourself
   - What is your favorite color?
   - Describe your family

5. Do not require specialist knowledge.

6. Topics should encourage:
   - opinions
   - explanations
   - examples
   - storytelling
   - comparisons
   - arguments

7. Use natural English.

8. Do NOT repeat similar topics.

9. Return ONLY valid JSON.

Use exactly this structure:

[
  {{
    "topic": "string",
    "category": "{category}",
    "difficulty": "Beginner",
    "description": "short description",
    "questions": [
      "question 1",
      "question 2",
      "question 3"
    ],
    "useful_vocabulary": [
      "word or phrase 1",
      "word or phrase 2",
      "word or phrase 3",
      "word or phrase 4",
      "word or phrase 5"
    ]
  }}
]

The response MUST contain exactly 20 objects.
"""


# ============================================================
# GENERATE ONE CATEGORY
# ============================================================

def generate_category(category):

    print()
    print("=" * 60)
    print(f"Generating: {category}")
    print("=" * 60)

    prompt = build_prompt(category)

    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.9,
            response_mime_type="application/json"
        )
    )

    if not response.text:

        raise RuntimeError(
            "Gemini returned empty response"
        )

    data = json.loads(
        response.text
    )

    if not isinstance(data, list):

        raise RuntimeError(
            "Gemini response is not a list"
        )

    return data


# ============================================================
# VALIDATE TOPIC
# ============================================================

def validate_topic(topic):

    if not isinstance(topic, dict):
        return False

    required_fields = [
        "topic",
        "category",
        "difficulty",
        "description",
        "questions",
        "useful_vocabulary"
    ]

    for field in required_fields:

        if field not in topic:
            return False

    if not isinstance(
        topic["questions"],
        list
    ):
        return False

    if not isinstance(
        topic["useful_vocabulary"],
        list
    ):
        return False

    if not str(
        topic["topic"]
    ).strip():

        return False

    if topic["difficulty"] not in [
        "Beginner",
        "Intermediate",
        "Advanced"
    ]:

        return False

    return True


# ============================================================
# CLEAN GENERATED TOPICS
# ============================================================

def clean_generated_topics(
    generated_topics,
    category,
    existing_topics
):

    cleaned = []

    # Existing titles
    existing_titles = {

        normalize_title(
            topic.get("topic", "")
        )

        for topic in existing_topics

        if isinstance(topic, dict)
    }

    # Titles inside this generation
    new_titles = set()

    for topic in generated_topics:

        # ----------------------------------------------------
        # Validate
        # ----------------------------------------------------

        if not validate_topic(topic):

            print(
                "⚠ Invalid topic skipped"
            )

            continue

        # ----------------------------------------------------
        # Force category
        # ----------------------------------------------------

        topic["category"] = category

        # ----------------------------------------------------
        # Title
        # ----------------------------------------------------

        title = normalize_title(
            topic["topic"]
        )

        # ----------------------------------------------------
        # Duplicate with existing library
        # ----------------------------------------------------

        if title in existing_titles:

            print(
                f"→ Existing duplicate skipped: "
                f"{topic['topic']}"
            )

            continue

        # ----------------------------------------------------
        # Duplicate inside new batch
        # ----------------------------------------------------

        if title in new_titles:

            print(
                f"→ Batch duplicate skipped: "
                f"{topic['topic']}"
            )

            continue

        # ----------------------------------------------------
        # Metadata
        # ----------------------------------------------------

        topic["source"] = "gemini"

        topic["generated_at"] = (
            datetime.now(
                timezone.utc
            ).isoformat()
        )

        new_titles.add(title)

        cleaned.append(topic)

    return cleaned


# ============================================================
# REPLACE CATEGORY
# ============================================================

def replace_category(
    category,
    new_topics
):

    current_topics = load_topics()

    # Keep all other categories
    remaining_topics = [

        topic

        for topic in current_topics

        if normalize_title(
            topic.get("category", "")
        )
        != normalize_title(category)
    ]

    updated_topics = (
        remaining_topics
        + new_topics
    )

    save_topics(
        updated_topics
    )

    print()
    print(
        f"✓ Replaced {category} topics"
    )

    print(
        f"✓ New topics: {len(new_topics)}"
    )

    print(
        f"✓ Total topics: "
        f"{len(updated_topics)}"
    )


# ============================================================
# REFRESH ONE CATEGORY
# ============================================================

def refresh_category(category):

    if category not in CATEGORIES:

        raise ValueError(
            f"Unknown category: {category}"
        )

    print()
    print("=" * 70)
    print(
        f"REFRESHING CATEGORY: {category}"
    )
    print("=" * 70)

    existing_topics = load_topics()

    # Generate
    generated = generate_category(
        category
    )

    print(
        f"Gemini returned: "
        f"{len(generated)} topics"
    )

    # Clean
    new_topics = clean_generated_topics(
        generated,
        category,
        existing_topics
    )

    # --------------------------------------------------------
    # Safety check
    # --------------------------------------------------------

    if len(new_topics) < 10:

        raise RuntimeError(
            f"Only {len(new_topics)} valid unique "
            f"topics generated. Category was NOT replaced."
        )

    # --------------------------------------------------------
    # Replace
    # --------------------------------------------------------

    replace_category(
        category,
        new_topics
    )

    print("=" * 70)
    print(
        f"✓ {category} refresh complete"
    )
    print("=" * 70)


# ============================================================
# GENERATE ALL CATEGORIES
# ============================================================

def generate_all():

    print()
    print("=" * 70)
    print("       SPEAKUP TOPIC LIBRARY GENERATOR")
    print("=" * 70)

    existing_topics = load_topics()

    print(
        f"Existing topics: "
        f"{len(existing_topics)}"
    )

    all_new_topics = []

    existing_titles = {

        normalize_title(
            topic.get("topic", "")
        )

        for topic in existing_topics

        if isinstance(topic, dict)
    }

    for category in CATEGORIES:

        try:

            generated = generate_category(
                category
            )

            print(
                f"Gemini returned "
                f"{len(generated)} topics"
            )

            cleaned = clean_generated_topics(
                generated,
                category,
                existing_topics
                + all_new_topics
            )

            all_new_topics.extend(
                cleaned
            )

            print(
                f"✓ Added {len(cleaned)} topics"
            )

        except Exception as error:

            print()
            print(
                f"❌ Failed: {category}"
            )

            print(error)

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    final_topics = (
        existing_topics
        + all_new_topics
    )

    save_topics(
        final_topics
    )

    # --------------------------------------------------------
    # Stats
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("GENERATION COMPLETE")
    print("=" * 70)

    print(
        f"Previous topics : "
        f"{len(existing_topics)}"
    )

    print(
        f"New topics      : "
        f"{len(all_new_topics)}"
    )

    print(
        f"Total topics    : "
        f"{len(final_topics)}"
    )

    print("=" * 70)


# ============================================================
# COMMAND LINE
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description="SpeakUp Topic Generator"
    )

    parser.add_argument(
        "--category",
        type=str,
        default=None,
        help="Generate topics for one category"
    )

    args = parser.parse_args()

    # --------------------------------------------------------
    # One category
    # --------------------------------------------------------

    if args.category:

        refresh_category(
            args.category
        )

    # --------------------------------------------------------
    # All categories
    # --------------------------------------------------------

    else:

        generate_all()


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    main()