"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Typography, Spin, Button, Divider } from "antd";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

const { Title, Text } = Typography;

export default function CampaignRemitoPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentId = searchParams.get("payment");

  const [campaign, setCampaign] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: c } = await axiosInstance.get(`${API}/campaigns/${id}/`);
      setCampaign(c);
      if (paymentId) {
        const { data: p } = await axiosInstance.get(`${API}/campaign-payments/${paymentId}/`);
        setPayment(p);
      }
    } catch {
      console.error("Error cargando remito de campaña");
    } finally {
      setLoading(false);
    }
  }, [id, paymentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (campaign) {
      const t = setTimeout(() => window.print(), 800);
      return () => clearTimeout(t);
    }
  }, [campaign]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" tip="Generando Remito..." />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <Title level={4}>Campaña no encontrada</Title>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  const totalValue = payment
    ? Number(payment.amount)
    : (campaign.spaces || []).reduce((s: number, sp: any) => s + Number(sp.rental_price || 0), 0)
      || Number(campaign.budget_total || 0);

  const periodLabel = payment
    ? dayjs(payment.period).format("MMMM YYYY").toUpperCase()
    : `${dayjs(campaign.start_date).format("DD/MM/YYYY")} — ${dayjs(campaign.end_date).format("DD/MM/YYYY")}`;

  const remitoNum = payment
    ? `RCM-${String(campaign.id).padStart(4, "0")}-${dayjs(payment.period).format("MMYY")}`
    : `RCM-${String(campaign.id).padStart(4, "0")}`;

  return (
    <div style={{ background: "#fff", minHeight: "100vh", color: "#000" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .ant-notification, .ant-message { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{
        padding: "16px 32px", background: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} style={{ borderRadius: 8 }}>
          Volver
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
            <div style={{ background: "#7c3aed", color: "#fff", padding: "4px 12px", fontSize: 24, fontWeight: 900, display: "inline-block", marginBottom: 6, borderRadius: 4 }}>
              C
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>REMITO COMERCIAL</div>
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              Documento no válido como factura
            </Text>
          </div>
        </div>

        <Divider style={{ margin: "20px 0", borderColor: "#e2e8f0" }} />

        {/* Cliente + datos del remito */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 32, gap: 20 }}>
          <div style={{ flex: 1 }}>
            <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>
              Datos del Cliente
            </Text>
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{campaign.client_name}</div>
            </div>
          </div>
          <div style={{ width: 240 }}>
            <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>
              Detalles del Remito
            </Text>
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
              {[
                ["Número:", remitoNum],
                ["Fecha:", dayjs().format("DD/MM/YYYY")],
                ["Campaña:", campaign.name],
                ["Período:", periodLabel],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
                  <Text strong style={{ fontSize: 12, textAlign: "right", maxWidth: 140 }}>{value}</Text>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detalle de espacios */}
        <div style={{ marginBottom: 32 }}>
          <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 10 }}>
            Detalle de Espacios
          </Text>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["Estructura / Cara", "Dirección", "Período", "Importe"].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#475569", fontSize: 11, textTransform: "uppercase", borderBottom: "2px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(campaign.spaces || []).map((s: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600 }}>{s.face_name || "—"}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{s.structure_name}</div>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#475569" }}>
                    {[s.location_address, s.location_locality].filter(Boolean).join(", ") || s.location_name || "—"}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#475569" }}>
                    {payment
                      ? dayjs(payment.period).format("MMM YYYY")
                      : `${dayjs(campaign.start_date).format("DD/MM/YY")} → ${dayjs(campaign.end_date).format("DD/MM/YY")}`}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#1e293b" }}>
                    ${Number(s.rental_price || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 40 }}>
          <div style={{ width: 280, background: "#f8fafc", padding: 20, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            {campaign.billing_type === "mensual" && payment && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Text type="secondary">Período:</Text>
                <Text strong>{dayjs(payment.period).format("MMMM YYYY")}</Text>
              </div>
            )}
            <Divider style={{ margin: "8px 0", borderColor: "#cbd5e1" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text strong style={{ fontSize: 16, color: "#1e293b" }}>Total:</Text>
              <Text strong style={{ fontSize: 22, color: "#7c3aed" }}>
                ${totalValue.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </Text>
            </div>
            {campaign.billing_type === "mensual" && !payment && (
              <Text type="secondary" style={{ fontSize: 11, display: "block", textAlign: "right", marginTop: 4 }}>
                Monto mensual
              </Text>
            )}
          </div>
        </div>

        {/* Notas */}
        {campaign.notes && (
          <div style={{ marginBottom: 60 }}>
            <Text strong style={{ textTransform: "uppercase", fontSize: 11, color: "#64748b", display: "block", marginBottom: 6 }}>Observaciones</Text>
            <div style={{ padding: "12px 16px", background: "#fafafa", borderRadius: 8, border: "1px solid #e2e8f0", color: "#334155" }}>
              {campaign.notes}
            </div>
          </div>
        )}

        {/* Firma */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 80 }}>
          <div style={{ width: 250, textAlign: "center" }}>
            <Divider style={{ margin: "0 0 8px", borderColor: "#94a3b8" }} />
            <Text strong style={{ fontSize: 13, color: "#475569" }}>Recibí Conforme</Text>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Aclaración y Firma</div>
          </div>
        </div>
      </div>
    </div>
  );
}
