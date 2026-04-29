"use client";

import React, { useState } from "react";
import { useList, useSelect, useInvalidate } from "@refinedev/core";
import { useModalForm, useTable } from "@refinedev/antd";
import {
    Typography, Table, Tag, Button, Modal, Form, Input, InputNumber,
    Select, Space, Row, Col, Spin, Empty, Tabs, Card, notification, Divider
} from "antd";
import { PlusOutlined, FundOutlined, EditOutlined, SwapOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { axiosInstance } from "@/utils/axios-instance";

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

    const { modalProps, formProps, show } = useModalForm({
        resource: "campaigns",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: modalAction === "create" ? "Campaña creada" : "Campaña actualizada", type: "success" as const }),
    });

    const { options: clientOptions } = useSelect({ resource: "clients", optionLabel: "name", optionValue: "id" });
    const { options: faceOptions } = useSelect({
        resource: "structure-faces",
        optionLabel: "display_name",
        optionValue: "id",
        filters: [{ field: "is_active", operator: "eq", value: true }],
        pagination: { pageSize: 200 },
    });

    const campaigns: any[] = result?.data || [];

    const handleFormFinish = async (values: any) => {
        const { link_face_id, rental_price, ...campaignValues } = values;
        
        if (modalAction === "create") {
            setIsSubmitting(true);
            try {
                // 1. Crear campaña
                const { data: campaignData } = await axiosInstance.post("/campaigns/", campaignValues);
                const campaignId = campaignData.id;
                
                // 2. Si se seleccionó una cara, crear Reserva + Link
                if (link_face_id) {
                    const { data: rentalData } = await axiosInstance.post("/space-rentals/", {
                        face: link_face_id,
                        client: campaignValues.client,
                        campaign: campaignId,
                        start_date: campaignValues.start_date,
                        end_date: campaignValues.end_date,
                        price: rental_price || 0,
                        status: 'reservado'
                    });
                    
                    await axiosInstance.post("/campaign-spaces/", {
                        campaign: campaignId,
                        space_rental: rentalData.id,
                        notes: "Auto-generado desde campaña"
                    });
                    notification.success({ message: "Campaña y Reserva creadas correctamente" });
                } else {
                    notification.success({ message: "Campaña creada correctamente" });
                }
                
                invalidate({ resource: "campaigns", invalidates: ["list"] });
                invalidate({ resource: "space-rentals", invalidates: ["list"] });
                modalProps.onCancel?.(null as any);
                formProps.form?.resetFields();
            } catch (error) {
                notification.error({ message: "Error al crear la campaña o reserva" });
                console.error(error);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // En modo edición usamos el onFinish default de refine
            await formProps.onFinish?.(campaignValues);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Listado de Campañas</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setModalAction("create"); setModalId(null); show(); }}
                    style={{ borderRadius: 10, height: 40, padding: "0 24px", fontWeight: 700, background: "#7c3aed", boxShadow: "0 8px 15px rgba(124,58,237,0.2)", border: "none" }}
                >
                    Nueva Campaña
                </Button>
            </div>

            {query.isLoading ? (
                <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
            ) : (
                <Table
                    dataSource={campaigns}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                    locale={{ emptyText: <Empty description="Sin campañas" /> }}
                    className="premium-table"
                >
                    <Table.Column title="Campaña" dataIndex="name" render={(v: string) => <Text strong>{v}</Text>} />
                    <Table.Column title="Cliente" dataIndex="client_name" render={(v: string) => v || <Text type="secondary">—</Text>} />
                    <Table.Column title="Estado" dataIndex="status" width={110} render={(v: string) => (
                        <Tag color={STATUS_COLORS[v] || "default"} style={{ borderRadius: 12, padding: "2px 12px" }}>{STATUS_LABELS[v] || v}</Tag>
                    )} />
                    <Table.Column title="Inicio" dataIndex="start_date" width={110} render={(v: string) => v ? dayjs(v).format("DD/MM/YYYY") : "—"} />
                    <Table.Column title="Fin" dataIndex="end_date" width={110} render={(v: string) => v ? dayjs(v).format("DD/MM/YYYY") : "—"} />
                    <Table.Column title="Espacios" dataIndex="spaces_count" width={90} render={(v: number) => <Tag color="cyan">{v ?? 0}</Tag>} />
                    <Table.Column title="Presupuesto" dataIndex="budget_total" width={130} render={(v: number) => v ? `$${Number(v).toLocaleString("es-AR")}` : "—"} />
                    <Table.Column title="" key="actions" width={70} render={(_: any, record: any) => (
                        <Button type="dashed" size="small" icon={<EditOutlined />}
                            onClick={() => { setModalAction("edit"); setModalId(record.id); setTimeout(() => show(), 0); }} />
                    )} />
                </Table>
            )}

            <Modal {...modalProps} title={<b>{modalAction === "create" ? "Nueva Campaña" : "Editar Campaña"}</b>} width={650} centered okButtonProps={{ loading: isSubmitting }}>
                <Form {...formProps} layout="vertical" onFinish={handleFormFinish}>
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
                            <Form.Item label="Fecha Inicio" name="start_date" rules={[{ required: true }]}>
                                <Input type="date" size="large" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Fecha Fin" name="end_date" rules={[{ required: true }]}>
                                <Input type="date" size="large" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Presupuesto Total" name="budget_total" initialValue={0}>
                        <InputNumber prefix="$" size="large" style={{ width: "100%" }} min={0} />
                    </Form.Item>

                    {modalAction === "create" && (
                        <>
                            <Divider style={{ margin: "24px 0" }}>
                                <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>ASIGNACIÓN DE ESTRUCTURA (OPCIONAL)</span>
                            </Divider>
                            <Row gutter={16} style={{ background: "#f8fafc", padding: "16px 16px 0", borderRadius: 12, marginBottom: 16 }}>
                                <Col span={14}>
                                    <Form.Item label="Vincular a Cartel/Cara" name="link_face_id" help="Se creará una Reserva comercial automáticamente">
                                        <Select size="large" options={faceOptions} placeholder="Seleccionar espacio..." showSearch optionFilterProp="label" allowClear />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item label="Precio de Alquiler" name="rental_price" help="Costo del espacio">
                                        <InputNumber prefix="$" size="large" style={{ width: "100%" }} min={0} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </>
                    )}

                    <Form.Item label="Notas" name="notes">
                        <Input.TextArea rows={3} placeholder="Referencias de diseño, observaciones, etc." />
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
