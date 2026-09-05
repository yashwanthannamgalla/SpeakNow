import json
import random

from typing import Optional

from fastapi import (
    FastAPI,
    Depends,
    Query,
    HTTPException,
)

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, EmailStr

from pwdlib import PasswordHash

from jose import jwt

from sqlalchemy.orm import Session

from sqlalchemy import func

from services.cohere_evaluator import cohere_evaluate
from services.local_evaluator import local_evaluate

from database import engine, Base, get_db
from models import Topic, TopicUsage, User


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="SpeakUp API"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# AUTHENTICATION CONFIGURATION
# ============================================================

password_hash = PasswordHash.recommended()

SECRET_KEY = "skillenhancer-change-this-secret-key"

ALGORITHM = "HS256"


# ============================================================
# AUTH REQUEST MODELS
# ============================================================


class SignupRequest(BaseModel):

    name: str

    email: EmailStr

    password: str

    english_level: str = "Beginner"

    learning_goal: str = "Improve Speaking"


class LoginRequest(BaseModel):

    email: EmailStr

    password: str


# ============================================================
# EVALUATION REQUEST
# ============================================================


class EvaluationRequest(BaseModel):

    topic: str

    category: Optional[str] = ""

    difficulty: Optional[str] = ""

    mode: Optional[str] = ""

    # Time user was supposed to speak
    target_duration: int = 60

    # Actual time user spoke
    actual_duration: Optional[float] = None

    transcript: str


# ============================================================
# CATEGORIES
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
    "General",
]


# ============================================================
# HELPER
# ============================================================


def user_response(user):

    return {
        "id": user.id,

        "name": user.name,

        "email": user.email,

        "english_level": user.english_level,

        "learning_goal": user.learning_goal,
    }


# ============================================================
# SIGNUP
# ============================================================


@app.post("/api/signup")
def signup(
    data: SignupRequest,
    db: Session = Depends(get_db),
):

    # ========================================================
    # VALIDATE PASSWORD
    # ========================================================

    if len(data.password) < 6:

        raise HTTPException(
            status_code=400,

            detail=(
                "Password must be at least 6 characters"
            ),
        )


    # ========================================================
    # NORMALIZE EMAIL
    # ========================================================

    email = data.email.lower()


    # ========================================================
    # CHECK EXISTING USER
    # ========================================================

    existing_user = (
        db.query(User)
        .filter(
            func.lower(User.email) == email
        )
        .first()
    )


    if existing_user:

        raise HTTPException(
            status_code=400,

            detail="Email already registered",
        )


    # ========================================================
    # HASH PASSWORD
    # ========================================================

    hashed_password = password_hash.hash(
        data.password
    )


    # ========================================================
    # CREATE USER
    # ========================================================

    user = User(

        name=data.name.strip(),

        email=email,

        password_hash=hashed_password,

        english_level=data.english_level,

        learning_goal=data.learning_goal,

    )


    db.add(user)

    db.commit()

    db.refresh(user)


    # ========================================================
    # CREATE JWT TOKEN
    #
    # Signup immediately logs the user in.
    # ========================================================

    token_data = {

        "sub": str(user.id),

        "email": user.email,

    }


    token = jwt.encode(

        token_data,

        SECRET_KEY,

        algorithm=ALGORITHM,

    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "success": True,

        "message": "Account created successfully",

        "token": token,

        "user": user_response(user),

    }


# ============================================================
# LOGIN
# ============================================================


