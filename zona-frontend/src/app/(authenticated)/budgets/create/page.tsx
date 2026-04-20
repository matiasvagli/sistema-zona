"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useList } from "@refinedev/core";
import {
  Typography, Form, Input, Select, Button,
  notification, Row, Col, InputNumber, Popconfirm, Divider, Tag, DatePicker,
} from "antd";
import {
  ArrowLeftOutlined, SaveOutlined, PlusOutlined, DeleteOutlined,
  UserOutlined, ShoppingOutlined, FileTextOutlined, CalculatorOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { ClientSelect } from "@/components/ClientSelect";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const API = "http://localhost:8000/api/v1";

type BudgetItem = {
  key: string;
  product: number | null;
  description: string;
  qty: number;
  unit_price: number;
  discount_pct: number;
};

function calcTotal(item: BudgetItem) {
  const sub = (item.qty || 0) * (item.unit_price || 0);
  return sub - sub * ((item.discount_pct || 0) / 100);
}

export default function BudgetCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [itemForm] = Form.useForm();

  const { result: productsResult } = useList({ resource: "products", pagination: { pageSize: 200 } });
  const products: any[] = productsResult?.data || [];
  const preClientId = searchParams.get("client");

  const addItem = () => {
    itemForm.validateFields().then((vals) => {
      const product = products.find((p) => p.id === vals.product);
      setItems((prev) => [
        ...prev,
        {
          key: Date.now().toString(),
          product: vals.product || null,
          description: vals.description || product?.name || "",
          qty: Number(vals.qty),
          unit_price: Number(vals.unit_price),
          discount_pct: Number(vals.discount_pct || 0),
        },
      ]);
      itemForm.resetFields();
    });
  };

  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key));

  const totalGeneral = items.reduce((acc, i) => acc + calcTotal(i), 0);

  const handleSubmit = async (values: any) => {
    if (items.length === 0) {
      notification.warning({ message: "Agregá al menos un ítem al presupuesto" });
      return;
    }
    setSaving(true);
    try {
      const { data: budget } = await axiosInstance.post(`${API}/budgets/`, {
        client: values.client,
        notes: values.notes || "",
        status: "borrador",
        expiry_date: values.expiry_date ? dayjs(values.expiry_date).format("YYYY-MM-DD") : null,
      });
      await Promise.all(
        items.map((item) =>
          axiosInstance.post(`${API}/budget-items/`, {
            budget: budget.id,
            product: item.product || null,
            description: item.description,
            qty: item.qty,
            unit_price: item.unit_price,
            discount_pct: item.discount_pct,
          })
        )
      );
      notification.success({
        message: "Presupuesto creado",
        description: `PRE-${String(budget.id).padStart(4, "0")} guardado como borrador.`,
      });
      router.push(`/budgets/${budget.id}`);
    } catch {
      notification.error({ message: "Error al crear el presupuesto" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100%" }}>

      {/* ── HEADER BAND ─────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)",
        padding: "28px 36px 90px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              borderRadius: 10,
            }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 16,
              }}>
                <FileTextOutlined />
              </div>
              <Title level={3} style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 800 }}>
                Nuevo Presupuesto
              </Title>
              <Tag style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff", borderRadius: 20, fontSize: 11,
              }}>
                Borrador
              </Tag>
            </div>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 2, display: "block" }}>
              Creá un presupuesto y después convertilo en OT con un click
            </Text>
          </div>
        </div>
      </div>

      {/* ── CONTENT (pulled up to overlap header) ───────────────── */}
      <div style={{ padding: "0 36px 36px", marginTop: -66 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ client: preClientId ? Number(preClientId) : undefined }}
        >
          <Row gutter={[20, 20]}>

            {/* LEFT COLUMN */}
            <Col xs={24} lg={16}>

              {/* Cliente + notas */}
              <div style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                padding: "24px 28px",
                marginBottom: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#e6f4ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#1677ff", fontSize: 14 }}>
                    <UserOutlined />
                  </div>
                  <Text strong style={{ fontSize: 14, color: "#0f172a" }}>Información del Cliente</Text>
                </div>

                <Form.Item
                  label={<Text strong style={{ fontSize: 13 }}>Cliente</Text>}
                  name="client"
                  rules={[{ required: true, message: "Seleccioná un cliente" }]}
                >
                  <ClientSelect size="large" />
                </Form.Item>

                <Form.Item
                  label={<Text strong style={{ fontSize: 13 }}>Notas internas</Text>}
                  name="notes"
                >
                  <TextArea
                    rows={2}
                    placeholder="Detalles, aclaraciones, observaciones del presupuesto..."
                    style={{ borderRadius: 8, resize: "none" }}
                  />
                </Form.Item>

                <Form.Item
                  label={<Text strong style={{ fontSize: 13 }}>Fecha de Vencimiento (opcional)</Text>}
                  name="expiry_date"
                  style={{ marginBottom: 0 }}
                >
                  <DatePicker 
                    style={{ width: "100%", borderRadius: 8 }} 
                    format="DD/MM/YYYY"
                    placeholder="Seleccionar fecha"
                    size="large"
                  />
                </Form.Item>
              </div>

              {/* Items */}
              <div style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}>
                {/* Items header */}
                <div style={{
                  padding: "18px 28px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", fontSize: 14 }}>
                      <ShoppingOutlined />
                    </div>
                    <Text strong style={{ fontSize: 14, color: "#0f172a" }}>Ítems del Presupuesto</Text>
                  </div>
                  {items.length > 0 && (
                    <Tag style={{ borderRadius: 20, background: "#f3e8ff", border: "none", color: "#7c3aed", fontSize: 12 }}>
                      {items.length} {items.length === 1 ? "ítem" : "ítems"}
                    </Tag>
                  )}
                </div>

                {/* Add item form */}
                <div style={{ padding: "20px 28px", background: "#fafbfc", borderBottom: "1px solid #f0f0f0" }}>
                  <Form form={itemForm} layout="vertical">
                    <Row gutter={12} align="bottom">
                      <Col xs={24} sm={8}>
                        <Form.Item label={<Text style={{ fontSize: 12 }}>Descripción</Text>} name="description" rules={[{ required: true, message: "Requerido" }]} style={{ marginBottom: 0 }}>
                          <Input placeholder="Ej: Cartel 3x2" size="middle" style={{ borderRadius: 8 }} />
                        </Form.Item>
                      </Col>
                      <Col xs={12} sm={5}>
                        <Form.Item label={<Text style={{ fontSize: 12 }}>Producto (opcional)</Text>} name="product" style={{ marginBottom: 0 }}>
                          <Select
                            placeholder="Vincular"
                            allowClear showSearch size="middle"
                            style={{ borderRadius: 8 }}
                            filterOption={(input, option) =>
                              String(option?.children || "").toLowerCase().includes(input.toLowerCase())
                            }
                            onChange={(val) => {
                              const p = products.find((x) => x.id === val);
                              if (p) {
                                itemForm.setFieldValue("description", p.name);
                                if (p.price) itemForm.setFieldValue("unit_price", p.price);
                              }
                            }}
                          >
                            {products.map((p) => (
                              <Option key={p.id} value={p.id}>{p.name}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col xs={4} sm={2}>
                        <Form.Item label={<Text style={{ fontSize: 12 }}>Cant.</Text>} name="qty" rules={[{ required: true, message: "!" }]} style={{ marginBottom: 0 }}>
                          <InputNumber min={0.01} style={{ width: "100%", borderRadius: 8 }} />
                        </Form.Item>
                      </Col>
                      <Col xs={8} sm={4}>
                        <Form.Item label={<Text style={{ fontSize: 12 }}>P. Unitario</Text>} name="unit_price" rules={[{ required: true, message: "!" }]} style={{ marginBottom: 0 }}>
                          <InputNumber min={0} prefix="$" style={{ width: "100%", borderRadius: 8 }} />
                        </Form.Item>
                      </Col>
                      <Col xs={6} sm={2}>
                        <Form.Item label={<Text style={{ fontSize: 12 }}>Dto %</Text>} name="discount_pct" style={{ marginBottom: 0 }}>
                          <InputNumber min={0} max={100} suffix="%" style={{ width: "100%", borderRadius: 8 }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} sm={3}>
                        <Form.Item label=" " style={{ marginBottom: 0 }}>
                          <Button
                            icon={<PlusOutlined />}
                            onClick={addItem}
                            style={{
                              width: "100%", borderRadius: 8,
                              background: "#7c3aed", borderColor: "#7c3aed", color: "#fff",
                              fontWeight: 600,
                            }}
                          >
                            Agregar
                          </Button>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </div>

                {/* Items list */}
                {items.length === 0 ? (
                  <div style={{ padding: "32px 28px", textAlign: "center" }}>
                    <CalculatorOutlined style={{ fontSize: 32, color: "#d9d9d9", display: "block", marginBottom: 8 }} />
                    <Text type="secondary" style={{ fontSize: 13 }}>Todavía no agregaste ítems</Text>
                  </div>
                ) : (
                  <div>
                    {/* Table header */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 60px 110px 60px 110px 36px",
                      padding: "10px 28px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #f0f0f0",
                    }}>
                      {["Descripción", "Cant.", "P. Unit.", "Dto %", "Subtotal", ""].map((h) => (
                        <Text key={h} type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</Text>
                      ))}
                    </div>

                    {items.map((item, idx) => (
                      <div
                        key={item.key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 60px 110px 60px 110px 36px",
                          alignItems: "center",
                          padding: "12px 28px",
                          borderBottom: idx < items.length - 1 ? "1px solid #f5f5f5" : "none",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div>
                          <Text strong style={{ fontSize: 13 }}>{item.description}</Text>
                          {item.product && (
                            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                              {products.find((p) => p.id === item.product)?.name}
                            </Text>
                          )}
                        </div>
                        <Text style={{ fontSize: 13 }}>{item.qty}</Text>
                        <Text style={{ fontSize: 13 }}>${Number(item.unit_price).toLocaleString("es-AR")}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.discount_pct}%</Text>
                        <Text strong style={{ fontSize: 13, color: "#059669" }}>
                          ${calcTotal(item).toLocaleString("es-AR")}
                        </Text>
                        <Popconfirm title="¿Eliminar ítem?" onConfirm={() => removeItem(item.key)} okText="Sí">
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </div>
                    ))}

                    {/* Total row */}
                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 16,
                      padding: "14px 28px",
                      background: "linear-gradient(135deg, #ecfdf5, #f0fdf4)",
                      borderTop: "2px solid #bbf7d0",
                    }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Total del presupuesto:</Text>
                      <Text strong style={{ fontSize: 20, color: "#059669" }}>
                        ${totalGeneral.toLocaleString("es-AR")}
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </Col>

            {/* RIGHT SIDEBAR */}
            <Col xs={24} lg={8}>
              <div style={{ position: "sticky", top: 24 }}>
                <div style={{
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                }}>
                  {/* Sidebar header */}
                  <div style={{
                    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
                    padding: "20px 24px",
                  }}>
                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Resumen</Text>
                    <Title level={4} style={{ color: "#fff", margin: "6px 0 0", fontSize: 22 }}>
                      ${totalGeneral.toLocaleString("es-AR")}
                    </Title>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                      {items.length} {items.length === 1 ? "ítem" : "ítems"}
                    </Text>
                  </div>

                  <div style={{ padding: "20px 24px" }}>
                    {/* Breakdown */}
                    {items.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        {items.map((item) => (
                          <div key={item.key} style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "flex-start", marginBottom: 10,
                          }}>
                            <Text style={{ fontSize: 12, flex: 1, color: "#475569" }} ellipsis>{item.description}</Text>
                            <Text strong style={{ fontSize: 12, flexShrink: 0, marginLeft: 8, color: "#059669" }}>
                              ${calcTotal(item).toLocaleString("es-AR")}
                            </Text>
                          </div>
                        ))}
                        <Divider style={{ margin: "12px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <Text strong style={{ fontSize: 13 }}>Total</Text>
                          <Text strong style={{ fontSize: 14, color: "#059669" }}>
                            ${totalGeneral.toLocaleString("es-AR")}
                          </Text>
                        </div>
                      </div>
                    )}

                    <Button
                      type="primary"
                      size="large"
                      icon={<SaveOutlined />}
                      htmlType="submit"
                      loading={saving}
                      style={{
                        width: "100%", borderRadius: 10,
                        background: "linear-gradient(135deg, #1677ff, #7c3aed)",
                        border: "none",
                        height: 46, fontSize: 15, fontWeight: 700,
                        boxShadow: "0 4px 14px rgba(22,119,255,0.4)",
                      }}
                    >
                      Guardar Presupuesto
                    </Button>
                    <Button
                      size="large"
                      onClick={() => router.back()}
                      style={{ width: "100%", marginTop: 10, borderRadius: 10, height: 42 }}
                    >
                      Cancelar
                    </Button>

                    {/* Tips */}
                    <div style={{
                      marginTop: 20, padding: "14px 16px",
                      background: "#fffbeb", borderRadius: 10,
                      border: "1px solid #fde68a",
                    }}>
                      <Text style={{ fontSize: 11, color: "#92400e", lineHeight: 1.6 }}>
                        💡 Podés convertir este presupuesto en una <strong>Orden de Trabajo</strong> una vez aprobado.
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}
