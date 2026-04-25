"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, Row, Col, Card, Typography, Divider, Space, Switch, Table, notification, Button, Tag, Avatar } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useList } from "@refinedev/core";
import { useState } from "react";
import {
  UserOutlined, LockOutlined, MailOutlined, IdcardOutlined,
  AppstoreOutlined, SafetyCertificateOutlined, TeamOutlined,
  ArrowLeftOutlined, KeyOutlined,
  EyeOutlined, EditOutlined, PlusSquareOutlined, DeleteOutlined
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";

const { Text, Title } = Typography;

export default function UserEdit() {
  const { id: userId } = useParams<{ id: string }>();
  const router = useRouter();
  const { formProps, saveButtonProps, queryResult: userQuery } = useForm({
    action: "edit",
    resource: "users",
    id: userId,
  });
  const [savingMembership, setSavingMembership] = useState<number | null>(null);

  // Obtener sectores para la tabla de permisos
  const { result: sectorsResult } = useList({
    resource: "sectors",
    sorters: [{ field: "order", order: "asc" }],
    pagination: { pageSize: 100 },
  });

  // Obtener membresías actuales
  const { result: membershipsResult, query: membershipsQuery } = useList({
    resource: "sector-memberships",
    filters: [{ field: "usuario", operator: "eq", value: userId }],
    pagination: { pageSize: 100 },
  });
  
  const refetchMemberships = membershipsQuery.refetch;
  const sectors: any[] = sectorsResult?.data || [];
  const memberships: any[] = membershipsResult?.data || [];
  const membershipMap: Record<number, any> = Object.fromEntries(
    memberships.map((m: any) => [m.sector, m])
  );

  const togglePermission = async (sectorId: number, field: string, value: boolean) => {
    setSavingMembership(sectorId);
    try {
      const existing = membershipMap[sectorId];
      if (!existing) {
        const payload: any = {
          usuario: Number(userId),
          sector: sectorId,
          puede_ver: field === 'puede_ver' ? value : true,
          puede_editar: field === 'puede_editar' ? value : false,
          puede_crear: field === 'puede_crear' ? value : false,
          puede_eliminar: field === 'puede_eliminar' ? value : false,
        };
        await axiosInstance.post(`${API}/sector-memberships/`, payload);
      } else {
        const updates: any = { [field]: value };
        if (field === 'puede_ver' && !value) {
          updates.puede_editar = false;
          updates.puede_crear = false;
          updates.puede_eliminar = false;
        }
        if (['puede_editar', 'puede_crear', 'puede_eliminar'].includes(field) && value) {
          updates.puede_ver = true;
        }
        await axiosInstance.patch(`${API}/sector-memberships/${existing.id}/`, updates);
      }
      await refetchMemberships();
    } catch {
      notification.error({ message: "Error al actualizar permiso" });
    } finally {
      setSavingMembership(null);
    }
  };

  const sectorColumns = [
    {
      title: "Sector",
      dataIndex: "name",
      render: (name: string) => (
        <Space>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
            <AppstoreOutlined />
          </div>
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Ver", width: 80, align: "center" as const,
      render: (_: any, sector: any) => (
        <Switch size="small" checked={!!membershipMap[sector.id]?.puede_ver} loading={savingMembership === sector.id} onChange={(v) => togglePermission(sector.id, "puede_ver", v)} />
      )
    },
    {
      title: "Editar", width: 80, align: "center" as const,
      render: (_: any, sector: any) => (
        <Switch size="small" checked={!!membershipMap[sector.id]?.puede_editar} loading={savingMembership === sector.id} onChange={(v) => togglePermission(sector.id, "puede_editar", v)} />
      )
    },
    {
      title: "Crear", width: 80, align: "center" as const,
      render: (_: any, sector: any) => (
        <Switch size="small" checked={!!membershipMap[sector.id]?.puede_crear} loading={savingMembership === sector.id} onChange={(v) => togglePermission(sector.id, "puede_crear", v)} />
      )
    },
    {
      title: "Borrar", width: 80, align: "center" as const,
      render: (_: any, sector: any) => (
        <Switch size="small" checked={!!membershipMap[sector.id]?.puede_eliminar} loading={savingMembership === sector.id} onChange={(v) => togglePermission(sector.id, "puede_eliminar", v)} />
      )
    },
  ];

  return (
    <AdminGuard>
      <div style={{ padding: "32px", background: "#f1f5f9", minHeight: "100vh" }}>
        {/* ── Header Premium ────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 60%, #22d3ee 100%)",
          borderRadius: "20px",
          padding: "32px 40px",
          marginBottom: "32px",
          boxShadow: "0 12px 30px rgba(8, 145, 178, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decoración de fondo */}
          <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "300px", height: "300px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", pointerEvents: "none" }} />
          
          <Space size={24}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              border: "1px solid rgba(255,255,255,0.3)"
            }}>
              <UserOutlined />
            </div>
            <div>
              <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, letterSpacing: "-1px" }}>
                Perfil de Usuario
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", display: "block", marginTop: "4px" }}>
                ID: #{userId} • Administre credenciales y privilegios granulares
              </Text>
            </div>
          </Space>
          
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
            style={{ 
              borderRadius: "12px", 
              height: "44px", 
              padding: "0 24px",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              fontWeight: 600,
              backdropFilter: "blur(5px)"
            }}
          >
            Volver al listado
          </Button>
        </div>

        <Form {...formProps} layout="vertical">
          <Row gutter={[32, 32]}>
            {/* Columna Izquierda: Credenciales */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space size={12}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfeff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0891b2" }}>
                      <LockOutlined />
                    </div>
                    <Text strong style={{ fontSize: 16 }}>Credenciales y Seguridad</Text>
                  </Space>
                }
                variant="borderless"
                style={{ 
                  borderRadius: "20px", 
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                  height: "100%"
                }}
              >
                <Form.Item
                  label={<Text strong type="secondary">Nombre de Usuario</Text>}
                  name="username"
                  rules={[{ required: true, message: "Este campo es obligatorio" }]}
                >
                  <Input size="large" prefix={<UserOutlined style={{ color: "#0891b2" }} />} style={{ borderRadius: "10px" }} />
                </Form.Item>

                <Form.Item
                  label={<Text strong type="secondary">Nueva Contraseña</Text>}
                  name="password"
                  help="Deje en blanco para no modificar"
                >
                  <Input.Password size="large" prefix={<KeyOutlined style={{ color: "#94a3b8" }} />} style={{ borderRadius: "10px" }} />
                </Form.Item>

                <Form.Item
                  label={<Text strong type="secondary">Correo Electrónico</Text>}
                  name="email"
                  rules={[{ type: "email", message: "Email inválido" }]}
                >
                  <Input size="large" prefix={<MailOutlined style={{ color: "#94a3b8" }} />} style={{ borderRadius: "10px" }} />
                </Form.Item>
              </Card>
            </Col>

            {/* Columna Derecha: Datos Personales */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space size={12}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                      <IdcardOutlined />
                    </div>
                    <Text strong style={{ fontSize: 16 }}>Información Personal</Text>
                  </Space>
                }
                variant="borderless"
                style={{ 
                  borderRadius: "20px", 
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
                  height: "100%"
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<Text strong type="secondary">Nombre</Text>} name="first_name">
                      <Input size="large" style={{ borderRadius: "10px" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<Text strong type="secondary">Apellido</Text>} name="last_name">
                      <Input size="large" style={{ borderRadius: "10px" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label={<Text strong type="secondary">Sector Primario</Text>} name="sector">
                  <Select 
                    size="large" 
                    placeholder="Seleccione sector base..."
                    style={{ borderRadius: "10px" }}
                    options={sectors.map(s => ({ value: s.id, label: s.name }))} 
                  />
                </Form.Item>

                <div style={{ 
                  marginTop: "16px",
                  padding: "20px", 
                  background: "#f8fafc", 
                  borderRadius: "12px", 
                  border: "1px solid #e2e8f0" 
                }}>
                  <Form.Item name="is_staff" valuePropName="checked" noStyle>
                    <Checkbox>
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: "14px" }}>
                          <SafetyCertificateOutlined style={{ color: "#0891b2", marginRight: "8px" }} /> 
                          Privilegios de Administrador
                        </Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Permite acceso total a configuraciones y gestión de usuarios.
                        </Text>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                </div>
              </Card>
            </Col>

            {/* Fila Inferior: Permisos Granulares */}
            <Col span={24}>
              <Card
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <Space size={12}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                        <TeamOutlined />
                      </div>
                      <Text strong style={{ fontSize: 16 }}>Permisos Granulares por Sector</Text>
                    </Space>
                    <Tag color="cyan" style={{ borderRadius: "8px", fontWeight: 600 }}>AUTOSAVE ACTIVADO</Tag>
                  </div>
                }
                variant="borderless"
                style={{ 
                  borderRadius: "20px", 
                  boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
                }}
              >
                <div style={{ background: "#fffbeb", padding: "12px 16px", borderRadius: "12px", border: "1px solid #fef3c7", marginBottom: "24px" }}>
                  <Text style={{ fontSize: "12px", color: "#92400e" }}>
                    <b>Nota:</b> Los cambios en los switches se guardan instantáneamente. Estos permisos definen qué puede hacer el usuario dentro de cada sector específico del pipeline.
                  </Text>
                </div>

                <Table 
                  dataSource={sectors} 
                  columns={sectorColumns} 
                  rowKey="id" 
                  pagination={false} 
                  loading={!sectorsResult?.data}
                  className="premium-table"
                />
              </Card>
            </Col>
          </Row>

          <div style={{ 
            marginTop: "32px", 
            display: "flex", 
            justifyContent: "flex-end",
            gap: "16px"
          }}>
            <Button 
              type="primary" 
              size="large" 
              {...saveButtonProps} 
              style={{ 
                height: "50px",
                padding: "0 48px", 
                borderRadius: "12px", 
                fontWeight: 700,
                fontSize: "16px",
                boxShadow: "0 8px 20px rgba(6, 182, 212, 0.3)"
              }}
            >
              Guardar Cambios
            </Button>
          </div>
        </Form>
      </div>

      <style>{`
        .premium-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.5px !important;
          padding: 16px 20px !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px 20px !important;
        }
        .premium-table .ant-table-row:hover td {
          background: #f1f5f9 !important;
        }
      `}</style>
    </AdminGuard>
  );
}
