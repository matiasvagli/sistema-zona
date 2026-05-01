"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Typography, Spin, Button, Divider } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

const { Title, Text } = Typography;

export default function BudgetPresupuestoPage() {
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
      console.error("Error cargando presupuesto");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  useEffect(() => {
    if (budget) {
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, [budget]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" tip="Generando Presupuesto..." />
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

  const preNum = `PRE-${String(budget.id).padStart(4, "0")}`;
  const totalAmount = Number(budget.total_amount || 0);
  const ivaPct = Number(budget.iva_pct || 0);
  const ivaAmount = Number(budget.iva_amount || 0);
  const totalWithIva = Number(budget.total_with_iva || 0);

  return (
    <div style={{ background: "#fff", minHeight: "100vh", color: "#000" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .ant-notification, .ant-message { display: none !important; }
          @page { margin: 18mm 15mm; }
        }
      `}</style>

      <div className="no-print" style={{
        padding: "16px 32px", background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ borderRadius: 8 }}>
          Volver al presupuesto
        </Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ borderRadius: 8 }}>
          Imprimir de nuevo
        </Button>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 30px", fontSize: 14 }}>

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
              background: "#1e3a8a", color: "#fff",
              padding: "4px 16px", fontSize: 22, fontWeight: 900,
              display: "inline-block", marginBottom: 6, borderRadius: 4,
              letterSpacing: "0.05em",
            }}>
              PRESUPUESTO
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 2 }}>
              {preNum}
            </div>
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              Documento no válido como factura
            </Text>
          </div>
        </div>

        <Divider style={{ margin: "20px 0", borderColor: "#e2e8f0" }} />

        {/* Cliente + detalles del presupuesto */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, gap: 20 }}>
          <div style={{ flex: 1 }}>
            <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>
              Datos del Cliente
            </Text>
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>
                {budget.client_name}
              </div>
              {budget.client_tax_id && (
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 2 }}>
                  CUIT: {budget.client_tax_id}
                </div>
              )}
              {budget.client_address && (
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 2 }}>
                  {budget.client_address}
                </div>
              )}
              {budget.client_email && (
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 2 }}>
                  {budget.client_email}
                </div>
              )}
              {budget.client_phone && (
                <div style={{ fontSize: 13, color: "#475569" }}>
                  {budget.client_phone}
                </div>
              )}
              {budget.government_order && (
                <div style={{ fontSize: 13, color: "#0284c7", fontWeight: 600, marginTop: 6 }}>
                  Orden de Compra: {budget.government_order}
                </div>
              )}
            </div>
          </div>

          <div style={{ width: 240 }}>
            <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>
              Detalles
            </Text>
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
              {[
                ["Número:", preNum],
                ["Fecha de emisión:", dayjs(budget.issue_date).format("DD/MM/YYYY")],
                ...(budget.expiry_date ? [["Válido hasta:", dayjs(budget.expiry_date).format("DD/MM/YYYY")]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                  <Text strong style={{ fontSize: 12 }}>{value}</Text>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla de ítems */}
        <div style={{ marginBottom: 32 }}>
          <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 10 }}>
            Detalle de Servicios
          </Text>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["Descripción", "Cant.", "P. Unitario", "Desc.", "Subtotal"].map((h, i) => (
                  <th key={h} style={{
                    padding: "10px 12px", textAlign: i === 0 ? "left" : "right",
                    fontWeight: 700, color: "#475569", fontSize: 11,
                    textTransform: "uppercase", borderBottom: "2px solid #e2e8f0",
                    borderTop: "1px solid #e2e8f0",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(budget.items || []).map((item: any) => {
                const sub = Number(item.qty) * Number(item.unit_price);
                const disc = sub * (Number(item.discount_pct || 0) / 100);
                const total = sub - disc;
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ fontWeight: 600 }}>{item.description}</div>
                      {item.product_name && item.product_name !== item.description && (
                        <div style={{ color: "#94a3b8", fontSize: 12 }}>{item.product_name}</div>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#475569" }}>
                      {Number(item.qty).toLocaleString("es-AR")}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#475569" }}>
                      ${Number(item.unit_price).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: Number(item.discount_pct) > 0 ? "#ef4444" : "#94a3b8" }}>
                      {Number(item.discount_pct) > 0 ? `${item.discount_pct}%` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#1e293b" }}>
                      ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
          <div style={{ width: 300, background: "#f8fafc", padding: 20, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Text type="secondary">Subtotal neto:</Text>
              <Text strong>${totalAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</Text>
            </div>
            {ivaPct > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Text type="secondary">IVA ({ivaPct}%):</Text>
                <Text strong style={{ color: "#f59e0b" }}>
                  +${ivaAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </Text>
              </div>
            )}
            <Divider style={{ margin: "8px 0", borderColor: "#cbd5e1" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text strong style={{ fontSize: 16, color: "#1e293b" }}>TOTAL:</Text>
              <Text strong style={{ fontSize: 24, color: "#1e3a8a" }}>
                ${totalWithIva.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </Text>
            </div>
          </div>
        </div>

        {/* Condiciones / Observaciones */}
        {budget.notes && (
          <div style={{ marginBottom: 40 }}>
            <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>
              Observaciones
            </Text>
            <div style={{ padding: "12px 16px", background: "#fafafa", borderRadius: 8, border: "1px solid #e2e8f0", color: "#334155" }}>
              {budget.notes}
            </div>
          </div>
        )}

        {/* Vigencia */}
        {budget.expiry_date && (
          <div style={{ marginBottom: 40, padding: "12px 16px", background: "#eff6ff", borderRadius: 8, border: "1px solid #bfdbfe" }}>
            <Text style={{ fontSize: 13, color: "#1e40af" }}>
              Este presupuesto tiene validez hasta el{" "}
              <strong>{dayjs(budget.expiry_date).format("DD [de] MMMM [de] YYYY")}</strong>.
              Pasada esa fecha los precios pueden estar sujetos a variación.
            </Text>
          </div>
        )}

        {/* Firma */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 60 }}>
          <div style={{ width: 260, textAlign: "center" }}>
            <Divider style={{ margin: "0 0 8px", borderColor: "#94a3b8" }} />
            <Text strong style={{ fontSize: 13, color: "#475569" }}>Firma y Aclaración</Text>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Cliente</div>
          </div>
        </div>

      </div>
    </div>
  );
}
