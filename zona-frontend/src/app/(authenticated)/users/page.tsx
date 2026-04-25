"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { List, useTable, EditButton, DeleteButton, CreateButton } from "@refinedev/antd";
import { API_URL as API } from "@/config/api";
import { Table, Space, Tag, Select, message, Typography, Card, Avatar, Tooltip, Button, Divider } from "antd";
import { useCustomMutation, useGetIdentity, useList } from "@refinedev/core";
import { 
  UserOutlined, 
  SafetyCertificateOutlined, 
  TeamOutlined, 
  ReloadOutlined,
  MailOutlined,
  IdcardOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import { useState } from "react";

const { Title, Text } = Typography;

export default function UserList() {
  const { data: identity } = useGetIdentity<any>();
  const [refreshKey, setRefreshKey] = useState(0);
  const isCeo = identity?.rol === 'ceo';

  // Usamos useList para asegurar consistencia y carga de datos
  const { result, query } = useList({
    resource: "users",
    pagination: { pageSize: 100 },
    queryOptions: { 
      queryKey: ["users-list", refreshKey],
    } as any
  });

  const users: any[] = result?.data || [];
  const totalUsers = result?.total || users.length;

  const { mutate } = useCustomMutation();

  const handleRoleChange = (userId: number, newRole: string) => {
    mutate({
      url: `${API}/users/${userId}/change_role/`,
      method: "patch",
      values: { rol: newRole },
    }, {
      onSuccess: () => {
        message.success("Rol actualizado con éxito");
        refresh();
      },
      onError: (err: any) => {
        message.error(err?.response?.data?.error || "Error al actualizar el rol");
      }
    });
  };

  const refresh = () => setRefreshKey(prev => prev + 1);

  return (
    <AdminGuard>
      <div style={{ padding: "32px", background: "#f1f5f9", minHeight: "100vh" }}>
        
        {/* ── Header Premium ────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
          borderRadius: "20px",
          padding: "32px 40px",
          marginBottom: "32px",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
          color: "#fff",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decoración abstracta */}
          <div style={{ position: "absolute", top: "-20%", right: "-5%", width: "300px", height: "300px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />

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
              <TeamOutlined />
            </div>
            <div>
              <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, letterSpacing: "-1px" }}>
                Gestión de Usuarios
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px" }}>
                Administración de personal, roles y accesos al sistema
              </Text>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ 
              background: "rgba(255,255,255,0.05)", 
              padding: "12px 24px", 
              borderRadius: "16px", 
              border: "1px solid rgba(255,255,255,0.1)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1 }}>{totalUsers}</div>
              <div style={{ fontSize: "10px", opacity: 0.5, marginTop: "4px", textTransform: "uppercase", fontWeight: 700 }}>Usuarios</div>
            </div>
            
            <Divider type="vertical" style={{ height: "40px", borderColor: "rgba(255,255,255,0.1)" }} />
            
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={refresh}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "10px" }}
              />
              <CreateButton style={{ 
                borderRadius: "10px", 
                height: "44px", 
                padding: "0 24px",
                background: "#fff",
                color: "#0f172a",
                border: "none",
                fontWeight: 700,
                boxShadow: "0 8px 15px rgba(0,0,0,0.2)"
              }}>
                Nuevo Usuario
              </CreateButton>
            </Space>
          </div>
        </div>

        {/* ── Tabla de Usuarios ────────────────────────────────────────── */}
        <Card
          variant="borderless"
          style={{ 
            borderRadius: "24px", 
            boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
            overflow: "hidden"
          }}
          styles={{ body: { padding: 0 } }}
        >
          <Table 
            dataSource={users}
            loading={query.isLoading}
            rowKey="id"
            className="premium-user-table"
            pagination={{
              pageSize: 15,
              showSizeChanger: false,
              style: { padding: "24px" }
            }}
          >
            <Table.Column 
              title="Usuario" 
              width="25%"
              render={(_: any, record: any) => (
                <Space size={14}>
                  <Avatar 
                    size={42}
                    icon={<UserOutlined />}
                    style={{ 
                      backgroundColor: record.rol === 'ceo' ? '#0f172a' : record.rol === 'admin' ? '#4338ca' : '#94a3b8',
                      boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ fontSize: "15px", color: "#1e293b" }}>
                      {record.first_name || record.last_name ? `${record.first_name} ${record.last_name}` : record.username}
                    </Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>@{record.username}</Text>
                  </div>
                </Space>
              )}
            />
            
            <Table.Column 
              dataIndex="email" 
              title="Contacto" 
              render={(email: string) => (
                <Text style={{ fontSize: "13px", color: "#64748b" }}>
                  <MailOutlined style={{ marginRight: 8, opacity: 0.7 }} />
                  {email || "—"}
                </Text>
              )}
            />

            <Table.Column
              dataIndex="rol"
              title="Rol / Nivel de Acceso"
              width={180}
              render={(value, record: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: "8px" }}>
                  <Select
                    defaultValue={value || "empleado"}
                    style={{ width: "100%", borderRadius: "8px" }}
                    variant="filled"
                    onChange={(newRole) => handleRoleChange(record.id, newRole)}
                    options={[
                      { value: 'ceo', label: 'CEO (Acceso Total)', disabled: !isCeo },
                      { value: 'admin', label: 'Admin (Gestión)' },
                      { value: 'empleado', label: 'Empleado' },
                    ]}
                  />
                  {record.is_staff && (
                    <Tag color="blue" icon={<SafetyCertificateOutlined />} style={{ borderRadius: "20px", width: "fit-content", fontSize: "10px", fontWeight: 700, margin: 0 }}>
                      STAFF
                    </Tag>
                  )}
                </div>
              )}
            />

            <Table.Column
              title="Sectores Activos"
              render={(_, record: any) => {
                const memberships = record.sector_memberships || [];
                if (memberships.length === 0) return <Text type="secondary" style={{ fontSize: "12px", fontStyle: "italic" }}>Sin sectores asignados</Text>;
                return (
                  <Space size={[0, 6]} wrap style={{ maxWidth: "250px" }}>
                    {memberships.map((m: any) => (
                      <Tag key={m.id} style={{ 
                        borderRadius: "6px", 
                        background: "#f1f5f9", 
                        border: "1px solid #e2e8f0", 
                        color: "#475569",
                        fontSize: "11px",
                        fontWeight: 600,
                        margin: 0
                      }}>
                        {m.sector_name}
                      </Tag>
                    ))}
                  </Space>
                );
              }}
            />

            <Table.Column
              title="Acciones"
              align="right"
              render={(_, record: any) => (
                <Space size={8} style={{ paddingRight: "16px" }}>
                  <Tooltip title="Editar perfil y permisos">
                    <EditButton 
                      hideText 
                      size="middle" 
                      recordItemId={record.id} 
                      style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }} 
                    />
                  </Tooltip>
                  <Tooltip title="Eliminar cuenta">
                    <DeleteButton 
                      hideText 
                      size="middle" 
                      recordItemId={record.id} 
                      style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }} 
                    />
                  </Tooltip>
                </Space>
              )}
            />
          </Table>
        </Card>
      </div>

      <style>{`
        .premium-user-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 1px !important;
          padding: 20px 24px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .premium-user-table .ant-table-tbody > tr > td {
          padding: 20px 24px !important;
          border-bottom: 1px solid #f8fafc !important;
        }
        .premium-user-table .ant-table-row:hover td {
          background: #f1f5f9 !important;
        }
        .ant-select-filled:not(.ant-select-customize-input) .ant-select-selector {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </AdminGuard>
  );
}
