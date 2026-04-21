/**
 * API Integration Guide for Frontend
 * 
 * This demonstrates how to use the centralized endpoints with your existing
 * axios instance in real components.
 */

import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";

// ─────────────────────────────────────────────────────────────────────────
// 1. SIMPLE GET REQUEST
// ─────────────────────────────────────────────────────────────────────────

export async function fetchAllUsers() {
  try {
    const response = await api.get(API.USERS.GET_ALL);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 2. GET WITH ID PARAMETER
// ─────────────────────────────────────────────────────────────────────────

export async function fetchUserProfile(userId: string) {
  try {
    const response = await api.get(API.USERS.GET_BY_ID(userId));
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 3. POST WITH FORM DATA (like profile updates)
// ─────────────────────────────────────────────────────────────────────────

export async function updateStudentProfile(userId: string, formData: FormData) {
  try {
    const response = await api.put(API.STUDENTS.UPDATE_PROFILE(userId), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to update student profile:`, error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 4. POST WITH JSON DATA
// ─────────────────────────────────────────────────────────────────────────

export async function createAssignment(data: any) {
  try {
    const response = await api.post(API.ASSIGNMENTS.CREATE, data);
    return response.data;
  } catch (error) {
    console.error("Failed to create assignment:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 5. DELETE REQUEST
// ─────────────────────────────────────────────────────────────────────────

export async function deleteGrade(gradeId: number) {
  try {
    const response = await api.delete(API.GRADES.DELETE(gradeId));
    return response.data;
  } catch (error) {
    console.error(`Failed to delete grade ${gradeId}:`, error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 6. REACT HOOK WITH ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";

export function useStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(API.USERS.GET_STUDENTS);
        setStudents(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { students, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────
// 7. MULTIPLE ID PARAMETERS (Classes & Students)
// ─────────────────────────────────────────────────────────────────────────

export async function markClassAttendance(
  classId: number,
  sessionId: number,
  attendanceData: any
) {
  try {
    const response = await api.post(
      API.CLASSES.MARK_ATTENDANCE(classId, sessionId),
      attendanceData
    );
    return response.data;
  } catch (error) {
    console.error("Failed to mark attendance:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 8. REAL COMPONENT EXAMPLE - STUDENTS LIST
// ─────────────────────────────────────────────────────────────────────────

/*
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { API } from "@/lib/endpoints";

export function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(API.USERS.GET_STUDENTS)
      .then((res) => setStudents(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <table>
      <tbody>
        {students.map((student) => (
          <tr key={student.id}>
            <td>{student.full_name}</td>
            <td>{student.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
*/

// ─────────────────────────────────────────────────────────────────────────
// 9. ERROR HANDLING & RESPONSE TYPING
// ─────────────────────────────────────────────────────────────────────────

interface UserResponse {
  id: string;
  full_name: string;
  email: string;
}

export async function fetchUserWithType(userId: string): Promise<UserResponse> {
  const response = await api.get<UserResponse>(API.USERS.GET_BY_ID(userId));
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────
// 10. BATCH OPERATIONS
// ─────────────────────────────────────────────────────────────────────────

export async function deleteMultipleGrades(gradeIds: number[]) {
  try {
    const promises = gradeIds.map((id) => api.delete(API.GRADES.DELETE(id)));
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Failed to delete grades:", error);
    throw error;
  }
}
