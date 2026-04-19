"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useList } from "@refinedev/core";
import {
  Typography, Table, Tag, Button, Progress, Tooltip, Space, Spin, Empty,
} from "antd";
import { PlusOutlined, FireOutlined, ClockCircleOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const statusConfig: Record<string, { color: string; label: string }> = {
  pendiente:  { color: "default",    label: "Pendiente"  },
  en_proceso: { color: "processing", label: "En Proceso" },
  pausada:    { color: "warning",    label: "Pausada"    },
  completada: { color: "success",    label: "Completada" },
  cancelada:  { color: "error",      label: "Cancelada"  },
};

function calcProgress(tasks: any[]) {
  if (!tasks?.length) return 0;
  return Math.round((tasks.filter((t) => t.status === "completada").length / tasks.length) * 100);
}

export default function WorkOrdersPage() {
  const router = useRouter();

  const { query, result } = useList({
    resource: "work-orders",
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 20 },
  });

  const data: any[] = result?.data || [];

  const columns = [
    {
      title: "#",
      dataIndex: "id",
      width: 60,
      render: (id: number) => <Text strong style={{ color: "#1890ff" }}>#{id}</Text>,
    },
    {
      title: "Título",
      dataIndex: "title",
      render: (title: string, record: any) => (
        <div>
          <Text strong>{title}</Text>
          {record.client_name && (
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>{record.client_name}</Text>
          )}
        </div>
      ),
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 120,
      render: (status: string) => {
        const cfg = statusConfig[status] || { color: "default", label: status };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: "Prioridad",
      dataIndex: "priority",
      width: 110,
      render: (priority: string) =>
        priority === "inmediata" ? (
          <Tag color="red" icon={<FireOutlined />}>Inmediata</Tag>
        ) : (
          <Tag color="default">Normal</Tag>
        ),
    },
    {
      title: "Progreso",
      dataIndex: "tasks",
      width: 160,
      render: (tasks: any[]) => {
        const pct = calcProgress(tasks);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Progress
              percent={pct}
              size="small"
              strokeColor={pct === 100 ? "#52c41a" : "#1890ff"}
              style={{ flex: 1, margin: 0 }}
            />
          </div>
        );
      },
    },
    {
      title: "Sectores",
      dataIndex: "tasks",
      width: 200,
      render: (tasks: any[]) => (
        <Space wrap size={4}>
          {tasks?.map((t: any) => (
            <Tag
              key={t.id}
              color={
                t.status === "completada" ? "success"
                : t.status === "en_proceso" ? "processing"
                : t.status === "bloqueada" ? "error"
                : "default"
              }
              style={{ fontSize: 11 }}
            >
              {t.sector_name}
            </Tag>
          ))}
          {(!tasks || tasks.length === 0) && <Text type="secondary" style={{ fontSize: 12 }}>Sin sectores</Text>}
        </Space>
      ),
    },
    {
      title: "Vencimiento",
      dataIndex: "due_date",
      width: 110,
      render: (due: string) => {
        if (!due) return <Text type="secondary">—</Text>;
        const overdue = dayjs().isAfter(dayjs(due));
        return (
          <Tooltip title={dayjs(due).format("DD/MM/YYYY HH:mm")}>
            <span style={{ color: overdue ? "#ff4d4f" : "#52c41a", fontSize: 13 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              {dayjs(due).format("DD/MM")}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/work-orders/${record.id}`)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Órdenes de Trabajo</Title>
          <Text type="secondary">Gestión y seguimiento de todas las OTs</Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => router.push("/work-orders/create")}
        >
          Nueva OT
        </Button>
      </div>

      {query.isLoading ? (
        <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
      ) : data.length === 0 ? (
        <Empty description="No hay órdenes de trabajo" />
      ) : (
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20 }}
            onRow={(record) => ({
              onClick: () => router.push(`/work-orders/${record.id}`),
              style: { cursor: "pointer" },
            })}
          />
        </div>
      )}
    </div>
  );
}
