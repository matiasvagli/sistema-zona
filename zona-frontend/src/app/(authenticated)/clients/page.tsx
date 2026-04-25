"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { EditButton, DeleteButton, CreateButton } from "@refinedev/antd";
import { Table, Space, Typography, Card, Tag, Button, Avatar, Tooltip, Divider, Input } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useList, useGetIdentity } from "@refinedev/core";
import { useState } from "react";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function ClientList() {
  const { data: identity } = useGetIdentity<any>();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchText, setSearchText] = useState("");

  // Usamos useList para mayor compatibilidad con el resto del proyecto y asegurar carga de datos
  const { result, query } = useList({
    resource: "clients",
    sorters: [{ field: "name", order: "asc" }],
    pagination: { pageSize: 100 },
    queryOptions: { 
      queryKey: ["clients", refreshKey],
      refetchInterval: 30000 
    } as any
  });

  const clients: any[] = result?.data || [];
  const totalClients = result?.total || clients.length;
  const activeClients = clients.filter((c: any) => c.is_active).length;

  const filteredClients = searchText.trim()
    ? clients.filter((c: any) => {
        const q = searchText.toLowerCase();
        return (
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.tax_id?.toLowerCase().includes(q)
        );
      })
    : clients;

  const refresh = () => setRefreshKey(prev => prev + 1);

  return (
    <AdminGuard>
      <div style={{ padding: "32px", background: "#f1f5f9", minHeight: "100vh" }}>
        
        {/* ── Header Premium con Stats ──────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)",
          borderRadius: "20px",
          padding: "32px 40px",
          marginBottom: "32px",
          boxShadow: "0 12px 30px rgba(49, 46, 129, 0.2)",
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
          <div style={{ position: "absolute", top: "-50%", left: "-10%", width: "400px", height: "400px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />

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
                Directorio de Clientes
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>
                Gestión centralizada de carteras y datos de contacto
              </Text>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* Stat: Total */}
            <div style={{ 
              background: "rgba(255,255,255,0.1)", 
              padding: "12px 20px", 
              borderRadius: "16px", 
              border: "1px solid rgba(255,255,255,0.1)",
              textAlign: "center",
              minWidth: "100px"
            }}>
              <div style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1 }}>{totalClients}</div>
              <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px", textTransform: "uppercase", fontWeight: 700 }}>Total</div>
            </div>
            {/* Stat: Activos */}
            <div style={{ 
              background: "rgba(16, 185, 129, 0.2)", 
              padding: "12px 20px", 
              borderRadius: "16px", 
              border: "1px solid rgba(16, 185, 129, 0.2)",
              textAlign: "center",
              minWidth: "100px"
            }}>
              <div style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1, color: "#34d399" }}>{activeClients}</div>
              <div style={{ fontSize: "10px", color: "#34d399", opacity: 0.8, marginTop: "4px", textTransform: "uppercase", fontWeight: 700 }}>Activos</div>
            </div>
            
            <Divider type="vertical" style={{ height: "40px", borderColor: "rgba(255,255,255,0.2)" }} />
            
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
                color: "#312e81",
                border: "none",
                fontWeight: 700,
                boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
              }}>
                Nuevo Cliente
              </CreateButton>
            </Space>
          </div>
        </div>

        {/* ── Buscador ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <Input
            size="large"
            placeholder="Buscar por nombre, email o CUIT..."
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ borderRadius: 12, maxWidth: 420, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          />
        </div>

        {/* ── Tabla Premium ─────────────────────────────────────────── */}
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
            dataSource={filteredClients}
            loading={query.isLoading}
            rowKey="id"
            className="premium-client-table"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              style: { padding: "24px" }
            }}
          >
            <Table.Column 
              dataIndex="name" 
              title="Cliente / Empresa" 
              width="30%"
              render={(name: string, record: any) => (
                <Space size={16}>
                  <Avatar 
                    size={44}
                    style={{ 
                      backgroundColor: record.is_active ? '#4338ca' : '#94a3b8',
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      fontWeight: 700,
                      fontSize: "18px"
                    }}
                  >
                    {name ? name.charAt(0).toUpperCase() : "?"}
                  </Avatar>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong style={{ fontSize: "15px", color: "#1e293b" }}>{name}</Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      <IdcardOutlined style={{ marginRight: 6 }} />
                      {record.tax_id || "Sin CUIT"}
                    </Text>
                  </div>
                </Space>
              )}
            />
            
            <Table.Column 
              title="Contacto" 
              render={(_: any, record: any) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: "4px" }}>
                  <Text style={{ fontSize: "13px" }}>
                    <MailOutlined style={{ color: '#94a3b8', marginRight: 8 }} />
                    {record.email || "—"}
                  </Text>
                  <Text style={{ fontSize: "13px" }}>
                    <PhoneOutlined style={{ color: '#94a3b8', marginRight: 8 }} />
                    {record.phone || "—"}
                  </Text>
                </div>
              )}
            />

            <Table.Column 
              dataIndex="address" 
              title="Ubicación" 
              render={(address: string) => (
                <div style={{ maxWidth: "200px" }}>
                  <Text ellipsis style={{ fontSize: "13px", color: "#64748b" }}>
                    <EnvironmentOutlined style={{ marginRight: 6 }} />
                    {address || "No especificada"}
                  </Text>
                </div>
              )}
            />

            <Table.Column 
              dataIndex="is_active" 
              title="Estado" 
              align="center"
              render={(isActive: boolean) => (
                <Tag 
                  color={isActive ? "success" : "default"} 
                  style={{ 
                    borderRadius: "20px", 
                    padding: "4px 12px", 
                    fontWeight: 700,
                    textTransform: "uppercase",
                    fontSize: "10px",
                    border: "none",
                    background: isActive ? "#ecfdf5" : "#f1f5f9",
                    color: isActive ? "#059669" : "#64748b"
                  }}
                >
                  {isActive ? "Activo" : "Inactivo"}
                </Tag>
              )}
            />

            <Table.Column
              title="Acciones"
              align="right"
              render={(_: any, record: any) => (
                <Space size={8} style={{ paddingRight: "16px" }}>
                  <Tooltip title="Nuevo presupuesto">
                    <Button
                      size="middle"
                      icon={<FileTextOutlined />}
                      onClick={() => router.push(`/budgets/create?client=${record.id}`)}
                      style={{ borderRadius: "10px", border: "1px solid #e2e8f0", color: "#7c3aed" }}
                    />
                  </Tooltip>
                  <Tooltip title="Editar detalles">
                    <EditButton
                      hideText
                      size="middle"
                      recordItemId={record.id}
                      style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }}
                    />
                  </Tooltip>
                  <Tooltip title="Eliminar registro">
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
        .premium-client-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 1px !important;
          padding: 20px 24px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .premium-client-table .ant-table-tbody > tr > td {
          padding: 20px 24px !important;
          border-bottom: 1px solid #f8fafc !important;
        }
        .premium-client-table .ant-table-row:hover td {
          background: #f1f5f9 !important;
        }
      `}</style>
    </AdminGuard>
  );
}
