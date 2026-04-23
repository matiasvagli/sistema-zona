"use client";

import React, { useEffect, useState } from "react";
import { Modal, Button, Typography, Space, Tag, notification } from "antd";
import { RocketOutlined, CheckCircleOutlined, BellOutlined, DollarOutlined, FileProtectOutlined } from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export const OTNotificationManager: React.FC = () => {
    const router = useRouter();
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
        const interval = setInterval(fetchNotifications, 5000); // Refrescar cada 5 segundos para que la alerta llegue rápido
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (pendingNotifications.length > 0 && !currentNotification) {
            setCurrentNotification(pendingNotifications[0]);
        }
    }, [pendingNotifications, currentNotification]);

    const handleConfirm = async (goToBilling = false) => {
        if (!currentNotification) return;
        setConfirming(true);
        try {
            await axiosInstance.post(`${API}/work-order-notifications/${currentNotification.id}/confirm/`);
            notification.success({
                message: "Confirmado",
                description: currentNotification.kind === "lista_para_facturar"
                    ? `OT marcada como vista: ${currentNotification.work_order_title}`
                    : `Recepción confirmada: ${currentNotification.work_order_title}`,
                placement: "bottomRight",
            });
            setPendingNotifications(prev => prev.filter(n => n.id !== currentNotification.id));
            setCurrentNotification(null);
            if (goToBilling) router.push("/pipeline?tab=historial");
        } catch {
            notification.error({ message: "No se pudo confirmar. Intentá de nuevo." });
        } finally {
            setConfirming(false);
        }
    };

    if (!currentNotification) return null;

    const isBilling  = currentNotification.kind === "lista_para_facturar";
    const isUrgent   = !isBilling && currentNotification.work_order_priority === "inmediata";
    const otTitle    = currentNotification.work_order_title?.split(':');
    const otLabel    = otTitle?.[0] ?? currentNotification.work_order_title;
    const otName     = otTitle?.[1]?.trim() ?? currentNotification.work_order_title;

    if (isBilling) {
        return (
            <Modal
                open
                footer={null}
                closable={false}
                centered
                width={420}
                styles={{ body: { padding: 0, overflow: "hidden", borderRadius: 16 } }}
                modalRender={(modal) => <div style={{ borderRadius: 16, overflow: "hidden" }}>{modal}</div>}
            >
                <div style={{
                    background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 60%, #0ea5e9 100%)",
                    padding: "24px",
                    textAlign: "center",
                }}>
                    <div style={{
                        width: 60, height: 60, borderRadius: "50%",
                        background: "rgba(255,255,255,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 16px",
                        border: "1px solid rgba(255,255,255,0.25)"
                    }}>
                        <FileProtectOutlined style={{ fontSize: 30, color: "#bae6fd" }} />
                    </div>
                    <Title level={4} style={{ color: "#fff", margin: 0 }}>OT Lista para Facturar</Title>
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                        El trabajo fue entregado al cliente
                    </Text>
                </div>

                <div style={{ padding: "28px 24px", textAlign: "center", background: "#fff" }}>
                    <Space size="small" style={{ marginBottom: 8 }}>
                        <Tag color="blue" style={{ borderRadius: 6, padding: "2px 10px" }}>{otLabel}</Tag>
                    </Space>
                    <Title level={3} style={{ margin: "0 0 20px", fontWeight: 700, color: "#0f172a" }}>
                        {otName}
                    </Title>

                    <div style={{
                        background: "#f0f9ff", padding: "14px", borderRadius: 12,
                        border: "1px solid #bae6fd", display: "flex", alignItems: "center",
                        gap: "12px", textAlign: "left", marginBottom: 20
                    }}>
                        <DollarOutlined style={{ color: "#0369a1", fontSize: 18 }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Podés procesar la facturación desde la sección de Historial en el Pipeline.
                        </Text>
                    </div>

                    <Space style={{ width: "100%" }} direction="vertical" size="small">
                        <Button
                            type="primary"
                            size="large"
                            icon={<FileProtectOutlined />}
                            loading={confirming}
                            onClick={() => handleConfirm(true)}
                            style={{
                                width: "100%", height: 46, borderRadius: 10,
                                fontSize: 15, fontWeight: 600,
                                background: "linear-gradient(90deg, #0369a1 0%, #0ea5e9 100%)",
                                border: "none",
                            }}
                        >
                            Ir a Facturar
                        </Button>
                        <Button
                            size="large"
                            loading={confirming}
                            onClick={() => handleConfirm(false)}
                            style={{ width: "100%", height: 40, borderRadius: 10, color: "#64748b" }}
                        >
                            Ya lo sé, cerrar
                        </Button>
                    </Space>
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            open={!!currentNotification}
            footer={null}
            closable={false}
            centered
            width={450}
            styles={{ body: { padding: 0, overflow: "hidden", borderRadius: 16 } }}
            modalRender={(modal) => <div style={{ borderRadius: 16, overflow: "hidden" }}>{modal}</div>}
        >
            <div style={{
                background: isUrgent
                    ? "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 60%, #ef4444 100%)"
                    : "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                padding: "24px",
                textAlign: "center",
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
                    {isUrgent ? "¡ORDEN PRIORITARIA!" : "¡Nueva Orden de Trabajo!"}
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                    Se ha asignado una nueva OT a tu sector
                </Text>
            </div>

            <div style={{ padding: "32px 24px", textAlign: "center", background: "#fff" }}>
                <div style={{ marginBottom: 24 }}>
                    <Space size="small" style={{ marginBottom: 8 }}>
                        <Tag color="blue" style={{ borderRadius: 6, padding: "2px 10px" }}>{otLabel}</Tag>
                        {isUrgent && (
                            <Tag color="red" style={{ borderRadius: 6, padding: "2px 10px", fontWeight: 700 }}>
                                PRIORIDAD INMEDIATA
                            </Tag>
                        )}
                    </Space>
                    <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
                        {otName}
                    </Title>
                </div>

                <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                    <div style={{
                        background: "#f8fafc", padding: "16px", borderRadius: 12,
                        border: "1px solid #e2e8f0", display: "flex",
                        alignItems: "center", gap: "12px", textAlign: "left"
                    }}>
                        <BellOutlined style={{ color: "#64748b", fontSize: 18 }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Por favor, confirmá que recibiste esta orden para que el equipo sepa que ya estás al tanto.
                        </Text>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        icon={<CheckCircleOutlined />}
                        loading={confirming}
                        onClick={() => handleConfirm(false)}
                        style={{
                            width: "100%", height: 50, borderRadius: 12,
                            fontSize: 16, fontWeight: 600,
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
