"use client";

import { AdminGuard } from "@/components/AdminGuard";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useList, useInvalidate, useSelect } from "@refinedev/core";
import {
  Typography, Button, Card, Tag, Table, Space, Tooltip,
  notification, Popconfirm, Input, Badge, Tabs,
  Form, InputNumber, Select, Row, Col, Modal, Divider,
} from "antd";
import {
  PlusOutlined, EyeOutlined, EditOutlined,
  FileTextOutlined, LinkOutlined, SearchOutlined,
  ClearOutlined, FundOutlined, DeleteOutlined,
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
  const [activeTab, setActiveTab] = useState("1");
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
    queryOptions: { refetchInterval: 15000 }, // Los presupuestos no son tan críticos de ver al segundo
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

  const productionTabContent = (
    <>
      {/* Stats Quick Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
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

      <Card variant="borderless" style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.04)", overflow: "hidden" }} styles={{ body: { padding: 0 } }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
          <Input
            placeholder="Buscar por PRE-# o Cliente..."
            prefix={<SearchOutlined style={{ color: "#94a3b8", marginRight: 8 }} />}
            size="large" allowClear value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 400, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: 500 }}>Mostrando {filteredBudgets.length} resultados</Text>
            {(searchText || statusFilter !== "all") && (
              <Button type="text" icon={<ClearOutlined />} onClick={() => { setSearchText(""); setStatusFilter("all"); }} style={{ color: "#ef4444", fontWeight: 500 }}>Limpiar</Button>
            )}
          </div>
        </div>
        <style>{`
          .budget-table .ant-table-thead > tr > th { background: #fff !important; color: #64748b !important; font-weight: 600 !important; font-size: 13px !important; border-bottom: 1px solid #f1f5f9 !important; padding: 16px 24px !important; }
          .budget-table .ant-table-tbody > tr > td { padding: 18px 24px !important; border-bottom: 1px solid #f1f5f9 !important; }
          .budget-table .ant-table-tbody > tr:hover > td { background: #f8fafc !important; }
        `}</style>
        <Table
          className="budget-table" columns={columns} dataSource={filteredBudgets} rowKey="id"
          loading={query.isLoading}
          pagination={{ pageSize: 15, showSizeChanger: false, position: ["bottomRight"], style: { margin: "24px" } }}
          onRow={(record) => ({ onClick: () => router.push(`/budgets/${record.id}`), style: { cursor: "pointer" } })}
        />
      </Card>
    </>
  );

  return (
    <AdminGuard>
    <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* ─── BANNER PREMIUM ─────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
        borderRadius: "20px",
        padding: "28px 32px",
        marginBottom: "32px",
        boxShadow: "0 10px 30px rgba(15,23,42,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16
      }}>
        <div>
          <Title level={2} style={{ margin: 0, color: "#fff", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Presupuestos
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 4, display: "block" }}>
            Gestión centralizada de cotizaciones comerciales y emisión de órdenes operativas.
          </Text>
        </div>
        
        {activeTab === "1" && (
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => router.push("/budgets/create")}
            style={{ 
              borderRadius: "12px", 
              height: "46px", 
              padding: "0 24px", 
              background: "#fff", 
              color: "#0f172a",
              fontWeight: 700,
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          >
            Nuevo Presupuesto
          </Button>
        )}
      </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "0 24px", marginBottom: 0 }}
          items={[
            {
              key: "1",
              label: <span style={{ fontWeight: 600 }}>📋 Producción</span>,
              children: productionTabContent,
            },
            {
              key: "2",
              label: <span style={{ fontWeight: 600 }}><FundOutlined /> Vía Pública</span>,
              children: <CampaignVPTab />,
            },
          ]}
        />

        <BillingModal
          open={billingModal.open}
          onClose={() => setBillingModal({ ...billingModal, open: false })}
          onSuccess={() => query.refetch()}
          budgetId={billingModal.budgetId || 0}
          clientName={billingModal.clientName}
          totalAmount={billingModal.totalAmount}
        />
      </div>
    </AdminGuard>
  );
}

// ── Tab Vía Pública: campañas en presupuesto/aprobado ──────────

function CampaignVPTab() {
  const router = useRouter();
  const invalidate = useInvalidate();
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form] = Form.useForm();
  const [modalAction, setModalAction] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalStartDate, setModalStartDate] = useState("");
  const [modalEndDate, setModalEndDate] = useState("");

  const { result, query } = useList({
    resource: "campaigns",
    pagination: { pageSize: 200 },
    sorters: [{ field: "id", order: "desc" }],
  });

  const { options: clientOptions } = useSelect({
    resource: "clients",
    optionLabel: "name",
    optionValue: "id",
  });

  const { options: allFaceOptions } = useSelect({
    resource: "structure-faces",
    optionLabel: "display_name",
    optionValue: "id",
    filters: [{ field: "is_active", operator: "eq", value: true }],
    pagination: { pageSize: 200 },
  });

  const { result: rentalsResult } = useList({
    resource: "space-rentals",
    pagination: { pageSize: 1000 },
    queryOptions: { enabled: createModalOpen },
  });
  const allRentals: any[] = rentalsResult?.data || [];

  const occupiedFaceIds = useMemo(() => {
    if (!modalStartDate || !modalEndDate) return new Set<number>();
    return new Set<number>(
      allRentals
        .filter((r: any) => r.status !== "finalizado")
        .filter((r: any) => r.start_date <= modalEndDate && r.end_date >= modalStartDate)
        .map((r: any) => Number(r.face))
    );
  }, [allRentals, modalStartDate, modalEndDate]);

  const faceOptionsWithAvail = useMemo(() =>
    (allFaceOptions || []).map((opt) => {
      const hasDate = !!(modalStartDate && modalEndDate);
      const occupied = hasDate && occupiedFaceIds.has(Number(opt.value));
      return {
        value: opt.value,
        label: String(opt.label),
        dotColor: !hasDate ? "#94a3b8" : occupied ? "#ef4444" : "#22c55e",
        disabled: occupied,
      };
    }),
    [allFaceOptions, occupiedFaceIds, modalStartDate, modalEndDate]
  );

  const allCampaigns: any[] = result?.data || [];
  const campaigns = allCampaigns.filter((c: any) =>
    ["presupuesto", "borrador", "aprobado"].includes(c.status)
  );

  const handleAprobar = async (campaignId: number) => {
    setApprovingId(campaignId);
    try {
      const { data } = await axiosInstance.post(`${API}/campaigns/${campaignId}/aprobar/`);
      notification.success({
        message: "Campaña aprobada",
        description: `OT-${String(data.work_order_id).padStart(4, "0")} creada correctamente.`,
        duration: 6,
      });
      invalidate({ resource: "campaigns", invalidates: ["list"] });
      // Redirigir a la OT creada
      if (data.work_order_id) {
        router.push(`/work-orders/${data.work_order_id}`);
      }
    } catch (err: any) {
      notification.error({ message: err?.response?.data?.detail || "Error al aprobar la campaña" });
    } finally {
      setApprovingId(null);
    }
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setEditingId(null);
    setModalAction("create");
    form.resetFields();
    setModalStartDate("");
    setModalEndDate("");
  };

  const handleEdit = (record: any) => {
    setModalAction("edit");
    setEditingId(record.id);
    setModalStartDate(record.start_date || "");
    setModalEndDate(record.end_date || "");
    
    // Preparar los assignments si existen
    const space_assignments = (record.spaces || []).map((s: any) => ({
      face_id: s.face,
      price: s.rental_price,
    }));

    form.setFieldsValue({
      name: record.name,
      client: record.client,
      billing_type: record.billing_type,
      start_date: record.start_date,
      end_date: record.end_date,
      notes: record.notes,
      space_assignments: space_assignments,
    });
    setCreateModalOpen(true);
  };

  const handleSubmit = async () => {
    let values: any;
    try { values = await form.validateFields(); } catch { return; }
    const { space_assignments, ...campaignValues } = values;
    const assignments: any[] = (space_assignments || []).filter((a: any) => a?.face_id);
    const totalFromSpaces = assignments.reduce((sum: number, a: any) => sum + Number(a.price || 0), 0);
    setIsCreating(true);
    try {
      if (modalAction === "create") {
        const { data: campaignData } = await axiosInstance.post(`${API}/campaigns/`, {
          ...campaignValues,
          status: "presupuesto",
          budget_total: totalFromSpaces,
        });
        const campaignId = campaignData.id;
        for (const assignment of assignments) {
          const { data: rentalData } = await axiosInstance.post(`${API}/space-rentals/`, {
            face: assignment.face_id,
            client: campaignValues.client,
            campaign: campaignId,
            start_date: campaignValues.start_date,
            end_date: campaignValues.end_date,
            price: assignment.price || 0,
            status: "reservado",
          });
          await axiosInstance.post(`${API}/campaign-spaces/`, {
            campaign: campaignId,
            space_rental: rentalData.id,
          });
        }
        notification.success({
          message: assignments.length > 0
            ? `Campaña creada con ${assignments.length} espacio(s)`
            : "Campaña creada correctamente",
        });
      } else {
        // Lógica de edición (PATCH)
        await axiosInstance.patch(`${API}/campaigns/${editingId}/`, {
          ...campaignValues,
          budget_total: totalFromSpaces,
        });
        
        notification.success({ message: "Campaña actualizada correctamente" });
      }
      invalidate({ resource: "campaigns", invalidates: ["list"] });
      invalidate({ resource: "space-rentals", invalidates: ["list"] });
      closeCreateModal();
    } catch {
      notification.error({ message: `Error al ${modalAction === "create" ? "crear" : "actualizar"} la campaña` });
    } finally {
      setIsCreating(false);
    }
  };

  const CAMP_COLORS: Record<string, string> = { borrador: "default", presupuesto: "orange", aprobado: "geekblue" };
  const CAMP_LABELS: Record<string, string> = { borrador: "Borrador", presupuesto: "Presupuesto", aprobado: "Aprobado" };

  return (
    <>
      <Card variant="borderless" style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.04)", overflow: "hidden" }} styles={{ body: { padding: 0 } }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
          <Text style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>Presupuestos de Vía Pública</Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setModalAction("create"); setCreateModalOpen(true); }}
            style={{ borderRadius: 10, height: 40, padding: "0 20px", fontWeight: 700, background: "#0f172a" }}
          >
            Nuevo Presupuesto VP
          </Button>
        </div>
        <Table
          className="budget-table"
          dataSource={campaigns}
          rowKey="id"
          loading={query.isLoading}
          pagination={{ pageSize: 15, showSizeChanger: false, position: ["bottomRight"], style: { margin: "24px" } }}
          locale={{ emptyText: "Sin campañas en presupuesto" }}
        >
          <Table.Column title="Campaña" dataIndex="name" render={(v: string) => <Text strong>{v}</Text>} />
          <Table.Column title="Cliente" dataIndex="client_name" render={(v: string) => v || <Text type="secondary">—</Text>} />
          <Table.Column title="Estado" dataIndex="status" width={120} render={(v: string) => (
            <Tag color={CAMP_COLORS[v] || "default"}>{CAMP_LABELS[v] || v}</Tag>
          )} />
          <Table.Column title="Presupuesto" dataIndex="budget_total" width={140} render={(v: number) => (
            <Text strong style={{ color: "#52c41a" }}>${Number(v || 0).toLocaleString("es-AR")}</Text>
          )} />
          <Table.Column title="Espacios" dataIndex="spaces_count" width={80} render={(v: number) => (
            <Text type="secondary">{v ?? 0}</Text>
          )} />
          <Table.Column title="Inicio" dataIndex="start_date" width={110} render={(v: string) => v ? dayjs(v).format("DD/MM/YYYY") : "—"} />
          <Table.Column title="Fin" dataIndex="end_date" width={110} render={(v: string) => v ? dayjs(v).format("DD/MM/YYYY") : "—"} />
          <Table.Column title="OT" dataIndex="work_order_id" width={100} render={(woId: number | null) =>
            woId ? (
              <Button type="link" size="small" icon={<LinkOutlined />}
                onClick={() => router.push(`/work-orders/${woId}`)} style={{ padding: 0 }}>
                OT-{String(woId).padStart(4, "0")}
              </Button>
            ) : <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
          } />
          <Table.Column title="Acciones" width={160} render={(_: any, record: any) => (
            <Space>
              {(record.status === "presupuesto" || record.status === "borrador") && !record.work_order_id && (
                <Popconfirm
                  title="¿Aprobar campaña?"
                  description="Se generará una Orden de Trabajo vinculada."
                  okText="Aprobar" cancelText="Cancelar"
                  onConfirm={() => handleAprobar(record.id)}
                >
                  <Button size="small" type="primary" loading={approvingId === record.id}
                    style={{ background: "#7c3aed", border: "none", borderRadius: 6, fontSize: 11 }}>
                    Aprobar → OT
                  </Button>
                </Popconfirm>
              )}
              <Tooltip title="Editar">
                <Button size="small" icon={<EditOutlined />}
                  onClick={() => handleEdit(record)} />
              </Tooltip>
              <Tooltip title="Ver en Campañas">
                <Button size="small" type="dashed" icon={<EyeOutlined />}
                  onClick={() => router.push("/campaigns")} />
              </Tooltip>
            </Space>
          )} />
        </Table>
      </Card>

      <Modal
        open={createModalOpen}
        onCancel={closeCreateModal}
        onOk={handleSubmit}
        title={<b>{modalAction === "create" ? "Nuevo Presupuesto Vía Pública" : "Editar Presupuesto Vía Pública"}</b>}
        width={700}
        centered
        okButtonProps={{ loading: isCreating }}
        okText={modalAction === "create" ? "Crear Campaña" : "Guardar Cambios"}
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Nombre de la Campaña" name="name" rules={[{ required: true, message: "Requerido" }]}>
            <Input size="large" placeholder="Ej: Campaña Verano 2025" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Cliente" name="client" rules={[{ required: true, message: "Requerido" }]}>
                <Select size="large" options={clientOptions} placeholder="Seleccionar cliente" showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tipo de Facturación" name="billing_type" initialValue="contrato">
                <Select size="large" options={[
                  { label: "Por Contrato (pago único)", value: "contrato" },
                  { label: "Mensual", value: "mensual" },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Fecha Inicio" name="start_date" rules={[{ required: true, message: "Requerido" }]}>
                <Input type="date" size="large" style={{ width: "100%" }}
                  onChange={(e) => setModalStartDate(e.target.value)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Fecha Fin" name="end_date" rules={[{ required: true, message: "Requerido" }]}>
                <Input type="date" size="large" style={{ width: "100%" }}
                  onChange={(e) => setModalEndDate(e.target.value)} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "16px 0" }}>
            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>ESPACIOS / ESTRUCTURAS (OPCIONAL)</span>
          </Divider>

          <div style={{ marginBottom: 12, fontSize: 12 }}>
            {modalStartDate && modalEndDate ? (
              <Space size={16} style={{ color: "#64748b" }}>
                <span>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#22c55e", marginRight: 4, verticalAlign: "middle" }} />
                  Disponible
                </span>
                <span>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#ef4444", marginRight: 4, verticalAlign: "middle" }} />
                  Ocupado
                </span>
              </Space>
            ) : (
              <span style={{ color: "#94a3b8" }}>Seleccioná las fechas para ver disponibilidad de espacios.</span>
            )}
          </div>

          <Form.List name="space_assignments">
            {(fields, { add, remove }) => (
              <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 16 }}>
                {fields.map(({ key, name }) => (
                  <Row key={key} gutter={12} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={13}>
                      <Form.Item name={[name, "face_id"]} style={{ marginBottom: 0 }}>
                        <Select
                          size="large"
                          options={faceOptionsWithAvail}
                          placeholder="Seleccionar cara/espacio..."
                          showSearch
                          filterOption={(input, option: any) =>
                            option?.label?.toLowerCase().includes(input.toLowerCase())
                          }
                          optionRender={(opt) => (
                            <span>
                              <span style={{
                                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                                marginRight: 8, verticalAlign: "middle",
                                background: (opt.data as any).dotColor || "#94a3b8",
                              }} />
                              {opt.label}
                            </span>
                          )}
                          allowClear
                        />
                      </Form.Item>
                    </Col>
                    <Col span={9}>
                      <Form.Item name={[name, "price"]} style={{ marginBottom: 0 }}>
                        <InputNumber prefix="$" size="large" style={{ width: "100%" }} min={0} placeholder="Precio alquiler" />
                      </Form.Item>
                    </Col>
                    <Col span={2} style={{ textAlign: "center" }}>
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}
                  style={{ width: "100%", marginTop: fields.length > 0 ? 8 : 0 }}>
                  Agregar Espacio
                </Button>
                {fields.length > 0 && (
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                    Se creará una Reserva por cada espacio agregado.
                  </div>
                )}
              </div>
            )}
          </Form.List>

          <Form.Item label="Notas Internas" name="notes">
            <Input.TextArea rows={3} placeholder="Descripción de la campaña, referencias, observaciones..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
