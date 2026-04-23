"use client";

import React, { useState, useMemo } from "react";
import { useList } from "@refinedev/core";
import {
  Table, Tag, Input, DatePicker, Button, Space, Typography, Tooltip, Avatar, notification, Segmented,
} from "antd";
import {
  SearchOutlined, EyeOutlined, CalendarOutlined, CheckCircleOutlined,
  UserOutlined, RocketOutlined, ClearOutlined, FileProtectOutlined, DollarOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { BillingModal } from "@/components/billing/BillingModal";

const { Text } = Typography;
const { RangePicker } = DatePicker;

export function FinishedWorksTab() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [tab, setTab] = useState<"sin_facturar" | "facturadas">("sin_facturar");
  const [billingModal, setBillingModal] = useState<{ open: boolean; budgetId: number | null; clientName: string; totalAmount: number; workOrderId?: number | null; clientId?: number | null }>({
    open: false, budgetId: null, clientName: "", totalAmount: 0
  });

  const { query, result } = useList({
    resource: "work-orders",
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 500 },
  });

  const allData: any[] = result?.data || [];

  const data = useMemo(() => {
    const statusFilter = tab === "facturadas"
      ? (r: any) => r.status === "facturada"
      : (r: any) => r.status === "completada" || r.status === "entregada";

    let rows = allData.filter(statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) =>
        String(r.id).includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.client_name?.toLowerCase().includes(q)
      );
    }
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      rows = rows.filter((r) => {
        const d = dayjs(r.created_at);
        return d.isAfter(start) && d.isBefore(end);
      });
    }
    return rows;
  }, [allData, search, dateRange, tab]);

  const sinFacturarCount = allData.filter((r) => r.status === "completada" || r.status === "entregada").length;
  const facturadasCount  = allData.filter((r) => r.status === "facturada").length;

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      width: 80,
      render: (id: number) => (
        <span style={{
          background: "#f6ffed", color: "#389e0d",
          padding: "4px 10px", borderRadius: "12px",
          fontWeight: 700, fontSize: 12, border: "1px solid #b7eb8f"
        }}>
          #{id}
        </span>
      ),
    },
    {
      title: "Trabajo Realizado",
      dataIndex: "title",
      render: (title: string, record: any) => (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong style={{ fontSize: 14, color: "#1e293b" }}>{title}</Text>
          <Text type="secondary" style={{ fontSize: 12, marginTop: 2 }}>
            <RocketOutlined style={{ marginRight: 4 }} />
            {record.tasks?.length || 0} sectores completados
          </Text>
        </div>
      ),
    },
    {
      title: "Cliente",
      dataIndex: "client_name",
      render: (client: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar
            size={30}
            icon={<UserOutlined />}
            style={{ backgroundColor: client ? "#e0e7ff" : "#f1f5f9", color: client ? "#4f46e5" : "#94a3b8" }}
          />
          <Text style={{ fontWeight: 500, color: client ? "#334155" : "#94a3b8" }}>
            {client || "Sin asignar"}
          </Text>
        </div>
      ),
    },
    {
      title: "Fecha",
      dataIndex: "created_at",
      width: 180,
      render: (date: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ background: "#f1f5f9", padding: "6px", borderRadius: "8px", color: "#64748b", display: "flex" }}>
            <CalendarOutlined />
          </div>
          <div>
            <Text style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#475569" }}>
              {dayjs(date).format("DD MMM, YYYY")}
            </Text>
            <Text style={{ display: "block", fontSize: 11, color: "#94a3b8" }}>
              {dayjs(date).format("HH:mm")} hs
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 140,
      render: (st: string) => {
        if (st === "facturada") {
          return (
            <Tag
              icon={<DollarOutlined />}
              style={{
                padding: "4px 12px", borderRadius: "20px", fontSize: 12, fontWeight: 600,
                border: "none", background: "#e0f2fe", color: "#0369a1"
              }}
            >
              FACTURADA
            </Tag>
          );
        }
        return (
          <Tag
            icon={<CheckCircleOutlined />}
            color="success"
            style={{
              padding: "4px 12px", borderRadius: "20px", fontSize: 12, fontWeight: 600,
              border: "none", background: "#ecfdf5", color: "#059669"
            }}
          >
            {st === "entregada" ? "ENTREGADA" : "COMPLETADA"}
          </Tag>
        );
      },
    },
    {
      title: "Acciones",
      key: "actions",
      width: 140,
      render: (_: any, record: any) => (
        <Space onClick={(e) => e.stopPropagation()}>
          {record.status !== "facturada" ? (
            <Tooltip title={record.budget ? "Procesar Facturación" : "Generar Factura (Sin presupuesto)"}>
              <Button
                size="small"
                icon={<FileProtectOutlined />}
                onClick={() => {
                  if (!record.client) {
                    notification.warning({ message: "Asigna un cliente a la OT para poder facturarla" });
                    return;
                  }
                  setBillingModal({
                    open: true,
                    budgetId: record.budget || null,
                    workOrderId: record.id,
                    clientId: record.client,
                    clientName: record.client_name,
                    totalAmount: record.total_amount || 0
                  });
                }}
                style={{
                  color: record.budget ? "#3b82f6" : "#f59e0b",
                  background: record.budget ? "#eff6ff" : "#fffbeb",
                  border: record.budget ? "1px solid #dbeafe" : "1px solid #fef3c7"
                }}
              />
            </Tooltip>
          ) : (
            <Tag
              icon={<DollarOutlined />}
              style={{ borderRadius: 8, fontSize: 11, color: "#0369a1", background: "#e0f2fe", border: "1px solid #bae6fd" }}
            >
              Ya facturada
            </Tag>
          )}
          <Tooltip title="Ver detalles de OT">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/work-orders/${record.id}`)}
              style={{ color: "#64748b", border: "1px solid #e2e8f0" }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s" }}>
      {/* Sub-tabs */}
      <div style={{ marginBottom: 20 }}>
        <Segmented
          size="large"
          value={tab}
          onChange={(v) => setTab(v as any)}
          options={[
            { label: `Sin facturar (${sinFacturarCount})`, value: "sin_facturar" },
            { label: `Facturadas (${facturadasCount})`,    value: "facturadas"   },
          ]}
          style={{ borderRadius: 10 }}
        />
      </div>

      {/* Barra de Filtros */}
      <div style={{
        display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap",
        background: "#fff", padding: "16px 20px", borderRadius: "16px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
        alignItems: "center"
      }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>
            BUSCAR TRABAJOS
          </Text>
          <Input
            size="large"
            placeholder="Buscar por #OT, título o nombre de cliente..."
            prefix={<SearchOutlined style={{ color: "#94a3b8", marginRight: 8 }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}
          />
        </div>

        <div style={{ minWidth: 260 }}>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block" }}>
            FILTRAR POR FECHA
          </Text>
          <RangePicker
            size="large"
            placeholder={["Desde", "Hasta"]}
            onChange={(dates) => setDateRange(dates as any)}
            format="DD/MM/YYYY"
            value={dateRange}
            style={{ width: "100%", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}
          />
        </div>

        {(search || dateRange) && (
          <div style={{ display: "flex", alignItems: "flex-end", height: 64 }}>
            <Button
              size="large"
              type="text"
              danger
              icon={<ClearOutlined />}
              onClick={() => { setSearch(""); setDateRange(null); }}
              style={{ fontWeight: 500, borderRadius: "10px" }}
            >
              Limpiar
            </Button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div style={{
        background: "#fff", borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        overflow: "hidden", border: "1px solid #f1f5f9"
      }}>
        <style>{`
          .finished-works-table .ant-table-thead > tr > th {
            background: #f8fafc !important;
            color: #64748b !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 16px 20px !important;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .finished-works-table .ant-table-tbody > tr > td {
            padding: 20px !important;
            border-bottom: 1px solid #f1f5f9 !important;
            transition: all 0.2s ease;
          }
          .finished-works-table .ant-table-tbody > tr:hover > td {
            background: #f8fafc !important;
          }
          .finished-works-table .ant-pagination {
            padding: 16px 24px !important;
            margin: 0 !important;
            border-top: 1px solid #f1f5f9;
          }
        `}</style>
        <Table
          className="finished-works-table"
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={query.isLoading}
          pagination={{
            pageSize: 15,
            showTotal: (total) => `Total: ${total} trabajos`,
          }}
          onRow={(record) => ({
            onClick: () => router.push(`/work-orders/${record.id}`),
            style: { cursor: "pointer" },
          })}
        />
      </div>

      <BillingModal
        open={billingModal.open}
        onClose={() => setBillingModal({ ...billingModal, open: false })}
        onSuccess={() => query.refetch()}
        budgetId={billingModal.budgetId || 0}
        workOrderId={billingModal.workOrderId}
        clientId={billingModal.clientId}
        clientName={billingModal.clientName}
        totalAmount={billingModal.totalAmount}
      />
    </div>
  );
}
