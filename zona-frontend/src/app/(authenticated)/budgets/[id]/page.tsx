"use client";

import { AdminGuard } from "@/components/AdminGuard";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Typography, Button, Card, Tag, Table,
  notification, Popconfirm, Divider, Row, Col, Spin,
  Modal, Input, InputNumber, Space,
} from "antd";
import {
  ArrowLeftOutlined, CheckCircleOutlined, FileTextOutlined, LinkOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import dayjs from "dayjs";

const { Title, Text } = Typography;

import { API_URL as API } from "@/config/api";
import { BUDGET_STATUS } from "@/constants/statuses";

const STATUS_CONFIG = BUDGET_STATUS;

export default function BudgetDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOT, setCreatingOT] = useState(false);

  const [ivaPct, setIvaPct] = useState<number>(0);
  const [governmentOrder, setGovernmentOrder] = useState<string>('');

  const emptyItemForm = { description: '', qty: 1, unit_price: 0, discount_pct: 0 };
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState<any>(emptyItemForm);
  const [savingItem, setSavingItem] = useState(false);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`${API}/budgets/${id}/`);
      setBudget(data);
    } catch {
      notification.error({ message: "Error al cargar el presupuesto" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  useEffect(() => {
    if (budget) {
      setIvaPct(Number(budget.iva_pct ?? 0));
      setGovernmentOrder(budget.government_order ?? '');
    }
  }, [budget]);

  const handleApprove = async () => {
    try {
      await axiosInstance.post(`${API}/budgets/${id}/approve/`);
      notification.success({ message: "Presupuesto aprobado" });
      fetchBudget();
    } catch {
      notification.error({ message: "Error al aprobar" });
    }
  };

  const handleCreateOT = async () => {
    setCreatingOT(true);
    try {
      const { data: newOT } = await axiosInstance.post(`${API}/budgets/${id}/create-work-order/`, {
        title: `OT — PRE-${String(id).padStart(4, "0")} ${budget?.client_name}`,
      });
      notification.success({
        message: "Orden de Trabajo creada",
        description: `OT #${newOT.id} generada a partir de este presupuesto.`,
      });
      router.push(`/work-orders/${newOT.id}`);
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "Error al crear OT" });
    } finally {
      setCreatingOT(false);
    }
  };

  const saveIva = async (pct: number) => {
    try {
      await axiosInstance.patch(`${API}/budgets/${id}/`, { iva_pct: pct });
      fetchBudget();
    } catch {
      notification.error({ message: "Error al guardar IVA" });
    }
  };

  const saveGovernmentOrder = async (val: string) => {
    try {
      await axiosInstance.patch(`${API}/budgets/${id}/`, { government_order: val });
      notification.success({ message: "Nro de orden guardado" });
      fetchBudget();
    } catch {
      notification.error({ message: "Error al guardar Nro de orden" });
    }
  };

  const openAddItem = () => {
    setEditingItem(null);
    setItemForm(emptyItemForm);
    setItemModalOpen(true);
  };

  const openEditItem = (item: any) => {
    setEditingItem(item);
    setItemForm({
      description: item.description,
      qty: Number(item.qty),
      unit_price: Number(item.unit_price),
      discount_pct: Number(item.discount_pct),
    });
    setItemModalOpen(true);
  };

  const saveItem = async () => {
    if (!itemForm.description || !itemForm.qty || !itemForm.unit_price) {
      notification.warning({ message: "Completá descripción, cantidad y precio" });
      return;
    }
    setSavingItem(true);
    try {
      if (editingItem) {
        await axiosInstance.patch(`${API}/budget-items/${editingItem.id}/`, { ...itemForm, budget: budget.id });
      } else {
        await axiosInstance.post(`${API}/budget-items/`, { ...itemForm, budget: budget.id });
      }
      notification.success({ message: editingItem ? "Ítem actualizado" : "Ítem agregado" });
      setItemModalOpen(false);
      fetchBudget();
    } catch {
      notification.error({ message: "Error al guardar ítem" });
    } finally {
      setSavingItem(false);
    }
  };

  const deleteItem = async (itemId: number) => {
    try {
      await axiosInstance.delete(`${API}/budget-items/${itemId}/`);
      notification.success({ message: "Ítem eliminado" });
      fetchBudget();
    } catch {
      notification.error({ message: "Error al eliminar ítem" });
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;
  }

  if (!budget) {
    return <div style={{ padding: 40 }}><Text type="secondary">Presupuesto no encontrado.</Text></div>;
  }

  const st = STATUS_CONFIG[budget.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.borrador;
  const totalAmount   = Number(budget.total_amount   || 0);
  const ivaAmount     = Number(budget.iva_amount     || 0);
  const totalWithIva  = Number(budget.total_with_iva || 0);

  const isBorrador = budget?.status !== "facturado";

  const itemColumns = [
    {
      title: "Descripción",
      dataIndex: "description",
      render: (v: string) => <Text>{v}</Text>,
    },
    {
      title: "Cant.",
      dataIndex: "qty",
      width: 80,
      render: (v: number) => <Text>{v}</Text>,
    },
    {
      title: "P. Unit.",
      dataIndex: "unit_price",
      width: 130,
      render: (v: number) => `$${Number(v).toLocaleString("es-AR")}`,
    },
    {
      title: "Dto %",
      dataIndex: "discount_pct",
      width: 80,
      render: (v: number) => `${v}%`,
    },
    {
      title: "Subtotal",
      dataIndex: "total_price",
      width: 140,
      render: (v: number) => (
        <Text strong style={{ color: "#52c41a" }}>${Number(v).toLocaleString("es-AR")}</Text>
      ),
    },
    ...(isBorrador ? [{
      title: "",
      key: "actions",
      width: 80,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditItem(record)} />
          <Popconfirm title="¿Eliminar ítem?" onConfirm={() => deleteItem(record.id)} okText="Sí" cancelText="No">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    }] : []),
  ];

  return (
    <AdminGuard>
    <div style={{ padding: "24px 32px", background: "#f1f5f9", minHeight: "100%" }}>
      {/* ─── HEADER PREMIUM ─────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderRadius: "20px",
        padding: "24px 32px",
        marginBottom: "32px",
        boxShadow: "0 10px 25px -5px rgba(15,23,42,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            icon={<ArrowLeftOutlined style={{ color: "#fff" }} />}
            onClick={() => router.push("/budgets")}
            type="text"
            size="large"
            style={{ 
              background: "rgba(255,255,255,0.08)", 
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px"
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <Title level={3} style={{ margin: 0, color: "#ffffff", fontWeight: 800, letterSpacing: "-0.03em" }}>
                PRE-{String(budget.id).padStart(4, "0")}
              </Title>
              <Tag color={st.color as any} style={{ fontSize: 12, fontWeight: 600, borderRadius: 6, border: "none", padding: "2px 10px" }}>
                {st.label.toUpperCase()}
              </Tag>
            </div>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500 }}>{budget.client_name}</Text>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {budget.status === "borrador" && (
            <Popconfirm title="¿Aprobar este presupuesto?" onConfirm={handleApprove} okText="Aprobar">
              <Button 
                icon={<CheckCircleOutlined />} 
                style={{ 
                  color: "#10b981", 
                  borderColor: "#10b981", 
                  background: "rgba(16, 185, 129, 0.1)",
                  fontWeight: 600,
                  borderRadius: "10px",
                  height: "40px"
                }}
              >
                Aprobar Presupuesto
              </Button>
            </Popconfirm>
          )}
          {budget.status === "aprobado" && !budget.work_order && (
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              loading={creatingOT}
              onClick={handleCreateOT}
              style={{ 
                background: "#1677ff", 
                borderColor: "#1677ff",
                fontWeight: 600,
                borderRadius: "10px",
                height: "40px",
                boxShadow: "0 4px 12px rgba(22,119,255,0.3)"
              }}
            >
              Crear Orden de Trabajo
            </Button>
          )}
          {budget.work_order && (
            <Button
              icon={<LinkOutlined />}
              onClick={() => router.push(`/work-orders/${budget.work_order}`)}
              style={{
                borderRadius: "10px",
                height: "40px",
                fontWeight: 600
              }}
            >
              Ver OT #{budget.work_order}
            </Button>
          )}
          <Button
            icon={<PrinterOutlined />}
            onClick={() => window.open(`/budgets/${id}/presupuesto`, "_blank")}
            style={{ borderRadius: "10px", height: "40px", fontWeight: 600 }}
          >
            Descargar PDF
          </Button>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{ 
              borderRadius: 16, 
              boxShadow: "0 4px 15px -3px rgba(0,0,0,0.05)",
              overflow: "hidden"
            }}
            styles={{ body: { padding: 32 } }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e6f4ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#1677ff" }}>
                  <FileTextOutlined style={{ fontSize: 16 }} />
                </div>
                <Title level={4} style={{ margin: 0, color: "#1e293b", fontWeight: 700 }}>Ítems del Presupuesto</Title>
              </div>
              {isBorrador && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={openAddItem} 
                  size="middle"
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Agregar ítem
                </Button>
              )}
            </div>
            
            <Table
              columns={itemColumns}
              dataSource={budget.items || []}
              rowKey="id"
              pagination={false}
              size="middle"
              locale={{ emptyText: "Este presupuesto no contiene ítems todavía" }}
              style={{ borderRadius: 8, overflow: "hidden" }}
              footer={() =>
                (budget.items || []).length > 0 ? (
                  <div style={{ textAlign: "right", padding: "8px 16px" }}>
                    <Text style={{ fontSize: 14, color: "#64748b", marginRight: 10 }}>Subtotal de ítems:</Text>
                    <Text strong style={{ fontSize: 18, color: "#1e293b" }}>
                      ${totalAmount.toLocaleString("es-AR")}
                    </Text>
                  </div>
                ) : null
              }
            />
          </Card>

          {budget.notes && (
            <Card
              bordered={false}
              style={{ 
                borderRadius: 16, 
                boxShadow: "0 4px 15px -3px rgba(0,0,0,0.05)", 
                marginTop: 24 
              }}
              styles={{ body: { padding: 24 } }}
            >
              <Text strong style={{ fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                Notas / Observaciones
              </Text>
              <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <Text style={{ color: "#334155", whiteSpace: "pre-wrap" }}>{budget.notes}</Text>
              </div>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{ 
              borderRadius: 16, 
              boxShadow: "0 4px 15px -3px rgba(0,0,0,0.05)", 
              background: "#fff",
              position: "sticky",
              top: 24
            }}
            styles={{ body: { padding: 28 } }}
          >
            <Title level={4} style={{ margin: "0 0 20px", color: "#1e293b", fontWeight: 700 }}>Resumen</Title>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Cliente</Text>
                <Text strong style={{ color: "#1e293b", textAlign: "right", maxWidth: "60%" }}>{budget.client_name}</Text>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Nro de Orden</Text>
                {isBorrador ? (
                  <Input
                    placeholder="O.C. / Gov #"
                    size="small"
                    value={governmentOrder}
                    onChange={(e) => setGovernmentOrder(e.target.value)}
                    onBlur={() => saveGovernmentOrder(governmentOrder)}
                    style={{ width: 110, borderRadius: 6, fontSize: 12 }}
                  />
                ) : (
                  <Text strong style={{ color: "#0284c7" }}>{budget.government_order || "—"}</Text>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Estado</Text>
                <Tag color={st.color as any} style={{ margin: 0, borderRadius: 6, fontWeight: 600 }}>{st.label}</Tag>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Fecha Emisión</Text>
                <Text strong style={{ color: "#1e293b" }}>
                  {budget.issue_date ? dayjs(budget.issue_date).format("DD/MM/YYYY") : "—"}
                </Text>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Vencimiento</Text>
                <Text strong style={{ color: budget.expiry_date && dayjs().isAfter(dayjs(budget.expiry_date)) ? "#ef4444" : "#1e293b" }}>
                  {budget.expiry_date ? dayjs(budget.expiry_date).format("DD/MM/YYYY") : "Sin vencimiento"}
                </Text>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Cantidad de Ítems</Text>
                <Text strong style={{ color: "#1e293b" }}>{(budget.items || []).length}</Text>
              </div>
            </div>

            <Divider style={{ margin: "20px 0", borderColor: "#f1f5f9" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "#64748b", fontSize: 14 }}>Subtotal</Text>
                <Text strong style={{ fontSize: 16, color: "#1e293b" }}>${totalAmount.toLocaleString("es-AR")}</Text>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: "#64748b", fontSize: 14 }}>IVA</Text>
                  {isBorrador ? (
                    <InputNumber
                      min={0}
                      max={100}
                      size="small"
                      value={ivaPct}
                      onChange={(v) => setIvaPct(v ?? 0)}
                      onBlur={() => saveIva(ivaPct)}
                      suffix="%"
                      style={{ width: 75, borderRadius: 6 }}
                    />
                  ) : (
                    <Tag style={{ margin: 0, borderRadius: 4, background: "#f1f5f9", border: "none", fontSize: 11, fontWeight: 600 }}>{ivaPct}%</Tag>
                  )}
                </div>
                <Text style={{ color: ivaPct > 0 ? "#f59e0b" : "#94a3b8", fontWeight: 600, fontSize: 14 }}>
                  {ivaPct > 0 ? `+$${ivaAmount.toLocaleString("es-AR")}` : "—"}
                </Text>
              </div>
            </div>

            <Divider style={{ margin: "20px 0", borderColor: "#f1f5f9" }} />

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text strong style={{ fontSize: 14, color: "#475569" }}>TOTAL{ivaPct > 0 ? " c/IVA" : ""}</Text>
                <Title level={3} style={{ margin: 0, color: "#10b981", fontWeight: 800, letterSpacing: "-0.03em" }}>
                  ${(ivaPct > 0 ? totalWithIva : totalAmount).toLocaleString("es-AR")}
                </Title>
              </div>
            </div>

            {budget.work_order && (
              <div style={{ marginTop: 24 }}>
                <Divider style={{ margin: "0 0 16px", borderColor: "#f1f5f9" }} />
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Vínculos</Text>
                <Button
                  block
                  icon={<LinkOutlined />}
                  onClick={() => router.push(`/work-orders/${budget.work_order}`)}
                  style={{ 
                    borderRadius: "10px", 
                    height: "42px",
                    fontWeight: 600,
                    background: "#f0fdf4",
                    borderColor: "#bbf7d0",
                    color: "#16a34a"
                  }}
                >
                  Ver Orden de Trabajo #{budget.work_order}
                </Button>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>

    <Modal
      title={editingItem ? "Editar ítem" : "Agregar ítem"}
      open={itemModalOpen}
      onOk={saveItem}
      onCancel={() => setItemModalOpen(false)}
      confirmLoading={savingItem}
      okText="Guardar"
      cancelText="Cancelar"
      width={480}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "10px 0" }}>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Descripción *</Text>
          <Input
            value={itemForm.description}
            onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
            placeholder="Ej: Cartel 3x2m impresión full color"
          />
        </div>
        <Row gutter={12}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Cantidad *</Text>
            <InputNumber
              min={0.01}
              style={{ width: "100%" }}
              value={itemForm.qty}
              onChange={(v) => setItemForm({ ...itemForm, qty: v ?? 1 })}
            />
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Precio unitario *</Text>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              value={itemForm.unit_price}
              onChange={(v) => setItemForm({ ...itemForm, unit_price: v ?? 0 })}
              prefix="$"
            />
          </Col>
        </Row>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Descuento %</Text>
          <InputNumber
            min={0}
            max={100}
            style={{ width: "100%" }}
            value={itemForm.discount_pct}
            onChange={(v) => setItemForm({ ...itemForm, discount_pct: v ?? 0 })}
            suffix="%"
          />
        </div>
        {itemForm.qty > 0 && itemForm.unit_price > 0 && (
          <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 14px" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Subtotal: </Text>
            <Text strong style={{ color: "#16a34a" }}>
              ${(itemForm.qty * itemForm.unit_price * (1 - itemForm.discount_pct / 100)).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </Text>
          </div>
        )}
      </div>
    </Modal>
    </AdminGuard>
  );
}
