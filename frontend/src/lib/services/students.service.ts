import { api } from "../api";
import { STUDENTS } from "../endpoints/students";

export const getStudentProfile = async (userId: string) => {
    const res = await api.get(STUDENTS.GET_PROFILE(userId));
    return res.data;
};

export const createStudentProfile = async (userId: string, data: any) => {
    const res = await api.post(STUDENTS.CREATE_PROFILE(userId), data);
    return res.data;
};

export const updateStudentProfile = async (userId: string, data: any) => {
    const res = await api.put(STUDENTS.UPDATE_PROFILE(userId), data);
    return res.data;
};

export const deleteStudentProfile = async (userId: string) => {
    const res = await api.delete(STUDENTS.DELETE_PROFILE(userId));
    return res.data;
};

export const getStudentClasses = async (userId: string) => {
    const res = await api.get(STUDENTS.GET_CLASSES(userId));
    return res.data;
};

export const getStudentGrades = async (studentId: string) => {
    const res = await api.get(STUDENTS.GET_GRADES(studentId));
    return res.data;
};

export const getStudentAttendance = async (studentId: string) => {
    const res = await api.get(STUDENTS.GET_ATTENDANCE(studentId));
    return res.data;
}