from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.user_profile import UserProfile
from app.utils.colors import Colors


class ProfileSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, UserProfile)

    def seed_profile(self, user_id: str, full_name: str, class_id: int | None = None):
        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping profile seeding")
            return None
        inspector = inspect(bind)
        if "user_profiles" not in set(inspector.get_table_names()):
            Colors.warning("Table 'user_profiles' does not exist, skipping profile seeding")
            return None

        if not self.exists(user_id=user_id):

            profile_data = {
                "user_id": user_id,
                "full_name": full_name,
                "class_id": class_id,
                "phone": "012345678",
                "address": "Phnom Penh"
            }

            profile = self.create_one(lambda: profile_data)
            self.db.commit()
            self.db.refresh(profile)

            Colors.success(f"Profile created for {full_name}")

            return profile
        
        