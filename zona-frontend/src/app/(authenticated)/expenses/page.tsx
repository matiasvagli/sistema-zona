"use client";

import React, { useState, useCallback } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import {
  Table, Button, Tag, Modal, Form, Input, InputNumber,
  Select, DatePicker, Space, Typography, Popconfirm,
  Row, Col, Card, notification, Divider, Tooltip, Empty,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  DollarOutlined, ShoppingOutlined, HomeOutlined,
  FilterOutlined, ReloadOutlined, CalendarOutlined,
  FileTextOutlined, BankOutlined, TagOutlined,
  UserOutlined, LinkOutlined, CheckCircleOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

type ExpenseCategory = "insumo" | "servicio" | "alquiler" | "otro";

interface Expense {
  id: number;
  category: ExpenseCategory;
  category_display: string;
  description: string;
  amount: string;
  date: string;
  work_order: number | null;
  work_order_title: string | null;
  registered_by_name: string;
  created_at: string;
}

const CAT_CONFIG: Record<ExpenseCategory, { color: string; label: string; bg: string; icon: React.ReactNode; solid: string }> = {
  insumo:   { color: "#1677ff", label: "Insumo",   bg: "#e6f4ff", icon: <ShoppingOutlined />,  solid: "#1677ff" },
  servicio: { color: "#7c3aed", label: "Servicio", bg: "#f3e8ff", icon: <FileTextOutlined />,  solid: "#7c3aed" },
  alquiler: { color: "#d97706", label: "Alquiler", bg: "#fffbeb", icon: <HomeOutlined />,       solid: "#d97706" },
  otro:     { color: "#64748b", label: "Otro",     bg: "#f1f5f9", icon: <TagOutlined />,        solid: "#64748b" },
};

export default function FinanzasPage() {
  const { data: identity } = useGetIdentity<any>();
  const isAdmin = !!(identity?.rol === "admin" || identity?.rol === "ceo" || identity?.is_staff);

  const [refreshKey, setRefreshKey] = useState(0);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [modal, setModal] = useState<{ open: boolean; editing: Expense | null }>({ open: false, editing: null });
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const { result: expensesResult, query: expensesQuery } = useList<Expense>({
    resource: "expenses",
    queryOptions: { queryKey: ["expenses", refreshKey] },
    filters: catFilter ? [{ field: "category", operator: "eq", value: catFilter }] : [],
    pagination: { pageSize: 200 },
  });

  const allExpenses: Expense[] = expensesResult?.data ?? [];
  const expenses: Expense[] = dateRange
    ? allExpenses.filter((e) => {
        const d = dayjs(e.date);
        return (d.isAfter(dateRange[0].subtract(1, "day")) && d.isBefore(dateRange[1].add(1, "day")));
      })
    : allExpenses;
  const totalAmount = expenses.reduce((acc: number, e: Expense) => acc + parseFloat(e.amount), 0);
  const insumos    = expenses.filter((e) => e.category === "insumo").reduce((a, e) => a + parseFloat(e.amount), 0);
  const servicios  = expenses.filter((e) => e.category === "servicio").reduce((a, e) => a + parseFloat(e.amount), 0);
  const alquiler   = expenses.filter((e) => e.category === "alquiler").reduce((a, e) => a + parseFloat(e.amount), 0);

  const openCreate = () => {
    form.resetFields();
    form.setFieldValue("date", dayjs());
    setModal({ open: true, editing: null });
  };

  const openEdit = (record: Expense) => {
    form.setFieldsValue({
      ...record,
      amount: parseFloat(record.amount),
      date: dayjs(record.date),
    });
    setModal({ open: true, editing: record });
  };

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = { ...values, date: values.date.format("YYYY-MM-DD") };

      if (modal.editing) {
        await axiosInstance.patch(`${API}/expenses/${modal.editing.id}/`, payload);
        notification.success({ message: "Gasto actualizado correctamente" });
      } else {
        await axiosInstance.post(`${API}/expenses/`, payload);
        notification.success({ message: "Gasto registrado correctamente" });
      }

      setModal({ open: false, editing: null });
      refresh();
    } catch (e: any) {
      if (e?.errorFields) return;
      notification.error({ message: "Error al guardar el gasto" });
    } finally {
      setSaving(false);
    }
  }, [form, modal.editing, refresh]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await axiosInstance.delete(`${API}/expenses/${id}/`);
      notification.success({ message: "Gasto eliminado" });
      refresh();
    } catch {
      notification.error({ message: "Error al eliminar" });
    }
  }, [refresh]);

  const fmtARS = (v: number) =>
    `$${v.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

  const statCards = [
    {
      title: "Total gastos",
      value: totalAmount,
      icon: <DollarOutlined />,
      color: "#dc2626",
      bg: "#fef2f2",
    },
    {
      title: "Insumos",
      value: insumos,
      icon: <ShoppingOutlined />,
      color: "#1677ff",
      bg: "#e6f4ff",
    },
    {
      title: "Servicios",
      value: servicios,
      icon: <FileTextOutlined />,
      color: "#7c3aed",
      bg: "#f3e8ff",
    },
    {
      title: "Alquiler",
      value: alquiler,
      icon: <HomeOutlined />,
      color: "#d97706",
      bg: "#fffbeb",
    },
  ];

  const FILTER_OPTS: { key: string | null; label: string }[] = [
    { key: null, label: "Todos" },
    { key: "insumo", label: "Insumo" },
    { key: "servicio", label: "Servicio" },
    { key: "alquiler", label: "Alquiler" },
    { key: "otro", label: "Otro" },
  ];

  const columns = [
    {
      title: "Fecha",
      dataIndex: "date",
      key: "date",
      width: 110,
      render: (d: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CalendarOutlined style={{ color: "#94a3b8", fontSize: 12 }} />
          <Text style={{ fontSize: 13 }}>{dayjs(d).format("DD/MM/YYYY")}</Text>
        </div>
      ),
      sorter: (a: Expense, b: Expense) => a.date.localeCompare(b.date),
      defaultSortOrder: "descend" as const,
    },
    {
      title: "Categoría",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (cat: ExpenseCategory) => {
        const cfg = CAT_CONFIG[cat];
        if (!cfg) return <Tag>{cat}</Tag>;
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: cfg.bg, color: cfg.color, fontWeight: 600,
            fontSize: 12, padding: "4px 10px", borderRadius: 20,
          }}>
            {cfg.icon} {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
      render: (v: string) => (
        <Text style={{ fontSize: 13, color: "#1e293b" }}>{v}</Text>
      ),
    },
    {
      title: "Monto",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (a: string) => (
        <Text strong style={{ fontSize: 14, color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>
          {fmtARS(parseFloat(a))}
        </Text>
      ),
      sorter: (a: Expense, b: Expense) => parseFloat(a.amount) - parseFloat(b.amount),
    },
    {
      title: "OT vinculada",
      dataIndex: "work_order_title",
      key: "work_order",
      width: 160,
      render: (t: string | null) =>
        t ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "#e0e7ff", color: "#4338ca", fontWeight: 600,
            fontSize: 11, padding: "3px 10px", borderRadius: 20,
          }}>
            <LinkOutlined style={{ fontSize: 10 }} /> {t}
          </span>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
        ),
    },
    {
      title: "Registrado por",
      dataIndex: "registered_by_name",
      key: "registered_by",
      width: 160,
      render: (v: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <UserOutlined style={{ color: "#94a3b8", fontSize: 11 }} />
          <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>
        </div>
      ),
    },
    ...(isAdmin ? [{
      title: "",
      key: "actions",
      width: 80,
      render: (_: any, record: Expense) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button
              size="small" type="text"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
              style={{ color: "#64748b", borderRadius: 6 }}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar este gasto?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar" okButtonProps={{ danger: true }}
            cancelText="Cancelar"
          >
            <Tooltip title="Eliminar">
              <Button size="small" type="text" icon={<DeleteOutlined />} danger style={{ borderRadius: 6 }} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1677ff 100%)",
        borderRadius: 16, padding: "24px 28px", marginBottom: 24,
        boxShadow: "0 8px 32px rgba(15,23,42,0.25)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 20,
            }}>
              <BankOutlined />
            </div>
            <div>
              <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, letterSpacing: "-0.5px" }}>
                Finanzas
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                Registro y control de gastos operativos
              </Text>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {/* Resumen rápido en el header */}
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{expenses.length}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 3 }}>registros</div>
          </div>
          <div style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
            <div style={{ color: "#fca5a5", fontSize: 22, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              {fmtARS(totalAmount)}
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 3 }}>total gastos</div>
          </div>

          <Button icon={<ReloadOutlined />} onClick={refresh}
            style={{ borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff" }}
          />

          {isAdmin && (
            <Button
              type="primary" icon={<PlusOutlined />} onClick={openCreate}
              style={{
                borderRadius: 8, fontWeight: 600,
                background: "rgba(255,255,255,0.95)", color: "#1e3a8a",
                border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
            >
              Registrar gasto
            </Button>
          )}
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {statCards.map((s) => (
          <Col key={s.title} xs={24} sm={12} md={6}>
            <Card
              variant="borderless"
              style={{ borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
              styles={{ body: { padding: "18px 20px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: s.bg, color: s.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>
                    {fmtARS(s.value)}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Tabla ──────────────────────────────────────────────────── */}
      <Card
        variant="borderless"
        style={{ borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
        styles={{ body: { padding: 0 } }}
      >
        {/* Toolbar */}
        <div style={{
          padding: "16px 20px", display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 12,
          borderBottom: "1px solid #f1f5f9",
        }}>
          <Space size={8} wrap>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "#e6f4ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#1677ff", fontSize: 14 }}>
                <FilterOutlined />
              </div>
              <Text strong style={{ fontSize: 14, color: "#1e293b" }}>Categoría</Text>
            </div>
            {FILTER_OPTS.map(({ key, label }) => {
              const cfg = key ? CAT_CONFIG[key as ExpenseCategory] : null;
              const isActive = catFilter === key;
              return (
                <button
                  key={key ?? "todos"}
                  onClick={() => setCatFilter(key)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 20,
                    border: isActive
                      ? `1.5px solid ${cfg?.color ?? "#1677ff"}`
                      : "1.5px solid #e2e8f0",
                    background: isActive ? (cfg?.bg ?? "#e6f4ff") : "#fff",
                    color: isActive ? (cfg?.color ?? "#1677ff") : "#64748b",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13, cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                >
                  {cfg && <span style={{ fontSize: 12 }}>{cfg.icon}</span>}
                  {label}
                </button>
              );
            })}
          </Space>

          <Space size={8}>
            <CalendarOutlined style={{ color: "#64748b" }} />
            <RangePicker
              format="DD/MM/YYYY"
              placeholder={["Desde", "Hasta"]}
              value={dateRange}
              onChange={(vals) => setDateRange(vals as [Dayjs, Dayjs] | null)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Space>
        </div>

        <Table
          dataSource={expenses}
          columns={columns}
          rowKey="id"
          loading={expensesQuery.isLoading}
          size="middle"
          pagination={{ pageSize: 50, showSizeChanger: false, showTotal: (t) => `${t} gastos` }}
          style={{ borderRadius: "0 0 14px 14px" }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="secondary">No hay gastos registrados</Text>}
                style={{ padding: "40px 0" }}
              />
            ),
          }}
          rowClassName={() => "expense-row"}
        />
      </Card>

      {/* ── Modal Registrar / Editar Gasto ──────────────────────────── */}
      <Modal
        open={modal.open}
        onCancel={() => setModal({ open: false, editing: null })}
        onOk={handleSave}
        okText={modal.editing ? "Guardar cambios" : "Registrar gasto"}
        cancelText="Cancelar"
        confirmLoading={saving}
        width={560}
        centered
        okButtonProps={{ style: { borderRadius: 8, fontWeight: 600, height: 38 } }}
        cancelButtonProps={{ style: { borderRadius: 8, height: 38 } }}
        styles={{
          header: { paddingBottom: 0 },
          content: { borderRadius: 16, padding: 0, overflow: "hidden" },
        }}
        title={null}
        footer={null}
      >
        {/* Header del modal */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1677ff 100%)",
          padding: "22px 24px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 18,
            }}>
              {modal.editing ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>
                {modal.editing ? "Editar gasto" : "Registrar nuevo gasto"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 }}>
                {modal.editing
                  ? "Modificá los datos del gasto seleccionado"
                  : "Completá el formulario para registrar un gasto operativo"}
              </div>
            </div>
          </div>
        </div>

        {/* Body del modal */}
        <div style={{ padding: "24px" }}>
          <Form form={form} layout="vertical" requiredMark="optional">

            {/* Fila 1: Categoría + Fecha */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label={<Text strong style={{ fontSize: 13 }}>Categoría</Text>}
                  rules={[{ required: true, message: "Seleccioná una categoría" }]}
                >
                  <Select
                    placeholder="Seleccionar..."
                    size="large"
                    style={{ borderRadius: 8 }}
                    options={Object.entries(CAT_CONFIG).map(([v, cfg]) => ({
                      value: v,
                      label: (
                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: cfg.color }}>{cfg.icon}</span>
                          {cfg.label}
                        </span>
                      ),
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="date"
                  label={<Text strong style={{ fontSize: 13 }}>Fecha del gasto</Text>}
                  rules={[{ required: true, message: "Indicá la fecha" }]}
                >
                  <DatePicker
                    style={{ width: "100%", borderRadius: 8 }}
                    format="DD/MM/YYYY"
                    size="large"
                    placeholder="DD/MM/AAAA"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Descripción */}
            <Form.Item
              name="description"
              label={<Text strong style={{ fontSize: 13 }}>Descripción</Text>}
              rules={[{ required: true, message: "Agregá una descripción" }]}
            >
              <Input
                size="large"
                placeholder="Ej: Resmas A4, factura luz febrero, alquiler depósito..."
                style={{ borderRadius: 8 }}
                prefix={<FileTextOutlined style={{ color: "#94a3b8" }} />}
              />
            </Form.Item>

            {/* Monto */}
            <Form.Item
              name="amount"
              label={<Text strong style={{ fontSize: 13 }}>Monto total</Text>}
              rules={[{ required: true, message: "Ingresá el monto" }]}
            >
              <InputNumber
                style={{ width: "100%", borderRadius: 8 }}
                size="large"
                min={0.01}
                step={100}
                prefix={<span style={{ color: "#94a3b8", fontWeight: 700 }}>$</span>}
                placeholder="0,00"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              />
            </Form.Item>

            {/* OT vinculada */}
            <Form.Item
              name="work_order"
              label={
                <span>
                  <Text strong style={{ fontSize: 13 }}>OT vinculada</Text>
                  <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>(opcional)</Text>
                </span>
              }
            >
              <InputNumber
                style={{ width: "100%", borderRadius: 8 }}
                size="large"
                placeholder="ID de la orden de trabajo"
                min={1}
                prefix={<LinkOutlined style={{ color: "#94a3b8" }} />}
              />
            </Form.Item>

            {/* Divider + botones */}
            <Divider style={{ margin: "8px 0 20px" }} />

            <Row gutter={12}>
              <Col span={12}>
                <Button
                  block size="large"
                  onClick={() => setModal({ open: false, editing: null })}
                  style={{ borderRadius: 8, fontWeight: 600, height: 42 }}
                >
                  Cancelar
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block size="large" type="primary"
                  loading={saving}
                  onClick={handleSave}
                  icon={modal.editing ? <CheckCircleOutlined /> : <PlusOutlined />}
                  style={{ borderRadius: 8, fontWeight: 600, height: 42 }}
                >
                  {modal.editing ? "Guardar cambios" : "Registrar gasto"}
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </Modal>

      {/* Row hover styles */}
      <style>{`
        .expense-row:hover td {
          background: #f8fafc !important;
          transition: background 0.15s;
        }
      `}</style>
    </div>
  );
}
