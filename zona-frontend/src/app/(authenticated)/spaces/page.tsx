"use client";

import React, { useState, useEffect, useCallback } from "react";
import { axiosInstance } from "@/utils/axios-instance";
import { Tabs, Card, Table, Typography, Tag, Button, Modal, Form, Input, InputNumber, Select, Row, Col, Space, Upload, notification, Spin, Empty } from "antd";
import { EnvironmentOutlined, BuildOutlined, DollarOutlined, UserOutlined, PlusOutlined, MinusCircleOutlined, UploadOutlined, EditOutlined, SwapOutlined, CameraOutlined, WarningOutlined, ThunderboltOutlined, FileTextOutlined, ZoomInOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined, BankOutlined, ToolOutlined, SearchOutlined } from "@ant-design/icons";
import { useSelect, useList, useInvalidate } from "@refinedev/core";
import { useModalForm, useTable } from "@refinedev/antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function SpacesHubPage() {
    const [activeGroup, setActiveGroup] = useState<'inmuebles' | 'operaciones'>('inmuebles');
    const [activeOpsTab, setActiveOpsTab] = useState<'estructuras' | 'reservas' | 'gastos'>('estructuras');
    const [preselectedFaceId, setPreselectedFaceId] = useState<any>(null);

    return (
        <div style={{ padding: "32px", background: "#f1f5f9", minHeight: "100vh" }}>

            {/* ── Header Premium ───────────────────────────────────────── */}
            <div style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
                borderRadius: "20px",
                padding: "32px 40px",
                marginBottom: "32px",
                boxShadow: "0 12px 30px rgba(37, 99, 235, 0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "24px",
                color: "#fff",
                position: "relative",
                overflow: "hidden"
            }}>
                <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "400px", height: "400px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div style={{
                        width: "64px", height: "64px", borderRadius: "16px",
                        background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "32px", border: "1px solid rgba(255,255,255,0.2)"
                    }}>
                        <EnvironmentOutlined />
                    </div>
                    <div>
                        <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, letterSpacing: "-1px" }}>
                            Hub de Vía Pública
                        </Title>
                        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>
                            Gestión ejecutiva de terrenos, cartelería y contratos
                        </Text>
                    </div>
                </div>
            </div>

            {/* ── Selector de grupo ── */}
            <div style={{
                display: "flex",
                gap: 8,
                marginBottom: 20,
                background: "#fff",
                borderRadius: 16,
                padding: 6,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                width: "fit-content",
            }}>
                {(([
                    { key: 'inmuebles', icon: <BankOutlined />, label: 'Activos Inmobiliarios', color: '#2563eb' },
                    { key: 'operaciones', icon: <ToolOutlined />, label: 'Operaciones', color: '#0891b2' },
                ]) as {key: 'inmuebles'|'operaciones', icon: React.ReactNode, label: string, color: string}[]).map(opt => (
                    <button
                        key={opt.key}
                        onClick={() => setActiveGroup(opt.key)}
                        style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 22px",
                            borderRadius: 12, border: "none", cursor: "pointer",
                            fontSize: 14, fontWeight: 700, transition: "all 0.18s",
                            background: activeGroup === opt.key
                                ? `linear-gradient(135deg, ${opt.color}18, ${opt.color}10)`
                                : "transparent",
                            color: activeGroup === opt.key ? opt.color : "#94a3b8",
                            boxShadow: activeGroup === opt.key ? `0 0 0 2px ${opt.color}30` : "none",
                        }}
                    >
                        <span style={{ fontSize: 16 }}>{opt.icon}</span>
                        {opt.label}
                    </button>
                ))}
            </div>

            <Card
                variant="borderless"
                style={{ borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)", overflow: "hidden" }}
                styles={{ body: { padding: 0 } }}
            >
                {/* ── Grupo 1: Activos Inmobiliarios ── */}
                {activeGroup === 'inmuebles' && (
                    <Tabs
                        defaultActiveKey="terrenos"
                        size="large"
                        tabBarStyle={{ padding: "16px 32px 0", background: "#fff", borderBottom: "1px solid #f1f5f9", marginBottom: 0 }}
                        tabBarGutter={32}
                        items={[
                            {
                                key: "terrenos",
                                label: (
                                    <span style={{ fontWeight: 600 }}>
                                        <EnvironmentOutlined style={{ color: "#2563eb", marginRight: 6 }} />
                                        Terrenos
                                    </span>
                                ),
                                children: <div style={{ padding: "32px" }}><LocationsTab /></div>
                            },
                            {
                                key: "contratos",
                                label: (
                                    <span style={{ fontWeight: 600 }}>
                                        <DollarOutlined style={{ color: "#16a34a", marginRight: 6 }} />
                                        Contratos
                                    </span>
                                ),
                                children: <div style={{ padding: "32px" }}><ContractsTab /></div>
                            },
                            {
                                key: "propietarios",
                                label: (
                                    <span style={{ fontWeight: 600 }}>
                                        <UserOutlined style={{ color: "#7c3aed", marginRight: 6 }} />
                                        Propietarios
                                    </span>
                                ),
                                children: <div style={{ padding: "32px" }}><LandlordsTab /></div>
                            },
                        ]}
                    />
                )}

                {/* ── Grupo 2: Operaciones ── */}
                {activeGroup === 'operaciones' && (
                    <Tabs
                        activeKey={activeOpsTab}
                        onChange={(k: any) => setActiveOpsTab(k)}
                        size="large"
                        tabBarStyle={{ padding: "16px 32px 0", background: "#fff", borderBottom: "1px solid #f1f5f9", marginBottom: 0 }}
                        tabBarGutter={32}
                        items={[
                            {
                                key: "estructuras",
                                label: (
                                    <span style={{ fontWeight: 600 }}>
                                        <BuildOutlined style={{ color: "#2563eb", marginRight: 6 }} />
                                        Estructuras
                                    </span>
                                ),
                                children: <div style={{ padding: "32px" }}><StructuresTab setActiveOpsTab={setActiveOpsTab} setPreselectedFaceId={setPreselectedFaceId} /></div>
                            },
                            {
                                key: "reservas",
                                label: (
                                    <span style={{ fontWeight: 600 }}>
                                        <SwapOutlined style={{ color: "#0891b2", marginRight: 6 }} />
                                        Reservas
                                    </span>
                                ),
                                children: <div style={{ padding: "32px" }}><RentalsTab preselectedFaceId={preselectedFaceId} setPreselectedFaceId={setPreselectedFaceId} /></div>
                            },
                            {
                                key: "gastos",
                                label: (
                                    <span style={{ fontWeight: 600 }}>
                                        <FileTextOutlined style={{ color: "#dc2626", marginRight: 6 }} />
                                        Gastos
                                    </span>
                                ),
                                children: <div style={{ padding: "32px" }}><GastosTab /></div>
                            },
                        ]}
                    />
                )}
            </Card>

            <style>{`
                .premium-table .ant-table-thead > tr > th {
                    background: #f8fafc !important;
                    color: #64748b !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    font-size: 11px !important;
                    letter-spacing: 1px !important;
                    padding: 20px 24px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                .premium-table .ant-table-tbody > tr > td {
                    padding: 20px 24px !important;
                    border-bottom: 1px solid #f8fafc !important;
                }
                .premium-table .ant-table-row:hover td {
                    background: #f1f5f9 !important;
                }
                .ant-tabs-nav::before { border-bottom: none !important; }
                .photo-overlay:hover { background: rgba(0,0,0,0.35) !important; }
                .photo-overlay:hover .zoom-icon { opacity: 1 !important; }
            `}</style>
        </div>
    );
}

// --- SUBCOMPONENTES ---