@app.post("/api/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):

    # ========================================================
    # NORMALIZE EMAIL
    # ========================================================

    email = data.email.lower()


    # ========================================================
    # FIND USER
    # ========================================================

    user = (
        db.query(User)
        .filter(
            func.lower(User.email) == email
        )
        .first()
    )


    # ========================================================
    # USER NOT FOUND
    # ========================================================

    if not user:

        raise HTTPException(
            status_code=401,

            detail="Invalid email or password",
        )


    # ========================================================
    # CHECK ACTIVE
    # ========================================================

    if not user.is_active:

        raise HTTPException(
            status_code=403,

            detail="This account is inactive",
        )


    # ========================================================
    # VERIFY PASSWORD
    # ========================================================

    password_valid = (
        password_hash.verify(
            data.password,

            user.password_hash,
        )
    )


    if not password_valid:

        raise HTTPException(
            status_code=401,

            detail="Invalid email or password",
        )


    # ========================================================
    # CREATE JWT TOKEN
    # ========================================================

    token_data = {

        "sub": str(user.id),

        "email": user.email,

    }


    token = jwt.encode(

        token_data,

        SECRET_KEY,

        algorithm=ALGORITHM,

    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "success": True,

        "message": "Login successful",

        "token": token,

        "user": user_response(user),

    }


# ============================================================
# EVALUATION
#
# Transcript
#     ↓
# Local Python analysis
#     ↓
# Objective statistics
#     ↓
# Cohere
#     ↓
# Final evaluation
# ============================================================


@app.post("/api/evaluate")
async def evaluate_speech(
    data: EvaluationRequest
):

    payload = data.model_dump()

    transcript = (
        payload.get("transcript") or ""
    ).strip()


    print()

    print("==============================")

    print("SPEAKUP EVALUATION STARTED")

    print("==============================")


    # ========================================================
    # CHECK TRANSCRIPT
    # ========================================================

    if len(transcript) < 3:

        print(
            "Transcript too short."
        )

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

                "Not enough speech was captured. "

                "Please speak for longer and try again."

            ),

        }


    # ========================================================
    # LOCAL PYTHON ANALYSIS
    # ========================================================

    print(
        "Running local analysis..."
    )


    try:

        local_result = local_evaluate(
            payload
        )

        print(
            "Local analysis completed."
        )


    except Exception as error:

        print()

        print("==============================")

        print("LOCAL EVALUATOR FAILED")

        print("==============================")


        print(error)


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

                "The speech could not be analyzed."

            ),

        }


    # ========================================================
    # PRINT LOCAL STATS
    # ========================================================

    stats = local_result.get(
        "speech_stats",
        {}
    )


    print()

    print("------------------------------")

    print("LOCAL SPEECH STATS")

    print("------------------------------")


    print(
        "Words:",
        stats.get(
            "word_count",
            0
        )
    )


    print(
        "Unique words:",
        stats.get(
            "unique_words",
            0
        )
    )


    print(
        "WPM:",
        stats.get(
            "estimated_wpm",
            0
        )
    )


    print(
        "Sentences:",
        stats.get(
            "sentence_count",
            0
        )
    )


    print(
        "Fillers:",
        stats.get(
            "filler_count",
            0
        )
    )


    print(
        "Repetitions:",
        stats.get(
            "repetition_count",
            0
        )
    )


    print(
        "------------------------------"
    )


    # ========================================================
    # COHERE
    # ========================================================

    print()

    print(
        "Sending transcript to Cohere..."
    )


    try:

        result = await cohere_evaluate(
            payload,
            local_result
        )


        print(
            "Cohere evaluation completed."
        )


        return result


    except Exception as error:

        print()

        print("==============================")

        print("COHERE EVALUATION FAILED")

        print("==============================")


        print(error)


        print()

        print(
            "Falling back to local evaluator..."
        )


        return local_result


# ============================================================
# RANDOM TOPIC
#
# IMPORTANT:
# NO GEMINI
# NO COHERE
#
# SQLite only.
# ============================================================


