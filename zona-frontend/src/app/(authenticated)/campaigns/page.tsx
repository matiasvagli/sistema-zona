"use client";

import React, { useState } from "react";
import { useList, useSelect } from "@refinedev/core";
import { useModalForm } from "@refinedev/antd";
import {
    Typography, Table, Tag, Button, Modal, Form, Input, InputNumber,
    Select, Space, Row, Col, Spin, Empty,
} from "antd";
import { PlusOutlined, FundOutlined, EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
    borrador: "default",
    activa: "success",
    finalizada: "blue",
};
const STATUS_LABELS: Record<string, string> = {
    borrador: "Borrador",
    activa: "Activa",
    finalizada: "Finalizada",
};

export default function CampaignsPage() {
    const { result, query } = useList({
        resource: "campaigns",
        pagination: { pageSize: 200 },
        sorters: [{ field: "id", order: "desc" }],
    });

    const [modalAction, setModalAction] = useState<"create" | "edit">("create");
    const [modalId, setModalId] = useState<any>(null);

    const { modalProps, formProps, show } = useModalForm({
        resource: "campaigns",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: modalAction === "create" ? "Campaña creada" : "Campaña actualizada", type: "success" }),
    });

    const { options: clientOptions } = useSelect({ resource: "clients", optionLabel: "name", optionValue: "id" });

    const campaigns: any[] = result?.data || [];

    const columns = [
        {
            title: "Campaña",
            dataIndex: "name",
            render: (val: string) => <Text strong>{val}</Text>,
        },
        {
            title: "Cliente",
            dataIndex: "client_name",
            render: (val: string) => val || <Text type="secondary">—</Text>,
        },
        {
            title: "Estado",
            dataIndex: "status",
            width: 110,
            render: (val: string) => (
                <Tag color={STATUS_COLORS[val] || "default"} style={{ borderRadius: 12, padding: "2px 12px" }}>
                    {STATUS_LABELS[val] || val}
                </Tag>
            ),
        },
        {
            title: "Inicio",
            dataIndex: "start_date",
            width: 110,
            render: (val: string) => val ? dayjs(val).format("DD/MM/YYYY") : <Text type="secondary">—</Text>,
        },
        {
            title: "Fin",
            dataIndex: "end_date",
            width: 110,
            render: (val: string) => val ? dayjs(val).format("DD/MM/YYYY") : <Text type="secondary">—</Text>,
        },
        {
            title: "Espacios",
            dataIndex: "spaces_count",
            width: 90,
            render: (val: number) => <Tag color="cyan">{val ?? 0}</Tag>,
        },
        {
            title: "Presupuesto",
            dataIndex: "budget_total",
            width: 130,
            render: (val: number) => val ? `$${Number(val).toLocaleString("es-AR")}` : <Text type="secondary">—</Text>,
        },
        {
            title: "",
            key: "actions",
            width: 70,
            render: (_: any, record: any) => (
                <Button
                    type="dashed"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => { setModalAction("edit"); setModalId(record.id); setTimeout(() => show(), 0); }}
                />
            ),
        },
    ];

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
                        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Gestión de campañas de vía pública</Text>
                    </div>
                </Space>
                <Button
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => { setModalAction("create"); setModalId(null); show(); }}
                    style={{ borderRadius: 12, height: 44, padding: "0 28px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 600 }}
                >
                    Nueva Campaña
                </Button>
            </div>

            {query.isLoading ? (
                <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
            ) : (
                <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                    <Table
                        dataSource={campaigns}
                        columns={columns}
                        rowKey="id"
                        pagination={{ pageSize: 20 }}
                        locale={{ emptyText: <Empty description="Sin campañas" /> }}
                        className="premium-table"
                    />
                </div>
            )}

            <Modal
                {...modalProps}
                title={<b>{modalAction === "create" ? "Nueva Campaña" : "Editar Campaña"}</b>}
                width={600}
                centered
            >
                <Form {...formProps} layout="vertical">
                    <Form.Item label="Nombre de la Campaña" name="name" rules={[{ required: true, message: "Requerido" }]}>
                        <Input size="large" placeholder="Ej: Campaña Verano 2025" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Cliente" name="client" rules={[{ required: true, message: "Requerido" }]}>
                                <Select size="large" options={clientOptions} placeholder="Seleccionar cliente" showSearch optionFilterProp="label" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Estado" name="status" initialValue="borrador">
                                <Select size="large" options={[
                                    { label: "Borrador", value: "borrador" },
                                    { label: "Activa", value: "activa" },
                                    { label: "Finalizada", value: "finalizada" },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Fecha Inicio" name="start_date" rules={[{ required: true, message: "Requerido" }]}>
                                <Input type="date" size="large" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Fecha Fin" name="end_date" rules={[{ required: true, message: "Requerido" }]}>
                                <Input type="date" size="large" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Presupuesto Total" name="budget_total" initialValue={0}>
                        <InputNumber prefix="$" size="large" style={{ width: "100%" }} min={0} />
                    </Form.Item>
                    <Form.Item label="Notas" name="notes">
                        <Input.TextArea rows={3} placeholder="Referencias de diseño, observaciones, etc." />
                    </Form.Item>
                </Form>
            </Modal>

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