function LocationsTab() {
    const { tableProps } = useTable({ resource: "locations", syncWithLocation: false });
    const [modalAction, setModalAction] = React.useState<"create" | "edit">("create");
    const [modalId, setModalId] = React.useState<any>(null);

    const { modalProps, formProps, show } = useModalForm({
        resource: "locations",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: "Terreno guardado exitosamente", type: "success" })
    });
    const { options: landlordOptions } = useSelect({ resource: "landlords", optionLabel: "name", optionValue: "id" });
    const [isGeocoding, setIsGeocoding] = React.useState(false);

    const { modalProps: landlordModalProps, formProps: landlordFormProps, show: showLandlord } = useModalForm({
        resource: "landlords",
        action: "create",
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: "Propietario creado", type: "success" })
    });

    const lat = Form.useWatch('latitude', formProps.form);
    const lon = Form.useWatch('longitude', formProps.form);

    const normFile = (e: any) => {
        if (Array.isArray(e)) return e;
        return e?.fileList;
    };

    const NULLABLE_FK_FIELDS = ['landlord'];

    const handleFormFinish = async (values: any) => {
        const formData = new FormData();
        for (const key in values) {
            if (key === 'contract_file_raw') continue;
            if (values[key] !== undefined && values[key] !== null) {
                formData.append(key, values[key]);
            } else if (NULLABLE_FK_FIELDS.includes(key)) {
                formData.append(key, '');
            }
        }
        if (values.contract_file_raw && values.contract_file_raw.length > 0) {
            formData.append('contract_file', values.contract_file_raw[0].originFileObj);
        }
        await formProps.onFinish?.(formData as any);
    };

    const handleGeocode = async () => {
        const address = formProps.form?.getFieldValue('address');
        const localityField = formProps.form?.getFieldValue('locality');
        
        if (!address && !localityField) {
            notification.warning({ message: "Ingresá una dirección o localidad para buscar en el mapa" });
            return;
        }

        const searchQuery = [address, localityField].filter(Boolean).join(", ");
        
        setIsGeocoding(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const addressObj = data[0].address || {};
                const streetAddress = [addressObj.road, addressObj.house_number].filter(Boolean).join(" ");
                formProps.form?.setFieldsValue({
                    address: streetAddress || address || "",
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon),
                    locality: addressObj.city || addressObj.town || addressObj.village || addressObj.state_district || addressObj.state || localityField || ""
                });
            } else {
                notification.warning({ message: "No se encontraron coordenadas para esa dirección y localidad" });
            }
        } catch {
            notification.error({ message: "Error al buscar coordenadas" });
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleReverseGeocode = async () => {
        const currentLat = formProps.form?.getFieldValue('latitude');
        const currentLon = formProps.form?.getFieldValue('longitude');
        if (!currentLat || !currentLon) {
            notification.warning({ message: "Ingresá latitud y longitud primero" });
            return;
        }
        setIsGeocoding(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLat}&lon=${currentLon}`);
            const data = await res.json();
            if (data && data.display_name) {
                const addressObj = data.address || {};
                const streetAddress = [addressObj.road, addressObj.house_number].filter(Boolean).join(" ");
                formProps.form?.setFieldsValue({ 
                    address: streetAddress || data.display_name,
                    locality: addressObj.city || addressObj.town || addressObj.village || addressObj.state_district || addressObj.state || ""
                });
            } else {
                notification.warning({ message: "No se encontró una dirección para esas coordenadas" });
            }
        } catch {
            notification.error({ message: "Error al buscar dirección" });
        } finally {
            setIsGeocoding(false);
        }
    };

    const [previewLocation, setPreviewLocation] = React.useState<any>(null);
    const [expensesLocation, setExpensesLocation] = React.useState<any>(null);
    const [searchName, setSearchName] = React.useState('');
    const [searchLocality, setSearchLocality] = React.useState('');
    const [sortByExpiration, setSortByExpiration] = React.useState<boolean>(true);
    const [expenseFilterType, setExpenseFilterType] = React.useState<string | undefined>(undefined);
    const [expenseFilterStartDate, setExpenseFilterStartDate] = React.useState<string | undefined>(undefined);
    const [expenseFilterEndDate, setExpenseFilterEndDate] = React.useState<string | undefined>(undefined);

    const [locationExpenses, setLocationExpenses] = React.useState<any[]>([]);
    const [loadingExpenses, setLoadingExpenses] = React.useState(false);

    const fetchLocationExpenses = useCallback(async (locationId: number) => {
        setLoadingExpenses(true);
        try {
            const res = await axiosInstance.get(
                `http://localhost:8000/api/v1/space-expenses/?location=${locationId}&page_size=500`
            );
            const data = res.data;
            // DRF puede devolver { results: [...] } o directamente [...]
            setLocationExpenses(Array.isArray(data) ? data : (data.results || data.data || []));
        } catch (e) {
            setLocationExpenses([]);
        } finally {
            setLoadingExpenses(false);
        }
    }, []);

    React.useEffect(() => {
        if (expensesLocation?.id) {
            fetchLocationExpenses(Number(expensesLocation.id));
        } else {
            setLocationExpenses([]);
        }
    }, [expensesLocation, fetchLocationExpenses]);

    const { modalProps: expenseFormProps, formProps: expenseFormConfig, show: showExpenseForm } = useModalForm({
        resource: "space-expenses",
        action: "create",
        warnWhenUnsavedChanges: false,
        successNotification: () => {
            if (expensesLocation?.id) fetchLocationExpenses(Number(expensesLocation.id));
            return { message: "Gasto registrado exitosamente", type: "success" };
        }
    });

    const locations = tableProps.dataSource || [];

    let filteredLocations = locations.filter((loc: any) => {
        const matchName = !searchName || loc.name?.toLowerCase().includes(searchName.toLowerCase());
        const matchLocality = !searchLocality || loc.locality?.toLowerCase().includes(searchLocality.toLowerCase());
        return matchName && matchLocality;
    });

    if (sortByExpiration) {
        filteredLocations.sort((a: any, b: any) => {
            if (!a.contract_end_date) return 1;
            if (!b.contract_end_date) return -1;
            return dayjs(a.contract_end_date).unix() - dayjs(b.contract_end_date).unix();
        });
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Listado de Terrenos</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setModalAction("create"); setModalId(null); show(); }}
                    style={{ borderRadius: "10px", height: "40px", padding: "0 24px", fontWeight: 700, background: "#2563eb", boxShadow: "0 8px 15px rgba(37,99,235,0.2)", border: "none" }}
                >
                    Nuevo Terreno
                </Button>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <Input
                    placeholder="Buscar por nombre..."
                    prefix={<SearchOutlined />}
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    style={{ width: 240, borderRadius: 10 }}
                    size="large"
                    allowClear
                />
                <Input
                    placeholder="Localidad..."
                    prefix={<EnvironmentOutlined />}
                    value={searchLocality}
                    onChange={(e) => setSearchLocality(e.target.value)}
                    style={{ width: 200, borderRadius: 10 }}
                    size="large"
                    allowClear
                />
                <Select
                    value={sortByExpiration}
                    onChange={(val) => setSortByExpiration(val)}
                    options={[
                        { label: 'Vencimiento más próximo', value: true },
                        { label: 'Sin orden por vencimiento', value: false }
                    ]}
                    style={{ width: 240 }}
                    size="large"
                />
            </div>

            {tableProps.loading ? (
                <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
            ) : filteredLocations.length === 0 ? (
                <Empty description="No se encontraron terrenos con esos filtros" style={{ padding: 60 }} />
            ) : (
                <Row gutter={[24, 24]}>
                    {filteredLocations.map((record: any) => {
                        const lat = record.latitude;
                        const lon = record.longitude;
                        const hasMap = !!(lat && lon);
                        const daysLeft = record.contract_end_date ? dayjs(record.contract_end_date).diff(dayjs(), 'day') : null;
                        
                        let tagColor = 'default';
                        let tagText = 'Sin contrato';
                        if (daysLeft !== null) {
                            if (daysLeft < 0) { tagColor = 'error'; tagText = 'Vencido'; }
                            else if (daysLeft <= 30) { tagColor = 'warning'; tagText = `Vence en ${daysLeft}d`; }
                            else { tagColor = 'success'; tagText = 'Vigente'; }
                        }

                        return (
                            <Col key={record.id} xs={24} sm={12} md={8} lg={6}>
                                <Card
                                    hoverable
                                    cover={
                                        hasMap ? (
                                            <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    style={{ border: 0, pointerEvents: 'none', display: 'block' }}
                                                    src={`https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`}
                                                />
                                                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                                    <Tag color={tagColor} style={{ borderRadius: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{tagText}</Tag>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                height: 160,
                                                background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexDirection: 'column', gap: 8, position: 'relative'
                                            }}>
                                                <EnvironmentOutlined style={{ fontSize: 36, color: '#94a3b8' }} />
                                                <Text type="secondary" style={{ fontSize: 12 }}>Sin coordenadas de mapa</Text>
                                                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                                    <Tag color={tagColor} style={{ borderRadius: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>{tagText}</Tag>
                                                </div>
                                            </div>
                                        )
                                    }
                                    styles={{ body: { padding: 16 } }}
                                    style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}
                                    onClick={() => setPreviewLocation(record)}
                                >
                                    <Text strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>{record.name}</Text>
                                    <Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <EnvironmentOutlined style={{ marginRight: 4 }} />{record.address || 'Sin dirección'}
                                    </Text>
                                    
                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <Text type="secondary" style={{ fontSize: 11 }}>Vencimiento:</Text>
                                            <Text style={{ fontSize: 12, fontWeight: 600 }}>
                                                {record.contract_end_date ? dayjs(record.contract_end_date).format('DD/MM/YYYY') : 'Sin contrato'}
                                            </Text>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <Button
                                                type="default"
                                                size="small"
                                                icon={<DollarOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpensesLocation(record);
                                                }}
                                                style={{ color: '#10b981', borderColor: '#10b981' }}
                                            >
                                                Gastos
                                            </Button>
                                            <Button
                                                type="dashed"
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setModalAction("edit");
                                                    setModalId(record.id);
                                                    setTimeout(() => show(), 0);
                                                }}
                                            >
                                                Editar
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* ── Modal de Detalle de Terreno ── */}
            <Modal
                open={!!previewLocation}
                onCancel={() => setPreviewLocation(null)}
                footer={null}
                width={600}
                centered
                styles={{ body: { padding: 24 } }}
                style={{ borderRadius: 20 }}
                title={<Title level={4} style={{ margin: 0, color: '#1e3a8a' }}><EnvironmentOutlined /> Detalle del Terreno</Title>}
            >
                {previewLocation && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>Nombre / Referencia</Text>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{previewLocation.name}</div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#f8fafc', padding: 16, borderRadius: 12 }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>Propietario</Text>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>
                                    {previewLocation.landlord_name || landlordOptions?.find((o: any) => String(o.value) === String(previewLocation.landlord))?.label || 'No especificado'}
                                </div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>Alquiler</Text>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>
                                    {previewLocation.rent_amount ? `$${previewLocation.rent_amount}` : 'N/A'} 
                                    {previewLocation.rent_period ? ` (${previewLocation.rent_period.toUpperCase()})` : ''}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>Vencimiento del Contrato</Text>
                                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginTop: 4 }}>
                                    {previewLocation.contract_end_date ? dayjs(previewLocation.contract_end_date).format('DD/MM/YYYY') : 'Sin contrato'}
                                </div>
                            </div>
                            <div>
                                <Text type="secondary" style={{ fontSize: 11 }}>Documento Adjunto</Text>
                                <div style={{ marginTop: 4 }}>
                                    {previewLocation.contract_file ? (
                                        <a href={previewLocation.contract_file} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}>
                                            <UploadOutlined /> Descargar Contrato
                                        </a>
                                    ) : (
                                        <Text type="secondary">No hay PDF cargado</Text>
                                    )}
                                </div>
                            </div>
                        </div>

                        {previewLocation.latitude && previewLocation.longitude && (
                            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', marginTop: 8 }}>
                                <iframe
                                    width="100%"
                                    height="250"
                                    style={{ border: 0, display: 'block' }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${previewLocation.latitude},${previewLocation.longitude}&z=16&output=embed`}
                                />
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                            <Button onClick={() => setPreviewLocation(null)} style={{ borderRadius: 8 }}>Cerrar</Button>
                            <Button 
                                type="primary" 
                                icon={<EditOutlined />} 
                                style={{ background: '#2563eb', border: 'none', borderRadius: 8 }}
                                onClick={() => {
                                    const id = previewLocation.id;
                                    setPreviewLocation(null);
                                    setModalAction("edit");
                                    setModalId(id);
                                    setTimeout(() => show(), 0);
                                }}
                            >
                                Editar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Modal de Gastos del Terreno ── */}
            <Modal
                open={!!expensesLocation}
                onCancel={() => setExpensesLocation(null)}
                footer={null}
                width={1000}
                centered
                styles={{ body: { padding: 24 } }}
                style={{ borderRadius: 20 }}
                title={<Title level={4} style={{ margin: 0, color: '#059669' }}><DollarOutlined /> Control de Gastos: {expensesLocation?.name}</Title>}
            >
                {expensesLocation && (() => {
                    const filteredExpenses = locationExpenses.filter((e: any) => {
                        const matchesType = !expenseFilterType || e.expense_type === expenseFilterType;
                        const matchesStart = !expenseFilterStartDate || (e.date && e.date >= expenseFilterStartDate);
                        const matchesEnd = !expenseFilterEndDate || (e.date && e.date <= expenseFilterEndDate);
                        return matchesType && matchesStart && matchesEnd;
                    });

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Barra de Filtros */}
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', background: '#f8fafc', padding: '16px 20px', borderRadius: 12, alignItems: 'center' }}>
                                <div style={{ minWidth: 200 }}>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Filtrar por Tipo</Text>
                                    <Select 
                                        allowClear 
                                        placeholder="Todos los conceptos" 
                                        value={expenseFilterType} 
                                        onChange={(v) => setExpenseFilterType(v)}
                                        style={{ width: '100%' }}
                                        options={[
                                            { label: 'Alquiler Terreno', value: 'alquiler' },
                                            { label: 'Luz / Energía', value: 'luz' },
                                            { label: 'Seguro', value: 'seguro' },
                                            { label: 'Impuesto Municipal', value: 'impuesto' },
                                            { label: 'Mantenimiento', value: 'mantenimiento' },
                                            { label: 'Otro', value: 'otro' }
                                        ]}
                                    />
                                </div>
                                <div>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Desde Fecha</Text>
                                    <Input 
                                        type="date" 
                                        value={expenseFilterStartDate} 
                                        onChange={(e) => setExpenseFilterStartDate(e.target.value || undefined)} 
                                        style={{ width: 180 }}
                                    />
                                </div>
                                <div>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Hasta Fecha</Text>
                                    <Input 
                                        type="date" 
                                        value={expenseFilterEndDate} 
                                        onChange={(e) => setExpenseFilterEndDate(e.target.value || undefined)} 
                                        style={{ width: 180 }}
                                    />
                                </div>
                                <div style={{ alignSelf: 'flex-end', paddingBottom: 2 }}>
                                    <Button 
                                        type="text" 
                                        onClick={() => {
                                            setExpenseFilterType(undefined);
                                            setExpenseFilterStartDate(undefined);
                                            setExpenseFilterEndDate(undefined);
                                        }}
                                        danger
                                        style={{ fontWeight: 500 }}
                                    >
                                        Limpiar Filtros
                                    </Button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Text type="secondary">Inversión acumulada en este terreno</Text>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#047857' }}>
                                        ${filteredExpenses.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0).toLocaleString('es-AR')}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <Button
                                        icon={<UploadOutlined />}
                                        onClick={() => {
                                            const csvContent = "data:text/csv;charset=utf-8," 
                                                + "Fecha,Tipo,Monto,Descripcion\n"
                                                + filteredExpenses.map((e: any) => `${e.date},${e.expense_type},${e.amount},"${e.description || ''}"`).join("\n");
                                            const encodedUri = encodeURI(csvContent);
                                            const link = document.createElement("a");
                                            link.setAttribute("href", encodedUri);
                                            link.setAttribute("download", `gastos_${expensesLocation.name.replace(/\s+/g, '_')}.csv`);
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                    >
                                        Exportar CSV
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        style={{ background: '#059669', border: 'none' }}
                                        onClick={() => {
                                            showExpenseForm();
                                            setTimeout(() => {
                                                expenseFormConfig.form?.setFieldsValue({
                                                    date: dayjs().format('YYYY-MM-DD'),
                                                    expense_type: 'alquiler',
                                                    amount: expensesLocation.rent_amount ? Number(expensesLocation.rent_amount) : undefined,
                                                });
                                            }, 150);
                                        }}
                                    >
                                        Registrar Gasto
                                    </Button>
                                </div>
                            </div>

                            {loadingExpenses ? (
                                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                            ) : filteredExpenses.length === 0 ? (
                                <Empty description="No se han registrado gastos para este terreno" />
                            ) : (
                                <Table
                                    dataSource={filteredExpenses}
                                    rowKey="id"
                                    pagination={{ pageSize: 5 }}
                                    size="small"
                                    className="premium-table"
                                >
                                    <Table.Column dataIndex="date" title="Fecha" render={(v) => dayjs(v).format('DD/MM/YYYY')} />
                                    <Table.Column dataIndex="expense_type" title="Tipo" render={(v: string) => {
                                        const labels: Record<string, string> = { alquiler: 'Alquiler', luz: 'Luz', seguro: 'Seguro', impuesto: 'Impuesto', mantenimiento: 'Mantenimiento', otro: 'Otro' };
                                        const colors: Record<string, string> = { alquiler: 'blue', luz: 'orange', seguro: 'purple', impuesto: 'cyan', mantenimiento: 'volcano', otro: 'default' };
                                        return <Tag color={colors[v] || 'default'}>{labels[v] || v.toUpperCase()}</Tag>;
                                    }} />
                                    <Table.Column dataIndex="amount" title="Monto" render={(v) => `$${Number(v).toLocaleString('es-AR')}`} />
                                    <Table.Column dataIndex="description" title="Descripción" ellipsis />
                                </Table>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            <Modal 
                {...expenseFormProps} 
                title={<b>Registrar Nuevo Gasto</b>} 
                width={600} 
                centered 
                zIndex={1100}
                onCancel={() => {
                    if (expenseFormConfig.form?.isFieldsTouched()) {
                        Modal.confirm({
                            title: '¿Cerrar formulario?',
                            icon: <WarningOutlined style={{ color: '#faad14' }} />,
                            content: 'Tenés cambios sin guardar que se van a perder.',
                            okText: 'Sí, salir',
                            cancelText: 'No, quedarme',
                            okButtonProps: { danger: true },
                            onOk: () => {
                                (expenseFormProps.onCancel as any)?.();
                            }
                        });
                    } else {
                        (expenseFormProps.onCancel as any)?.();
                    }
                }}
            >
                <Form
                    {...expenseFormConfig}
                    layout="vertical"
                    onFinish={(values) => {
                        (expenseFormConfig.onFinish as any)?.({
                            ...values,
                            location: expensesLocation?.id ? Number(expensesLocation.id) : undefined,
                        });
                    }}
                >
                    <Form.Item label="Tipo de Gasto" name="expense_type" rules={[{ required: true }]}>
                        <Select
                            options={[
                                { label: 'Alquiler Terreno', value: 'alquiler' },
                                { label: 'Luz / Energía', value: 'luz' },
                                { label: 'Seguro', value: 'seguro' },
                                { label: 'Impuesto Municipal', value: 'impuesto' },
                                { label: 'Mantenimiento', value: 'mantenimiento' },
                                { label: 'Otro', value: 'otro' }
                            ]}
                        />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Monto" name="amount" rules={[{ required: true }]}>
                                <InputNumber prefix="$" style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Fecha de Pago" name="date" rules={[{ required: true }]}>
                                <Input type="date" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Descripción / Observación" name="description">
                        <Input.TextArea rows={3} placeholder="Detalles de la factura o el servicio..." />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal {...modalProps} title={<b>{modalAction === "create" ? "Registrar Nuevo Terreno" : "Editar Terreno"}</b>} width={700} centered>
                <Form {...formProps} layout="vertical" onFinish={handleFormFinish}>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item label="Nombre Referencia" name="name" rules={[{ required: true }]}><Input placeholder="Ej: Esquina Mitre y San Martín" size="large" /></Form.Item></Col>
                        <Col span={12}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <Form.Item label="Propietario" name="landlord" style={{ flex: 1 }}>
                                    <Select options={landlordOptions} placeholder="Seleccionar" allowClear showSearch optionFilterProp="label" size="large" />
                                </Form.Item>
                                <Button icon={<PlusOutlined />} onClick={() => showLandlord()} title="Agregar propietario" size="large" style={{ marginTop: 30 }} />
                            </div>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}><Form.Item label="Inicio de Contrato" name="contract_start_date"><Input type="date" size="large" style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item label="Fin de Contrato" name="contract_end_date"><Input type="date" size="large" style={{ width: '100%' }} /></Form.Item></Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}><Form.Item label="Monto Alquiler" name="rent_amount"><InputNumber prefix="$" size="large" style={{ width: '100%' }} /></Form.Item></Col>
                        <Col span={12}>
                            <Form.Item label="Periodo de Pago" name="rent_period" initialValue="mensual">
                                <Select size="large" options={[{ label: 'Mensual', value: 'mensual' }, { label: 'Bimestral', value: 'bimestral' }, { label: 'Semestral', value: 'semestral' }, { label: 'Anual', value: 'anual' }, { label: 'Por Contrato (Total)', value: 'por_contrato' }]} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Estado del Terreno" name="is_active" initialValue={true}>
                                <Select size="large" options={[{ label: 'Activo (En gestión)', value: true }, { label: 'Inactivo (Baja)', value: false }]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Contrato PDF (Opcional)" name="contract_file_raw" valuePropName="fileList" getValueFromEvent={normFile}>
                                <Upload name="contract" beforeUpload={() => false} maxCount={1} accept=".pdf">
                                    <Button icon={<UploadOutlined />} size="large">Seleccionar PDF</Button>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Card size="small" title="Ubicación Geográfica" bordered={false} style={{ background: '#f8fafc', marginTop: 8, borderRadius: 12 }}>
                        <Form.Item label="Dirección" name="address" help="Ingresá la dirección y presioná el botón para buscar la Lat/Lon">
                            <Input.Search
                                placeholder="Ej: Av. Libertador 1000"
                                enterButton={<span><EnvironmentOutlined /> Buscar en Maps</span>}
                                onSearch={handleGeocode}
                                loading={isGeocoding}
                                size="large"
                            />
                        </Form.Item>
                        <Form.Item label="Localidad" name="locality" help="Se autocompleta al buscar en Maps, pero podés editarlo">
                            <Input placeholder="Ej: Pilar, CABA, Rosario" size="large" />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col span={12}><Form.Item label="Latitud" name="latitude"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                            <Col span={12}><Form.Item label="Longitud" name="longitude"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                        </Row>
                        <Button type="dashed" onClick={handleReverseGeocode} loading={isGeocoding} size="small" style={{ marginBottom: 16 }}>
                            Obtener dirección desde coordenadas
                        </Button>

                        {lat && lon && (
                            <div style={{ marginTop: 8, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                <iframe width="100%" height="250" style={{ border: 0, display: 'block' }} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${lat},${lon}&z=16&output=embed`} />
                            </div>
                        )}
                    </Card>
                </Form>
            </Modal>

            <Modal {...landlordModalProps} title={<b>Nuevo Propietario</b>} zIndex={1001} centered>
                <Form {...landlordFormProps} layout="vertical">
                    <Form.Item label="Nombre / Razón Social" name="name" rules={[{ required: true }]}><Input size="large" /></Form.Item>
                    <Form.Item label="Email" name="email"><Input type="email" size="large" /></Form.Item>
                    <Form.Item label="Teléfono" name="phone"><Input size="large" /></Form.Item>
                    <Form.Item label="CUIT/CUIL" name="cuit"><Input size="large" /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

function AvailabilityDetail({ availability }: { availability: any }) {
    if (!availability) return null;

    if (availability.type === 'led') {
        const pct = availability.pct ?? 0;
        const color = pct === 100 ? '#10b981' : pct === 0 ? '#ef4444' : '#f59e0b';
        const label = pct === 100 ? 'DISPONIBLE' : pct === 0 ? 'COMPLETO' : `${pct}% libre`;
        const availSec = Math.round(availability.available_day);
        const availMin = (availSec / 60).toFixed(1);
        const availHs  = (availSec / 3600).toFixed(2);
        const opHours  = availability.operating_hours ?? 24;
        return (
            <div style={{ marginTop: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1 }}>
                        PANTALLA LED · {opHours}hs/día
                    </Text>
                    <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .3s' }} />
                </div>
                <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                    Libre/día: {availSec} seg · {availMin} min · {availHs} hs
                </Text>
            </div>
        );
    }

    if (availability.type === 'faces') {
        const faces: { id: number; name: string; occupied: boolean }[] = availability.faces || [];
        if (faces.length === 0) return (
            <div style={{ marginTop: 10, padding: '6px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>Sin caras configuradas</Text>
            </div>
        );
        return (
            <div style={{ marginTop: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <Text style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, display: 'block', marginBottom: 6 }}>
                    CARAS
                </Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {faces.map(f => (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={{ fontSize: 12 }}>{f.name}</Text>
                            <span style={{
                                fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 8,
                                background: f.occupied ? '#fef2f2' : '#ecfdf5',
                                color: f.occupied ? '#ef4444' : '#10b981',
                            }}>
                                {f.occupied ? 'OCUPADA' : 'LIBRE'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
}

// ── Modal de Detalle de Estructura (photo + info + mapa) ────────────────────
function StructureDetailModal({
    structure,
    onClose,
    typeColors,
    typeLabels,
    setActiveOpsTab,
    setPreselectedFaceId,
}: {
    structure: any;
    onClose: () => void;
    typeColors: Record<string, string>;
    typeLabels: Record<string, string>;
    setActiveOpsTab: (tab: any) => void;
    setPreselectedFaceId: (id: any) => void;
}) {
    const [plData, setPlData] = React.useState<any>(null);
    const [loadingPL, setLoadingPL] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('info');

    React.useEffect(() => {
        if (!structure?.id) { setPlData(null); return; }
        setActiveTab('info');
        setLoadingPL(true);
        Promise.all([
            axiosInstance.get(`http://localhost:8000/api/v1/space-expenses/?structure=${structure.id}&page_size=500`),
            axiosInstance.get(`http://localhost:8000/api/v1/space-expenses/?location=${structure.location}&page_size=500`),
            axiosInstance.get(`http://localhost:8000/api/v1/space-rentals/?page_size=500`),
        ]).then(([expStruct, expLoc, rentals]) => {
            const structExp = Array.isArray(expStruct.data) ? expStruct.data : (expStruct.data.results || []);
            const locExp   = Array.isArray(expLoc.data)    ? expLoc.data    : (expLoc.data.results    || []);
            const allRentals = Array.isArray(rentals.data)   ? rentals.data   : (rentals.data.results   || []);
            const faceIds = (structure.faces || []).map((f: any) => f.id);
            const structRentals = allRentals.filter((r: any) => faceIds.includes(r.face));
            setPlData({ structExp, locExp, structRentals });
        }).catch(() => setPlData(null)).finally(() => setLoadingPL(false));
    }, [structure?.id]);

    if (!structure) return null;

    const av = structure.availability;
    const lat = structure.location_latitude ? parseFloat(structure.location_latitude) : null;
    const lon = structure.location_longitude ? parseFloat(structure.location_longitude) : null;
    const hasMap = !!(lat && lon);

    // Calcular estado general de disponibilidad para encabezado
    const getRentalStatus = () => {
        if (!av) return { label: 'Sin info', color: '#94a3b8', bg: '#f8fafc' };
        if (av.type === 'led') {
            const pct = av.pct ?? 0;
            if (pct === 100) return { label: 'DISPONIBLE', color: '#10b981', bg: '#ecfdf5' };
            if (pct === 0)   return { label: 'COMPLETO', color: '#ef4444', bg: '#fef2f2' };
            return { label: `${pct}% LIBRE`, color: '#f59e0b', bg: '#fffbeb' };
        }
        if (av.type === 'faces') {
            if (av.status === 'disponible') return { label: 'DISPONIBLE', color: '#10b981', bg: '#ecfdf5' };
            if (av.status === 'ocupado')    return { label: 'OCUPADO', color: '#ef4444', bg: '#fef2f2' };
            if (av.status === 'parcial')    return { label: 'PARCIALMENTE LIBRE', color: '#f59e0b', bg: '#fffbeb' };
        }
        return { label: 'Sin caras', color: '#94a3b8', bg: '#f8fafc' };
    };
    const rentalStatus = getRentalStatus();

    // Lógica de disponibilidad
    const isAvailable = av?.type === 'led' ? (av.pct > 0) : (av?.available > 0);

    const handleReserve = () => {
        let faceIdToReserve = null;
        if (av?.type === 'faces') {
            const freeFace = av.faces?.find((f: any) => !f.occupied);
            if (freeFace) faceIdToReserve = freeFace.id;
        } else if (av?.type === 'led' && av.faces?.length > 0) {
            faceIdToReserve = av.faces[0].id;
        } else if (structure.faces && structure.faces.length > 0) {
            faceIdToReserve = structure.faces[0].id;
        }
        
        if (faceIdToReserve) {
            setPreselectedFaceId(faceIdToReserve);
        }

        setActiveOpsTab('reservas');
        onClose();
    };

    return (
        <Modal
            open={!!structure}
            onCancel={onClose}
            footer={null}
            width={1000}
            centered
            styles={{ body: { padding: 0 } }}
            style={{ borderRadius: 20, overflow: 'hidden' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column' }}>

                {/* ── Foto banner ── */}
                <div style={{ position: 'relative', height: 320, background: '#0f172a', overflow: 'hidden' }}>
                    {structure.photo ? (
                        <img
                            src={structure.photo}
                            alt={structure.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }}
                        />
                    ) : (
                        <div style={{
                            height: '100%',
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12,
                        }}>
                            <CameraOutlined style={{ fontSize: 56, color: '#475569' }} />
                            <Text style={{ color: '#64748b', fontSize: 14 }}>Sin foto de instalación</Text>
                        </div>
                    )}

                    {/* Overlay gradiente inferior */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
                    }} />

                    {/* Tags sobre la foto */}
                    <div style={{ position: 'absolute', top: 16, left: 20, display: 'flex', gap: 8 }}>
                        <Tag color={typeColors[structure.type] || 'blue'} style={{ borderRadius: 10, fontSize: 12, padding: '2px 12px', fontWeight: 700, border: 'none' }}>
                            {typeLabels[structure.type] || structure.type}
                        </Tag>
                        <Tag
                            color={structure.is_active ? 'success' : 'default'}
                            style={{ borderRadius: 10, fontSize: 12, padding: '2px 12px', fontWeight: 700, border: 'none' }}
                        >
                            {structure.is_active ? 'INSTALADO' : 'DESMONTADO'}
                        </Tag>
                    </div>

                    {/* Nombre en la foto */}
                    <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
                        <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                            {structure.name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 4 }}>
                            <EnvironmentOutlined style={{ marginRight: 6 }} />
                            {structure.location_name}
                            {structure.location_locality ? ` — ${structure.location_locality}` : ''}
                        </div>
                    </div>
                </div>

                {/* ── Tab selector ── */}
                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    {[
                        { key: 'info', label: '📋 Información' },
                        { key: 'rentabilidad', label: '📊 Rentabilidad' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            style={{
                                padding: '14px 28px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontWeight: activeTab === tab.key ? 700 : 500,
                                fontSize: 14,
                                color: activeTab === tab.key ? '#2563eb' : '#64748b',
                                borderBottom: activeTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
                                transition: 'all .15s',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'info' && (
                <div style={{ padding: '32px 40px', display: 'grid', gridTemplateColumns: hasMap ? '1fr 1fr' : '1fr', gap: 32 }}>
                    {/* Columna izquierda: info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div style={{ background: rentalStatus.bg, borderRadius: 14, padding: '16px 20px', border: `1px solid ${rentalStatus.color}30` }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 6 }}>ESTADO DE ALQUILER</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: rentalStatus.color }}>{rentalStatus.label}</div>
                        </div>
                        {av?.type === 'faces' && av.faces?.length > 0 && (
                            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 12 }}>CARAS DE EXHIBICIÓN</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {av.faces.map((f: any) => (
                                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: f.occupied ? '#fef2f2' : '#ecfdf5', borderRadius: 8 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{f.name}</span>
                                                {f.occupied && f.end_date && (
                                                    <span style={{ fontSize: 11, color: '#b91c1c' }}><CalendarOutlined style={{ marginRight: 4 }} />Hasta: {dayjs(f.end_date).format('DD/MM/YYYY')}</span>
                                                )}
                                            </div>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: f.occupied ? '#ef4444' : '#10b981' }}>
                                                {f.occupied ? <><CloseCircleOutlined /> ALQUILADA</> : <><CheckCircleOutlined /> DISPONIBLE</>}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {av?.type === 'led' && (
                            <div style={{ background: '#fffbeb', borderRadius: 14, padding: '16px 20px', border: '1px solid #fde68a' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: 1, marginBottom: 8 }}>⚡ PANTALLA LED</div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: '#92400e' }}>Horas operativas</div><div style={{ fontSize: 16, fontWeight: 700, color: '#78350f' }}>{av.operating_hours}hs/día</div></div>
                                    <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: '#92400e' }}>Libre por día</div><div style={{ fontSize: 16, fontWeight: 700, color: '#78350f' }}>{(av.available_day / 60).toFixed(0)} min</div></div>
                                </div>
                                <div style={{ background: '#fef3c7', borderRadius: 6, height: 8, marginTop: 10, overflow: 'hidden' }}>
                                    <div style={{ width: `${av.pct}%`, height: '100%', background: av.pct > 50 ? '#10b981' : av.pct > 0 ? '#f59e0b' : '#ef4444', borderRadius: 6 }} />
                                </div>
                                <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>{av.pct}% disponible</Text>
                            </div>
                        )}
                        <div style={{ background: '#f8fafc', borderRadius: 14, padding: '16px 20px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 12 }}>DATOS DE LA ESTRUCTURA</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {structure.dimensions && (<div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: '#64748b' }}>Dimensiones</span><span style={{ fontSize: 13, fontWeight: 600 }}>{structure.dimensions}</span></div>)}
                                {structure.installation_date && (<div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: '#64748b' }}><CalendarOutlined /> Instalación</span><span style={{ fontSize: 13, fontWeight: 600 }}>{dayjs(structure.installation_date).format('DD/MM/YYYY')}</span></div>)}
                                {structure.location_address && (<div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}><EnvironmentOutlined /> Dirección</span><span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>{structure.location_address}</span></div>)}
                                {hasMap && (<div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: '#64748b' }}>Coordenadas</span><a href={`https://maps.google.com/?q=${lat},${lon}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>Ver en Google Maps ↗</a></div>)}
                            </div>
                        </div>
                    </div>
                    {/* Columna derecha: mapa + reserva */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {hasMap && (
                            <>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1 }}>UBICACIÓN EN MAPA</div>
                                <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', flex: 1, minHeight: 280 }}>
                                    <iframe width="100%" height="100%" style={{ border: 0, display: 'block', minHeight: 280 }} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${lat},${lon}&z=16&output=embed`} />
                                </div>
                            </>
                        )}
                        <div style={{ marginTop: 'auto' }}>
                            {isAvailable ? (
                                <Button type="primary" icon={<CalendarOutlined />} onClick={handleReserve} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '48px', borderRadius: 12, background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}>
                                    Realizar Reserva
                                </Button>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#fef2f2', border: '1px solid #fee2e2', padding: '16px', borderRadius: 14, textAlign: 'center' }}>
                                    <Text strong style={{ color: '#991b1b', fontSize: 14 }}>⚠️ Sin caras disponibles</Text>
                                    <Text style={{ fontSize: 13, color: '#dc2626' }}>Próxima fecha de liberación:<br /><strong>{av?.end_date ? dayjs(av.end_date).format('DD/MM/YYYY') : 'No especificada'}</strong></Text>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                )}

                {activeTab === 'rentabilidad' && (
                <div style={{ padding: '32px 40px' }}>
                    {loadingPL ? (
                        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
                    ) : !plData ? (
                        <Empty description="No se pudieron cargar los datos financieros" />
                    ) : (() => {
                        const ingresos = plData.structRentals.reduce((s: number, r: any) => s + Number(r.price || 0), 0);
                        const costosEstructura = plData.structExp.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
                        const costosTerreno = plData.locExp.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
                        const costosTotales = costosEstructura + costosTerreno;
                        const resultado = ingresos - costosTotales;
                        const margen = ingresos > 0 ? Math.round((resultado / ingresos) * 100) : 0;
                        return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                {/* KPIs */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                                    {[
                                        { label: 'Ingresos Totales', value: `$${ingresos.toLocaleString('es-AR')}`, color: '#10b981', bg: '#ecfdf5', icon: '💰' },
                                        { label: 'Costos Terreno', value: `$${costosTerreno.toLocaleString('es-AR')}`, color: '#ef4444', bg: '#fef2f2', icon: '🏗️' },
                                        { label: 'Costos Estructura', value: `$${costosEstructura.toLocaleString('es-AR')}`, color: '#f59e0b', bg: '#fffbeb', icon: '🔧' },
                                        { label: resultado >= 0 ? 'Ganancia Neta' : 'Pérdida Neta', value: `$${Math.abs(resultado).toLocaleString('es-AR')}`, color: resultado >= 0 ? '#2563eb' : '#dc2626', bg: resultado >= 0 ? '#eff6ff' : '#fef2f2', icon: resultado >= 0 ? '📈' : '📉' },
                                    ].map(kpi => (
                                        <div key={kpi.label} style={{ background: kpi.bg, borderRadius: 16, padding: '20px 18px', border: `1px solid ${kpi.color}20` }}>
                                            <div style={{ fontSize: 20, marginBottom: 6 }}>{kpi.icon}</div>
                                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{kpi.label.toUpperCase()}</div>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Barra de margen */}
                                <div style={{ background: '#f8fafc', borderRadius: 14, padding: '20px 24px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <Text strong>Margen de Rentabilidad</Text>
                                        <Text strong style={{ color: margen >= 0 ? '#10b981' : '#ef4444', fontSize: 18 }}>{margen}%</Text>
                                    </div>
                                    <div style={{ background: '#e2e8f0', borderRadius: 8, height: 12, overflow: 'hidden' }}>
                                        <div style={{ width: `${Math.min(Math.abs(margen), 100)}%`, height: '100%', background: margen >= 50 ? '#10b981' : margen >= 20 ? '#f59e0b' : '#ef4444', borderRadius: 8, transition: 'width .5s' }} />
                                    </div>
                                </div>

                                {/* Detalle por campañas */}
                                {plData.structRentals.length > 0 && (
                                    <div>
                                        <Text strong style={{ display: 'block', marginBottom: 12 }}>Campañas / Alquileres ({plData.structRentals.length})</Text>
                                        <Table dataSource={plData.structRentals} rowKey="id" size="small" pagination={{ pageSize: 4 }} className="premium-table">
                                            <Table.Column dataIndex="client_name" title="Cliente" render={(v: string) => v || '—'} />
                                            <Table.Column dataIndex="campaign_name" title="Campaña" render={(v: string) => v ? <Tag color="orange">{v}</Tag> : '—'} />
                                            <Table.Column title="Período" render={(_: any, r: any) => `${dayjs(r.start_date).format('DD/MM/YY')} → ${dayjs(r.end_date).format('DD/MM/YY')}`} />
                                            <Table.Column dataIndex="price" title="Precio" render={(v: number) => <Text strong style={{ color: '#10b981' }}>${Number(v).toLocaleString('es-AR')}</Text>} />
                                        </Table>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
                )}
            </div>
        </Modal>
    );
}


function StructuresTab({ setActiveOpsTab, setPreselectedFaceId }: { setActiveOpsTab: (tab: any) => void, setPreselectedFaceId: (id: any) => void }) {


    const { result: structuresResult, query: structuresQuery } = useList({
        resource: "structures",
        pagination: { pageSize: 200 },
        sorters: [{ field: "id", order: "desc" }],
    });
    const structures: any[] = structuresResult?.data || [];

    const [modalAction, setModalAction] = React.useState<"create" | "edit">("create");
    const [modalId, setModalId] = React.useState<any>(null);
    const [previewStructure, setPreviewStructure] = React.useState<any>(null);

    // ── Gastos de estructura ──
    const [expensesStructure, setExpensesStructure] = React.useState<any>(null);
    const [structureExpenses, setStructureExpenses] = React.useState<any[]>([]);
    const [loadingStructureExpenses, setLoadingStructureExpenses] = React.useState(false);
    const [structExpFilterType, setStructExpFilterType] = React.useState<string | undefined>(undefined);
    const [structExpFilterStart, setStructExpFilterStart] = React.useState<string | undefined>(undefined);
    const [structExpFilterEnd, setStructExpFilterEnd] = React.useState<string | undefined>(undefined);

    const fetchStructureExpenses = useCallback(async (structureId: number) => {
        setLoadingStructureExpenses(true);
        try {
            const res = await axiosInstance.get(
                `http://localhost:8000/api/v1/space-expenses/?structure=${structureId}&page_size=500`
            );
            const data = res.data;
            setStructureExpenses(Array.isArray(data) ? data : (data.results || data.data || []));
        } catch {
            setStructureExpenses([]);
        } finally {
            setLoadingStructureExpenses(false);
        }
    }, []);

    React.useEffect(() => {
        if (expensesStructure?.id) fetchStructureExpenses(Number(expensesStructure.id));
        else setStructureExpenses([]);
    }, [expensesStructure, fetchStructureExpenses]);

    const { modalProps: structExpModalProps, formProps: structExpFormConfig, show: showStructExpForm } = useModalForm({
        resource: "space-expenses",
        action: "create",
        warnWhenUnsavedChanges: false,
        successNotification: () => {
            if (expensesStructure?.id) fetchStructureExpenses(Number(expensesStructure.id));
            return { message: "Gasto registrado exitosamente", type: "success" };
        }
    });

    const { modalProps, formProps, show } = useModalForm({
        resource: "structures",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: modalAction === "create" ? "Estructura creada" : "Estructura actualizada", type: "success" })
    });
    const { options: locationOptions } = useSelect({ resource: "locations", optionLabel: "name", optionValue: "id" });

    const normFile = (e: any) => Array.isArray(e) ? e : e?.fileList;

    const handleFormFinish = async (values: any) => {
        const hasNewPhoto = values.photo_raw?.length > 0 && values.photo_raw[0]?.originFileObj;
        if (!hasNewPhoto) {
            const { photo_raw, ...submitValues } = values;
            await formProps.onFinish?.(submitValues);
            return;
        }
        const formData = new FormData();
        for (const key in values) {
            if (key === 'photo_raw' || key === 'faces') continue;
            if (values[key] !== undefined && values[key] !== null) {
                formData.append(key, typeof values[key] === 'boolean' ? String(values[key]) : values[key]);
            }
        }
        formData.append('photo', values.photo_raw[0].originFileObj);
        await formProps.onFinish?.(formData as any);
    };

    const TYPE_COLORS: any = { 
        monoposte: 'purple', 
        frontlight: 'cyan', 
        backlight: 'blue',
        pantalla_led: 'orange', 
        medianera: 'volcano', 
        refugio: 'green',
        columna: 'geekblue',
        cartelera_simple: 'magenta',
        otro: 'default' 
    };
    const TYPE_LABELS: any = { 
        monoposte: 'Monoposte', 
        frontlight: 'Frontlight', 
        backlight: 'Backlight',
        pantalla_led: 'Pantalla LED', 
        medianera: 'Medianera', 
        refugio: 'Refugio',
        columna: 'Columna',
        cartelera_simple: 'Cartelera simple',
        otro: 'Otro' 
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Cartelería Física</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setModalAction("create"); setModalId(null); show(); }}
                    style={{ borderRadius: "10px", height: "40px", padding: "0 24px", fontWeight: 700, background: "#2563eb", boxShadow: "0 8px 15px rgba(37,99,235,0.2)", border: "none" }}
                >
                    Nueva Estructura
                </Button>
            </div>

            {structuresQuery.isLoading ? (
                <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
            ) : structures.length === 0 ? (
                <Empty description="Sin estructuras registradas" style={{ padding: 60 }} />
            ) : (
                <Row gutter={[24, 24]}>
                    {structures.map(record => (
                        <Col key={record.id} xs={24} sm={12} md={8} lg={6}>
                            <Card
                                hoverable
                                cover={
                                    record.photo ? (
                                        <div
                                            style={{ position: 'relative', cursor: 'pointer' }}
                                            onClick={() => setPreviewStructure(record)}
                                        >
                                            <img
                                                src={record.photo}
                                                alt={record.name}
                                                style={{ height: 160, objectFit: 'cover', width: '100%', display: 'block' }}
                                            />
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: 'rgba(0,0,0,0)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'background .2s',
                                            }}
                                                className="photo-overlay"
                                            >
                                                <ZoomInOutlined style={{ fontSize: 32, color: '#fff', opacity: 0, transition: 'opacity .2s' }} className="zoom-icon" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                height: 160,
                                                background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexDirection: 'column', gap: 8, cursor: 'pointer',
                                            }}
                                            onClick={() => setPreviewStructure(record)}
                                        >
                                            <CameraOutlined style={{ fontSize: 36, color: '#94a3b8' }} />
                                            <Text type="secondary" style={{ fontSize: 12 }}>Sin foto de instalación</Text>
                                        </div>
                                    )
                                }
                                styles={{ body: { padding: 16 } }}
                                style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}
                            >
                                {/* Header: tipo + estado */}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                    <Tag color={TYPE_COLORS[record.type] || 'blue'} style={{ borderRadius: 10, fontSize: 11 }}>
                                        {TYPE_LABELS[record.type] || record.type}
                                    </Tag>
                                    <Tag color={record.is_active ? 'success' : 'default'} style={{ borderRadius: 10, fontSize: 11 }}>
                                        {record.is_active ? 'INSTALADO' : 'DESMONTADO'}
                                    </Tag>
                                </div>

                                {/* Nombre y ubicación */}
                                <Text strong style={{ display: 'block', fontSize: 15, marginBottom: 2 }}>{record.name}</Text>
                                <Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{record.location_name}</Text>
                                {record.dimensions && (
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>{record.dimensions}</Text>
                                )}

                                {/* Disponibilidad detallada */}
                                {record.is_active && <AvailabilityDetail availability={record.availability} />}

                                {/* Alerta sin OT */}
                                {record.is_active && !record.has_installation_ot && (
                                    <div style={{
                                        background: '#fef3c7', border: '1px solid #fcd34d',
                                        borderRadius: 8, padding: '5px 10px', marginTop: 8,
                                        fontSize: 11, color: '#92400e', display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                        <WarningOutlined /> Sin OT de instalación
                                    </div>
                                )}

                                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ZoomInOutlined />}
                                        onClick={() => setPreviewStructure(record)}
                                        style={{ color: '#2563eb', fontSize: 12 }}
                                    >
                                        Ver detalle
                                    </Button>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <Button
                                            size="small"
                                            icon={<DollarOutlined />}
                                            onClick={(e) => { e.stopPropagation(); setExpensesStructure(record); }}
                                            style={{ color: '#059669', borderColor: '#059669', borderRadius: 8 }}
                                        >
                                            Gastos
                                        </Button>
                                        <Button
                                            type="dashed"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => { setModalAction("edit"); setModalId(record.id); setTimeout(() => show(), 0); }}
                                        >
                                            Editar
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* ── Modal de Detalle de Estructura ── */}
            <StructureDetailModal
                structure={previewStructure}
                onClose={() => setPreviewStructure(null)}
                typeColors={TYPE_COLORS}
                typeLabels={TYPE_LABELS}
                setActiveOpsTab={setActiveOpsTab}
                setPreselectedFaceId={setPreselectedFaceId}
            />

            {/* ── Modal de Gastos de Estructura ── */}
            <Modal
                open={!!expensesStructure}
                onCancel={() => setExpensesStructure(null)}
                footer={null}
                width={1000}
                centered
                styles={{ body: { padding: 24 } }}
                style={{ borderRadius: 20 }}
                title={<Title level={4} style={{ margin: 0, color: '#7c3aed' }}><DollarOutlined /> Gastos de Estructura: {expensesStructure?.name}</Title>}
            >
                {expensesStructure && (() => {
                    const filteredStructExp = structureExpenses.filter((e: any) => {
                        const matchesType = !structExpFilterType || e.expense_type === structExpFilterType;
                        const matchesStart = !structExpFilterStart || e.date >= structExpFilterStart;
                        const matchesEnd = !structExpFilterEnd || e.date <= structExpFilterEnd;
                        return matchesType && matchesStart && matchesEnd;
                    });
                    const EXPENSE_LABELS: Record<string, string> = { instalacion: 'Instalación', mantenimiento: 'Mantenimiento', reparacion: 'Reparación', seguro: 'Seguro', impuesto: 'Impuesto', otro: 'Otro' };
                    const EXPENSE_COLORS: Record<string, string> = { instalacion: 'purple', mantenimiento: 'blue', reparacion: 'volcano', seguro: 'cyan', impuesto: 'orange', otro: 'default' };
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Info del cartel */}
                            <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: 12, padding: '12px 20px', display: 'flex', gap: 24, alignItems: 'center' }}>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>TERRENO</Text>
                                    <div style={{ fontWeight: 700 }}>{expensesStructure.location_name || '—'}</div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>TIPO</Text>
                                    <div style={{ fontWeight: 700 }}>{expensesStructure.type?.toUpperCase() || '—'}</div>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: 11 }}>DIMENSIONES</Text>
                                    <div style={{ fontWeight: 700 }}>{expensesStructure.dimensions || '—'}</div>
                                </div>
                            </div>

                            {/* Filtros */}
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', background: '#f8fafc', padding: '16px 20px', borderRadius: 12, alignItems: 'center' }}>
                                <div style={{ minWidth: 200 }}>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Filtrar por Tipo</Text>
                                    <Select
                                        allowClear
                                        placeholder="Todos los conceptos"
                                        value={structExpFilterType}
                                        onChange={(v) => setStructExpFilterType(v)}
                                        style={{ width: '100%' }}
                                        options={[
                                            { label: 'Instalación inicial', value: 'instalacion' },
                                            { label: 'Mantenimiento', value: 'mantenimiento' },
                                            { label: 'Reparación', value: 'reparacion' },
                                            { label: 'Seguro', value: 'seguro' },
                                            { label: 'Impuesto', value: 'impuesto' },
                                            { label: 'Otro', value: 'otro' },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Desde Fecha</Text>
                                    <Input type="date" value={structExpFilterStart} onChange={(e) => setStructExpFilterStart(e.target.value || undefined)} style={{ width: 180 }} />
                                </div>
                                <div>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Hasta Fecha</Text>
                                    <Input type="date" value={structExpFilterEnd} onChange={(e) => setStructExpFilterEnd(e.target.value || undefined)} style={{ width: 180 }} />
                                </div>
                                <div style={{ alignSelf: 'flex-end', paddingBottom: 2 }}>
                                    <Button type="text" danger onClick={() => { setStructExpFilterType(undefined); setStructExpFilterStart(undefined); setStructExpFilterEnd(undefined); }}>
                                        Limpiar Filtros
                                    </Button>
                                </div>
                            </div>

                            {/* Header financiero + botones */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <Text type="secondary">Inversión total en esta estructura</Text>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>
                                        ${filteredStructExp.reduce((acc: number, cur: any) => acc + Number(cur.amount), 0).toLocaleString('es-AR')}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <Button
                                        icon={<UploadOutlined />}
                                        onClick={() => {
                                            const csvContent = "data:text/csv;charset=utf-8,"
                                                + "Fecha,Tipo,Monto,Descripcion\n"
                                                + filteredStructExp.map((e: any) => `${e.date},${e.expense_type},${e.amount},"${e.description || ''}"`).join("\n");
                                            const link = document.createElement("a");
                                            link.setAttribute("href", encodeURI(csvContent));
                                            link.setAttribute("download", `gastos_estructura_${expensesStructure.name.replace(/\s+/g, '_')}.csv`);
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                    >
                                        Exportar CSV
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        style={{ background: '#7c3aed', border: 'none' }}
                                        onClick={() => {
                                            showStructExpForm();
                                            setTimeout(() => {
                                                structExpFormConfig.form?.setFieldsValue({
                                                    date: dayjs().format('YYYY-MM-DD'),
                                                    expense_type: 'instalacion',
                                                });
                                            }, 150);
                                        }}
                                    >
                                        Registrar Gasto
                                    </Button>
                                </div>
                            </div>

                            {/* Tabla */}
                            {loadingStructureExpenses ? (
                                <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                            ) : filteredStructExp.length === 0 ? (
                                <Empty description="No se han registrado gastos para esta estructura" />
                            ) : (
                                <Table dataSource={filteredStructExp} rowKey="id" pagination={{ pageSize: 6 }} size="small" className="premium-table">
                                    <Table.Column dataIndex="date" title="Fecha" render={(v) => dayjs(v).format('DD/MM/YYYY')} />
                                    <Table.Column dataIndex="expense_type" title="Tipo" render={(v: string) => (
                                        <Tag color={EXPENSE_COLORS[v] || 'default'}>{EXPENSE_LABELS[v] || v}</Tag>
                                    )} />
                                    <Table.Column dataIndex="amount" title="Monto" render={(v) => `$${Number(v).toLocaleString('es-AR')}`} />
                                    <Table.Column dataIndex="description" title="Descripción" ellipsis />
                                </Table>
                            )}
                        </div>
                    );
                })()}
            </Modal>

            <Modal 
                {...structExpModalProps} 
                title={<b>Registrar Gasto de Estructura</b>} 
                width={600} 
                centered 
                zIndex={1100}
                onCancel={() => {
                    if (structExpFormConfig.form?.isFieldsTouched()) {
                        Modal.confirm({
                            title: '¿Cerrar formulario?',
                            icon: <WarningOutlined style={{ color: '#faad14' }} />,
                            content: 'Tenés cambios sin guardar que se van a perder.',
                            okText: 'Sí, salir',
                            cancelText: 'No, quedarme',
                            okButtonProps: { danger: true },
                            onOk: () => {
                                (structExpModalProps.onCancel as any)?.();
                            }
                        });
                    } else {
                        (structExpModalProps.onCancel as any)?.();
                    }
                }}
            >
                <Form
                    {...structExpFormConfig}
                    layout="vertical"
                    onFinish={(values) => {
                        (structExpFormConfig.onFinish as any)?.({
                            ...values,
                            structure: expensesStructure?.id ? Number(expensesStructure.id) : undefined,
                        });
                    }}
                >
                    <Form.Item label="Tipo de Gasto" name="expense_type" rules={[{ required: true }]}>
                        <Select options={[
                            { label: 'Instalación inicial', value: 'instalacion' },
                            { label: 'Mantenimiento', value: 'mantenimiento' },
                            { label: 'Reparación', value: 'reparacion' },
                            { label: 'Seguro', value: 'seguro' },
                            { label: 'Impuesto', value: 'impuesto' },
                            { label: 'Otro', value: 'otro' },
                        ]} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Monto" name="amount" rules={[{ required: true }]}>
                                <InputNumber prefix="$" style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Fecha" name="date" rules={[{ required: true }]}>
                                <Input type="date" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Descripción / Observación" name="description">
                        <Input.TextArea rows={3} placeholder="Ej: Instalación inicial monoposte, pintura estructural..." />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal {...modalProps} title={<b>{modalAction === "create" ? "Registrar Estructura" : "Editar Estructura"}</b>} width={700} centered>
                <Form {...formProps} layout="vertical" onFinish={handleFormFinish}>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item label="Identificador" name="name" rules={[{ required: true }]}><Input placeholder="Ej: Monoposte Mitre" size="large" /></Form.Item></Col>
                        <Col span={12}><Form.Item label="Terreno" name="location" rules={[{ required: true }]}><Select options={locationOptions} placeholder="Seleccionar" size="large" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Tipo" name="type" initialValue="monoposte">
                                <Select size="large" options={[
                                    { label: 'Monoposte', value: 'monoposte' },
                                    { label: 'Frontlight', value: 'frontlight' },
                                    { label: 'Backlight', value: 'backlight' },
                                    { label: 'Pantalla LED', value: 'pantalla_led' },
                                    { label: 'Medianera', value: 'medianera' },
                                    { label: 'Refugio', value: 'refugio' },
                                    { label: 'Columna', value: 'columna' },
                                    { label: 'Cartelera simple', value: 'cartelera_simple' },
                                    { label: 'Otro', value: 'otro' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}><Form.Item label="Dimensiones" name="dimensions"><Input placeholder="Ej: 4x3m" size="large" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Fecha Instalación" name="installation_date"><Input type="date" size="large" style={{ width: '100%' }} /></Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Estado" name="is_active" initialValue={true}>
                                <Select size="large" options={[{ label: 'Instalado', value: true }, { label: 'Desmontado', value: false }]} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
                        {({ getFieldValue }) => getFieldValue('type') === 'pantalla_led' && (
                            <Card size="small" style={{ background: '#f8fafc', borderRadius: 12, marginBottom: 16 }}
                                title={<span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>⚡ Configuración LED</span>}>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Horas operativas por día"
                                            name="led_operating_hours"
                                            initialValue={24}
                                            help="Cuántas horas por día está encendida (ej: 18 = 6am a medianoche)"
                                        >
                                            <InputNumber size="large" style={{ width: '100%' }} min={1} max={24} addonAfter="hs/día" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label="Segundos vendibles por hora"
                                            name="led_total_seconds_per_hour"
                                            initialValue={3600}
                                            help="3600 = 100% de la hora. Bajá si dejás pausas entre spots"
                                        >
                                            <InputNumber size="large" style={{ width: '100%' }} min={1} max={3600} addonAfter="seg/h" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>
                        )}
                    </Form.Item>

                    {modalAction === "edit" && (
                        <Form.Item
                            label="Foto Post-Instalación"
                            name="photo_raw"
                            valuePropName="fileList"
                            getValueFromEvent={normFile}
                            help="Subí la foto del cartel ya instalado en el terreno"
                        >
                            <Upload beforeUpload={() => false} maxCount={1} accept="image/*" listType="picture">
                                <Button icon={<CameraOutlined />} size="large">Seleccionar Foto</Button>
                            </Upload>
                        </Form.Item>
                    )}

                    {modalAction === "create" && (
                        <Card size="small" title="Caras de Exhibición" variant="borderless" style={{ background: '#f8fafc', marginBottom: 16, borderRadius: 12 }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                                Agregá las caras comercializables. Si no agregás ninguna se creará una por defecto.
                            </Text>
                            <Form.List name="faces">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: 'Falta el nombre' }]} style={{ marginBottom: 0 }}>
                                                    <Input placeholder="Ej: Norte" size="large" />
                                                </Form.Item>
                                                <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', fontSize: '18px', cursor: 'pointer' }} />
                                            </Space>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} style={{ marginTop: 12 }}>
                                            Agregar Cara
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </Card>
                    )}
                </Form>
            </Modal>
        </div>
    );
}

function ContractsTab() {
    const { tableProps } = useTable({ resource: "locations", syncWithLocation: false, pagination: { pageSize: 1000 } });
    const [filterStatus, setFilterStatus] = React.useState('all');
    const [searchName, setSearchName] = React.useState('');

    const { modalProps, formProps, show } = useModalForm({
        resource: "locations",
        action: "edit",
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: "Alertas configuradas", type: "success" })
    });

    const openAlertsModal = (record: any) => {
        show(record.id);
    };

    let filteredData = tableProps.dataSource || [];

    if (searchName) {
        filteredData = filteredData.filter(record => record.name?.toLowerCase().includes(searchName.toLowerCase()));
    }

    if (filterStatus !== 'all') {
        filteredData = filteredData.filter(record => {
            if (!record.contract_end_date) return filterStatus === 'no_contract';
            const daysLeft = dayjs(record.contract_end_date).diff(dayjs(), 'day');
            if (filterStatus === 'expired') return daysLeft < 0;
            if (filterStatus === 'warning') return daysLeft >= 0 && daysLeft <= 30;
            if (filterStatus === 'ok') return daysLeft > 30;
            return true;
        });
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Vencimientos de Contratos (Terrenos)</Title>
                <div style={{ display: 'flex', gap: 16 }}>
                    <Input
                        placeholder="Buscar por nombre..."
                        prefix={<SearchOutlined />}
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        style={{ width: 240, borderRadius: 10 }}
                        size="large"
                        allowClear
                    />
                    <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        size="large"
                        style={{ width: 240 }}
                        options={[
                            { label: 'Todos los Terrenos', value: 'all' },
                            { label: 'Vencidos', value: 'expired' },
                            { label: 'Vencen en menos de 30 días', value: 'warning' },
                            { label: 'Contrato Vigente (>30 días)', value: 'ok' },
                            { label: 'Sin Contrato', value: 'no_contract' },
                        ]}
                    />
                </div>
            </div>
            <Table {...tableProps} dataSource={filteredData} rowKey="id" className="premium-table">
                <Table.Column dataIndex="name" title="Terreno" render={(val) => <Text strong>{val}</Text>} />
                <Table.Column dataIndex="landlord_name" title="Propietario" render={(val) => val || <Text type="secondary">N/A</Text>} />
                <Table.Column dataIndex="contract_end_date" title="Vencimiento" render={(val) => {
                    if (!val) return <Text type="secondary">Sin contrato</Text>;
                    const daysLeft = dayjs(val).diff(dayjs(), 'day');
                    if (daysLeft < 0) return <Tag color="error">Vencido hace {-daysLeft} días</Tag>;
                    if (daysLeft < 30) return <Tag color="warning">Vence en {daysLeft} días</Tag>;
                    return <Tag color="success">Vence en {daysLeft} días</Tag>;
                }} />
                <Table.Column dataIndex="rent_amount" title="Monto" render={(val) => val ? `$${val}` : '-'} />
                <Table.Column dataIndex="expiration_alert_active" title="Alertas" render={(val, record: any) => (
                    val ? <Text type="success">Sí ({record.expiration_alert_days_before}d / cada {record.expiration_alert_frequency}d)</Text> : <Text type="secondary">Desactivadas</Text>
                )} />
                <Table.Column title="Acciones" render={(_, record: any) => (
                    <Button type="dashed" size="small" onClick={() => openAlertsModal(record)}>Configurar Alerta</Button>
                )} />
            </Table>

            <Modal {...modalProps} title={<b>Configurar Alertas de Vencimiento</b>} width={500} centered>
                <Form {...formProps} layout="vertical">
                    <Form.Item label="Activar Alertas para este Terreno" name="expiration_alert_active">
                        <Select size="large" options={[{ label: 'Sí, enviar alertas', value: true }, { label: 'No, desactivar', value: false }]} />
                    </Form.Item>
                    <Form.Item label="¿Cuántos días antes del vencimiento empezamos a avisar?" name="expiration_alert_days_before" help="Ejemplo: 30 días">
                        <InputNumber size="large" style={{ width: '100%' }} min={1} />
                    </Form.Item>
                    <Form.Item label="Frecuencia de aviso" name="expiration_alert_frequency" help="Ejemplo: Avisar cada 7 días">
                        <InputNumber size="large" style={{ width: '100%' }} min={1} addonAfter="días" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

function LandlordsTab() {
    const { tableProps } = useTable({ resource: "landlords", syncWithLocation: false });
    const [modalAction, setModalAction] = React.useState<"create" | "edit">("create");
    const [modalId, setModalId] = React.useState<any>(null);
    const [searchQuery, setSearchQuery] = React.useState('');

    const { modalProps, formProps, show } = useModalForm({
        resource: "landlords",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: modalAction === "create" ? "Propietario creado" : "Propietario actualizado", type: "success" })
    });

    let filteredLandlords = tableProps.dataSource || [];
    if (searchQuery) {
        filteredLandlords = filteredLandlords.filter((l: any) => {
            const matchName = l.name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchEmail = l.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchPhone = l.phone?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchName || matchEmail || matchPhone;
        });
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Cartera de Propietarios</Title>
                <div style={{ display: 'flex', gap: 16 }}>
                    <Input
                        placeholder="Buscar por nombre, mail o tel..."
                        prefix={<SearchOutlined />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: 280, borderRadius: 10 }}
                        size="large"
                        allowClear
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => { setModalAction("create"); setModalId(null); show(); }}
                        style={{ borderRadius: "10px", height: "40px", padding: "0 24px", fontWeight: 700, background: "#2563eb", boxShadow: "0 8px 15px rgba(37,99,235,0.2)", border: "none" }}
                    >
                        Nuevo Propietario
                    </Button>
                </div>
            </div>
            <Table {...tableProps} dataSource={filteredLandlords} rowKey="id" className="premium-table">
                <Table.Column dataIndex="name" title="Nombre / Razón Social" render={(val) => <Text strong>{val}</Text>} />
                <Table.Column dataIndex="email" title="Email" />
                <Table.Column dataIndex="phone" title="Teléfono" />
                <Table.Column dataIndex="cuit" title="CUIT/CUIL" />
                <Table.Column title="" width={70} render={(_: any, record: any) => (
                    <Button type="dashed" size="small" icon={<EditOutlined />}
                        onClick={() => { setModalAction("edit"); setModalId(record.id); setTimeout(() => show(), 0); }} />
                )} />
            </Table>

            <Modal {...modalProps} title={<b>{modalAction === "create" ? "Registrar Propietario" : "Editar Propietario"}</b>} centered>
                <Form {...formProps} layout="vertical">
                    <Form.Item label="Nombre Completo / Razón Social" name="name" rules={[{ required: true }]}><Input size="large" /></Form.Item>
                    <Form.Item label="Email" name="email"><Input type="email" size="large" /></Form.Item>
                    <Form.Item label="Teléfono" name="phone"><Input size="large" /></Form.Item>
                    <Form.Item label="CUIT/CUIL" name="cuit"><Input size="large" /></Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

function RentalsTab({ preselectedFaceId, setPreselectedFaceId }: { preselectedFaceId: any, setPreselectedFaceId: (id: any) => void }) {
    const { tableProps } = useTable({ resource: "space-rentals", syncWithLocation: false });
    const [modalAction, setModalAction] = React.useState<"create" | "edit">("create");
    const [modalId, setModalId] = React.useState<any>(null);

    const { modalProps, formProps, show } = useModalForm({
        resource: "space-rentals",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: modalAction === "create" ? "Reserva creada" : "Reserva actualizada", type: "success" })
    });

    React.useEffect(() => {
        if (preselectedFaceId) {
            setModalAction("create");
            setModalId(null);
            show();
            setTimeout(() => {
                formProps.form?.setFieldsValue({ face: preselectedFaceId });
            }, 300);
            setPreselectedFaceId(null);
        }
    }, [preselectedFaceId]);

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
                <Title level={4} style={{ margin: 0 }}>Reservas Comerciales</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setModalAction("create"); setModalId(null); show(); }}
                    style={{ borderRadius: "10px", height: "40px", padding: "0 24px", fontWeight: 700, background: "#2563eb", boxShadow: "0 8px 15px rgba(37,99,235,0.2)", border: "none" }}
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
                    style={{ borderRadius: "10px", height: "40px", padding: "0 24px", fontWeight: 700, background: "#2563eb", boxShadow: "0 8px 15px rgba(37,99,235,0.2)", border: "none" }}
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
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Franja desde (hora)" name="hour_from" help="Ej: 18 para prime time. Vacío = toda la jornada">
                                <InputNumber size="large" style={{ width: '100%' }} min={0} max={23} placeholder="0–23" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Franja hasta (hora)" name="hour_to" help="Ej: 24 = hasta medianoche (exclusivo). Vacío = toda la jornada">
                                <InputNumber size="large" style={{ width: '100%' }} min={0} max={24} placeholder="0–24" />
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

