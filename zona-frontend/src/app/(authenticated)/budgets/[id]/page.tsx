"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Typography, Button, Card, Tag, Table,
  notification, Popconfirm, Divider, Row, Col, Spin,
} from "antd";
import {
  ArrowLeftOutlined, CheckCircleOutlined, FileTextOutlined, LinkOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";

const { Title, Text } = Typography;

const API = "http://localhost:8000/api/v1";

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  borrador:  { color: "default", label: "Borrador"  },
  aprobado:  { color: "success", label: "Aprobado"  },
  rechazado: { color: "error",   label: "Rechazado" },
  facturado: { color: "blue",    label: "Facturado" },
};

export default function BudgetDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOT, setCreatingOT] = useState(false);

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

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>;
  }

  if (!budget) {
    return <div style={{ padding: 40 }}><Text type="secondary">Presupuesto no encontrado.</Text></div>;
  }

  const st = STATUS_CONFIG[budget.status] || STATUS_CONFIG.borrador;
  const totalAmount = Number(budget.total_amount || 0);

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
  ];

  return (
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
            <Title level={5} style={{ margin: "0 0 20px", color: "#334155" }}>Ítems</Title>
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
              <Text type="secondary" style={{ fontSize: 12 }}>Ítems</Text>
              <Text strong style={{ display: "block", marginTop: 2 }}>{(budget.items || []).length}</Text>
            </div>

            <Divider style={{ margin: "16px 0" }} />

            <Text type="secondary" style={{ fontSize: 12 }}>Total</Text>
            <Title level={3} style={{ margin: "4px 0 0", color: "#52c41a" }}>
              ${totalAmount.toLocaleString("es-AR")}
            </Title>

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
  );
}
