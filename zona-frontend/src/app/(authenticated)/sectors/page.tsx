"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { List, useTable, EditButton, DeleteButton, CreateButton } from "@refinedev/antd";
import { Table, Space, Typography, Card, Tag, Button, Tooltip, Divider } from "antd";
import { 
  AppstoreOutlined, 
  OrderedListOutlined, 
  SettingOutlined, 
  ReloadOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { useState } from "react";

const { Title, Text } = Typography;

export default function SectorList() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Usamos useList para asegurar consistencia con el resto del proyecto
  const { result, query } = useList({
    resource: "sectors",
    sorters: [{ field: "order", order: "asc" }],
    pagination: { pageSize: 50 },
    queryOptions: { 
      queryKey: ["sectors-list", refreshKey],
    } as any
  });

  const sectors: any[] = result?.data || [];
  const totalSectors = result?.total || sectors.length;

  const refresh = () => setRefreshKey(prev => prev + 1);

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
          flexWrap: "wrap",
          gap: "24px",
          color: "#fff",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decoración abstracta */}
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
              <SettingOutlined />
            </div>
            <div>
              <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, letterSpacing: "-1px" }}>
                Configuración de Sectores
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>
                Defina el flujo de trabajo y jerarquía del pipeline de producción
              </Text>
            </div>
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ 
              background: "rgba(255,255,255,0.1)", 
              padding: "12px 24px", 
              borderRadius: "16px", 
              border: "1px solid rgba(255,255,255,0.1)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1 }}>{totalSectors}</div>
              <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "4px", textTransform: "uppercase", fontWeight: 700 }}>Sectores</div>
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
                color: "#4338ca",
                border: "none",
                fontWeight: 700,
                boxShadow: "0 8px 15px rgba(0,0,0,0.1)"
              }}>
                Nuevo Sector
              </CreateButton>
            </Space>
          </div>
        </div>

        {/* ── Tabla de Sectores ────────────────────────────────────────── */}
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
            dataSource={sectors}
            loading={query.isLoading}
            rowKey="id"
            className="premium-sector-table"
            pagination={false}
          >
            <Table.Column 
              dataIndex="id" 
              title="ID" 
              width={80}
              render={(id: number) => <Text type="secondary" style={{ fontVariantNumeric: "tabular-nums" }}>#{id}</Text>}
            />
            
            <Table.Column 
              dataIndex="name" 
              title="Nombre del Sector" 
              render={(name: string) => (
                <Space size={12}>
                  <div style={{ 
                    width: 36, 
                    height: 36, 
                    borderRadius: "10px", 
                    background: "#eef2ff", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    color: "#4338ca",
                    fontSize: "18px"
                  }}>
                    <AppstoreOutlined />
                  </div>
                  <Text strong style={{ fontSize: "15px", color: "#1e293b" }}>{name}</Text>
                </Space>
              )}
            />

            <Table.Column 
              dataIndex="order" 
              title="Orden en Pipeline" 
              align="center"
              render={(order: number) => (
                <Tag 
                  icon={<OrderedListOutlined />} 
                  style={{ 
                    borderRadius: "20px", 
                    padding: "4px 16px", 
                    fontWeight: 700,
                    background: "#f5f3ff",
                    color: "#7c3aed",
                    border: "1px solid #ddd6fe"
                  }}
                >
                  POSICIÓN {order}
                </Tag>
              )}
            />

            <Table.Column 
              title="Acciones" 
              align="right"
              render={(_: any, record: any) => (
                <Space size={8} style={{ paddingRight: "16px" }}>
                  <Tooltip title="Editar configuración">
                    <EditButton 
                      hideText 
                      size="middle" 
                      recordItemId={record.id} 
                      style={{ borderRadius: "10px", border: "1px solid #e2e8f0" }} 
                    />
                  </Tooltip>
                  <Tooltip title="Eliminar sector">
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

        {/* Info adicional */}
        <div style={{ marginTop: "24px", padding: "20px", background: "#f8fafc", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" }}>
          <ArrowRightOutlined style={{ color: "#4338ca" }} />
          <Text type="secondary">
            El <b>Orden en Pipeline</b> determina la secuencia en la que aparecen los sectores en la vista de producción. Un número menor indica una etapa más temprana.
          </Text>
        </div>
      </div>

      <style>{`
        .premium-sector-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 1px !important;
          padding: 20px 24px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .premium-sector-table .ant-table-tbody > tr > td {
          padding: 20px 24px !important;
          border-bottom: 1px solid #f8fafc !important;
        }
        .premium-sector-table .ant-table-row:hover td {
          background: #f1f5f9 !important;
        }
      `}</style>
    </AdminGuard>
  );
}
