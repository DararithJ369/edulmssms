import random
from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.db.seed.base import BaseSeeder
from app.models.finance import FeeCollection, Expense, Salary
from app.models.user import User
from app.models.user_profile import UserProfile
from app.utils.colors import Colors


class FinanceSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, FeeCollection)

    def seed_finance(self):
        rng = random.Random(42)  # Deterministic seed

        # 1. Seed Fee Collections (Tuition fees for all 200 students)
        # Fetch all student names from profiles
        students = (
            self.db.query(UserProfile)
            .join(User)
            .filter(User.role_id == 3)  # Student Role ID
            .order_by(User.username.asc())
            .all()
        )

        seeded_fees = []
        for idx, student in enumerate(students, start=1):
            ref_code = f"FE-2026-{idx:03d}"
            existing = self.db.query(FeeCollection).filter_by(reference=ref_code).first()
            if existing:
                seeded_fees.append(existing)
                continue

            # Determine payment status distribution: 80% paid, 12% partial, 8% pending
            rand_val = rng.random()
            if rand_val < 0.80:
                status = "paid"
                amount = 1200.0
                paid_date = date(2026, 4, 1) + timedelta(days=rng.randint(0, 15))
                notes = "Full Semester I Tuition Payment"
            elif rand_val < 0.92:
                status = "partial"
                amount = 600.0
                paid_date = date(2026, 4, 1) + timedelta(days=rng.randint(0, 15))
                notes = "First Installment (50%) of Semester I Tuition"
            else:
                status = "pending"
                amount = 1200.0
                paid_date = None
                notes = "Outstanding Semester I Tuition Balance"

            fc = FeeCollection(
                student_name=student.full_name or "Student Student",
                reference=ref_code,
                amount=amount,
                status=status,
                paid_date=paid_date,
                notes=notes
            )
            self.db.add(fc)
            seeded_fees.append(fc)

        # 2. Seed Salaries (Payroll for all 20 instructors)
        instructors = (
            self.db.query(UserProfile)
            .join(User)
            .filter(User.role_id == 2)  # Instructor Role ID
            .order_by(User.username.asc())
            .all()
        )

        seeded_salaries = []
        months = ["2026-03", "2026-04", "2026-05"]

        for month in months:
            for idx, inst in enumerate(instructors):
                # Check if salary record already exists
                existing = self.db.query(Salary).filter_by(staff_name=inst.full_name, month=month).first()
                if existing:
                    seeded_salaries.append(existing)
                    continue

                # Determine role & amount based on index
                if idx % 4 == 0:
                    role = "Professor"
                    amount = 4500.0
                elif idx % 4 == 1:
                    role = "Associate Professor"
                    amount = 4000.0
                elif idx % 4 == 2:
                    role = "Senior Lecturer"
                    amount = 3500.0
                else:
                    role = "Lecturer"
                    amount = 3000.0

                s = Salary(
                    staff_name=inst.full_name or "Faculty Staff",
                    role=role,
                    month=month,
                    amount=amount,
                    status="paid",
                    paid_date=date(2026, int(month.split("-")[1]), 28) + timedelta(days=rng.randint(0, 2)),
                    notes="Standard Monthly Faculty Payroll"
                )
                self.db.add(s)
                seeded_salaries.append(s)

        # 3. Seed Expenses (12 operational expenses over the last 3 months)
        expenses_data = [
            {"title": "High-Speed Campus Fiber Internet Fee", "category": "Utilities", "amount": 350.0, "spent_date": date(2026, 3, 25), "notes": "Monthly campus-wide fiber connectivity bill"},
            {"title": "AWS Cloud Architecture & Hosting Fees", "category": "Hosting", "amount": 450.0, "spent_date": date(2026, 3, 28), "notes": "Hosting production dashboard servers and RDS databases"},
            {"title": "Academic Database Software Licenses", "category": "Software Licenses", "amount": 850.0, "spent_date": date(2026, 4, 1), "notes": "DBMS lab query tools access keys"},
            {"title": "Library Textbook Acquisition", "category": "Library", "amount": 1200.0, "spent_date": date(2026, 4, 5), "notes": "Standard curriculum textbooks (50 books)"},
            {"title": "Office Supplies & Whiteboard Markers", "category": "Office Supplies", "amount": 180.0, "spent_date": date(2026, 4, 10), "notes": "Markers, copy paper, and print cartridges"},
            {"title": "High-Speed Campus Fiber Internet Fee", "category": "Utilities", "amount": 350.0, "spent_date": date(2026, 4, 25), "notes": "Monthly campus-wide fiber connectivity bill"},
            {"title": "AWS Cloud Architecture & Hosting Fees", "category": "Hosting", "amount": 480.0, "spent_date": date(2026, 4, 28), "notes": "Hosting production dashboard servers and RDS databases"},
            {"title": "Robotics Lab Equipment Upgrades", "category": "Equipment", "amount": 1500.0, "spent_date": date(2026, 5, 2), "notes": "Microcontroller boards, sensor modules, and servo motors"},
            {"title": "Zoom Pro University Subscriptions", "category": "Software Licenses", "amount": 600.0, "spent_date": date(2026, 5, 10), "notes": "Video conferencing rooms licenses"},
            {"title": "General Campus Plumbing Repair", "category": "Maintenance", "amount": 320.0, "spent_date": date(2026, 5, 15), "notes": "Restroom plumbing system updates"},
            {"title": "High-Speed Campus Fiber Internet Fee", "category": "Utilities", "amount": 350.0, "spent_date": date(2026, 5, 25), "notes": "Monthly campus-wide fiber connectivity bill"},
            {"title": "AWS Cloud Architecture & Hosting Fees", "category": "Hosting", "amount": 510.0, "spent_date": date(2026, 5, 28), "notes": "Hosting production dashboard servers and RDS databases"}
        ]

        seeded_expenses = []
        for ed in expenses_data:
            existing = self.db.query(Expense).filter_by(title=ed["title"], spent_date=ed["spent_date"]).first()
            if not existing:
                e = Expense(**ed)
                self.db.add(e)
                seeded_expenses.append(e)
            else:
                seeded_expenses.append(existing)

        self.db.commit()
        Colors.success(f"✓ {len(seeded_fees)} fee collection(s), {len(seeded_salaries)} salary record(s), and {len(seeded_expenses)} expense record(s) successfully seeded")
        return {"fees": seeded_fees, "salaries": seeded_salaries, "expenses": seeded_expenses}
