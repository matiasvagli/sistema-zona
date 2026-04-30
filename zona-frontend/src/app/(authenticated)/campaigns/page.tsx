"use client";

import React, { useState, useMemo } from "react";
import { useList, useSelect, useInvalidate } from "@refinedev/core";
import { useModalForm, useTable } from "@refinedev/antd";
import {
    Typography, Table, Tag, Button, Modal, Form, Input, InputNumber,
    Select, Space, Row, Col, Spin, Empty, Tabs, Card, notification, Divider, Upload, Image, Tooltip, Checkbox
} from "antd";
import { PlusOutlined, FundOutlined, EditOutlined, SwapOutlined, DeleteOutlined, EnvironmentOutlined, CalendarOutlined, LinkOutlined, UploadOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, FileTextOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL } from "@/config/api";

dayjs.locale("es");

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
    borrador: "default",
    presupuesto: "orange",
    aprobado: "geekblue",
    activa: "success",
    finalizada: "blue",
    cancelada: "error",
};
const STATUS_LABELS: Record<string, string> = {
    borrador: "Borrador",
    presupuesto: "Presupuesto",
    aprobado: "Aprobado",
    activa: "Activa",
    finalizada: "Finalizada",
    cancelada: "Cancelada",
};

export default function CampaignsPage() {
    return (
        <div style={{ padding: 32, background: "#f1f5f9", minHeight: "100vh" }}>
            {/* Header */}
            <div style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 60%, #a78bfa 100%)",
                borderRadius: 20, padding: "28px 36px", marginBottom: 32,
                boxShadow: "0 12px 30px rgba(124,58,237,0.2)",
                display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff",
                position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: "-40%", right: "-5%", width: 300, height: 300, background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />
                <Space size={20}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
                        <FundOutlined />
                    </div>
                    <div>
                        <Title level={3} style={{ color: "#fff", margin: 0, fontWeight: 800 }}>Campañas</Title>
                        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Gestión comercial de campañas, reservas y pantallas LED</Text>
                    </div>
                </Space>
            </div>

            <Card
                variant="borderless"
                style={{ borderRadius: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.04)", overflow: "hidden" }}
                styles={{ body: { padding: 0 } }}
            >
                <Tabs
                    defaultActiveKey="1"
                    centered
                    size="large"
                    tabBarStyle={{ padding: "16px 24px 0", background: "#fff", borderBottom: "1px solid #f1f5f9", marginBottom: 0 }}
                    items={[
                        { key: "1", label: <span style={{ fontWeight: 600 }}><FundOutlined /> Campañas</span>, children: <div style={{ padding: 32 }}><CampaignsTab /></div> },
                        { key: "2", label: <span style={{ fontWeight: 600 }}><SwapOutlined /> Reservas Comerciales</span>, children: <div style={{ padding: 32 }}><RentalsTab /></div> },
                        { key: "3", label: <span style={{ fontWeight: 600 }}>📺 Pantallas LED</span>, children: <div style={{ padding: 32 }}><LEDSlotsTab /></div> },
                    ]}
                />
            </Card>

            <style>{`
                .premium-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    color: #64748b !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    font-size: 11px !important;
                    letter-spacing: 1px !important;
                    padding: 16px 20px !important;
                }
                .premium-table .ant-table-tbody > tr > td {
                    padding: 16px 20px !important;
                }
                .premium-table .ant-table-row:hover td {
                    background: #f1f5f9 !important;
                }
            `}</style>
        </div>
    );
}

// ── Tab 1: Campañas ──────────────────────────────────────────

const STATUS_GRADIENTS: Record<string, string> = {
    aprobado: "linear-gradient(135deg, #2563eb, #3b82f6)",
    activa: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
    finalizada: "linear-gradient(135deg, #475569, #64748b)",
    cancelada: "linear-gradient(135deg, #dc2626, #ef4444)",
};

const BILLING_LABELS: Record<string, string> = {
    contrato: "Por Contrato",
    mensual: "Mensual",
};

function CampaignsTab() {
    const { result, query } = useList({
        resource: "campaigns",
        pagination: { pageSize: 200 },
        sorters: [{ field: "id", order: "desc" }],
    });

    const invalidate = useInvalidate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalAction, setModalAction] = useState<"create" | "edit">("create");
    const [modalId, setModalId] = useState<any>(null);
    const [detailCampaign, setDetailCampaign] = useState<any>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [modalStartDate, setModalStartDate] = useState("");
    const [modalEndDate, setModalEndDate] = useState("");
    const [payModal, setPayModal] = useState<any>(null);
    const [payForm] = Form.useForm();
    const [payLoading, setPayLoading] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const { modalProps, formProps, show } = useModalForm({
        resource: "campaigns",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: modalAction === "create" ? "Campaña creada" : "Campaña actualizada", type: "success" as const }),
    });

    const { options: clientOptions } = useSelect({ resource: "clients", optionLabel: "name", optionValue: "id" });
    const { options: allFaceOptions } = useSelect({
        resource: "structure-faces",
        optionLabel: "display_name",
        optionValue: "id",
        filters: [{ field: "is_active", operator: "eq", value: true }],
        pagination: { pageSize: 200 },
    });

    const { result: rentalsResult } = useList({
        resource: "space-rentals",
        pagination: { pageSize: 500 },
        queryOptions: { enabled: createModalOpen },
    });
    const allRentals: any[] = rentalsResult?.data || [];

    const occupiedFaceIds = useMemo(() => {
        if (!modalStartDate || !modalEndDate) return new Set<number>();
        return new Set<number>(
            allRentals
                .filter((r: any) => r.status !== "finalizado")
                .filter((r: any) => r.start_date <= modalEndDate && r.end_date >= modalStartDate)
                .map((r: any) => Number(r.face))
        );
    }, [allRentals, modalStartDate, modalEndDate]);

    const faceOptionsWithAvail = useMemo(() =>
        (allFaceOptions || []).map((opt) => {
            const hasDate = !!(modalStartDate && modalEndDate);
            const occupied = hasDate && occupiedFaceIds.has(Number(opt.value));
            return {
                value: opt.value,
                label: String(opt.label),
                dotColor: !hasDate ? "#94a3b8" : occupied ? "#ef4444" : "#22c55e",
                disabled: occupied,
            };
        }),
        [allFaceOptions, occupiedFaceIds, modalStartDate, modalEndDate]
    );

    const campaigns: any[] = (result?.data || []).filter(
        (c: any) => !["presupuesto", "borrador"].includes(c.status)
    );

    const handleModalOk = async () => {
        let values: any;
        try { values = await formProps.form?.validateFields(); } catch { return; }

        const { space_assignments, ...campaignValues } = values;
        const formData = new FormData();
        
        Object.keys(campaignValues).forEach(key => {
            if (campaignValues[key] !== undefined && campaignValues[key] !== null) {
                formData.append(key, campaignValues[key]);
            }
        });

        if (photoFile) {
            formData.append("photo", photoFile);
        }

        setIsSubmitting(true);
        try {
            if (modalAction === "create") {
                const assignments: any[] = (space_assignments || []).filter((a: any) => a?.face_id);
                const totalFromSpaces = assignments.reduce((sum: number, a: any) => sum + Number(a.price || 0), 0);
                formData.append("budget_total", String(totalFromSpaces));

                const { data: campaignData } = await axiosInstance.post(`${API_URL}/campaigns/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                const campaignId = campaignData.id;
                for (const assignment of assignments) {
                    const { data: rentalData } = await axiosInstance.post(`${API_URL}/space-rentals/`, {
                        face: assignment.face_id, client: campaignValues.client,
                        campaign: campaignId, start_date: campaignValues.start_date,
                        end_date: campaignValues.end_date, price: assignment.price || 0, status: "reservado",
                    });
                    await axiosInstance.post(`${API_URL}/campaign-spaces/`, { campaign: campaignId, space_rental: rentalData.id });
                }
                notification.success({ message: assignments.length > 0 ? `Campaña creada con ${assignments.length} espacio(s)` : "Campaña creada correctamente" });
            } else {
                await axiosInstance.patch(`${API_URL}/campaigns/${modalId}/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                notification.success({ message: "Campaña actualizada" });
            }
            
            invalidate({ resource: "campaigns", invalidates: ["list"] });
            invalidate({ resource: "space-rentals", invalidates: ["list"] });
            setCreateModalOpen(false);
            modalProps.onCancel?.(null as any);
            formProps.form?.resetFields();
            setPhotoFile(null);
            setPhotoPreview(null);
        } catch (err) {
            console.error(err);
            notification.error({ message: "Error al procesar la campaña" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEdit = (id: number) => {
        setDetailCampaign(null);
        setCreateModalOpen(false);
        setModalAction("edit");
        setModalId(id);
        setTimeout(() => show(), 0);
    };

    const handleMarkPaid = async (values: any) => {
        if (!payModal) return;
        setPayLoading(true);
        try {
            await axiosInstance.patch(`${API_URL}/campaign-payments/${payModal.id}/`, {
                status: "pagado",
                paid_date: values.paid_date,
                payment_method: values.payment_method || "",
                invoice_ref: values.invoice_ref || "",
                notes: values.notes || "",
            });
            notification.success({ message: "Pago registrado" });
            invalidate({ resource: "campaigns", invalidates: ["list"] });
            // Actualiza el detailCampaign localmente para refrescar la sección de pagos
            const { data: refreshed } = await axiosInstance.get(`${API_URL}/campaigns/${detailCampaign.id}/`);
            setDetailCampaign(refreshed);
            setPayModal(null);
            payForm.resetFields();
            if (values.emit_remito) {
                window.open(`/campaigns/${detailCampaign.id}/remito?payment=${payModal.id}`, "_blank");
            }
        } catch {
            notification.error({ message: "Error al registrar el pago" });
        } finally {
            setPayLoading(false);
        }
    };

    const handleRegenerate = async (campaignId: number) => {
        try {
            await axiosInstance.post(`${API_URL}/campaigns/${campaignId}/regenerar-pagos/`);
            notification.success({ message: "Pagos regenerados" });
            const { data: refreshed } = await axiosInstance.get(`${API_URL}/campaigns/${campaignId}/`);
            setDetailCampaign(refreshed);
        } catch {
            notification.error({ message: "Error al regenerar pagos" });
        }
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, alignItems: "center" }}>
                <Title level={4} style={{ margin: 0 }}>Campañas Activas</Title>
                <Button
                    type="primary" icon={<PlusOutlined />}
                    onClick={() => { setCreateModalOpen(true); setModalStartDate(""); setModalEndDate(""); setModalAction("create"); setModalId(null); show(); }}
                    style={{ borderRadius: 10, height: 40, padding: "0 24px", fontWeight: 700, background: "#7c3aed", border: "none" }}
                >
                    Nueva Campaña
                </Button>
            </div>

            {query.isLoading ? (
                <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
            ) : campaigns.length === 0 ? (
                <Empty description="Sin campañas activas" style={{ padding: 80 }} />
            ) : (
                <Row gutter={[24, 24]}>
                    {campaigns.map((campaign: any) => {
                        const locations = [...new Set(
                            (campaign.spaces || []).map((s: any) => {
                                const addr = s.location_address || s.location_name || "";
                                const loc = s.location_locality ? `, ${s.location_locality}` : "";
                                return addr ? `${addr}${loc}` : null;
                            }).filter(Boolean)
                        )].join(" / ") || "Sin dirección";
                        const totalValue = (campaign.spaces || [])
                            .reduce((sum: number, s: any) => sum + Number(s.rental_price || 0), 0)
                            || Number(campaign.budget_total || 0);
                        const daysLeft = dayjs(campaign.end_date).diff(dayjs(), "day");
                        const gradient = STATUS_GRADIENTS[campaign.status] || STATUS_GRADIENTS.activa;

                        return (
                            <Col key={campaign.id} xs={24} sm={12} md={8} lg={6}>
                                <Card
                                    hoverable
                                    onClick={() => setDetailCampaign(campaign)}
                                    style={{ borderRadius: 16, overflow: "hidden", cursor: "pointer", border: "1px solid #f1f5f9" }}
                                    styles={{ body: { padding: 16 } }}
                                    cover={
                                        campaign.photo ? (
                                            <div style={{ position: "relative", height: 160, overflow: "hidden" }}>
                                                <img 
                                                    src={campaign.photo} 
                                                    alt={campaign.name} 
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                                />
                                                <div style={{ position: "absolute", top: 12, right: 12 }}>
                                                    <Tag style={{ borderRadius: 12, fontWeight: 700, border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", backdropFilter: "blur(4px)" }}>
                                                        {STATUS_LABELS[campaign.status] || campaign.status}
                                                    </Tag>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                height: 160,
                                                background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexDirection: "column", gap: 8, position: "relative"
                                            }}>
                                                <FundOutlined style={{ fontSize: 36, color: "#94a3b8" }} />
                                                <Text type="secondary" style={{ fontSize: 12 }}>Sin foto de campaña</Text>
                                                <div style={{ position: "absolute", top: 12, right: 12 }}>
                                                    <Tag color={STATUS_COLORS[campaign.status]} style={{ borderRadius: 12, fontWeight: 700 }}>
                                                        {STATUS_LABELS[campaign.status] || campaign.status}
                                                    </Tag>
                                                </div>
                                            </div>
                                        )
                                    }
                                >
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                        <Text strong style={{ fontSize: 16, color: "#1e293b", display: "block" }}>{campaign.name}</Text>
                                        <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 8 }}>{campaign.client_name}</Text>
                                        
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#475569", fontSize: 13 }}>
                                            <EnvironmentOutlined style={{ flexShrink: 0, color: "#64748b" }} />
                                            <Text style={{ fontSize: 13, color: "#475569" }} ellipsis={{ tooltip: locations }}>{locations}</Text>
                                        </div>
                                        
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#475569", fontSize: 13 }}>
                                            <CalendarOutlined style={{ flexShrink: 0, color: "#64748b" }} />
                                            <span>
                                                {dayjs(campaign.start_date).format("DD/MM/YY")} → {dayjs(campaign.end_date).format("DD/MM/YY")}
                                                {daysLeft >= 0 && daysLeft <= 30 && (
                                                    <Tag color="warning" style={{ border: "none", borderRadius: 6, marginLeft: 8, fontSize: 10, fontWeight: 700 }}>
                                                        {daysLeft === 0 ? "Vence hoy" : `${daysLeft}d`}
                                                    </Tag>
                                                )}
                                            </span>
                                        </div>

                                        <Divider style={{ margin: "12px 0" }} />
                                        
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Tag color={campaign.billing_type === "mensual" ? "blue" : "purple"} style={{ margin: 0, borderRadius: 6, fontWeight: 600 }}>
                                                {campaign.billing_type === "mensual" ? "📅 MENSUAL" : "📋 CONTRATO"}
                                            </Tag>
                                            <Text strong style={{ color: "#22c55e", fontSize: 16 }}>
                                                ${Number(totalValue).toLocaleString("es-AR")}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* Modal detalle campaña */}
            <Modal
                open={!!detailCampaign}
                onCancel={() => setDetailCampaign(null)}
                title={detailCampaign ? <b>{detailCampaign.name}</b> : null}
                footer={[
                    <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => openEdit(detailCampaign?.id)}>
                        Editar
                    </Button>,
                    <Button key="close" onClick={() => setDetailCampaign(null)}>Cerrar</Button>,
                ]}
                width={620}
                centered
            >
                {detailCampaign && (() => {
                    const c = detailCampaign;
                    const totalValue = (c.spaces || [])
                        .reduce((sum: number, s: any) => sum + Number(s.rental_price || 0), 0)
                        || Number(c.budget_total || 0);
                    const months = Math.max(1, dayjs(c.end_date).diff(dayjs(c.start_date), "month") + 1);

                    return (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
                            {c.photo && (
                                <div style={{ width: "100%", height: 200, borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
                                    <Image src={c.photo} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                            )}
                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Cliente</Text>
                                        <div><Text strong>{c.client_name}</Text></div>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Estado</Text>
                                        <div><Tag color={STATUS_COLORS[c.status]}>{STATUS_LABELS[c.status]}</Tag></div>
                                    </div>
                                </Col>
                            </Row>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Período</Text>
                                        <div><Text strong>{dayjs(c.start_date).format("DD/MM/YYYY")} → {dayjs(c.end_date).format("DD/MM/YYYY")}</Text></div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{months} mes{months !== 1 ? "es" : ""}</Text>
                                    </div>
                                </Col>
                                <Col span={12}>
                                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Facturación</Text>
                                        <div>
                                            <Tag color={c.billing_type === "mensual" ? "blue" : "purple"}>
                                                {BILLING_LABELS[c.billing_type] || "—"}
                                            </Tag>
                                        </div>
                                        {c.billing_type === "mensual" && (
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                ${Number(totalValue).toLocaleString("es-AR")}/mes
                                            </Text>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            {/* Espacios */}
                            {(c.spaces || []).length > 0 && (
                                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                                    <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 8 }}>
                                        Espacios ({c.spaces.length})
                                    </Text>
                                    {c.spaces.map((s: any, i: number) => (
                                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < c.spaces.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                                            <div>
                                                <Text strong style={{ fontSize: 13 }}>{s.face_name || "—"}</Text>
                                                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                                                    {[s.location_address, s.location_locality].filter(Boolean).join(", ") || s.location_name || s.structure_name || "—"}
                                                </Text>
                                            </div>
                                            <Text strong style={{ color: "#22c55e" }}>
                                                ${Number(s.rental_price || 0).toLocaleString("es-AR")}
                                            </Text>
                                        </div>
                                    ))}
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "2px solid #e2e8f0" }}>
                                        <Text strong>Total</Text>
                                        <Text strong style={{ color: "#22c55e", fontSize: 16 }}>
                                            ${Number(totalValue).toLocaleString("es-AR")}
                                        </Text>
                                    </div>
                                </div>
                            )}

                            {/* Pagos */}
                            {(c.payments || []).length > 0 && (
                                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
                                            Pagos ({c.payments.length})
                                        </Text>
                                        <Tooltip title="Regenerar pagos desde fechas y monto actuales">
                                            <Button size="small" type="text" icon={<ReloadOutlined />} onClick={() => handleRegenerate(c.id)} style={{ color: "#94a3b8" }} />
                                        </Tooltip>
                                    </div>
                                    {c.payments.map((p: any, i: number) => {
                                        const isOverdue = p.status === "pendiente" && dayjs().isAfter(dayjs(p.period).endOf("month"));
                                        const eff = isOverdue ? "vencido" : p.status;
                                        const cfg: Record<string, { color: string; icon: React.ReactNode }> = {
                                            pagado:   { color: "#22c55e", icon: <CheckCircleOutlined /> },
                                            pendiente:{ color: "#f59e0b", icon: <ClockCircleOutlined /> },
                                            vencido:  { color: "#ef4444", icon: <ExclamationCircleOutlined /> },
                                        };
                                        const { color, icon } = cfg[eff] || cfg.pendiente;
                                        return (
                                            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < c.payments.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <span style={{ color, fontSize: 16 }}>{icon}</span>
                                                    <div>
                                                        <Text strong style={{ fontSize: 13, textTransform: "capitalize" }}>{dayjs(p.period).format("MMMM YYYY")}</Text>
                                                        {p.status === "pagado" && (
                                                            <Text type="secondary" style={{ display: "block", fontSize: 11 }}>
                                                                {p.paid_date ? dayjs(p.paid_date).format("DD/MM/YYYY") : ""}
                                                                {p.invoice_ref ? ` · ${p.invoice_ref}` : ""}
                                                            </Text>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <Text strong style={{ color: eff === "pagado" ? "#22c55e" : "#1e293b" }}>
                                                        ${Number(p.amount).toLocaleString("es-AR")}
                                                    </Text>
                                                    {p.status !== "pagado" ? (
                                                        <Button
                                                            size="small" type="primary"
                                                            style={{ background: "#7c3aed", border: "none", borderRadius: 6, fontSize: 11 }}
                                                            onClick={() => { setPayModal(p); payForm.setFieldsValue({ paid_date: dayjs().format("YYYY-MM-DD"), payment_method: "transferencia" }); }}
                                                        >
                                                            Marcar pagado
                                                        </Button>
                                                    ) : (
                                                        <Tooltip title="Ver remito">
                                                            <Button size="small" type="text" icon={<FileTextOutlined />}
                                                                onClick={() => window.open(`/campaigns/${c.id}/remito?payment=${p.id}`, "_blank")}
                                                                style={{ color: "#7c3aed" }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {c.payments.filter((p: any) => p.status === "pagado").length} de {c.payments.length} pagados
                                        </Text>
                                        <Text strong style={{ color: "#22c55e", fontSize: 13 }}>
                                            ${c.payments.filter((p: any) => p.status === "pagado").reduce((s: number, p: any) => s + Number(p.amount), 0).toLocaleString("es-AR")} cobrado
                                        </Text>
                                    </div>
                                </div>
                            )}

                            {/* OT vinculada */}
                            {c.work_order_id && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#eff6ff", borderRadius: 10, padding: "12px 16px" }}>
                                    <LinkOutlined style={{ color: "#3b82f6" }} />
                                    <Text>Orden de Trabajo vinculada:</Text>
                                    <Tag color="geekblue">OT-{String(c.work_order_id).padStart(4, "0")}</Tag>
                                </div>
                            )}

                            {/* Notas internas */}
                            {c.notes && (
                                <div style={{ background: "#fffbeb", borderRadius: 10, padding: "12px 16px", borderLeft: "3px solid #f59e0b" }}>
                                    <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>Notas Internas</Text>
                                    <Text>{c.notes}</Text>
                                </div>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            {/* Modal Marcar Pagado */}
            <Modal
                open={!!payModal}
                onCancel={() => { setPayModal(null); payForm.resetFields(); }}
                title={<b>Registrar Pago — {payModal ? dayjs(payModal.period).format("MMMM YYYY") : ""}</b>}
                onOk={() => payForm.validateFields().then(handleMarkPaid)}
                okText="Confirmar Pago"
                okButtonProps={{ loading: payLoading, style: { background: "#7c3aed", border: "none" } }}
                centered
                width={440}
                zIndex={1050}
            >
                <Form form={payForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Fecha de Pago" name="paid_date" rules={[{ required: true, message: "Requerida" }]}>
                                <Input type="date" size="large" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Método de Pago" name="payment_method">
                                <Select size="large" options={[
                                    { label: "Transferencia", value: "transferencia" },
                                    { label: "Efectivo", value: "efectivo" },
                                    { label: "Cheque", value: "cheque" },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Nro. Comprobante / Factura" name="invoice_ref">
                        <Input size="large" placeholder="Ej: FC-A 0001-00001234" />
                    </Form.Item>
                    <Form.Item label="Notas" name="notes">
                        <Input.TextArea rows={2} placeholder="Observaciones del pago..." />
                    </Form.Item>
                    <Form.Item name="emit_remito" valuePropName="checked" style={{ marginBottom: 0 }}>
                        <Checkbox>Generar remito al confirmar</Checkbox>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal crear/editar campaña */}
            <Modal {...modalProps} onOk={handleModalOk} onCancel={(e) => { setCreateModalOpen(false); modalProps.onCancel?.(e); }} title={<b>{modalAction === "create" ? "Nueva Campaña" : "Editar Campaña"}</b>} width={650} centered okButtonProps={{ loading: isSubmitting }}>
                <Form {...formProps} layout="vertical">
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item label="Nombre de la Campaña" name="name" rules={[{ required: true, message: "Requerido" }]}>
                                <Input size="large" placeholder="Ej: Campaña Verano 2025" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Foto / Arte">
                                {photoPreview && (
                                    <div style={{ marginBottom: 8, borderRadius: 8, overflow: "hidden", height: 80 }}>
                                        <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                )}
                                <Upload
                                    listType="picture"
                                    maxCount={1}
                                    beforeUpload={(file) => {
                                        setPhotoFile(file);
                                        setPhotoPreview(URL.createObjectURL(file));
                                        return false;
                                    }}
                                    onRemove={() => { setPhotoFile(null); setPhotoPreview(null); }}
                                    fileList={photoFile ? [{ uid: '-1', name: photoFile.name, status: 'done' } as any] : []}
                                >
                                    <Button icon={<UploadOutlined />} style={{ width: "100%" }}>Cargar</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Cliente" name="client" rules={[{ required: true, message: "Requerido" }]}>
                                <Select size="large" options={clientOptions} placeholder="Seleccionar cliente" showSearch optionFilterProp="label" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Estado" name="status" initialValue="activa">
                                <Select size="large" options={[
                                    { label: "Aprobado", value: "aprobado" },
                                    { label: "Activa", value: "activa" },
                                    { label: "Finalizada", value: "finalizada" },
                                    { label: "Cancelada", value: "cancelada" },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Fecha Inicio" name="start_date" rules={[{ required: true }]}>
                                <Input type="date" size="large" style={{ width: "100%" }} onChange={(e) => setModalStartDate(e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Fecha Fin" name="end_date" rules={[{ required: true }]}>
                                <Input type="date" size="large" style={{ width: "100%" }} onChange={(e) => setModalEndDate(e.target.value)} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Facturación" name="billing_type" initialValue="contrato">
                                <Select size="large" options={[
                                    { label: "Por Contrato", value: "contrato" },
                                    { label: "Mensual", value: "mensual" },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>

                    {modalAction === "create" && (
                        <>
                            <Divider style={{ margin: "16px 0" }}>
                                <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>ESPACIOS (OPCIONAL)</span>
                            </Divider>
                            <Form.List name="space_assignments">
                                {(fields, { add, remove }) => (
                                    <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 16 }}>
                                        {fields.map(({ key, name }) => (
                                            <Row key={key} gutter={12} align="middle" style={{ marginBottom: 8 }}>
                                                <Col span={13}>
                                                    <Form.Item name={[name, "face_id"]} style={{ marginBottom: 0 }}>
                                                        <Select
                                                            size="large"
                                                            options={faceOptionsWithAvail}
                                                            placeholder="Seleccionar cara/espacio..."
                                                            showSearch
                                                            filterOption={(input, opt) => String(opt?.label || "").toLowerCase().includes(input.toLowerCase())}
                                                            allowClear
                                                            optionRender={(opt) => (
                                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: (opt.data as any).dotColor, flexShrink: 0, display: "inline-block" }} />
                                                                    {opt.label}
                                                                </div>
                                                            )}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={9}>
                                                    <Form.Item name={[name, "price"]} style={{ marginBottom: 0 }}>
                                                        <InputNumber prefix="$" size="large" style={{ width: "100%" }} min={0} placeholder="Precio alquiler" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={2} style={{ textAlign: "center" }}>
                                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                                </Col>
                                            </Row>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ width: "100%", marginTop: fields.length > 0 ? 8 : 0 }}>
                                            Agregar Espacio
                                        </Button>
                                    </div>
                                )}
                            </Form.List>
                        </>
                    )}

                    <Form.Item label="Notas Internas" name="notes">
                        <Input.TextArea rows={3} placeholder="Referencias, observaciones, etc." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

// ── Tab 2: Reservas Comerciales ──────────────────────────────

function RentalsTab() {
    const { tableProps } = useTable({ resource: "space-rentals", syncWithLocation: false });
    const [modalAction, setModalAction] = React.useState<"create" | "edit">("create");
    const [modalId, setModalId] = React.useState<any>(null);

    const { modalProps, formProps, show } = useModalForm({
        resource: "space-rentals",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: modalAction === "create" ? "Reserva creada" : "Reserva actualizada", type: "success" as const })
    });

    const { options: faceOptions } = useSelect({
        resource: "structure-faces",
        optionLabel: "display_name",
        optionValue: "id",
        filters: [{ field: "is_active", operator: "eq", value: true }],
        pagination: { pageSize: 200 },
    });
    const { options: clientOptions } = useSelect({ resource: "clients", optionLabel: "name", optionValue: "id" });
    const { options: campaignOptions } = useSelect({ resource: "campaigns", optionLabel: "name", optionValue: "id" });

    const STATUS_COLORS: Record<string, string> = { reservado: 'blue', activo: 'success', finalizado: 'default' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Reservas de Caras</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setModalAction("create"); setModalId(null); show(); }}
                    style={{ borderRadius: 10, height: 40, padding: "0 24px", fontWeight: 700, background: "#7c3aed", boxShadow: "0 8px 15px rgba(124,58,237,0.2)", border: "none" }}
                >
                    Nueva Reserva
                </Button>
            </div>
            <Table {...tableProps} rowKey="id" className="premium-table">
                <Table.Column title="Cara / Estructura / Ubicación" render={(_: any, r: any) => (
                    <div>
                        <Text strong>{r.face_name || '—'}</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{r.structure_name} {r.location_name ? `— ${r.location_name}` : ''}</Text>
                    </div>
                )} />
                <Table.Column dataIndex="client_name" title="Cliente" render={(v: string) => v || <Text type="secondary">—</Text>} />
                <Table.Column dataIndex="campaign_name" title="Campaña" render={(v: string) => v ? <Tag color="orange">{v}</Tag> : <Text type="secondary">—</Text>} />
                <Table.Column dataIndex="start_date" title="Inicio" width={110} render={(v: string) => v ? dayjs(v).format("DD/MM/YYYY") : '—'} />
                <Table.Column dataIndex="end_date" title="Fin" width={110} render={(v: string) => v ? dayjs(v).format("DD/MM/YYYY") : '—'} />
                <Table.Column dataIndex="price" title="Precio" width={120} render={(v: number) => v ? `$${Number(v).toLocaleString()}` : '—'} />
                <Table.Column dataIndex="status" title="Estado" width={110} render={(v: string) => (
                    <Tag color={STATUS_COLORS[v] || 'default'} style={{ borderRadius: '12px', padding: '2px 12px' }}>{v?.toUpperCase()}</Tag>
                )} />
                <Table.Column title="" width={70} render={(_: any, record: any) => (
                    <Button type="dashed" size="small" icon={<EditOutlined />}
                        onClick={() => { setModalAction("edit"); setModalId(record.id); setTimeout(() => show(), 0); }} />
                )} />
            </Table>

            <Modal {...modalProps} title={<b>{modalAction === "create" ? "Nueva Reserva" : "Editar Reserva"}</b>} width={600} centered>
                <Form {...formProps} layout="vertical">
                    <Form.Item label="Cara del Cartel" name="face" rules={[{ required: true, message: "Requerido" }]}>
                        <Select size="large" options={faceOptions} placeholder="Seleccionar cara..." showSearch optionFilterProp="label" />
                    </Form.Item>
                    <Form.Item label="Cliente" name="client" rules={[{ required: true, message: "Requerido" }]}>
                        <Select size="large" options={clientOptions} placeholder="Seleccionar cliente..." showSearch optionFilterProp="label" />
                    </Form.Item>
                    <Form.Item label="Campaña (opcional)" name="campaign">
                        <Select size="large" options={campaignOptions} placeholder="Vincular a una campaña..." showSearch optionFilterProp="label" allowClear />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Fecha Inicio" name="start_date" rules={[{ required: true }]}>
                                <Input type="date" size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Fecha Fin" name="end_date" rules={[{ required: true }]}>
                                <Input type="date" size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Precio" name="price" rules={[{ required: true }]}>
                                <InputNumber prefix="$" size="large" style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Estado" name="status" initialValue="reservado">
                                <Select size="large" options={[
                                    { label: 'Reservado', value: 'reservado' },
                                    { label: 'Activo', value: 'activo' },
                                    { label: 'Finalizado', value: 'finalizado' },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
}

// ── Tab 3: Pantallas LED ─────────────────────────────────────

function LEDSlotsTab() {
    const { tableProps } = useTable({ resource: "led-slots", syncWithLocation: false });
    const [modalAction, setModalAction] = React.useState<"create" | "edit">("create");
    const [modalId, setModalId] = React.useState<any>(null);

    const { modalProps, formProps, show } = useModalForm({
        resource: "led-slots",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: modalAction === "create" ? "Slot LED creado" : "Slot LED actualizado", type: "success" as const })
    });

    const { options: structureOptions } = useSelect({
        resource: "structures",
        optionLabel: "name",
        optionValue: "id",
        filters: [{ field: "type", operator: "eq", value: "pantalla_led" }],
    });
    const { options: clientOptions } = useSelect({ resource: "clients", optionLabel: "name", optionValue: "id" });
    const { options: campaignOptions } = useSelect({ resource: "campaigns", optionLabel: "name", optionValue: "id" });

    const STATUS_COLORS: Record<string, string> = { activo: 'success', pausado: 'warning', finalizado: 'default' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Slots de Pantallas LED</Title>
                    <Text type="secondary">Gestión de tiempo vendido por pantalla</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setModalAction("create"); setModalId(null); show(); }}
                    style={{ borderRadius: 10, height: 40, padding: "0 24px", fontWeight: 700, background: "#7c3aed", boxShadow: "0 8px 15px rgba(124,58,237,0.2)", border: "none" }}
                >
                    Nuevo Slot LED
                </Button>
            </div>
            <Table {...tableProps} rowKey="id" className="premium-table">
                <Table.Column title="Pantalla" render={(_: any, r: any) => (
                    <div>
                        <Text strong>{r.structure_name || '—'}</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{r.location_name || ''}</Text>
                    </div>
                )} />
                <Table.Column dataIndex="client_name" title="Cliente" render={(v: string) => v || <Text type="secondary">—</Text>} />
                <Table.Column dataIndex="campaign_name" title="Campaña" render={(v: string) => v ? <Tag color="orange">{v}</Tag> : <Text type="secondary">—</Text>} />
                <Table.Column title="Spot" render={(_: any, r: any) => (
                    <Text>{r.duration} {r.time_unit} × {r.repetitions_per_hour}/h</Text>
                )} />
                <Table.Column dataIndex="start_date" title="Inicio" width={100} render={(v: string) => v ? dayjs(v).format("DD/MM/YY") : '—'} />
                <Table.Column dataIndex="end_date" title="Fin" width={100} render={(v: string) => v ? dayjs(v).format("DD/MM/YY") : '—'} />
                <Table.Column dataIndex="price" title="Precio" width={110} render={(v: number) => v ? `$${Number(v).toLocaleString()}` : '—'} />
                <Table.Column dataIndex="status" title="Estado" width={100} render={(v: string) => (
                    <Tag color={STATUS_COLORS[v] || 'default'} style={{ borderRadius: '12px', padding: '2px 12px' }}>{v?.toUpperCase()}</Tag>
                )} />
                <Table.Column title="" width={70} render={(_: any, record: any) => (
                    <Button type="dashed" size="small" icon={<EditOutlined />}
                        onClick={() => { setModalAction("edit"); setModalId(record.id); setTimeout(() => show(), 0); }} />
                )} />
            </Table>

            <Modal {...modalProps} title={<b>{modalAction === "create" ? "Nuevo Slot LED" : "Editar Slot LED"}</b>} width={650} centered>
                <Form {...formProps} layout="vertical">
                    <Form.Item label="Pantalla LED" name="structure" rules={[{ required: true, message: "Requerido" }]}>
                        <Select size="large" options={structureOptions} placeholder="Seleccionar pantalla..." showSearch optionFilterProp="label" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Cliente" name="client" rules={[{ required: true, message: "Requerido" }]}>
                                <Select size="large" options={clientOptions} placeholder="Seleccionar..." showSearch optionFilterProp="label" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Campaña (opcional)" name="campaign">
                                <Select size="large" options={campaignOptions} placeholder="Vincular campaña..." showSearch optionFilterProp="label" allowClear />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Duración del Spot" name="duration" rules={[{ required: true }]}>
                                <InputNumber size="large" style={{ width: '100%' }} min={1} placeholder="Ej: 15" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Unidad" name="time_unit" initialValue="segundos">
                                <Select size="large" options={[
                                    { label: 'Segundos', value: 'segundos' },
                                    { label: 'Minutos', value: 'minutos' },
                                    { label: 'Horas', value: 'horas' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Reps / hora" name="repetitions_per_hour" initialValue={1} rules={[{ required: true }]}>
                                <InputNumber size="large" style={{ width: '100%' }} min={1} placeholder="Ej: 4" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Inicio" name="start_date" rules={[{ required: true }]}>
                                <Input type="date" size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Fin" name="end_date" rules={[{ required: true }]}>
                                <Input type="date" size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Precio" name="price" rules={[{ required: true }]}>
                                <InputNumber prefix="$" size="large" style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Estado" name="status" initialValue="activo">
                                <Select size="large" options={[
                                    { label: 'Activo', value: 'activo' },
                                    { label: 'Pausado', value: 'pausado' },
                                    { label: 'Finalizado', value: 'finalizado' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="URL del Arte/Video" name="creative_url">
                                <Input size="large" placeholder="https://..." />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Notas" name="notes">
                        <Input.TextArea rows={2} placeholder="Observaciones del slot..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
