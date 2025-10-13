const TOKEN_KEY = "token";
const USER_KEY = "user";
const EXPIRES_AT_KEY = "expires_at";
const AUTH_EVENT = "authChanged";

export interface AuthRole {
  id?: string | number;
  role_name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AuthUser {
  id?: string | number;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  username?: string;
  user_image_url?: string;
  role?: string;
  role_id?: string;
  role_name?: string;
  profile_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  roles?: AuthRole[];
  [key: string]: unknown;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expires_at?: string;
}

const dispatchAuthChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT));
  }
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = (): AuthUser | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr) as AuthUser;
  } catch {
    return null;
  }
};

export const getExpiresAt = () => localStorage.getItem(EXPIRES_AT_KEY);

export const setAuthSession = ({ token, user, expires_at }: AuthSession) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  if (expires_at) {
    localStorage.setItem(EXPIRES_AT_KEY, expires_at);
  } else {
    localStorage.removeItem(EXPIRES_AT_KEY);
  }

  dispatchAuthChanged();
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  dispatchAuthChanged();
};
