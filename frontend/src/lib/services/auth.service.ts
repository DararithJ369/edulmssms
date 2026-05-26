import { api } from "../api";
import { AUTH } from "../endpoints/auth";

export const login = async (data: {
    email: string;
    password: string;
}) => {
    const res = await api.post(AUTH.LOGIN, data);
    
    localStorage.setItem("access_token", res.data.access_token);
    localStorage.setItem("refresh_token", res.data.refresh_token);
    
    return res.data;
};

export const refreshToken = async () => {
    const res = await api.post(AUTH.REFRESH, {
        refresh_token: localStorage.getItem("refresh_token"),
    });
    localStorage.setItem("access_token", res.data.access_token);    
    return res.data;
};

export const logout = async () => {
    await api.post(AUTH.LOGOUT);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/signin";
}
