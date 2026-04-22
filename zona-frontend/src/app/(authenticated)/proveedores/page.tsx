"use client";

import React, { useState, useCallback } from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import {
  Table, Button, Tag, Modal, Form, Input, InputNumber,
  Select, DatePicker, Space, Typography, Popconfirm,
  Row, Col, Card, notification, Divider, Tooltip, Tabs,
  Upload, Badge,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
  ShopOutlined, FileTextOutlined, UploadOutlined,
  CalendarOutlined, DollarOutlined, LinkOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface Supplier {
  id: number;
  name: string;
  cuit: string;
  phone: string;
  email: string;
  notes: string;
  invoice_count: number;
  pending_amount: number;
}

interface SupplierInvoice {
  id: number;
  supplier: number;
  supplier_name: string;
  invoice_number: string;
  amount: string;
  date: string;
  due_date: string | null;
  status: "pendiente" | "pagada";
  status_display: string;
  paid_at: string | null;
  pdf: string | null;
  purchase_request: number | null;
  purchase_request_info: { id: number; product_name: string; quantity_requested: string } | null;
  notes: string;
  registered_by_name: string;
}

const fmtARS = (v: number | string) =>
  `$${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

export default function ProveedoresPage() {
  const { data: identity } = useGetIdentity<any>();
  const isAdmin = !!(identity?.rol === "admin" || identity?.rol === "ceo" || identity?.is_staff);

  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // ── Proveedores ────────────────────────────────────────────
  const [supplierModal, setSupplierModal] = useState<{ open: boolean; editing: Supplier | null }>({ open: false, editing: null });
  const [supplierForm] = Form.useForm();
  const [savingSupplier, setSavingSupplier] = useState(false);

  const { result: suppliersResult } = useList<Supplier>({
    resource: "suppliers",
    queryOptions: { queryKey: ["suppliers", refreshKey] },
    pagination: { pageSize: 200 },
  });
  const suppliers: Supplier[] = suppliersResult?.data ?? [];

  // ── Facturas ───────────────────────────────────────────────
  const [invoiceModal, setInvoiceModal] = useState<{ open: boolean; editing: SupplierInvoice | null }>({ open: false, editing: null });
  const [invoiceForm] = Form.useForm();
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const { result: invoicesResult, query: invoicesQuery } = useList<SupplierInvoice>({
    resource: "supplier-invoices",
    queryOptions: { queryKey: ["invoices", refreshKey, statusFilter] },
    filters: statusFilter ? [{ field: "status", operator: "eq", value: statusFilter }] : [],
    pagination: { pageSize: 300 },
  });

  const allInvoices: SupplierInvoice[] = invoicesResult?.data ?? [];
  const invoices = dateRange
    ? allInvoices.filter((inv) => {
        const d = dayjs(inv.date);
        return d.isAfter(dateRange[0].subtract(1, "day")) && d.isBefore(dateRange[1].add(1, "day"));
      })
    : allInvoices;

  const pendingTotal = allInvoices.filter(i => i.status === "pendiente").reduce((a, i) => a + parseFloat(i.amount), 0);
  const pendingCount = allInvoices.filter(i => i.status === "pendiente").length;
  const overdueCount = allInvoices.filter(i =>
    i.status === "pendiente" && i.due_date && dayjs(i.due_date).isBefore(dayjs())
  ).length;

  // ── Handlers proveedores ───────────────────────────────────
  const openCreateSupplier = () => {
    supplierForm.resetFields();
    setSupplierModal({ open: true, editing: null });
  };

  const openEditSupplier = (s: Supplier) => {
    supplierForm.setFieldsValue(s);
    setSupplierModal({ open: true, editing: s });
  };

  const handleSaveSupplier = useCallback(async () => {
    try {
      const values = await supplierForm.validateFields();
      setSavingSupplier(true);
      if (supplierModal.editing) {
        await axiosInstance.patch(`${API}/suppliers/${supplierModal.editing.id}/`, values);
        notification.success({ message: "Proveedor actualizado" });
      } else {
        await axiosInstance.post(`${API}/suppliers/`, values);
        notification.success({ message: "Proveedor creado" });
      }
      setSupplierModal({ open: false, editing: null });
      refresh();
    } catch (e: any) {
      if (e?.errorFields) return;
      notification.error({ message: "Error al guardar" });
    } finally {
      setSavingSupplier(false);
    }
  }, [supplierForm, supplierModal.editing, refresh]);

  const handleDeleteSupplier = useCallback(async (id: number) => {
    try {
      await axiosInstance.delete(`${API}/suppliers/${id}/`);
      notification.success({ message: "Proveedor eliminado" });
      refresh();
    } catch {
      notification.error({ message: "No se puede eliminar — tiene facturas asociadas" });
    }
  }, [refresh]);

  // ── Handlers facturas ──────────────────────────────────────
  const openCreateInvoice = () => {
    invoiceForm.resetFields();
    invoiceForm.setFieldValue("date", dayjs());
    setPdfFile(null);
    setInvoiceModal({ open: true, editing: null });
  };

  const openEditInvoice = (inv: SupplierInvoice) => {
    invoiceForm.setFieldsValue({
      ...inv,
      amount: parseFloat(inv.amount),
      date: dayjs(inv.date),
      due_date: inv.due_date ? dayjs(inv.due_date) : null,
    });
    setPdfFile(null);
    setInvoiceModal({ open: true, editing: inv });
  };

  const handleSaveInvoice = useCallback(async () => {
    try {
      const values = await invoiceForm.validateFields();
      setSavingInvoice(true);

      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        if (k === "date" || k === "due_date") {
          formData.append(k, (v as Dayjs).format("YYYY-MM-DD"));
        } else {
          formData.append(k, String(v));
        }
      });
      if (pdfFile) formData.append("pdf", pdfFile);

      if (invoiceModal.editing) {
        await axiosInstance.patch(`${API}/supplier-invoices/${invoiceModal.editing.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        notification.success({ message: "Factura actualizada" });
      } else {
        await axiosInstance.post(`${API}/supplier-invoices/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        notification.success({ message: "Factura registrada" });
      }
      setInvoiceModal({ open: false, editing: null });
      refresh();
    } catch (e: any) {
      if (e?.errorFields) return;
      notification.error({ message: "Error al guardar" });
    } finally {
      setSavingInvoice(false);
    }
  }, [invoiceForm, invoiceModal.editing, pdfFile, refresh]);

  const handleMarkPaid = useCallback(async (id: number) => {
    try {
      await axiosInstance.post(`${API}/supplier-invoices/${id}/mark_paid/`);
      notification.success({ message: "Factura marcada como pagada" });
      refresh();
    } catch {
      notification.error({ message: "Error al marcar como pagada" });
    }
  }, [refresh]);

  const handleDeleteInvoice = useCallback(async (id: number) => {
    try {
      await axiosInstance.delete(`${API}/supplier-invoices/${id}/`);
      notification.success({ message: "Factura eliminada" });
      refresh();
    } catch {
      notification.error({ message: "Error al eliminar" });
    }
  }, [refresh]);

  // ── Columnas ───────────────────────────────────────────────
  const supplierColumns = [
    {
      title: "Proveedor",
      dataIndex: "name",
      key: "name",
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: "CUIT", dataIndex: "cuit", key: "cuit", render: (v: string) => v || <Text type="secondary">—</Text> },
    { title: "Teléfono", dataIndex: "phone", key: "phone", render: (v: string) => v || <Text type="secondary">—</Text> },
    { title: "Email", dataIndex: "email", key: "email", render: (v: string) => v || <Text type="secondary">—</Text> },
    {
      title: "Facturas",
      dataIndex: "invoice_count",
      key: "invoice_count",
      render: (v: number) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Deuda pendiente",
      dataIndex: "pending_amount",
      key: "pending_amount",
      render: (v: number) => v > 0
        ? <Text strong style={{ color: "#dc2626" }}>{fmtARS(v)}</Text>
        : <Text type="secondary">—</Text>,
    },
    ...(isAdmin ? [{
      title: "",
      key: "actions",
      width: 80,
      render: (_: any, record: Supplier) => (
        <Space size={4}>
          <Tooltip title="Editar">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditSupplier(record)} />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar proveedor?"
            description="Solo se puede eliminar si no tiene facturas."
            onConfirm={() => handleDeleteSupplier(record.id)}
            okText="Eliminar" okButtonProps={{ danger: true }} cancelText="Cancelar"
          >
            <Button size="small" type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  const invoiceColumns = [
    {
      title: "Fecha",
      dataIndex: "date",
      key: "date",
      width: 105,
      render: (d: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <CalendarOutlined style={{ color: "#94a3b8", fontSize: 11 }} />
          <Text style={{ fontSize: 12 }}>{dayjs(d).format("DD/MM/YYYY")}</Text>
        </div>
      ),
      sorter: (a: SupplierInvoice, b: SupplierInvoice) => a.date.localeCompare(b.date),
      defaultSortOrder: "descend" as const,
    },
    {
      title: "Proveedor",
      dataIndex: "supplier_name",
      key: "supplier_name",
      render: (v: string) => <Text strong style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: "Nro factura",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (v: string) => v
        ? <Tag color="default" style={{ fontFamily: "monospace" }}>{v}</Tag>
        : <Text type="secondary" style={{ fontSize: 12 }}>S/N</Text>,
    },
    {
      title: "Monto",
      dataIndex: "amount",
      key: "amount",
      render: (a: string) => (
        <Text strong style={{ color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>
          {fmtARS(parseFloat(a))}
        </Text>
      ),
      sorter: (a: SupplierInvoice, b: SupplierInvoice) => parseFloat(a.amount) - parseFloat(b.amount),
    },
    {
      title: "Vencimiento",
      dataIndex: "due_date",
      key: "due_date",
      width: 115,
      render: (d: string | null, record: SupplierInvoice) => {
        if (!d) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
        const isOverdue = record.status === "pendiente" && dayjs(d).isBefore(dayjs());
        return (
          <span style={{ color: isOverdue ? "#dc2626" : "#64748b", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            {isOverdue && <WarningOutlined />}
            {dayjs(d).format("DD/MM/YYYY")}
          </span>
        );
      },
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (s: string) => s === "pagada"
        ? <Tag color="success" icon={<CheckCircleOutlined />}>Pagada</Tag>
        : <Tag color="warning" icon={<ClockCircleOutlined />}>Pendiente</Tag>,
    },
    {
      title: "PDF",
      dataIndex: "pdf",
      key: "pdf",
      width: 60,
      render: (url: string | null) => url
        ? <Tooltip title="Ver factura"><a href={url} target="_blank" rel="noreferrer"><FileTextOutlined style={{ color: "#1677ff", fontSize: 16 }} /></a></Tooltip>
        : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
    },
    {
      title: "Pedido de compra",
      dataIndex: "purchase_request_info",
      key: "pr",
      render: (pr: SupplierInvoice["purchase_request_info"]) => pr
        ? <Tooltip title={`Cantidad: ${pr.quantity_requested}`}>
            <Tag color="geekblue" icon={<LinkOutlined />}>{pr.product_name}</Tag>
          </Tooltip>
        : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>,
    },
    ...(isAdmin ? [{
      title: "",
      key: "actions",
      width: 100,
      render: (_: any, record: SupplierInvoice) => (
        <Space size={4}>
          {record.status === "pendiente" && (
            <Popconfirm
              title="¿Marcar como pagada?"
              onConfirm={() => handleMarkPaid(record.id)}
              okText="Sí" cancelText="No"
            >
              <Tooltip title="Marcar pagada">
                <Button size="small" type="text" icon={<CheckCircleOutlined />} style={{ color: "#16a34a" }} />
              </Tooltip>
            </Popconfirm>
          )}
          <Tooltip title="Editar">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEditInvoice(record)} />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar factura?"
            onConfirm={() => handleDeleteInvoice(record.id)}
            okText="Eliminar" okButtonProps={{ danger: true }} cancelText="Cancelar"
          >
            <Button size="small" type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }));

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
        borderRadius: 16, padding: "24px 28px", marginBottom: 24,
        boxShadow: "0 8px 32px rgba(15,23,42,0.25)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, fontSize: 20,
            background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
          }}>
            <ShopOutlined />
          </div>
          <div>
            <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800 }}>Proveedores</Title>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
              Gestión de proveedores y facturas pendientes de pago
            </Text>
          </div>
        </div>

        <Space size={12} wrap>
          {pendingCount > 0 && (
            <div style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 12, padding: "10px 18px", textAlign: "center" }}>
              <div style={{ color: "#fca5a5", fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{fmtARS(pendingTotal)}</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>
                {pendingCount} fact. pendiente{pendingCount !== 1 ? "s" : ""}
                {overdueCount > 0 && <span style={{ color: "#fca5a5" }}> · {overdueCount} vencida{overdueCount !== 1 ? "s" : ""}</span>}
              </div>
            </div>
          )}
        </Space>
      </div>

      <Tabs
        defaultActiveKey="facturas"
        items={[
          {
            key: "facturas",
            label: (
              <span>
                <FileTextOutlined />
                Facturas
                {pendingCount > 0 && <Badge count={pendingCount} size="small" style={{ marginLeft: 6 }} />}
              </span>
            ),
            children: (
              <Card variant="borderless" style={{ borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }} styles={{ body: { padding: 0 } }}>
                {/* Toolbar facturas */}
                <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #f1f5f9" }}>
                  <Space size={8} wrap>
                    {([null, "pendiente", "pagada"] as (string | null)[]).map((s) => (
                      <Button
                        key={s ?? "todas"}
                        size="small"
                        type={statusFilter === s ? "primary" : "default"}
                        danger={s === "pendiente" && statusFilter === s}
                        onClick={() => setStatusFilter(s)}
                        style={{ borderRadius: 20 }}
                      >
                        {s === null ? "Todas" : s === "pendiente" ? "Pendientes" : "Pagadas"}
                      </Button>
                    ))}
                  </Space>
                  <Space size={8}>
                    <CalendarOutlined style={{ color: "#64748b" }} />
                    <RangePicker
                      format="DD/MM/YYYY"
                      placeholder={["Desde", "Hasta"]}
                      value={dateRange}
                      onChange={(v) => setDateRange(v as [Dayjs, Dayjs] | null)}
                      allowClear
                      style={{ borderRadius: 8 }}
                    />
                    {isAdmin && (
                      <Button type="primary" icon={<PlusOutlined />} onClick={openCreateInvoice} style={{ borderRadius: 8 }}>
                        Nueva factura
                      </Button>
                    )}
                  </Space>
                </div>
                <Table
                  dataSource={invoices}
                  columns={invoiceColumns}
                  rowKey="id"
                  loading={invoicesQuery.isLoading}
                  size="middle"
                  pagination={{ pageSize: 50, showTotal: (t) => `${t} facturas` }}
                />
              </Card>
            ),
          },
          {
            key: "proveedores",
            label: <span><ShopOutlined />Proveedores ({suppliers.length})</span>,
            children: (
              <Card variant="borderless" style={{ borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }} styles={{ body: { padding: 0 } }}>
                <div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end", borderBottom: "1px solid #f1f5f9" }}>
                  {isAdmin && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateSupplier} style={{ borderRadius: 8 }}>
                      Nuevo proveedor
                    </Button>
                  )}
                </div>
                <Table
                  dataSource={suppliers}
                  columns={supplierColumns}
                  rowKey="id"
                  size="middle"
                  pagination={{ pageSize: 50 }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Modal Proveedor */}
      <Modal
        open={supplierModal.open}
        title={supplierModal.editing ? "Editar proveedor" : "Nuevo proveedor"}
        onOk={handleSaveSupplier}
        onCancel={() => setSupplierModal({ open: false, editing: null })}
        okText="Guardar" cancelText="Cancelar"
        confirmLoading={savingSupplier}
        width={480}
      >
        <Form form={supplierForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Nombre / Razón social" rules={[{ required: true }]}>
            <Input size="large" placeholder="Ej: Papelera del Sur S.A." />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="cuit" label="CUIT">
                <Input placeholder="20-12345678-9" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Teléfono">
                <Input placeholder="11 1234-5678" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="email" label="Email">
            <Input placeholder="contacto@proveedor.com" />
          </Form.Item>
          <Form.Item name="notes" label="Notas">
            <Input.TextArea rows={2} placeholder="Condiciones de pago, contacto, etc." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Factura */}
      <Modal
        open={invoiceModal.open}
        title={invoiceModal.editing ? "Editar factura" : "Registrar factura"}
        onOk={handleSaveInvoice}
        onCancel={() => { setInvoiceModal({ open: false, editing: null }); setPdfFile(null); }}
        okText="Guardar" cancelText="Cancelar"
        confirmLoading={savingInvoice}
        width={560}
      >
        <Form form={invoiceForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="supplier" label="Proveedor" rules={[{ required: true }]}>
                <Select size="large" options={supplierOptions} placeholder="Seleccioná..." />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="invoice_number" label="Nro de factura">
                <Input placeholder="A-0001-00012345" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="amount" label="Monto total" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: "100%" }} size="large" min={0.01}
                  prefix={<DollarOutlined style={{ color: "#94a3b8" }} />}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date" label="Fecha de emisión" rules={[{ required: true }]}>
                <DatePicker style={{ width: "100%" }} size="large" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="due_date" label="Vencimiento (opcional)">
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Sin vencimiento" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="purchase_request" label="Pedido de compra (opcional)">
                <InputNumber style={{ width: "100%" }} placeholder="ID del pedido" min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notas">
            <Input.TextArea rows={2} placeholder="Descripción de lo facturado, condiciones, etc." />
          </Form.Item>

          <Form.Item label="PDF de la factura (opcional)">
            <Upload
              beforeUpload={(file) => { setPdfFile(file); return false; }}
              maxCount={1}
              accept=".pdf,.jpg,.jpeg,.png"
              fileList={pdfFile ? [{ uid: "1", name: pdfFile.name, status: "done" }] : []}
              onRemove={() => setPdfFile(null)}
            >
              <Button icon={<UploadOutlined />}>Adjuntar archivo</Button>
            </Upload>
            {invoiceModal.editing?.pdf && !pdfFile && (
              <div style={{ marginTop: 6 }}>
                <a href={invoiceModal.editing.pdf} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                  <FileTextOutlined /> Ver PDF actual
                </a>
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
