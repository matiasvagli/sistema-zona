"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography, Spin, Table, Divider, Button } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function RemitoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBudget = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`${API}/budgets/${id}/`);
      setBudget(data);
    } catch {
      console.error("Error cargando remito");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  useEffect(() => {
    if (budget) {
      // Pequeño timeout para dar tiempo a renderizar la tabla antes de imprimir
      const t = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [budget]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" tip="Generando Remito..." />
      </div>
    );
  }

  if (!budget) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <Title level={4}>Presupuesto no encontrado</Title>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  const columns = [
    {
      title: "Cant.",
      dataIndex: "qty",
      width: 80,
      render: (v: any) => <Text strong>{Number(v).toLocaleString("es-AR")}</Text>,
    },
    {
      title: "Descripción del Ítem",
      dataIndex: "description",
      render: (v: string) => <Text>{v}</Text>,
    },
    {
      title: "P. Unitario",
      dataIndex: "unit_price",
      width: 120,
      align: "right" as const,
      render: (v: any) => <Text>${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</Text>,
    },
    {
      title: "Desc.",
      dataIndex: "discount_pct",
      width: 80,
      align: "right" as const,
      render: (v: any) => Number(v) > 0 ? <Text style={{ color: "#ef4444" }}>{Number(v)}%</Text> : <Text>—</Text>,
    },
    {
      title: "Subtotal",
      key: "subtotal",
      width: 130,
      align: "right" as const,
      render: (_: any, record: any) => {
        const sub = Number(record.qty) * Number(record.unit_price);
        const desc = sub * (Number(record.discount_pct || 0) / 100);
        return <Text strong>${(sub - desc).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</Text>;
      },
    },
  ];

  return (
    <div style={{ background: "#fff", minHeight: "100vh", color: "#000" }}>
      {/* Botones de acción arriba (ocultos al imprimir) */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .ant-notification, .ant-message { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ 
        padding: "16px 32px", 
        background: "#f8fafc", 
        borderBottom: "1px solid #e2e8f0", 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ borderRadius: 8 }}>
          Volver al presupuesto
        </Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ borderRadius: 8 }}>
          Imprimir de nuevo
        </Button>
      </div>

      {/* ─── TEMPLATE REMITO ─── */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 30px", fontSize: "14px" }}>
        {/* Encabezado */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 900, color: "#1e293b", letterSpacing: "-0.03em" }}>
              ZONA URBANA
            </Title>
            <Text type="secondary" style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Publicidad en Vía Pública
            </Text>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ 
              background: "#000", 
              color: "#fff", 
              padding: "4px 12px", 
              fontSize: 24, 
              fontWeight: 900, 
              display: "inline-block", 
              marginBottom: 6,
              borderRadius: 4
            }}>
              R
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>REMITO COMERCIAL</div>
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              Documento no válido como factura
            </Text>
          </div>
        </div>

        <Divider style={{ margin: "20px 0", borderColor: "#e2e8f0" }} />

        {/* Datos del Comprobante y Cliente */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, gap: 20 }}>
          <div style={{ flex: 1 }}>
            <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>
              Datos del Cliente
            </Text>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                {budget.client_name}
              </div>
              {budget.government_order && (
                <div style={{ fontSize: 13, color: "#0284c7", fontWeight: 600 }}>
                  Nro de Orden: {budget.government_order}
                </div>
              )}
            </div>
          </div>

          <div style={{ width: "220px" }}>
            <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>
              Detalles del Remito
            </Text>
            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Número:</Text>
                <Text strong>REM-{String(budget.id).padStart(4, "0")}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Fecha:</Text>
                <Text strong>{dayjs().format("DD/MM/YYYY")}</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de ítems */}
        <div style={{ marginBottom: 40 }}>
          <Table
            columns={columns}
            dataSource={budget.items || []}
            rowKey="id"
            pagination={false}
            bordered
            size="small"
            style={{ marginBottom: 20 }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 30 }}>
          <div style={{ width: "300px", background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Text type="secondary">Subtotal:</Text>
              <Text strong>${Number(budget.total_amount || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</Text>
            </div>
            {Number(budget.iva_pct || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Text type="secondary">IVA ({Number(budget.iva_pct)}%):</Text>
                <Text strong style={{ color: "#f59e0b" }}>
                  +${Number(budget.iva_amount || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </Text>
              </div>
            )}
            <Divider style={{ margin: "10px 0", borderColor: "#cbd5e1" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text strong style={{ fontSize: 16, color: "#1e293b" }}>Total:</Text>
              <Text strong style={{ fontSize: 20, color: "#10b981" }}>
                ${Number(budget.total_with_iva || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </Text>
            </div>
          </div>
        </div>

        {/* Notas / Observaciones */}
        {budget.notes && (
          <div style={{ marginBottom: 60 }}>
            <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>
              Observaciones
            </Text>
            <div style={{ padding: "12px 16px", background: "#fafafa", borderRadius: 8, border: "1px solid #e2e8f0", color: "#334155" }}>
              {budget.notes}
            </div>
          </div>
        )}

        {/* Firma de conformidad */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 80 }}>
          <div style={{ width: "250px", textAlign: "center" }}>
            <Divider style={{ margin: "0 0 8px", borderColor: "#94a3b8" }} />
            <Text strong style={{ fontSize: 13, color: "#475569" }}>Recibí Conforme</Text>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Aclaración y Firma</div>
          </div>
        </div>
      </div>
    </div>
  );
}
