"""
Shared role-based query filtering for student-scoped resources.

Extracted from duplicated logic in result_service.py and attendance_service.py.
"""
from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.orm import Query


def apply_student_role_filter(
    query: Query,
    student_id_column: Any,
    current_user: Any,
    page: int,
    limit: int,
) -> tuple[Query, Optional[dict]]:
    """Restrict *query* to rows visible to *current_user* based on their role.

    Returns
    -------
    (filtered_query, early_return)
        *early_return* is ``None`` when the query should proceed normally.
        When a parent has no linked students it is the empty-list response
        dict that the caller should return immediately.
    """
    if current_user is None:
        return query, None

    role = current_user.role.name.lower()

    if role == "student":
        query = query.filter(student_id_column == current_user.id)
    elif role == "parent":
        if current_user.profile and current_user.profile.parent_profile:
            student_user_ids = [
                s.profile.user_id
                for s in current_user.profile.parent_profile.students
                if s.profile
            ]
            query = query.filter(student_id_column.in_(student_user_ids))
        else:
            return query, {
                "data": [],
                "meta": {"page": page, "total": 0, "limit": limit},
            }

    return query, None
