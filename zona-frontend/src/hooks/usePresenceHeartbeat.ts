"use client";

import { useEffect, useRef } from "react";
import { axiosInstance } from "@/utils/axios-instance";

import { API_URL } from "@/config/api";

const PING_INTERVAL = 25_000;

/**
 * Hook que manda un heartbeat al backend cada 25 segundos
 * para mantener el estado "online" del usuario actual.
 */
export function usePresenceHeartbeat() {
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const ping = async () => {
        try {
            await axiosInstance.post(`${API_URL}/presence/ping/`);
        } catch (err) {
            console.error("Presence ping failed:", err);
        }
    };

    useEffect(() => {
        ping(); // ping inmediato al montar
        timerRef.current = setInterval(ping, PING_INTERVAL);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);
}
