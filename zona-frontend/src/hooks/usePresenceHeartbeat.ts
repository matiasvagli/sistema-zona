"use client";

import { useEffect, useRef } from "react";
import { axiosInstance } from "@/utils/axios-instance";

const PING_INTERVAL = 25_000; // 25 segundos
const API_URL = "http://localhost:8000/api/v1";

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