const EXPENSE_TYPE_LABELS: Record<string, string> = {
    alquiler: 'Alquiler Terreno',
    luz: 'Luz / Energía',
    seguro: 'Seguro',
    impuesto: 'Impuesto Municipal',
    mantenimiento: 'Mantenimiento / Reparación',
    otro: 'Otro',
};

const EXPENSE_TYPE_COLORS: Record<string, string> = {
    alquiler: 'blue',
    luz: 'gold',
    seguro: 'purple',
    impuesto: 'red',
    mantenimiento: 'orange',
    otro: 'default',
};

const RENT_PERIOD_LABELS: Record<string, string> = {
    mensual: 'mensual', bimestral: 'bimestral', semestral: 'semestral',
    anual: 'anual', por_contrato: 'pago único por contrato',
};

function GastosTab() {
    const { tableProps, setFilters } = useTable({
        resource: "space-expenses",
        syncWithLocation: false,
        pagination: { pageSize: 50 },
        sorters: { initial: [{ field: "date", order: "desc" }] },
    });

    const [modalAction, setModalAction] = React.useState<"create" | "edit">("create");
    const [modalId, setModalId] = React.useState<any>(null);
    const [filterLocation, setFilterLocation] = React.useState<any>(null);
    const [filterType, setFilterType] = React.useState<any>(null);

    const { modalProps, formProps, show } = useModalForm({
        resource: "space-expenses",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: modalAction === "create" ? "Gasto registrado" : "Gasto actualizado", type: "success" as const }),
    });

    const { options: locationOptions } = useSelect({ resource: "locations", optionLabel: "name", optionValue: "id", pagination: { pageSize: 200 } });
    const { options: structureOptions } = useSelect({ resource: "structures", optionLabel: "name", optionValue: "id", pagination: { pageSize: 200 } });

    // Datos completos de terrenos para auto-completar monto de alquiler
    const { result: locationsListResult } = useList({ resource: "locations", pagination: { pageSize: 200 } });
    const allLocations: any[] = locationsListResult?.data || [];

    // Observamos los campos del form para auto-completar
    const watchedExpType = Form.useWatch('expense_type', formProps.form);
    const watchedLocId   = Form.useWatch('location', formProps.form);

    React.useEffect(() => {
        if (watchedExpType !== 'alquiler' || !watchedLocId) return;
        const loc = allLocations.find((l: any) => l.id === watchedLocId);
        if (!loc) return;
        formProps.form?.setFieldsValue({ amount: Number(loc.rent_amount) });
        if (loc.rent_period === 'por_contrato') {
            formProps.form?.setFieldsValue({
                period_from: loc.contract_start_date || undefined,
                period_to:   loc.contract_end_date   || undefined,
            });
        }
    }, [watchedExpType, watchedLocId]);

    const selectedLoc = allLocations.find((l: any) => l.id === watchedLocId);
    const showRentHint = watchedExpType === 'alquiler' && selectedLoc;
    const isContrato   = selectedLoc?.rent_period === 'por_contrato';

    const handleFilterLocation = (val: any) => {
        setFilterLocation(val);
        setFilters(val ? [{ field: "location", operator: "eq", value: val }] : []);
    };
    const handleFilterType = (val: any) => {
        setFilterType(val);
        setFilters(val ? [{ field: "expense_type", operator: "eq", value: val }] : []);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Gastos de Vía Pública</Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>Alquiler, luz, seguros, impuestos y mantenimiento por terreno o estructura</Text>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setModalAction("create"); setModalId(null); show(); }}
                    style={{ borderRadius: 10, height: 40, padding: "0 24px", fontWeight: 700, background: "#2563eb", border: "none", boxShadow: "0 8px 15px rgba(37,99,235,0.2)" }}
                >
                    Registrar Gasto
                </Button>
            </div>

            {/* Filtros */}
            <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={10}>
                    <Select allowClear showSearch optionFilterProp="label" placeholder="Filtrar por terreno"
                        options={locationOptions} value={filterLocation} onChange={handleFilterLocation}
                        style={{ width: '100%' }} size="large" />
                </Col>
                <Col span={8}>
                    <Select allowClear placeholder="Filtrar por tipo" value={filterType} onChange={handleFilterType}
                        style={{ width: '100%' }} size="large"
                        options={Object.entries(EXPENSE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                </Col>
            </Row>

            {/* Tabla */}
            <Table {...tableProps} rowKey="id" className="premium-table">
                <Table.Column dataIndex="expense_type" title="Tipo" render={(v: string) => (
                    <Tag color={EXPENSE_TYPE_COLORS[v] || 'default'} style={{ borderRadius: 10 }}>
                        {EXPENSE_TYPE_LABELS[v] || v}
                    </Tag>
                )} />
                <Table.Column title="Terreno / Estructura" render={(_: any, r: any) => (
                    <div>
                        {r.location_name && <Text style={{ display: 'block', fontSize: 13 }}><EnvironmentOutlined style={{ marginRight: 4 }} />{r.location_name}</Text>}
                        {r.structure_name && <Text type="secondary" style={{ display: 'block', fontSize: 12 }}><BuildOutlined style={{ marginRight: 4 }} />{r.structure_name}</Text>}
                        {!r.location_name && !r.structure_name && <Text type="secondary">—</Text>}
                    </div>
                )} />
                <Table.Column title="Período que cubre" render={(_: any, r: any) => (
                    r.period_from
                        ? <Text style={{ fontSize: 12 }}>{dayjs(r.period_from).format("DD/MM/YYYY")} → {r.period_to ? dayjs(r.period_to).format("DD/MM/YYYY") : '...'}</Text>
                        : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                )} />
                <Table.Column dataIndex="date" title="Fecha pago" width={110} render={(v: string) => v ? dayjs(v).format("DD/MM/YYYY") : '—'} />
                <Table.Column dataIndex="amount" title="Monto" width={130} render={(v: number) => (
                    <Text strong style={{ color: '#ef4444' }}>-${Number(v).toLocaleString('es-AR')}</Text>
                )} />
                <Table.Column dataIndex="description" title="Descripción" render={(v: string) => v ? <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> : null} />
                <Table.Column title="" width={70} render={(_: any, record: any) => (
                    <Button type="dashed" size="small" icon={<EditOutlined />}
                        onClick={() => { setModalAction("edit"); setModalId(record.id); setTimeout(() => show(), 0); }} />
                )} />
            </Table>

            {/* Modal crear/editar gasto */}
            <Modal {...modalProps} title={<b>{modalAction === "create" ? "Registrar Gasto" : "Editar Gasto"}</b>} width={620} centered>
                <Form {...formProps} layout="vertical">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Tipo de Gasto" name="expense_type" rules={[{ required: true }]}>
                                <Select size="large" options={Object.entries(EXPENSE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Terreno (si aplica)" name="location">
                                <Select size="large" options={locationOptions} placeholder="Seleccionar..." allowClear showSearch optionFilterProp="label" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Hint alquiler: monto pre-cargado desde el contrato */}
                    {showRentHint && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#92400e' }}>
                            Monto cargado desde el contrato del terreno: <strong>${Number(selectedLoc.rent_amount).toLocaleString('es-AR')} {RENT_PERIOD_LABELS[selectedLoc.rent_period] || selectedLoc.rent_period}</strong>.
                            {' '}Si el importe cambió, modificalo acá y después actualizalo en el terreno.
                            {isContrato && selectedLoc.contract_start_date && (
                                <span> · Período del contrato auto-cargado.</span>
                            )}
                        </div>
                    )}

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Monto" name="amount" rules={[{ required: true }]}>
                                <InputNumber prefix="$" size="large" style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Estructura (si aplica)" name="structure">
                                <Select size="large" options={structureOptions} placeholder="Seleccionar..." allowClear showSearch optionFilterProp="label" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item label="Fecha de pago" name="date" rules={[{ required: true }]}>
                                <Input type="date" size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Período desde" name="period_from"
                                help={isContrato ? "Auto-cargado del contrato, podés modificarlo" : "Ej: 01/01/2026"}>
                                <Input type="date" size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="Período hasta" name="period_to"
                                help={isContrato ? "Auto-cargado del contrato, podés modificarlo" : "Ej: 31/01/2026"}>
                                <Input type="date" size="large" style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Descripción / Referencia" name="description">
                        <Input.TextArea rows={2} placeholder="Ej: Factura EDESUR Enero 2026, Póliza seguro anual..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
