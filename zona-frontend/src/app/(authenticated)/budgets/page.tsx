"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useList } from "@refinedev/core";
import {
  Typography, Button, Card, Tag, Table, Space, Tooltip,
  notification, Popconfirm,
} from "antd";
import {
  PlusOutlined, EyeOutlined, CheckCircleOutlined,
  FileTextOutlined, LinkOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const API = "http://localhost:8000/api/v1";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  borrador:  { color: "default", label: "Borrador"  },
  aprobado:  { color: "success", label: "Aprobado"  },
  rechazado: { color: "error",   label: "Rechazado" },
  facturado: { color: "blue",    label: "Facturado" },
};

export default function BudgetsPage() {
  const router = useRouter();
  const [creatingOT, setCreatingOT] = useState<number | null>(null);

  const { query, result, refetch } = useList({
    resource: "budgets",
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 50 },
  });

  const budgets: any[] = result?.data || [];

  const handleApprove = async (id: number) => {
    try {
      await axiosInstance.post(`${API}/budgets/${id}/approve/`);
      notification.success({ message: "Presupuesto aprobado" });
      refetch();
    } catch {
      notification.error({ message: "Error al aprobar" });
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
        const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.borrador;
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
            onClick={() => router.push(`/work-orders/${woId}`)}
            style={{ padding: 0 }}
          >
            OT #{woId}
          </Button>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ),
    },
    {
      title: "Fecha",
      dataIndex: "created_at",
      width: 120,
      render: (d: string) => <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(d).format("DD/MM/YYYY")}</Text>,
    },
    {
      title: "Acciones",
      width: 180,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="Ver detalle">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/budgets/${record.id}`)}
            />
          </Tooltip>
          {record.status === "borrador" && (
            <Popconfirm
              title="¿Aprobar este presupuesto?"
              onConfirm={() => handleApprove(record.id)}
              okText="Aprobar"
            >
              <Button size="small" icon={<CheckCircleOutlined />} style={{ color: "#52c41a", borderColor: "#52c41a" }}>
                Aprobar
              </Button>
            </Popconfirm>
          )}
          {record.status === "aprobado" && !record.work_order && (
            <Button
              size="small"
              type="primary"
              icon={<FileTextOutlined />}
              loading={creatingOT === record.id}
              onClick={() => handleCreateOT(record)}
            >
              Crear OT
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: "#0f172a" }}>Presupuestos</Title>
          <Text type="secondary">Gestioná los presupuestos y generá órdenes de trabajo.</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => router.push("/budgets/create")}
          style={{ borderRadius: 8, background: "#0f172a", borderColor: "#0f172a" }}
        >
          Nuevo Presupuesto
        </Button>
      </div>

      {/* Stats pills */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = budgets.filter((b) => b.status === key).length;
          return (
            <span key={key} style={{
              padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: "#f5f5f5", color: "#595959",
            }}>
              {count} {cfg.label}{count !== 1 ? "s" : ""}
            </span>
          );
        })}
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <Table
          columns={columns}
          dataSource={budgets}
          rowKey="id"
          loading={query.isLoading}
          pagination={{ pageSize: 20 }}
          size="small"
        />
      </Card>
    </div>
  );
}
