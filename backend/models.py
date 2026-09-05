from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime

from database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)

    topic = Column(String(500), unique=True, nullable=False)

    category = Column(String(100), nullable=False, index=True)

    difficulty = Column(String(50), nullable=False, index=True)

    description = Column(Text)

    questions = Column(Text)

    useful_vocabulary = Column(Text)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    is_active = Column(
        Boolean,
        default=True
    )



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    english_level = Column(
        String(50),
        default="Beginner"
    )

    learning_goal = Column(
        String(100),
        default="Improve Speaking"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    is_active = Column(
        Boolean,
        default=True
    )

class TopicUsage(Base):
    __tablename__ = "topic_usage"

    id = Column(Integer, primary_key=True)

    topic_id = Column(
        Integer,
        nullable=False,
        index=True
    )

    used_at = Column(
        DateTime,
        default=datetime.utcnow
    )