"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useList } from "@refinedev/core";
import {
  Typography, Form, Input, Select, DatePicker, Button, Card, Divider,
  Checkbox, Tag, Space, notification, Spin, Row, Col,
} from "antd";
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, FireOutlined, SaveOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const taskStatusConfig: Record<string, { color: string; label: string }> = {
  pendiente:  { color: "default",    label: "Pendiente"  },
  en_proceso: { color: "processing", label: "En Proceso" },
  completada: { color: "success",    label: "Completada" },
  bloqueada:  { color: "error",      label: "Bloqueada"  },
};

export default function WorkOrderCreate() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState<number[]>([]);

  const { result: clientsResult, query: clientsQuery } = useList({
    resource: "clients",
    pagination: { pageSize: 100 },
  });
  const { result: sectorsResult, query: sectorsQuery } = useList({
    resource: "sectors",
    sorters: [{ field: "order", order: "asc" }],
  });

  const clients: any[] = clientsResult?.data || [];
  const sectors: any[] = sectorsResult?.data || [];

  const toggleSector = (sectorId: number) => {
    setSelectedSectors((prev) =>
      prev.includes(sectorId) ? prev.filter((id) => id !== sectorId) : [...prev, sectorId]
    );
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        status: values.status || "pendiente",
        priority: values.priority || "normal",
        notes: values.notes || "",
        client: values.client || null,
        due_date: values.due_date ? dayjs(values.due_date).toISOString() : null,
      };

      const { data: newOT } = await axiosInstance.post(
        "http://localhost:8000/api/v1/work-orders/",
        payload
      );

      // Crear sector tasks para cada sector seleccionado
      if (selectedSectors.length > 0) {
        await Promise.all(
          selectedSectors.map((sectorId) =>
            axiosInstance.post("http://localhost:8000/api/v1/sector-tasks/", {
              work_order: newOT.id,
              sector: sectorId,
              status: "pendiente",
            })
          )
        );
      }

      notification.success({
        message: "OT creada correctamente",
        description: `OT #${newOT.id} — ${newOT.title}`,
      });

      router.push("/work-orders");
    } catch (err: any) {
      notification.error({
        message: "Error al crear la OT",
        description: err?.response?.data
          ? JSON.stringify(err.response.data)
          : "Intentá de nuevo.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          type="text"
        />
        <div>
          <Title level={2} style={{ margin: 0 }}>Nueva Orden de Trabajo</Title>
          <Text type="secondary">Completá los datos y asigná los sectores de producción</Text>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ status: "pendiente", priority: "normal" }}
      >
        <Row gutter={[20, 0]}>
          {/* Columna principal */}
          <Col xs={24} lg={16}>
            <Card
              title="Datos de la OT"
              variant="borderless"
              style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}
            >
              <Form.Item
                label="Título"
                name="title"
                rules={[{ required: true, message: "El título es obligatorio" }]}
              >
                <Input placeholder="Ej: Cartel vial Av. Colón" size="large" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Estado" name="status">
                    <Select size="large">
                      <Option value="pendiente">Pendiente</Option>
                      <Option value="en_proceso">En Proceso</Option>
                      <Option value="pausada">Pausada</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Prioridad" name="priority">
                    <Select size="large">
                      <Option value="normal">Normal</Option>
                      <Option value="inmediata">
                        <span style={{ color: "#ff4d4f" }}>
                          <FireOutlined style={{ marginRight: 6 }} />Inmediata
                        </span>
                      </Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Cliente" name="client">
                    {clientsQuery.isLoading ? (
                      <Spin size="small" />
                    ) : (
                      <Select
                        size="large"
                        placeholder="Seleccionar cliente (opcional)"
                        allowClear
                        showSearch
                        filterOption={(input, option) =>
                          String(option?.children || "").toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {clients.map((c: any) => (
                          <Option key={c.id} value={c.id}>{c.name}</Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Fecha de vencimiento" name="due_date">
                    <DatePicker
                      size="large"
                      style={{ width: "100%" }}
                      placeholder="Seleccionar fecha"
                      format="DD/MM/YYYY"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Notas" name="notes">
                <TextArea rows={3} placeholder="Observaciones, detalles adicionales..." />
              </Form.Item>
            </Card>
          </Col>

          {/* Sectores */}
          <Col xs={24} lg={8}>
            <Card
              title="Sectores de producción"
              variant="borderless"
              style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}
            >
              {sectorsQuery.isLoading ? (
                <div style={{ textAlign: "center", padding: 20 }}><Spin /></div>
              ) : sectors.length === 0 ? (
                <Text type="secondary">No hay sectores configurados.</Text>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sectors.map((sector: any) => {
                    const selected = selectedSectors.includes(sector.id);
                    return (
                      <div
                        key={sector.id}
                        onClick={() => toggleSector(sector.id)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: `2px solid ${selected ? "#1890ff" : "#f0f0f0"}`,
                          background: selected ? "#e6f7ff" : "#fafafa",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.15s",
                        }}
                      >
                        <Text strong style={{ color: selected ? "#1890ff" : "#262626" }}>
                          {sector.name}
                        </Text>
                        {selected && (
                          <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>Incluido</Tag>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedSectors.length > 0 && (
                <>
                  <Divider style={{ margin: "16px 0 8px" }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {selectedSectors.length} sector{selectedSectors.length > 1 ? "es" : ""} seleccionado{selectedSectors.length > 1 ? "s" : ""}
                  </Text>
                </>
              )}
            </Card>
          </Col>
        </Row>

        {/* Botones */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Button size="large" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            htmlType="submit"
            loading={saving}
          >
            Crear OT
          </Button>
        </div>
      </Form>
    </div>
  );
}
