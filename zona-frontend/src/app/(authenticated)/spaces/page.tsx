"use client";

import React from "react";
import { Tabs, Card, Table, Typography, Tag, Button, Modal, Form, Input, InputNumber, Select, Row, Col, Space, Upload, notification, Spin, Empty } from "antd";
import { EnvironmentOutlined, BuildOutlined, DollarOutlined, UserOutlined, PlusOutlined, MinusCircleOutlined, UploadOutlined, EditOutlined, SwapOutlined, CameraOutlined, WarningOutlined } from "@ant-design/icons";
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
                        { key: "4", label: <span style={{ fontWeight: 600 }}><DollarOutlined /> Contratos</span>, children: <div style={{ padding: "32px" }}><ContractsTab /></div> },
                        { key: "5", label: <span style={{ fontWeight: 600 }}><UserOutlined /> Propietarios</span>, children: <div style={{ padding: "32px" }}><LandlordsTab /></div> }
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

    const handleFormFinish = async (values: any) => {
        const formData = new FormData();
        for (const key in values) {
            if (key === 'contract_file_raw') continue;
            if (values[key] !== undefined && values[key] !== null) {
                formData.append(key, values[key]);
            }
        }
        if (values.contract_file_raw && values.contract_file_raw.length > 0) {
            formData.append('contract_file', values.contract_file_raw[0].originFileObj);
        }
        await formProps.onFinish?.(formData as any);
    };

    const handleGeocode = async () => {
        const address = formProps.form?.getFieldValue('address');
        if (!address) {
            notification.warning({ message: "Ingresá una dirección primero para buscar las coordenadas" });
            return;
        }
        setIsGeocoding(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                formProps.form?.setFieldsValue({
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon)
                });
            } else {
                notification.warning({ message: "No se encontraron coordenadas para esa dirección" });
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
                formProps.form?.setFieldsValue({ address: data.display_name });
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

function StructuresTab() {
    const { result: structuresResult, query: structuresQuery } = useList({
        resource: "structures",
        pagination: { pageSize: 200 },
        sorters: [{ field: "id", order: "desc" }],
    });
    const structures: any[] = structuresResult?.data || [];

    const [modalAction, setModalAction] = React.useState<"create" | "edit">("create");
    const [modalId, setModalId] = React.useState<any>(null);

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

    const TYPE_COLORS: any = { monoposte: 'purple', frontlight: 'cyan', pantalla_led: 'orange', pared: 'default', otro: 'default' };
    const TYPE_LABELS: any = { monoposte: 'Monoposte', frontlight: 'Frontlight', pantalla_led: 'Pantalla LED', pared: 'Pared/Medianera', otro: 'Otro' };

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
                                        <img
                                            src={record.photo}
                                            alt={record.name}
                                            style={{ height: 160, objectFit: 'cover', width: '100%' }}
                                        />
                                    ) : (
                                        <div style={{
                                            height: 160,
                                            background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexDirection: 'column', gap: 8,
                                        }}>
                                            <CameraOutlined style={{ fontSize: 36, color: '#94a3b8' }} />
                                            <Text type="secondary" style={{ fontSize: 12 }}>Sin foto de instalación</Text>
                                        </div>
                                    )
                                }
                                styles={{ body: { padding: 16 } }}
                                style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}
                            >
                                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                                    <Tag color={TYPE_COLORS[record.type] || 'blue'} style={{ borderRadius: 10, fontSize: 11 }}>
                                        {TYPE_LABELS[record.type] || record.type}
                                    </Tag>
                                    <Tag color={record.is_active ? 'success' : 'default'} style={{ borderRadius: 10, fontSize: 11 }}>
                                        {record.is_active ? 'INSTALADO' : 'DESMONTADO'}
                                    </Tag>
                                </div>
                                <Text strong style={{ display: 'block', fontSize: 15, marginBottom: 2 }}>{record.name}</Text>
                                <Text type="secondary" style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{record.location_name}</Text>
                                {record.dimensions && (
                                    <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{record.dimensions}</Text>
                                )}
                                {record.is_active && !record.has_installation_ot && (
                                    <div style={{
                                        background: '#fef3c7', border: '1px solid #fcd34d',
                                        borderRadius: 8, padding: '5px 10px', marginTop: 10,
                                        fontSize: 11, color: '#92400e', display: 'flex', alignItems: 'center', gap: 5,
                                    }}>
                                        <WarningOutlined /> Sin OT de instalación
                                    </div>
                                )}
                                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {record.faces?.length > 0 ? (
                                        <Tag color="cyan" style={{ borderRadius: 10 }}>
                                            {record.faces.length} cara{record.faces.length !== 1 ? 's' : ''}
                                        </Tag>
                                    ) : <span />}
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
                                    { label: 'Pantalla LED', value: 'pantalla_led' },
                                    { label: 'Pared/Medianera', value: 'pared' },
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
            const daysLeft = Math.ceil((new Date(record.contract_end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
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
                    const daysLeft = Math.ceil((new Date(val).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
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
