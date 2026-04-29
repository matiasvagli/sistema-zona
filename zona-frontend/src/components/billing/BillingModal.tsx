"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal, Form, Select, Input, Button, Divider, Alert, Spin, notification } from "antd";
import { FileProtectOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetId: number | null;
  workOrderId?: number | null;
  clientId?: number | null;
  clientName: string;
  totalAmount: number;
}

export const BillingModal: React.FC<BillingModalProps> = ({
  open,
  onClose,
  onSuccess,
  budgetId,
  workOrderId,
  clientId,
  clientName,
  totalAmount,
}) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);

  const billingType = Form.useWatch('billing_type', form);

  useEffect(() => {
    if (open && budgetId) {
      setLoadingBudget(true);
      axiosInstance.get(`${API}/budgets/${budgetId}/`)
        .then(({ data }) => setBudgetData(data))
        .catch(() => setBudgetData(null))
        .finally(() => setLoadingBudget(false));
    } else {
      setBudgetData(null);
    }
  }, [open, budgetId]);

  const subtotal     = budgetData ? Number(budgetData.total_amount   || 0) : totalAmount;
  const ivaPct       = budgetData ? Number(budgetData.iva_pct        || 0) : 0;
  const ivaAmount    = budgetData ? Number(budgetData.iva_amount     || 0) : 0;
  const totalFactura = budgetData ? Number(budgetData.total_with_iva || 0) : totalAmount;

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      let finalBudgetId = budgetId;

      // Si no hay presupuesto, lo creamos primero
      if (!finalBudgetId && workOrderId) {
        const { data: newBudget } = await axiosInstance.post(`${API}/budgets/`, {
          client: clientId, 
          work_order: workOrderId,
          status: "aprobado", 
          notes: values.notes || "Facturación directa desde OT"
        });
        finalBudgetId = newBudget.id;
      }

      if (!finalBudgetId) throw new Error("No se pudo determinar el presupuesto a facturar.");

      await axiosInstance.post(`${API}/budgets/${finalBudgetId}/invoice/`, values);
      
      notification.success({
        message: values.billing_type === "remito" ? "Remito generado" : "Facturación exitosa",
        description: values.billing_type === "remito" 
          ? `El remito del presupuesto PRE-${String(finalBudgetId).padStart(4, "0")} está listo.` 
          : `El presupuesto PRE-${String(finalBudgetId).padStart(4, "0")} ha sido marcado como facturado.`,
      });

      if (values.billing_type === "remito") {
        router.push(`/budgets/${finalBudgetId}/remito`);
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      notification.error({
        message: "Error al facturar",
        description: e?.response?.data?.detail || "No se pudo procesar la facturación.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <FileProtectOutlined style={{ color: "#3b82f6" }} />
          <span>Procesar Facturación</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      styles={{ body: { padding: "20px 24px" } }}
    >
      <div style={{ marginBottom: 20 }}>
        <Alert
          message="Preparado para integración AFIP"
          description="Este módulo ya cuenta con la estructura para emitir Factura A, B o C automáticamente."
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          style={{ borderRadius: 12 }}
        />
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          billing_type: "factura",
          receipt_type: "factura_b",
          payment_method: "transferencia",
        }}
      >
        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: 24 }}>
          {loadingBudget ? (
            <div style={{ textAlign: "center", padding: 12 }}><Spin size="small" /></div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#64748b" }}>Cliente:</span>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>{clientName}</span>
              </div>
              {budgetData?.government_order && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#64748b" }}>Nro de Orden:</span>
                  <span style={{ fontWeight: 700, color: "#0284c7" }}>{budgetData.government_order}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ivaPct > 0 ? 6 : 0 }}>
                <span style={{ color: "#64748b" }}>{ivaPct > 0 ? "Subtotal:" : "Total a Facturar:"}</span>
                <span style={{ fontWeight: ivaPct > 0 ? 500 : 800, color: ivaPct > 0 ? "#475569" : "#10b981", fontSize: ivaPct > 0 ? 14 : 16 }}>
                  ${subtotal.toLocaleString("es-AR")}
                </span>
              </div>
              {ivaPct > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#64748b" }}>IVA ({ivaPct}%):</span>
                    <span style={{ color: "#f59e0b" }}>+${ivaAmount.toLocaleString("es-AR")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: 8, marginTop: 4 }}>
                    <span style={{ color: "#64748b", fontWeight: 600 }}>Total c/IVA:</span>
                    <span style={{ fontWeight: 800, color: "#10b981", fontSize: 16 }}>
                      ${totalFactura.toLocaleString("es-AR")}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <Divider orientation="left" style={{ fontSize: 12, color: "#94a3b8" }}>Configuración Fiscal</Divider>

        <Form.Item name="billing_type" label="Tipo de Operación">
          <Select onChange={(val) => {
            if (val === 'remito') {
              form.setFieldsValue({ receipt_type: null });
            } else {
              form.setFieldsValue({ receipt_type: 'factura_b' });
            }
          }}>
            <Select.Option value="factura">Emisión de Factura (AFIP)</Select.Option>
            <Select.Option value="remito">Emisión de Remito (Uso Interno)</Select.Option>
          </Select>
        </Form.Item>

        {billingType !== "remito" && (
          <Form.Item name="receipt_type" label="Tipo de Comprobante">
            <Select disabled>
              <Select.Option value="factura_a">Factura A</Select.Option>
              <Select.Option value="factura_b">Factura B</Select.Option>
              <Select.Option value="factura_c">Factura C</Select.Option>
            </Select>
          </Form.Item>
        )}

        <Form.Item name="payment_method" label="Método de Pago">
          <Select>
            <Select.Option value="transferencia">Transferencia Bancaria</Select.Option>
            <Select.Option value="efectivo">Efectivo / Caja</Select.Option>
            <Select.Option value="cheque">Cheque</Select.Option>
            <Select.Option value="tarjeta">Tarjeta de Crédito/Débito</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="notes" label="Notas Internas">
          <Input.TextArea placeholder="Observaciones para la factura..." rows={2} />
        </Form.Item>

        <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
          <Button onClick={onClose} style={{ flex: 1, height: 45, borderRadius: 10 }}>
            Cancelar
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<ThunderboltOutlined />}
            style={{ 
              flex: 2, height: 45, borderRadius: 10, 
              background: "#0f172a", border: "none",
              fontWeight: 600
            }}
          >
            Confirmar y Facturar
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
