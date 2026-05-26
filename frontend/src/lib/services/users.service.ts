import { api } from "../api";
import { USERS } from "../endpoints/users";

export const getAllUsers = async () => {
    const res = await api.get(USERS.GET_ALL);
    return res.data;
};

export const createUser = async (data: any) => {
    const res = await api.post(USERS.CREATE, data);
    return res.data;
};

export const getUserById = async (userId: string) => {
    const res = await api.get(USERS.GET_BY_ID(userId));
    return res.data;
};

export const updateUser = async (userId: string, data: any) => {
    const res = await api.put(USERS.UPDATE(userId), data);
    return res.data;
};

export const deleteUser = async (userId: string) => {
    const res = await api.delete(USERS.DELETE(userId));
    return res.data;
};

export const getMyProfile = async () => {
    const res = await api.get(USERS.GET_ME);
    return res.data;
};

export const setupUserForm = async (data: any) => {
    const res = await api.post(USERS.SETUP_FORM, data);
    return res.data;
};

export const getStudents = async () => {
    const res = await api.get(USERS.GET_STUDENTS);
    return res.data;
};

export const getInstructors = async () => {
    const res = await api.get(USERS.GET_INSTRUCTORS);
    return res.data;
};

export const getParents = async () => {
    const res = await api.get(USERS.GET_PARENTS);
    return res.data;
};

export const getAdmins = async () => {
    const res = await api.get(USERS.GET_ADMINS);
    return res.data;
};