"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useList } from "@refinedev/core";
import {
  Typography, Button, Card, Tag, Table, Space, Tooltip,
  notification, Popconfirm, Input, Segmented, Badge,
} from "antd";
import {
  PlusOutlined, EyeOutlined, CheckCircleOutlined,
  FileTextOutlined, LinkOutlined, SearchOutlined,
  ClearOutlined, FilterOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import dayjs from "dayjs";

const { Title, Text } = Typography;
import { BillingModal } from "@/components/billing/BillingModal";

import { API_URL as API } from "@/config/api";
import { BUDGET_STATUS } from "@/constants/statuses";

const STATUS_CONFIG = BUDGET_STATUS;

export default function BudgetsPage() {
  const router = useRouter();
  const [creatingOT, setCreatingOT] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [billingModal, setBillingModal] = useState<{ open: boolean; budgetId: number | null; clientName: string; totalAmount: number }>({
    open: false, budgetId: null, clientName: "", totalAmount: 0
  });

  const { query, result } = useList({
    resource: "budgets",
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 100 },
  });

  const allBudgets: any[] = result?.data || [];

  const filteredBudgets = React.useMemo(() => {
    return allBudgets.filter((b) => {
      const matchSearch = 
        searchText === "" ||
        `PRE-${String(b.id).padStart(4, "0")}`.toLowerCase().includes(searchText.toLowerCase()) ||
        b.client_name?.toLowerCase().includes(searchText.toLowerCase());
      
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      
      return matchSearch && matchStatus;
    });
  }, [allBudgets, searchText, statusFilter]);

  const handleApprove = async (id: number) => {
    try {
      await axiosInstance.post(`${API}/budgets/${id}/approve/`);
      notification.success({ message: "Presupuesto aprobado" });
      query.refetch();
    } catch (e: any) {
      console.error("Error approving budget:", e);
      const errorMsg = e?.response?.data?.detail || e?.response?.data?.error || "Error al aprobar";
      notification.error({ message: errorMsg });
    }
  };

  const handleCreateOT = async (budget: any) => {
    setCreatingOT(budget.id);
    try {
      const { data: newOT } = await axiosInstance.post(`${API}/budgets/${budget.id}/create-work-order/`, {
        title: `OT — PRE-${String(budget.id).padStart(4, "0")} ${budget.client_name}`,
      });
      notification.success({
        message: "Orden de Trabajo creada",
        description: `OT #${newOT.id} creada a partir del presupuesto.`,
      });
      router.push(`/work-orders/${newOT.id}`);
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "Error al crear OT" });
    } finally {
      setCreatingOT(null);
    }
  };

  const columns = [
    {
      title: "#",
      dataIndex: "id",
      width: 80,
      render: (id: number) => (
        <Text type="secondary" style={{ fontSize: 12 }}>PRE-{String(id).padStart(4, "0")}</Text>
      ),
    },
    {
      title: "Cliente",
      dataIndex: "client_name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 120,
      render: (s: string) => {
        const cfg = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.borrador;
        return <Tag color={cfg.color as any}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Items",
      dataIndex: "items",
      width: 80,
      render: (items: any[]) => <Text type="secondary">{items?.length || 0}</Text>,
    },
    {
      title: "Total",
      dataIndex: "total_amount",
      width: 130,
      render: (v: number) => (
        <Text strong style={{ color: "#52c41a" }}>
          ${Number(v || 0).toLocaleString("es-AR")}
        </Text>
      ),
    },
    {
      title: "OT vinculada",
      dataIndex: "work_order",
      width: 120,
      render: (woId: number | null) =>
        woId ? (
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={(e) => { e.stopPropagation(); router.push(`/work-orders/${woId}`); }}
            style={{ padding: 0 }}
          >
            OT #{woId}
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ),
    },
    {
      title: "Emisión",
      dataIndex: "issue_date",
      width: 120,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format("DD/MM/YYYY")}</Text>,
    },
    {
      title: "Acciones",
      width: 150,
      render: (_: any, record: any) => (
        <Space size="middle" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Ver detalle">
            <Button
              shape="circle"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/budgets/${record.id}`)}
              style={{ border: "1px solid #e2e8f0", color: "#64748b" }}
            />
          </Tooltip>
          {record.status === "borrador" && (
            <Popconfirm
              title="¿Aprobar presupuesto?"
              onConfirm={() => handleApprove(record.id)}
            >
              <Button 
                size="small" 
                type="text"
                style={{ color: "#10b981", fontWeight: 600, background: "#ecfdf5", borderRadius: 6 }}
              >
                Aprobar
              </Button>
            </Popconfirm>
          )}
          {record.status === "aprobado" && (
            <Button 
              size="small" 
              icon={<FileTextOutlined />}
              onClick={() => setBillingModal({
                open: true,
                budgetId: record.id,
                clientName: record.client_name,
                totalAmount: record.total_amount
              })}
              style={{ color: "#3b82f6", fontWeight: 600, background: "#eff6ff", borderRadius: 6 }}
            >
              Facturar
            </Button>
          )}
          {record.status === "aprobado" && !record.work_order && (
            <Button
              size="small"
              type="primary"
              loading={creatingOT === record.id}
              onClick={() => handleCreateOT(record)}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              Crear OT
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleInvoice = async (id: number) => {
    try {
      await axiosInstance.post(`${API}/budgets/${id}/invoice/`);
      notification.success({ message: "Presupuesto facturado" });
      query.refetch();
    } catch {
      notification.error({ message: "Error al facturar" });
    }
  };

  return (
    <div style={{ padding: "32px", background: "#f1f5f9", minHeight: "100vh" }}>
      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#0f172a", fontWeight: 800 }}>Presupuestos</Title>
          <Text style={{ color: "#64748b", fontSize: 15 }}>Gestión centralizada de cotizaciones y emisión de órdenes.</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => router.push("/budgets/create")}
          style={{ 
            borderRadius: 12, 
            height: 48, 
            padding: "0 24px",
            background: "#0f172a", 
            boxShadow: "0 4px 12px rgba(15,23,42,0.15)",
            fontWeight: 600
          }}
        >
          Nuevo Presupuesto
        </Button>
      </div>

      {/* Stats Quick Filters */}
      <div style={{ 
        display: "flex", gap: 12, marginBottom: 24, overflowX: "auto", paddingBottom: 8,
        scrollbarWidth: "none"
      }}>
        <div 
          onClick={() => setStatusFilter("all")}
          style={{
            cursor: "pointer", padding: "10px 20px", borderRadius: 12,
            background: statusFilter === "all" ? "#0f172a" : "#fff",
            color: statusFilter === "all" ? "#fff" : "#64748b",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            border: `1px solid ${statusFilter === "all" ? "#0f172a" : "#e2e8f0"}`,
            transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8
          }}
        >
          <Text style={{ color: "inherit", fontWeight: 600 }}>Todos</Text>
          <Badge count={allBudgets.length} style={{ backgroundColor: statusFilter === "all" ? "#334155" : "#f1f5f9", color: statusFilter === "all" ? "#fff" : "#64748b", boxShadow: "none" }} />
        </div>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = allBudgets.filter((b) => b.status === key).length;
          const isActive = statusFilter === key;
          return (
            <div 
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                cursor: "pointer", padding: "10px 20px", borderRadius: 12,
                background: isActive ? "#0f172a" : "#fff",
                color: isActive ? "#fff" : "#64748b",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                border: `1px solid ${isActive ? "#0f172a" : "#e2e8f0"}`,
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8
              }}
            >
              <Text style={{ color: "inherit", fontWeight: 600 }}>{cfg.label}</Text>
              <Badge count={count} style={{ backgroundColor: isActive ? "#334155" : "#f1f5f9", color: isActive ? "#fff" : "#64748b", boxShadow: "none" }} />
            </div>
          );
        })}
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.04)", overflow: "hidden" }}
        styles={{ body: { padding: 0 } }}
      >
        {/* Filters Toolbar */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
            <Input
              placeholder="Buscar por PRE-# o Cliente..."
              prefix={<SearchOutlined style={{ color: "#94a3b8", marginRight: 8 }} />}
              size="large"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: 400, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>
              Mostrando {filteredBudgets.length} resultados
            </Text>
            {(searchText || statusFilter !== "all") && (
              <Button 
                type="text" 
                icon={<ClearOutlined />} 
                onClick={() => { setSearchText(""); setStatusFilter("all"); }}
                style={{ color: "#ef4444", fontWeight: 500 }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        <style>{`
          .budget-table .ant-table-thead > tr > th {
            background: #fff !important;
            color: #64748b !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            border-bottom: 1px solid #f1f5f9 !important;
            padding: 16px 24px !important;
          }
          .budget-table .ant-table-tbody > tr > td {
            padding: 18px 24px !important;
            border-bottom: 1px solid #f1f5f9 !important;
          }
          .budget-table .ant-table-tbody > tr:hover > td {
            background: #f8fafc !important;
          }
        `}</style>
        
        <Table
          className="budget-table"
          columns={columns}
          dataSource={filteredBudgets}
          rowKey="id"
          loading={query.isLoading}
          pagination={{ 
            pageSize: 15,
            showSizeChanger: false,
            position: ["bottomRight"],
            style: { margin: "24px" }
          }}
          onRow={(record) => ({
            onClick: () => router.push(`/budgets/${record.id}`),
            style: { cursor: "pointer" }
          })}
        />
      </Card>

      <BillingModal
        open={billingModal.open}
        onClose={() => setBillingModal({ ...billingModal, open: false })}
        onSuccess={() => query.refetch()}
        budgetId={billingModal.budgetId || 0}
        clientName={billingModal.clientName}
        totalAmount={billingModal.totalAmount}
      />
    </div>
  );
}
