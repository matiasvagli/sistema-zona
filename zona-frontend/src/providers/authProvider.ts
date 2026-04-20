import { AuthProvider } from "@refinedev/core";
import axios from "axios";

const API_URL = "http://localhost:8000/api/v1";

// Cache de identidad para evitar múltiples llamadas en el mismo render cycle
let _identityCache: { data: any; ts: number } | null = null;
const CACHE_TTL_MS = 30_000; // 30 segundos

function getCachedIdentity() {
    if (_identityCache && Date.now() - _identityCache.ts < CACHE_TTL_MS) {
        return _identityCache.data;
    }
    return null;
}

function setCachedIdentity(data: any) {
    _identityCache = { data, ts: Date.now() };
}

export function clearIdentityCache() {
    _identityCache = null;
}

let _inflightRequest: Promise<any> | null = null;

async function fetchIdentity() {
    if (typeof window === "undefined") return null;

    const cached = getCachedIdentity();
    if (cached) return cached;

    // Si ya hay una petición en vuelo, reutilizarla
    if (_inflightRequest) return _inflightRequest;

    const token = localStorage.getItem("access_token");
    if (!token) return null;

    _inflightRequest = axios
        .get(`${API_URL}/users/me/`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        .then(({ data }) => {
            setCachedIdentity(data);
            return data;
        })
        .catch(() => null)
        .finally(() => {
            _inflightRequest = null;
        });

    return _inflightRequest;
}

export const authProvider: AuthProvider = {
    login: async ({ username, password }) => {
        try {
            const { data } = await axios.post(`${API_URL}/auth/token/`, {
                username,
                password,
            });

            localStorage.setItem("access_token", data.access);
            localStorage.setItem("refresh_token", data.refresh);
            clearIdentityCache(); // limpiar caché al hacer login

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
        clearIdentityCache(); // limpiar caché al hacer logout
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
            return { authenticated: true };
        }

        return {
            authenticated: false,
            logout: true,
            redirectTo: "/login",
        };
    },
    getPermissions: async () => {
        return fetchIdentity();
    },
    getIdentity: async () => {
        return fetchIdentity();
    },
    onError: async (error) => {
        if (error.status === 401) { // Solo echa si el token expiró (401)
            return {
                logout: true,
                redirectTo: "/login",
            };
        }
        return { error };
    },
};

