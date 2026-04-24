"use client";

import React, { useEffect, useRef } from "react";
import { notification } from "antd";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";

export const NotificationToast: React.FC = () => {
    const lastNotifId = useRef<number | null>(null);

    const fetchNotifications = async () => {
        try {
            // Solo pedimos las no leídas
            const { data } = await axiosInstance.get(`${API}/notifications/?is_read=false&limit=1`);
            const latest = data.results?.[0];

            if (latest && latest.id !== lastNotifId.current) {
                lastNotifId.current = latest.id;
                
                // Mostrar Toast
                notification.info({
                    message: latest.title,
                    description: latest.message,
                    placement: "topRight",
                    duration: 8,
                    style: {
                        borderRadius: "12px",
                        borderLeft: "4px solid #1677ff"
                    },
                    onClick: () => {
                        if (latest.link) window.location.href = latest.link;
                    }
                });

                // Opcional: Marcar como leída automáticamente al mostrarla? 
                // Mejor dejar que el usuario la marque o que quede en la lista.
            }
        } catch (error) {
            console.error("Error fetching generic notifications:", error);
        }
    };

    useEffect(() => {
        // Primera carga
        fetchNotifications();
        
        // Polling cada 15 segundos para no saturar el back
        const interval = setInterval(fetchNotifications, 15000);
        
        return () => clearInterval(interval);
    }, []);

    return null; // Este componente no renderiza nada visual fijo, solo dispara los Toasts
};