@app.get("/api/random-topic")
def random_topic(

    category: str | None = Query(
        default=None
    ),

    difficulty: str | None = Query(
        default=None
    ),

    db: Session = Depends(get_db),

):

    # ========================================================
    # BUILD QUERY
    # ========================================================

    query = (
        db.query(Topic)
        .filter(
            Topic.is_active == True
        )
    )


    # ========================================================
    # CATEGORY
    # ========================================================

    if (
        category
        and category.lower() != "all"
    ):

        query = query.filter(

            func.lower(
                Topic.category
            )
            == category.lower()

        )


    # ========================================================
    # DIFFICULTY
    # ========================================================

    if (
        difficulty
        and difficulty.lower() != "all"
    ):

        query = query.filter(

            func.lower(
                Topic.difficulty
            )
            == difficulty.lower()

        )


    # ========================================================
    # GET TOPICS
    # ========================================================

    topics = query.all()


    # ========================================================
    # NO TOPICS
    # ========================================================

    if not topics:

        return {

            "success": False,

            "message": (
                "No topics available "
                "for the selected filters."
            ),

        }


    # ========================================================
    # RECENT TOPICS
    # ========================================================

    recent_usage = (

        db.query(
            TopicUsage.topic_id
        )

        .order_by(
            TopicUsage.used_at.desc()
        )

        .limit(20)

        .all()

    )


    recent_ids = {

        row[0]

        for row in recent_usage

    }


    # ========================================================
    # REMOVE RECENTLY USED
    # ========================================================

    available = [

        topic

        for topic in topics

        if topic.id not in recent_ids

    ]


    # ========================================================
    # NEW CYCLE
    # ========================================================

    if not available:

        available = topics


    # ========================================================
    # RANDOM TOPIC
    # ========================================================

    selected = random.choice(
        available
    )


    # ========================================================
    # RECORD USAGE
    # ========================================================

    usage = TopicUsage(

        topic_id=selected.id

    )


    db.add(usage)

    db.commit()


    # ========================================================
    # QUESTIONS
    # ========================================================

    try:

        questions = json.loads(

            selected.questions or "[]"

        )

    except (
        json.JSONDecodeError,
        TypeError
    ):

        questions = []


    # ========================================================
    # VOCABULARY
    # ========================================================

    try:

        useful_vocabulary = json.loads(

            selected.useful_vocabulary
            or "[]"

        )

    except (
        json.JSONDecodeError,
        TypeError
    ):

        useful_vocabulary = []


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "success": True,

        "topic": {

            "id": selected.id,

            "topic": selected.topic,

            "category": selected.category,

            "difficulty": selected.difficulty,

            "description": selected.description,

            "questions": questions,

            "useful_vocabulary": useful_vocabulary,

        },

    }


# ============================================================
# CATEGORIES
# ============================================================


@app.get("/api/categories")
def get_categories(
    db: Session = Depends(get_db)
):

    result = []


    for category in CATEGORIES:

        count = (

            db.query(Topic)

            .filter(

                Topic.is_active == True,

                func.lower(
                    Topic.category
                )
                == category.lower()

            )

            .count()

        )


        result.append({

            "name": category,

            "topic_count": count,

        })


    return {

        "success": True,

        "categories": result,

    }


# ============================================================
# TOPIC DATABASE STATS
# ============================================================


@app.get("/api/topic/stats")
def topic_stats(
    db: Session = Depends(get_db)
):

    # ========================================================
    # TOTAL
    # ========================================================

    total = (

        db.query(Topic)

        .filter(
            Topic.is_active == True
        )

        .count()

    )


    # ========================================================
    # CATEGORY COUNTS
    # ========================================================

    categories = {}


    for category in CATEGORIES:

        count = (

            db.query(Topic)

            .filter(

                Topic.is_active == True,

                func.lower(
                    Topic.category
                )
                == category.lower()

            )

            .count()

        )


        categories[category] = count


    # ========================================================
    # DIFFICULTY COUNTS
    # ========================================================

    difficulties = {}


    for difficulty in [

        "Beginner",

        "Intermediate",

        "Advanced"

    ]:

        count = (

            db.query(Topic)

            .filter(

                Topic.is_active == True,

                func.lower(
                    Topic.difficulty
                )
                == difficulty.lower()

            )

            .count()

        )


        difficulties[difficulty] = count


    return {

        "success": True,

        "total_topics": total,

        "categories": categories,

        "difficulties": difficulties,

    }


# ============================================================
# HEALTH CHECK
# ============================================================


@app.get("/api/health")
def health():

    return {

        "success": True,

        "message": "SpeakUp API is running",

    }


# ============================================================
# ROOT
# ============================================================


@app.get("/")
def root():

    return {

        "message": "SpeakUp API",

    }