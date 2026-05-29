from sqlalchemy.orm import Session
from datetime import date
from app.db.seed.base import BaseSeeder
from app.models.finance import FeeCollection, Expense, Salary
from app.utils.colors import Colors


class FinanceSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, FeeCollection)

    def seed_finance(self):
        # 1. Seed Fee Collections (Tuition fees paid by students)
        fees_data = [
            {"student_name": "Emma Johnson", "reference": "FE-2026-001", "amount": 1200.0, "status": "paid", "paid_date": date(2026, 4, 5), "notes": "Spring Semester Tuition Fee"},
            {"student_name": "Liam Smith", "reference": "FE-2026-002", "amount": 1200.0, "status": "paid", "paid_date": date(2026, 4, 6), "notes": "Spring Semester Tuition Fee"},
            {"student_name": "Olivia Williams", "reference": "FE-2026-003", "amount": 1200.0, "status": "paid", "paid_date": date(2026, 4, 7), "notes": "Spring Semester Tuition Fee"},
            {"student_name": "Noah Brown", "reference": "FE-2026-004", "amount": 1200.0, "status": "paid", "paid_date": date(2026, 4, 8), "notes": "Spring Semester Tuition Fee"},
            {"student_name": "Ava Jones", "reference": "FE-2026-005", "amount": 1200.0, "status": "paid", "paid_date": date(2026, 4, 10), "notes": "Spring Semester Tuition Fee"},
            {"student_name": "Ethan Garcia", "reference": "FE-2026-006", "amount": 1200.0, "status": "paid", "paid_date": date(2026, 4, 11), "notes": "Spring Semester Tuition Fee"},
            {"student_name": "Sophia Miller", "reference": "FE-2026-007", "amount": 1200.0, "status": "paid", "paid_date": date(2026, 4, 12), "notes": "Spring Semester Tuition Fee"},
            {"student_name": "Mason Davis", "reference": "FE-2026-008", "amount": 1200.0, "status": "paid", "paid_date": date(2026, 4, 15), "notes": "Spring Semester Tuition Fee"},
        ]

        seeded_fees = []
        for fd in fees_data:
            existing = self.db.query(FeeCollection).filter_by(reference=fd["reference"]).first()
            if not existing:
                fc = FeeCollection(**fd)
                self.db.add(fc)
                seeded_fees.append(fc)
            else:
                seeded_fees.append(existing)

        # 2. Seed Salaries (Instructor/staff payroll payments)
        salaries_data = [
            {"staff_name": "Dr. Sarah Chen", "role": "Professor", "month": "2026-04", "amount": 4500.0, "status": "paid", "paid_date": date(2026, 4, 30), "notes": "Monthly Faculty Salary"},
            {"staff_name": "Prof. Michael Johnson", "role": "Associate Professor", "month": "2026-04", "amount": 4200.0, "status": "paid", "paid_date": date(2026, 4, 30), "notes": "Monthly Faculty Salary"},
            {"staff_name": "Dr. James Wilson", "role": "Professor", "month": "2026-04", "amount": 4500.0, "status": "paid", "paid_date": date(2026, 4, 30), "notes": "Monthly Faculty Salary"},
            {"staff_name": "Prof. Lisa Anderson", "role": "Assistant Professor", "month": "2026-04", "amount": 3800.0, "status": "paid", "paid_date": date(2026, 4, 30), "notes": "Monthly Faculty Salary"},
            {"staff_name": "Dr. Robert Martinez", "role": "Lecturer", "month": "2026-04", "amount": 3500.0, "status": "paid", "paid_date": date(2026, 4, 30), "notes": "Monthly Faculty Salary"},
        ]

        seeded_salaries = []
        for sd in salaries_data:
            existing = self.db.query(Salary).filter_by(staff_name=sd["staff_name"], month=sd["month"]).first()
            if not existing:
                s = Salary(**sd)
                self.db.add(s)
                seeded_salaries.append(s)
            else:
                seeded_salaries.append(existing)

        # 3. Seed Expenses (Operational school costs)
        expenses_data = [
            {"title": "Academic Database Software Subscriptions", "category": "Software Licenses", "amount": 750.0, "spent_date": date(2026, 4, 5), "notes": "Annual software access for students"},
            {"title": "Physics and Robotics Lab Equipment Maintenance", "category": "Equipment", "amount": 540.0, "spent_date": date(2026, 4, 12), "notes": "Calibrating lab kits"},
            {"title": "Digital Textbook E-Library Acquisition", "category": "Library", "amount": 1200.0, "spent_date": date(2026, 4, 18), "notes": "Acquired 50 new standard course texts"},
            {"title": "High-Speed Campus Fiber Internet Fee", "category": "Utilities", "amount": 350.0, "spent_date": date(2026, 4, 25), "notes": "Monthly fiber utility bill"},
        ]

        seeded_expenses = []
        for ed in expenses_data:
            existing = self.db.query(Expense).filter_by(title=ed["title"]).first()
            if not existing:
                e = Expense(**ed)
                self.db.add(e)
                seeded_expenses.append(e)
            else:
                seeded_expenses.append(existing)

        self.db.commit()
        Colors.success(f"{len(seeded_fees)} fee collection(s), {len(seeded_salaries)} salary record(s), and {len(seeded_expenses)} expense record(s) seeded")
        return {"fees": seeded_fees, "salaries": seeded_salaries, "expenses": seeded_expenses}
