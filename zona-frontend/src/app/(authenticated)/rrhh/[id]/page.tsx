"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useOne, useList, useUpdate, useCreate } from "@refinedev/core";
import {
  Typography, Form, Input, Select, DatePicker, Switch, Button, Card, Row, Col, Space, Spin, Divider,
} from "antd";
import {
  UserOutlined, ArrowLeftOutlined, SaveOutlined, IdcardOutlined,
  BankOutlined, PhoneOutlined, HomeOutlined, CalendarOutlined, MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { notification } from "antd";

const { Title, Text } = Typography;

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form] = Form.useForm();
  const isCreate = id === "create";

  const { query } = useOne({
    resource: "employees",
    id,
    queryOptions: { enabled: !isCreate },
  });
  const isLoading = query?.isFetching || query?.isLoading;

  const { result: sectorsResult } = useList({
    resource: "sectors",
    pagination: { pageSize: 100 },
    sorters: [{ field: "order", order: "asc" }],
  });

  const { result: usersResult } = useList({
    resource: "users",
    pagination: { pageSize: 200 },
  });

  const { mutate: update, mutation: updateMutation } = useUpdate();
  const { mutate: create, mutation: createMutation } = useCreate();

  const employee = query?.data?.data;
  const saving = updateMutation?.isPending;
  const creating = createMutation?.isPending;
  const sectors: any[] = sectorsResult?.data || [];
  const users: any[] = usersResult?.data || [];

  React.useEffect(() => {
    if (employee) {
      form.setFieldsValue({
        ...employee,
        fecha_nacimiento: employee.fecha_nacimiento ? dayjs(employee.fecha_nacimiento) : null,
        fecha_ingreso: employee.fecha_ingreso ? dayjs(employee.fecha_ingreso) : null,
      });
    }
  }, [employee?.id, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        fecha_nacimiento: values.fecha_nacimiento ? values.fecha_nacimiento.format("YYYY-MM-DD") : null,
        fecha_ingreso: values.fecha_ingreso ? values.fecha_ingreso.format("YYYY-MM-DD") : null,
      };

      if (isCreate) {
        create(
          { resource: "employees", values: payload },
          { onSuccess: (d) => { notification.success({ message: "Empleado creado" }); router.push(`/rrhh/${d.data.id}`); } }
        );
      } else {
        update(
          { resource: "employees", id, values: payload },
          { onSuccess: () => notification.success({ message: "Cambios guardados" }) }
        );
      }
    } catch {}
  };

  if (!isCreate && isLoading) return <div style={{ padding: 80, textAlign: "center" }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: 32, background: "#f1f5f9", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 60%, #22d3ee 100%)",
        borderRadius: 20, padding: "28px 36px", marginBottom: 32,
        boxShadow: "0 12px 30px rgba(8,145,178,0.2)",
        display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff",
      }}>
        <Space size={20}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
            <UserOutlined />
          </div>
          <div>
            <Title level={3} style={{ color: "#fff", margin: 0, fontWeight: 800 }}>
              {isCreate ? "Nuevo Empleado" : `${employee?.last_name || "Cargando..."}, ${employee?.first_name || ""}`}
            </Title>
            {!isCreate && employee?.legajo && (
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>Legajo #{employee.legajo}</Text>
            )}
          </div>
        </Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/rrhh")}
          style={{ borderRadius: 12, height: 44, padding: "0 24px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 600 }}>
          Volver
        </Button>
      </div>

      <Form form={form} layout="vertical">
        <Row gutter={[24, 24]}>
          {/* Datos personales */}
          <Col xs={24} lg={12}>
            <Card title={<Space><IdcardOutlined style={{ color: "#0891b2" }} /><Text strong>Datos Personales</Text></Space>}
              variant="borderless" style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Nombre" name="first_name" rules={[{ required: true, message: "Requerido" }]}>
                    <Input size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Apellido" name="last_name" rules={[{ required: true, message: "Requerido" }]}>
                    <Input size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="DNI" name="dni">
                    <Input size="large" prefix={<IdcardOutlined style={{ color: "#94a3b8" }} />} style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Fecha de Nacimiento" name="fecha_nacimiento">
                    <DatePicker size="large" format="DD/MM/YYYY" style={{ width: "100%", borderRadius: 10 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Dirección" name="direccion">
                <Input size="large" prefix={<HomeOutlined style={{ color: "#94a3b8" }} />} style={{ borderRadius: 10 }} />
              </Form.Item>
              <Form.Item label="Teléfono" name="phone">
                <Input size="large" prefix={<PhoneOutlined style={{ color: "#94a3b8" }} />} style={{ borderRadius: 10 }} />
              </Form.Item>
              <Form.Item label="Email Personal" name="email_personal">
                <Input size="large" prefix={<MailOutlined style={{ color: "#94a3b8" }} />} style={{ borderRadius: 10 }} />
              </Form.Item>
            </Card>
          </Col>

          {/* Datos laborales */}
          <Col xs={24} lg={12}>
            <Card title={<Space><CalendarOutlined style={{ color: "#16a34a" }} /><Text strong>Datos Laborales</Text></Space>}
              variant="borderless" style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="N° Legajo" name="legajo" rules={[{ required: true, message: "Requerido" }]}>
                    <Input size="large" style={{ borderRadius: 10 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Fecha de Ingreso" name="fecha_ingreso">
                    <DatePicker size="large" format="DD/MM/YYYY" style={{ width: "100%", borderRadius: 10 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="Sector" name="sector">
                <Select size="large" placeholder="Seleccionar sector..." allowClear style={{ borderRadius: 10 }}
                  options={sectors.map((s) => ({ value: s.id, label: s.name }))} />
              </Form.Item>
              <Form.Item label="Usuario del sistema" name="user">
                <Select size="large" placeholder="Vincular usuario..." allowClear style={{ borderRadius: 10 }}
                  options={users.map((u) => ({ value: u.id, label: `${u.username}${u.first_name ? ` — ${u.first_name} ${u.last_name}` : ""}` }))}
                  onChange={(userId) => {
                    const u = users.find((u) => u.id === userId);
                    if (u) {
                      form.setFieldsValue({ first_name: u.first_name || "", last_name: u.last_name || "" });
                    }
                  }}
                />
              </Form.Item>
              <Form.Item label="CBU / CVU" name="cbu_cvu">
                <Input size="large" prefix={<BankOutlined style={{ color: "#94a3b8" }} />} style={{ borderRadius: 10 }} maxLength={30} />
              </Form.Item>
              <Form.Item label="Activo" name="is_active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" size="large" icon={<SaveOutlined />} loading={saving || creating} onClick={handleSave}
            style={{ height: 48, padding: "0 40px", borderRadius: 12, fontWeight: 700, fontSize: 15 }}>
            {isCreate ? "Crear Empleado" : "Guardar Cambios"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
