import json
import os

from database import SessionLocal, engine, Base
from models import Topic


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TOPICS_FILE = os.path.join(BASE_DIR, "topics.json")


def migrate():
    Base.metadata.create_all(bind=engine)

    with open(TOPICS_FILE, "r", encoding="utf-8") as f:
        topics = json.load(f)

    db = SessionLocal()

    added = 0
    skipped = 0

    try:
        for item in topics:

            topic_text = item.get("topic", "").strip()

            if not topic_text:
                continue

            # Don't insert duplicates
            existing = (
                db.query(Topic)
                .filter(Topic.topic == topic_text)
                .first()
            )

            if existing:
                skipped += 1
                continue

            topic = Topic(
                topic=topic_text,
                category=item.get("category", "General"),
                difficulty=item.get("difficulty", "Intermediate"),
                description=item.get("description", ""),
                questions=json.dumps(
                    item.get("questions", []),
                    ensure_ascii=False
                ),
                useful_vocabulary=json.dumps(
                    item.get("useful_vocabulary", []),
                    ensure_ascii=False
                ),
                is_active=True
            )

            db.add(topic)
            added += 1

        db.commit()

        print("\nMigration complete!")
        print(f"Added   : {added}")
        print(f"Skipped : {skipped}")
        print(f"Total   : {db.query(Topic).count()}")

    except Exception as e:
        db.rollback()
        print("Migration failed:", e)

    finally:
        db.close()


if __name__ == "__main__":
    migrate()