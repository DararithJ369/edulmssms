const authCookieOptions = "path=/; max-age=604800; samesite=lax";

const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${encodeURIComponent(value)}; ${authCookieOptions}`;
};

const removeCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
};

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
  localStorage.setItem("access_token", token);
  setCookie("access_token", token);
};

export const setRefreshToken = (token: string) => {
  localStorage.setItem("refresh_token", token);
  setCookie("refresh_token", token);
};

export const setUserRole = (role: string) => {
  localStorage.setItem("user_role", role);
  setCookie("user_role", role);
};

export const setUserId = (userId: string) => {
  localStorage.setItem("user_id", userId);
  setCookie("user_id", userId);
};

export const setAuthSession = (params: {
  accessToken: string;
  refreshToken: string;
  userRole: string;
  userId?: string;
}) => {
  setToken(params.accessToken);
  setRefreshToken(params.refreshToken);
  setUserRole(params.userRole);

  if (params.userId) {
    setUserId(params.userId);
  }
};

export const getToken = () => {
  return localStorage.getItem("token") || localStorage.getItem("access_token");
};

export const removeToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_username");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_image");

  removeCookie("access_token");
  removeCookie("refresh_token");
  removeCookie("user_role");
  removeCookie("user_id");
};

export const normalizeRole = (role: string) => {
  if (role === "instructor") {
    return "teacher";
  }

  return role;
};