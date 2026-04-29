"use client";

import React from "react";
import { Tabs, Card, Table, Typography, Tag, Button, Modal, Form, Input, InputNumber, Select, Row, Col, Space, Upload, notification, Spin, Empty } from "antd";
import { EnvironmentOutlined, BuildOutlined, DollarOutlined, UserOutlined, PlusOutlined, MinusCircleOutlined, UploadOutlined, EditOutlined, SwapOutlined, CameraOutlined, WarningOutlined, ThunderboltOutlined, FileTextOutlined, ZoomInOutlined, CalendarOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useSelect, useList } from "@refinedev/core";
import { useModalForm, useTable } from "@refinedev/antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function SpacesHubPage() {
    return (
        <div style={{ padding: "32px", background: "#f1f5f9", minHeight: "100vh" }}>

            {/* ── Header Premium ────────────────────────────────────────── */}
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
                        width: "64px",
                        height: "64px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(10px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "32px",
                        border: "1px solid rgba(255,255,255,0.2)"
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

            <Card
                variant="borderless"
                style={{
                    borderRadius: "24px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
                    overflow: "hidden"
                }}
                styles={{ body: { padding: 0 } }}
            >
                <Tabs
                    defaultActiveKey="1"
                    centered
                    size="large"
                    tabBarStyle={{ padding: "16px 24px 0", background: "#fff", borderBottom: "1px solid #f1f5f9", marginBottom: 0 }}
                    items={[
                        { key: "1", label: <span style={{ fontWeight: 600 }}><EnvironmentOutlined /> Terrenos</span>, children: <div style={{ padding: "32px" }}><LocationsTab /></div> },
                        { key: "2", label: <span style={{ fontWeight: 600 }}><BuildOutlined /> Estructuras</span>, children: <div style={{ padding: "32px" }}><StructuresTab /></div> },
                        { key: "3", label: <span style={{ fontWeight: 600 }}><SwapOutlined /> Reservas</span>, children: <div style={{ padding: "32px" }}><RentalsTab /></div> },
                        { key: "6", label: <span style={{ fontWeight: 600 }}><ThunderboltOutlined /> Slots LED</span>, children: <div style={{ padding: "32px" }}><LEDSlotsTab /></div> },
                        { key: "7", label: <span style={{ fontWeight: 600 }}><FileTextOutlined /> Gastos</span>, children: <div style={{ padding: "32px" }}><GastosTab /></div> },
                        { key: "4", label: <span style={{ fontWeight: 600 }}><DollarOutlined /> Contratos</span>, children: <div style={{ padding: "32px" }}><ContractsTab /></div> },
                        { key: "5", label: <span style={{ fontWeight: 600 }}><UserOutlined /> Propietarios</span>, children: <div style={{ padding: "32px" }}><LandlordsTab /></div> },
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
            <Table {...tableProps} rowKey="id" className="premium-table">
                <Table.Column dataIndex="name" title="Nombre / Referencia" render={(val) => <Text strong>{val}</Text>} />
                <Table.Column dataIndex="address" title="Dirección" />
                <Table.Column dataIndex="locality" title="Localidad" render={(val) => val || <Text type="secondary">-</Text>} />
                <Table.Column dataIndex="landlord_name" title="Propietario" render={(val) => val || <Text type="secondary">N/A</Text>} />
                <Table.Column dataIndex="rent_amount" title="Alquiler" render={(val) => val ? `$${val}` : '-'} />
                <Table.Column dataIndex="rent_period" title="Periodo" render={(val) => {
                    const colors: any = { mensual: 'blue', bimestral: 'cyan', semestral: 'purple', anual: 'gold', por_contrato: 'magenta' };
                    return val ? <Tag color={colors[val] || 'default'} style={{ borderRadius: '12px', padding: '2px 12px' }}>{val.replace('_', ' ').toUpperCase()}</Tag> : null;
                }} />
                <Table.Column title="Contrato PDF" render={(_, record: any) => {
                    if (record.contract_file) {
                        return <a href={record.contract_file} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}><UploadOutlined /> Ver PDF</a>;
                    }
                    return <Text type="secondary">-</Text>;
                }} />
                <Table.Column title="Mapa" render={(_, record: any) => {
                    if (record.latitude && record.longitude) {
                        return <a href={`https://maps.google.com/?q=${record.latitude},${record.longitude}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600 }}><EnvironmentOutlined /> Ver Maps</a>;
                    }
                    return <Text type="secondary">Sin coords</Text>;
                }} />
                <Table.Column dataIndex="is_active" title="Estado" render={(val) => val ? <Tag color="success" style={{ borderRadius: '12px', padding: '2px 12px' }}>ACTIVO</Tag> : <Tag color="default" style={{ borderRadius: '12px' }}>INACTIVO</Tag>} />
                <Table.Column title="Acciones" render={(_, record: any) => (
                    <Button type="dashed" size="small" icon={<EditOutlined />} onClick={() => { setModalAction("edit"); setModalId(record.id); setTimeout(() => show(), 0); }}>Editar</Button>
                )} />
            </Table>

            <Modal {...modalProps} title={<b>{modalAction === "create" ? "Registrar Nuevo Terreno" : "Editar Terreno"}</b>} width={700} centered>
                <Form {...formProps} layout="vertical" onFinish={handleFormFinish}>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item label="Nombre Referencia" name="name" rules={[{ required: true }]}><Input placeholder="Ej: Esquina Mitre y San Martín" size="large" /></Form.Item></Col>
                        <Col span={12}>
                            <Form.Item label="Propietario" name="landlord">
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Select options={landlordOptions} placeholder="Seleccionar" allowClear showSearch optionFilterProp="label" style={{ flex: 1 }} size="large" />
                                    <Button icon={<PlusOutlined />} onClick={() => showLandlord()} title="Agregar propietario" size="large" />
                                </div>
                            </Form.Item>
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
}: {
    structure: any;
    onClose: () => void;
    typeColors: Record<string, string>;
    typeLabels: Record<string, string>;
}) {
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

    return (
        <Modal
            open={!!structure}
            onCancel={onClose}
            footer={null}
            width={860}
            centered
            styles={{ body: { padding: 0 } }}
            style={{ borderRadius: 20, overflow: 'hidden' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column' }}>

                {/* ── Foto banner ── */}
                <div style={{ position: 'relative', height: 280, background: '#0f172a', overflow: 'hidden' }}>
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
                        <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                            {structure.name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 4 }}>
                            <EnvironmentOutlined style={{ marginRight: 6 }} />
                            {structure.location_name}
                            {structure.location_locality ? ` — ${structure.location_locality}` : ''}
                        </div>
                    </div>
                </div>

                {/* ── Cuerpo con info + mapa ── */}
                <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: hasMap ? '1fr 1fr' : '1fr', gap: 24 }}>

                    {/* Columna izquierda: info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Estado de alquiler */}
                        <div style={{
                            background: rentalStatus.bg,
                            borderRadius: 14,
                            padding: '14px 18px',
                            border: `1px solid ${rentalStatus.color}30`,
                        }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 6 }}>
                                ESTADO DE ALQUILER
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: rentalStatus.color }}>
                                {rentalStatus.label}
                            </div>
                        </div>

                        {/* Caras (si aplica) */}
                        {av?.type === 'faces' && av.faces?.length > 0 && (
                            <div style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 18px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 10 }}>
                                    CARAS DE EXHIBICIÓN
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {av.faces.map((f: any) => (
                                        <div key={f.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '6px 10px',
                                            background: f.occupied ? '#fef2f2' : '#ecfdf5',
                                            borderRadius: 8,
                                        }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{f.name}</span>
                                            <span style={{
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                fontSize: 11, fontWeight: 700,
                                                color: f.occupied ? '#ef4444' : '#10b981',
                                            }}>
                                                {f.occupied
                                                    ? <><CloseCircleOutlined /> ALQUILADA</>
                                                    : <><CheckCircleOutlined /> DISPONIBLE</>
                                                }
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* LED info */}
                        {av?.type === 'led' && (
                            <div style={{ background: '#fffbeb', borderRadius: 14, padding: '14px 18px', border: '1px solid #fde68a' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: 1, marginBottom: 8 }}>
                                    ⚡ PANTALLA LED
                                </div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, color: '#92400e' }}>Horas operativas</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#78350f' }}>{av.operating_hours}hs/día</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 11, color: '#92400e' }}>Libre por día</div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#78350f' }}>{(av.available_day / 60).toFixed(0)} min</div>
                                    </div>
                                </div>
                                <div style={{ background: '#fef3c7', borderRadius: 6, height: 8, marginTop: 10, overflow: 'hidden' }}>
                                    <div style={{ width: `${av.pct}%`, height: '100%', background: av.pct > 50 ? '#10b981' : av.pct > 0 ? '#f59e0b' : '#ef4444', borderRadius: 6, transition: 'width .3s' }} />
                                </div>
                                <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>{av.pct}% disponible</Text>
                            </div>
                        )}

                        {/* Datos del cartel */}
                        <div style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 18px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 10 }}>
                                DATOS DE LA ESTRUCTURA
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {structure.dimensions && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, color: '#64748b' }}>Dimensiones</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{structure.dimensions}</span>
                                    </div>
                                )}
                                {structure.installation_date && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, color: '#64748b' }}><CalendarOutlined /> Instalación</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{dayjs(structure.installation_date).format('DD/MM/YYYY')}</span>
                                    </div>
                                )}
                                {structure.location_address && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                        <span style={{ fontSize: 13, color: '#64748b', whiteSpace: 'nowrap' }}><EnvironmentOutlined /> Dirección</span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>{structure.location_address}</span>
                                    </div>
                                )}
                                {hasMap && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 13, color: '#64748b' }}>Coordenadas</span>
                                        <a
                                            href={`https://maps.google.com/?q=${lat},${lon}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}
                                        >
                                            Ver en Google Maps ↗
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha: mapa */}
                    {hasMap && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1 }}>
                                UBICACIÓN EN MAPA
                            </div>
                            <div style={{
                                borderRadius: 14,
                                overflow: 'hidden',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                                flex: 1,
                                minHeight: 260,
                            }}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, display: 'block', minHeight: 260 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${lat},${lon}&z=16&output=embed`}
                                />
                            </div>
                            <a
                                href={`https://maps.google.com/?q=${lat},${lon}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'block', textAlign: 'center',
                                    padding: '8px 0',
                                    borderRadius: 10,
                                    background: '#2563eb',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 13,
                                    textDecoration: 'none',
                                }}
                            >
                                <EnvironmentOutlined style={{ marginRight: 6 }} />
                                Abrir en Google Maps
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

function StructuresTab() {

    const { result: structuresResult, query: structuresQuery } = useList({
        resource: "structures",
        pagination: { pageSize: 200 },
        sorters: [{ field: "id", order: "desc" }],
    });
    const structures: any[] = structuresResult?.data || [];

    const [modalAction, setModalAction] = React.useState<"create" | "edit">("create");
    const [modalId, setModalId] = React.useState<any>(null);
    const [previewStructure, setPreviewStructure] = React.useState<any>(null);

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

                                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<ZoomInOutlined />}
                                        onClick={() => setPreviewStructure(record)}
                                        style={{ color: '#2563eb', fontSize: 12 }}
                                    >
                                        Ver detalle
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
            />

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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Vencimientos de Contratos (Terrenos)</Title>
                <Select
                    value={filterStatus}
                    onChange={setFilterStatus}
                    size="large"
                    style={{ width: 220 }}
                    options={[
                        { label: 'Todos los Terrenos', value: 'all' },
                        { label: 'Vencidos', value: 'expired' },
                        { label: 'Vencen en menos de 30 días', value: 'warning' },
                        { label: 'Contrato Vigente (>30 días)', value: 'ok' },
                        { label: 'Sin Contrato', value: 'no_contract' },
                    ]}
                />
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

    const { modalProps, formProps, show } = useModalForm({
        resource: "landlords",
        action: modalAction,
        id: modalId,
        warnWhenUnsavedChanges: false,
        successNotification: () => ({ message: modalAction === "create" ? "Propietario creado" : "Propietario actualizado", type: "success" })
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Cartera de Propietarios</Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => { setModalAction("create"); setModalId(null); show(); }}
                    style={{ borderRadius: "10px", height: "40px", padding: "0 24px", fontWeight: 700, background: "#2563eb", boxShadow: "0 8px 15px rgba(37,99,235,0.2)", border: "none" }}
                >
                    Nuevo Propietario
                </Button>
            </div>
            <Table {...tableProps} rowKey="id" className="premium-table">
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

function RentalsTab() {
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
    const { data: locationsListData } = useList({ resource: "locations", pagination: { pageSize: 200 } });
    const allLocations: any[] = (locationsListData as any)?.data || [];

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
