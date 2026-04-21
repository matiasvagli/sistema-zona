"use client";

import React, { useState } from "react";
import { Modal, Form, Select, Input, InputNumber, Button, Divider, Alert, notification } from "antd";
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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

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
        message: "Facturación exitosa",
        description: `El presupuesto PRE-${String(finalBudgetId).padStart(4, "0")} ha sido marcado como facturado.`,
      });
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
          receipt_type: "factura_b",
          payment_method: "transferencia",
        }}
      >
        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "#64748b" }}>Cliente:</span>
            <span style={{ fontWeight: 700, color: "#1e293b" }}>{clientName}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#64748b" }}>Total a Facturar:</span>
            <span style={{ fontWeight: 800, color: "#10b981", fontSize: 16 }}>
              ${totalAmount.toLocaleString("es-AR")}
            </span>
          </div>
        </div>

        <Divider orientation="left" style={{ fontSize: 12, color: "#94a3b8" }}>Configuración Fiscal</Divider>

        <Form.Item name="receipt_type" label="Tipo de Comprobante">
          <Select disabled>
            <Select.Option value="factura_a">Factura A</Select.Option>
            <Select.Option value="factura_b">Factura B</Select.Option>
            <Select.Option value="factura_c">Factura C</Select.Option>
          </Select>
        </Form.Item>

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
