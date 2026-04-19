import { AuthProvider } from "@refinedev/core";
import axios from "axios";

const API_URL = "http://localhost:8000/api/v1";

export const authProvider: AuthProvider = {
    login: async ({ username, password }) => {
        try {
            const { data } = await axios.post(`${API_URL}/auth/token/`, {
                username,
                password,
            });

            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);

            return {
                success: true,
                redirectTo: "/",
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: "Login failed",
                    name: "Usuario o contraseña inválidos",
                },
            };
        }
    },
    logout: async () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return {
            success: true,
            redirectTo: "/login",
        };
    },
    check: async () => {
        if (typeof window === "undefined") {
            return { authenticated: false };
        }

        const token = localStorage.getItem("access_token");
        if (token) {
            return {
                authenticated: true,
            };
        }

        return {
            authenticated: false,
            logout: true,
            redirectTo: "/login",
        };
    },
    getPermissions: async () => null,
    getIdentity: async () => {
        if (typeof window === "undefined") return null;

        const token = localStorage.getItem("access_token");
        if (token) {
            try {
                const { data } = await axios.get(`${API_URL}/users/me/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                return data;
            } catch (e) {
                return null;
            }
        }
        return null;
    },
    onError: async (error) => {
        if (error.status === 401 || error.status === 403) {
            return {
                logout: true,
                redirectTo: "/login",
            };
        }
        return {};
    },
};
