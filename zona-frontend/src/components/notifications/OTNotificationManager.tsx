"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button, Typography, Space, Tag, notification } from "antd";
import { RocketOutlined, CheckCircleOutlined, BellOutlined } from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";

const { Title, Text } = Typography;

export const OTNotificationManager: React.FC = () => {
    const [pendingNotifications, setPendingNotifications] = useState<any[]>([]);
    const [currentNotification, setCurrentNotification] = useState<any | null>(null);
    const [confirming, setConfirming] = useState(false);

    const fetchNotifications = async () => {
        try {
            const { data } = await axiosInstance.get(`${API}/work-order-notifications/`);
            setPendingNotifications(data.results || []);
        } catch (error) {
            console.error("Error fetching OT notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Polling cada 30 segundos
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (pendingNotifications.length > 0 && !currentNotification) {
            setCurrentNotification(pendingNotifications[0]);
        }
    }, [pendingNotifications, currentNotification]);

    const handleConfirm = async () => {
        if (!currentNotification) return;
        setConfirming(true);
        try {
            await axiosInstance.post(`${API}/work-order-notifications/${currentNotification.id}/confirm/`);
            
            notification.success({
                message: "Recepción Confirmada",
                description: `Has confirmado la recepción de la OT: ${currentNotification.work_order_title}`,
                placement: "bottomRight",
            });

            // Remover de la lista local
            setPendingNotifications(prev => prev.filter(n => n.id !== currentNotification.id));
            setCurrentNotification(null);
        } catch (error) {
            notification.error({
                message: "Error",
                description: "No se pudo confirmar la recepción. Intentá de nuevo.",
            });
        } finally {
            setConfirming(false);
        }
    };

    if (!currentNotification) return null;
    const isUrgent = currentNotification.work_order_priority === "inmediata";

    return (
        <Modal
            open={!!currentNotification}
            footer={null}
            closable={false}
            centered
            width={450}
            styles={{
                body: { padding: 0, overflow: "hidden", borderRadius: 16 }
            }}
            modalRender={(modal) => (
                <div style={{ borderRadius: 16, overflow: "hidden" }}>
                    {modal}
                </div>
            )}
        >
            <div style={{
                background: isUrgent 
                    ? "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 60%, #ef4444 100%)"
                    : "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                padding: "24px",
                textAlign: "center",
                position: "relative"
            }}>
                <div style={{
                    width: 60, height: 60, borderRadius: "50%",
                    background: "rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                    border: "1px solid rgba(255,255,255,0.2)"
                }}>
                    <RocketOutlined style={{ fontSize: 30, color: isUrgent ? "#fca5a5" : "#38bdf8" }} />
                </div>
                <Title level={4} style={{ color: "#fff", margin: 0 }}>
                    {isUrgent ? "🚨 ¡ORDEN PRIORITARIA!" : "¡Nueva Orden de Trabajo!"}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                    Se ha asignado una nueva OT a tu sector
                </Text>
            </div>

            <div style={{ padding: "32px 24px", textAlign: "center", background: "#fff" }}>
                <div style={{ marginBottom: 24 }}>
                    <Space size="small" style={{ marginBottom: 8 }}>
                        <Tag color="blue" style={{ borderRadius: 6, padding: "2px 10px" }}>
                            {currentNotification.work_order_title.split(':')[0]}
                        </Tag>
                        {isUrgent && (
                            <Tag color="red" style={{ borderRadius: 6, padding: "2px 10px", fontWeight: 700 }}>
                                PRIORIDAD INMEDIATA
                            </Tag>
                        )}
                    </Space>
                    <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                        {currentNotification.work_order_title.split(':')[1]?.trim() || currentNotification.work_order_title}
                    </Title>
                </div>

                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div style={{ 
                        background: "#f8fafc", 
                        padding: "16px", 
                        borderRadius: 12, 
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        textAlign: "left"
                    }}>
                        <BellOutlined style={{ color: "#64748b", fontSize: 18 }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Por favor, confirma que has recibido esta orden para que el equipo de producción sepa que ya estás al tanto.
                        </Text>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        loading={confirming}
                        onClick={handleConfirm}
                        style={{
                            width: "100%",
                            height: 50,
                            borderRadius: 12,
                            fontSize: 16,
                            fontWeight: 600,
                            background: isUrgent
                                ? "linear-gradient(90deg, #b91c1c 0%, #ef4444 100%)"
                                : "linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)",
                            border: "none",
                            boxShadow: isUrgent 
                                ? "0 4px 12px rgba(239,68,68,0.3)"
                                : "0 4px 12px rgba(99,102,241,0.3)"
                        }}
                    >
                        Confirmar Recepción
                    </Button>
                </Space>
            </div>
        </Modal>
    );
};
