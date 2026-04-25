"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { useForm } from "@refinedev/antd";
import { API_URL as API } from "@/config/api";
import { Form, Input, InputNumber, Checkbox, Table, Button, Space, message, Select, Card, Typography, Row, Col, Divider, Tag, Tooltip } from "antd";
import { useList, useCustomMutation, useCreate, useDelete } from "@refinedev/core";
import { useState } from "react";
import { 
  AppstoreOutlined, 
  OrderedListOutlined, 
  SettingOutlined, 
  UserAddOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  EditOutlined
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";

const { Title, Text } = Typography;

export default function SectorEdit() {
  const { id: routeId } = useParams<{ id: string }>();
  const router = useRouter();
  
  const { formProps, saveButtonProps, id } = useForm({
    resource: "sectors",
    id: routeId,
    redirect: false // Nos quedamos aquí para editar permisos
  });
  
  const sectorId = id || routeId;

  const { result: usersResult } = useList({ 
    resource: "users",
    pagination: { pageSize: 200 }
  });
  
  const { result: membershipsResult, query: membershipsQuery } = useList({
    resource: "sector-memberships",
    filters: [{ field: "sector", operator: "eq", value: sectorId }],
    queryOptions: { enabled: !!sectorId },
  });

  const { mutate: updateMembership } = useCustomMutation();
  const { mutate: createMembership } = useCreate();
  const { mutate: deleteMembership } = useDelete();

  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const handleAddUser = () => {
    if (!selectedUser || !sectorId) return;
    createMembership({
      resource: "sector-memberships",
      values: {
        usuario: selectedUser,
        sector: sectorId,
        puede_ver: true,
        puede_crear: false,
        puede_editar: false,
        puede_eliminar: false
      }
    }, {
      onSuccess: () => {
        message.success("Usuario vinculado al sector");
        setSelectedUser(null);
        membershipsQuery.refetch();
      },
      onError: (err: any) => message.error("Error: " + err.message)
    });
  };

  const handleUpdatePerm = (membershipId: number, field: string, checked: boolean) => {
    updateMembership({
      url: `${API}/sector-memberships/${membershipId}/`,
      method: "patch",
      values: { [field]: checked },
    }, {
      onSuccess: () => message.success("Privilegio actualizado"),
      onError: () => message.error("No se pudo actualizar el permiso")
    });
  };

  const handleRemove = (membershipId: number) => {
    deleteMembership({
      resource: "sector-memberships",
      id: membershipId,
    }, {
      onSuccess: () => {
        message.success("Usuario removido del sector");
        membershipsQuery.refetch();
      }
    });
  };

  return (
    <AdminGuard>
      <div style={{ padding: "32px", background: "#f1f5f9", minHeight: "100vh" }}>
        
        {/* ── Header Premium ────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #312e81 0%, #4338ca 60%, #6366f1 100%)",
          borderRadius: "20px",
          padding: "32px 40px",
          marginBottom: "32px",
          boxShadow: "0 12px 30px rgba(67, 56, 202, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "400px", height: "400px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />

          <Space size={24}>
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
              <EditOutlined />
            </div>
            <div>
              <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, letterSpacing: "-1px" }}>
                Configuración del Sector
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>
                Ajuste el flujo de trabajo y administre el personal asignado
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
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              fontWeight: 600
            }}
          >
            Volver
          </Button>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} lg={10}>
            <Card
              title={
                <Space size={12}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4338ca" }}>
                    <SettingOutlined />
                  </div>
                  <Text strong style={{ fontSize: 16 }}>Atributos del Sector</Text>
                </Space>
              }
              variant="borderless"
              style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}
            >
              <Form {...formProps} layout="vertical">
                <Form.Item
                  label={<Text strong type="secondary">Nombre del Sector</Text>}
                  name="name"
                  rules={[{ required: true, message: "El nombre es obligatorio" }]}
                >
                  <Input size="large" prefix={<AppstoreOutlined style={{ color: "#4338ca" }} />} style={{ borderRadius: "10px" }} />
                </Form.Item>

                <Form.Item
                  label={<Text strong type="secondary">Orden en Pipeline</Text>}
                  name="order"
                  help="Define la posición secuencial de izquierda a derecha"
                >
                  <InputNumber size="large" min={0} style={{ width: "100%", borderRadius: "10px" }} prefix={<OrderedListOutlined style={{ color: "#94a3b8" }} />} />
                </Form.Item>

                <Divider />

                <div style={{ 
                  padding: "20px", 
                  background: "#f0fdf4", 
                  borderRadius: "12px", 
                  border: "1px solid #dcfce7" 
                }}>
                  <Form.Item name="is_active" valuePropName="checked" noStyle>
                    <Checkbox>
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: "14px" }}>
                          <SafetyCertificateOutlined style={{ color: "#16a34a", marginRight: "8px" }} /> 
                          Sector Activo
                        </Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Solo los sectores activos aparecen en el pipeline de producción.
                        </Text>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                </div>

                <div style={{ marginTop: "32px" }}>
                  <Button 
                    type="primary" 
                    size="large" 
                    {...saveButtonProps} 
                    style={{ 
                      width: "100%",
                      height: "50px",
                      borderRadius: "12px", 
                      fontWeight: 700,
                      background: "#4338ca",
                      border: "none",
                      boxShadow: "0 8px 20px rgba(67, 56, 202, 0.3)"
                    }}
                  >
                    Guardar Cambios
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <Space size={12}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fdf2f8", display: "flex", alignItems: "center", justifyContent: "center", color: "#db2777" }}>
                      <TeamOutlined />
                    </div>
                    <Text strong style={{ fontSize: 16 }}>Personal Asignado al Sector</Text>
                  </Space>
                  <Tag color="magenta" style={{ borderRadius: "8px", fontWeight: 600 }}>GESTIÓN DE PERMISOS</Tag>
                </div>
              }
              variant="borderless"
              style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}
            >
              <div style={{ 
                background: "#f8fafc", 
                padding: "24px", 
                borderRadius: "16px", 
                border: "1px solid #e2e8f0",
                marginBottom: "24px"
              }}>
                <Text strong style={{ display: "block", marginBottom: "12px", fontSize: "13px", color: "#64748b" }}>
                  VINCULAR NUEVO USUARIO
                </Text>
                <Row gutter={12}>
                  <Col flex="auto">
                    <Select 
                      size="large"
                      style={{ width: "100%", borderRadius: "10px" }}
                      placeholder="Busque un usuario para asignar..."
                      showSearch
                      optionFilterProp="label"
                      value={selectedUser}
                      onChange={setSelectedUser}
                      options={usersResult?.data?.map((u: any) => ({ value: u.id, label: `${u.first_name || ''} ${u.last_name || ''} (@${u.username})`.trim() })) || []}
                    />
                  </Col>
                  <Col>
                    <Button 
                      type="primary" 
                      size="large" 
                      icon={<UserAddOutlined />}
                      onClick={handleAddUser} 
                      disabled={!selectedUser}
                      style={{ borderRadius: "10px", background: "#db2777", border: "none" }}
                    >
                      Asignar
                    </Button>
                  </Col>
                </Row>
              </div>

              <Table 
                dataSource={membershipsResult?.data || []} 
                rowKey="id"
                pagination={false}
                className="premium-perm-table"
              >
                <Table.Column 
                  title="Integrante" 
                  render={(_, record: any) => (
                    <Text strong style={{ fontSize: "14px", color: "#1e293b" }}>{record.username}</Text>
                  )} 
                />
                <Table.Column 
                  title="Ver" 
                  align="center"
                  render={(_, record: any) => (
                    <Tooltip title="Permite visualizar el pipeline de este sector">
                      <Checkbox 
                        defaultChecked={record.puede_ver} 
                        onChange={(e) => handleUpdatePerm(record.id, 'puede_ver', e.target.checked)} 
                      />
                    </Tooltip>
                  )} 
                />
                <Table.Column 
                  title="Editar" 
                  align="center"
                  render={(_, record: any) => (
                    <Tooltip title="Permite iniciar/completar tareas">
                      <Checkbox 
                        defaultChecked={record.puede_editar} 
                        onChange={(e) => handleUpdatePerm(record.id, 'puede_editar', e.target.checked)} 
                      />
                    </Tooltip>
                  )} 
                />
                <Table.Column 
                  title="Quitar" 
                  align="center"
                  render={(_, record: any) => (
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleRemove(record.id)}
                      style={{ borderRadius: "8px" }}
                    />
                  )} 
                />
              </Table>
            </Card>
          </Col>
        </Row>
      </div>

      <style>{`
        .premium-perm-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          letter-spacing: 0.5px !important;
          padding: 12px 16px !important;
        }
        .premium-perm-table .ant-table-tbody > tr > td {
          padding: 16px !important;
        }
      `}</style>
    </AdminGuard>
  );
}
