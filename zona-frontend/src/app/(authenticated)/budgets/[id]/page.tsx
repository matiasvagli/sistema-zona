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
  PlusOutlined, EditOutlined, DeleteOutlined,
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
    if (budget) setIvaPct(Number(budget.iva_pct ?? 0));
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

  const isBorrador = budget?.status === "borrador";

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
    <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/budgets")}
          type="text"
          size="large"
          style={{ background: "#fff", border: "1px solid #e2e8f0" }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Title level={3} style={{ margin: 0, color: "#0f172a" }}>
              PRE-{String(budget.id).padStart(4, "0")}
            </Title>
            <Tag color={st.color as any} style={{ fontSize: 13 }}>{st.label}</Tag>
          </div>
          <Text type="secondary">{budget.client_name}</Text>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {budget.status === "borrador" && (
            <Popconfirm title="¿Aprobar este presupuesto?" onConfirm={handleApprove} okText="Aprobar">
              <Button icon={<CheckCircleOutlined />} style={{ color: "#52c41a", borderColor: "#52c41a" }}>
                Aprobar
              </Button>
            </Popconfirm>
          )}
          {budget.status === "aprobado" && !budget.work_order && (
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              loading={creatingOT}
              onClick={handleCreateOT}
              style={{ background: "#0f172a", borderColor: "#0f172a" }}
            >
              Crear OT desde este presupuesto
            </Button>
          )}
          {budget.work_order && (
            <Button
              icon={<LinkOutlined />}
              onClick={() => router.push(`/work-orders/${budget.work_order}`)}
            >
              Ver OT #{budget.work_order}
            </Button>
          )}
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            styles={{ body: { padding: 32 } }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Title level={5} style={{ margin: 0, color: "#334155" }}>Ítems</Title>
              {isBorrador && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openAddItem} size="small">
                  Agregar ítem
                </Button>
              )}
            </div>
            <Table
              columns={itemColumns}
              dataSource={budget.items || []}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: "Sin ítems" }}
              footer={() =>
                (budget.items || []).length > 0 ? (
                  <div style={{ textAlign: "right" }}>
                    <Text strong style={{ fontSize: 16 }}>
                      Total: <span style={{ color: "#52c41a" }}>${totalAmount.toLocaleString("es-AR")}</span>
                    </Text>
                  </div>
                ) : null
              }
            />
          </Card>

          {budget.notes && (
            <Card
              bordered={false}
              style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginTop: 24 }}
              styles={{ body: { padding: 24 } }}
            >
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>Notas</Text>
              <Text>{budget.notes}</Text>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
            styles={{ body: { padding: 32 } }}
          >
            <Title level={5} style={{ margin: "0 0 16px", color: "#334155" }}>Resumen</Title>

            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Cliente</Text>
              <Text strong style={{ display: "block", marginTop: 2 }}>{budget.client_name}</Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Estado</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color={st.color as any}>{st.label}</Tag>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Fecha Emisión</Text>
              <Text strong style={{ display: "block", marginTop: 2 }}>
                {budget.issue_date ? dayjs(budget.issue_date).format("DD/MM/YYYY") : "—"}
              </Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Vencimiento</Text>
              <Text strong style={{ display: "block", marginTop: 2, color: budget.expiry_date && dayjs().isAfter(dayjs(budget.expiry_date)) ? "#ff4d4f" : "inherit" }}>
                {budget.expiry_date ? dayjs(budget.expiry_date).format("DD/MM/YYYY") : "Sin vencimiento"}
              </Text>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Ítems</Text>
              <Text strong style={{ display: "block", marginTop: 2 }}>{(budget.items || []).length}</Text>
            </div>

            <Divider style={{ margin: "16px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Subtotal</Text>
              <Text strong>${totalAmount.toLocaleString("es-AR")}</Text>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>IVA</Text>
                {isBorrador ? (
                  <InputNumber
                    min={0}
                    max={100}
                    size="small"
                    value={ivaPct}
                    onChange={(v) => setIvaPct(v ?? 0)}
                    onBlur={() => saveIva(ivaPct)}
                    suffix="%"
                    style={{ width: 80 }}
                  />
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>({ivaPct}%)</Text>
                )}
              </div>
              <Text style={{ color: ivaPct > 0 ? "#f59e0b" : "#94a3b8" }}>
                {ivaPct > 0 ? `+$${ivaAmount.toLocaleString("es-AR")}` : "—"}
              </Text>
            </div>

            <Divider style={{ margin: "10px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Total{ivaPct > 0 ? " c/IVA" : ""}</Text>
              <Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                ${(ivaPct > 0 ? totalWithIva : totalAmount).toLocaleString("es-AR")}
              </Title>
            </div>

            {budget.work_order && (
              <>
                <Divider style={{ margin: "16px 0" }} />
                <Text type="secondary" style={{ fontSize: 12 }}>OT vinculada</Text>
                <Button
                  block
                  icon={<LinkOutlined />}
                  onClick={() => router.push(`/work-orders/${budget.work_order}`)}
                  style={{ marginTop: 8 }}
                >
                  OT #{budget.work_order}
                </Button>
              </>
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
