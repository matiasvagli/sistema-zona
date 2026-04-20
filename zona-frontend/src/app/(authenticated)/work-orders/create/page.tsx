"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useList } from "@refinedev/core";
import {
  Typography, Form, Input, Select, DatePicker, Button, Card,
  notification, Spin, Row, Col, Divider, Tag,
} from "antd";
import {
  ArrowLeftOutlined, FireOutlined, SaveOutlined,
  UserOutlined, CalendarOutlined, AlignLeftOutlined,
  CameraOutlined, DeleteOutlined, PlusOutlined, CheckCircleFilled,
  FileTextOutlined, RocketOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import dayjs from "dayjs";
import { ClientSelect } from "@/components/ClientSelect";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const API = "http://localhost:8000/api/v1";

type PhotoFile = { file: File; preview: string };

const SECTOR_PALETTE = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16",
];

function PhotoUploadZone({
  label, emoji, files, onAdd, onRemove, inputRef,
}: {
  label: string; emoji: string;
  files: PhotoFile[]; onAdd: (f: File) => void; onRemove: (i: number) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text strong style={{ fontSize: 12, color: "#475569" }}>{emoji} {label}</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={() => inputRef.current?.click()}
          style={{ fontSize: 11, height: 24, borderRadius: 6 }}>
          Agregar
        </Button>
      </div>
      <input
        ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={(e) => { Array.from(e.target.files || []).forEach(onAdd); e.target.value = ""; }}
      />
      {files.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2px dashed #cbd5e1", borderRadius: 10, padding: "14px 10px",
            textAlign: "center", cursor: "pointer", background: "#f8fafc",
            transition: "border-color 0.2s",
          }}
        >
          <CameraOutlined style={{ fontSize: 18, color: "#94a3b8" }} />
          <Text type="secondary" style={{ display: "block", marginTop: 4, fontSize: 11 }}>
            Click para agregar
          </Text>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {files.map((f, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={f.preview} alt=""
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "2px solid #e2e8f0" }}
              />
              <Button size="small" type="text" danger icon={<DeleteOutlined />}
                onClick={() => onRemove(i)}
                style={{
                  position: "absolute", top: -6, right: -6, background: "#fff",
                  borderRadius: "50%", width: 18, height: 18, minWidth: 18, padding: 0,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)", fontSize: 10,
                }}
              />
            </div>
          ))}
          <div onClick={() => inputRef.current?.click()}
            style={{
              width: 60, height: 60, borderRadius: 8, border: "2px dashed #cbd5e1",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", background: "#f8fafc",
            }}
          >
            <PlusOutlined style={{ color: "#94a3b8", fontSize: 14 }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkOrderCreate() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState<number[]>([]);
  const [photosBefore, setPhotosBefore] = useState<PhotoFile[]>([]);
  const [photosAfter,  setPhotosAfter]  = useState<PhotoFile[]>([]);
  const fileBeforeRef = useRef<HTMLInputElement>(null);
  const fileAfterRef  = useRef<HTMLInputElement>(null);

  const { result: sectorsResult, query: sectorsQuery } = useList({
    resource: "sectors", sorters: [{ field: "order", order: "asc" }],
  });
  const { result: budgetsResult } = useList({
    resource: "budgets", pagination: { pageSize: 100 },
    sorters: [{ field: "created_at", order: "desc" }],
  });

  const sectors: any[] = sectorsResult?.data || [];
  const budgets: any[] = budgetsResult?.data || [];

  const onBudgetSelect = (budgetId: number) => {
    const b = budgets.find((x) => x.id === budgetId);
    if (!b) return;
    if (b.client) form.setFieldValue("client", b.client);
    if (b.notes)  form.setFieldValue("notes",  b.notes);
  };

  const addPhoto = (file: File, cat: "before" | "after") => {
    const preview = URL.createObjectURL(file);
    if (cat === "before") setPhotosBefore((p) => [...p, { file, preview }]);
    else setPhotosAfter((p) => [...p, { file, preview }]);
  };
  const removePhoto = (idx: number, cat: "before" | "after") => {
    if (cat === "before") setPhotosBefore((p) => p.filter((_, i) => i !== idx));
    else setPhotosAfter((p) => p.filter((_, i) => i !== idx));
  };
  const uploadPhotos = async (otId: number, files: PhotoFile[], cat: "before" | "after") => {
    for (const { file } of files) {
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("category", cat);
      await axiosInstance.post(`${API}/work-orders/${otId}/upload-photo/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
  };
  const toggleSector = (id: number) =>
    setSelectedSectors((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        status: values.status || "pendiente",
        priority: values.priority || "normal",
        notes: values.notes || "",
        client: values.client || null,
        budget: values.budget || null,
        due_date: values.due_date ? dayjs(values.due_date).toISOString() : null,
      };
      const { data: newOT } = await axiosInstance.post(`${API}/work-orders/`, payload);
      if (selectedSectors.length > 0) {
        await Promise.all(selectedSectors.map((sid) =>
          axiosInstance.post(`${API}/sector-tasks/`, { work_order: newOT.id, sector: sid, status: "pendiente" })
        ));
      }
      if (photosBefore.length > 0) await uploadPhotos(newOT.id, photosBefore, "before");
      if (photosAfter.length  > 0) await uploadPhotos(newOT.id, photosAfter,  "after");
      notification.success({ message: "Orden creada", description: `OT #${newOT.id} registrada.` });
      router.push(`/work-orders/${newOT.id}`);
    } catch {
      notification.error({ message: "Error al crear la orden. Intentá de nuevo." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#f0f4f8", minHeight: "100%" }}>

      {/* Hero header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)",
        padding: "32px 40px 28px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{
          position: "absolute", top: -40, right: -40, width: 200, height: 200,
          borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -60, right: 120, width: 160, height: 160,
          borderRadius: "50%", background: "rgba(99,102,241,0.15)", pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            type="text"
            style={{ color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              background: "rgba(255,255,255,0.12)", borderRadius: 14,
              padding: "10px 12px", backdropFilter: "blur(10px)",
            }}>
              <RocketOutlined style={{ color: "#fff", fontSize: 22 }} />
            </div>
            <div>
              <Title level={3} style={{ margin: 0, color: "#fff", fontWeight: 700 }}>
                Nueva Orden de Trabajo
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                Completá los datos y asigná los sectores que van a intervenir.
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "28px 32px" }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}
          initialValues={{ status: "pendiente", priority: "normal" }}>
          <Row gutter={[20, 20]}>

            {/* LEFT: form fields */}
            <Col xs={24} lg={14}>
              <Card
                style={{
                  borderRadius: 16, border: "none",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                  overflow: "hidden",
                }}
                styles={{ body: { padding: 0 } }}
              >
                {/* Card header accent */}
                <div style={{
                  background: "linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)",
                  padding: "14px 28px",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.6)" }} />
                  <Text strong style={{ color: "#fff", fontSize: 14, letterSpacing: 0.3 }}>
                    Información General
                  </Text>
                </div>

                <div style={{ padding: "28px 28px 20px" }}>
                  {/* Presupuesto (optional) */}
                  <Form.Item
                    label={
                      <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        <FileTextOutlined style={{ marginRight: 6, color: "#f59e0b" }} />
                        Presupuesto vinculado <span style={{ textTransform: "none", fontWeight: 400 }}>(opcional)</span>
                      </span>
                    }
                    name="budget"
                    style={{ marginBottom: 20 }}
                  >
                    <Select
                      size="large" placeholder="Buscar presupuesto..." allowClear showSearch
                      optionFilterProp="label"
                      onChange={(val) => val && onBudgetSelect(val)}
                      style={{ borderRadius: 10 }}
                      options={budgets.map((b) => ({
                        value: b.id,
                        label: `PRE-${String(b.id).padStart(4, "0")} — ${b.client_name}${b.total_amount ? ` ($${Number(b.total_amount).toLocaleString("es-AR")})` : ""}`,
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Título</span>}
                    name="title"
                    rules={[{ required: true, message: "Requerido" }]}
                    style={{ marginBottom: 20 }}
                  >
                    <Input
                      size="large" placeholder="Ej: Cartel vía pública — Aeropuerto"
                      style={{ borderRadius: 10, fontSize: 14 }}
                    />
                  </Form.Item>

                  <Row gutter={14}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={<span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Estado</span>}
                        name="status" style={{ marginBottom: 20 }}>
                        <Select size="large" style={{ borderRadius: 10 }}>
                          <Option value="pendiente">Pendiente</Option>
                          <Option value="en_proceso">En Proceso</Option>
                          <Option value="pausada">Pausada</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={<span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Prioridad</span>}
                        name="priority" style={{ marginBottom: 20 }}>
                        <Select size="large" style={{ borderRadius: 10 }}>
                          <Option value="normal">Normal</Option>
                          <Option value="inmediata">
                            <span style={{ color: "#ef4444" }}><FireOutlined style={{ marginRight: 6 }} />Inmediata</span>
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={14}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={<span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}><UserOutlined style={{ marginRight: 5 }} />Cliente</span>}
                        name="client" style={{ marginBottom: 20 }}>
                        <ClientSelect size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        label={<span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}><CalendarOutlined style={{ marginRight: 5 }} />Entrega</span>}
                        name="due_date" style={{ marginBottom: 20 }}>
                        <DatePicker size="large" style={{ width: "100%", borderRadius: 10 }}
                          placeholder="DD/MM/YYYY" format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={<span style={{ color: "#64748b", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}><AlignLeftOutlined style={{ marginRight: 5 }} />Notas</span>}
                    name="notes" style={{ marginBottom: 0 }}>
                    <TextArea rows={3} placeholder="Medidas, materiales, instrucciones especiales..."
                      style={{ borderRadius: 10 }} />
                  </Form.Item>
                </div>
              </Card>
            </Col>

            {/* RIGHT: sectors + photos + save */}
            <Col xs={24} lg={10}>
              {/* Sectores */}
              <Card
                style={{
                  borderRadius: 16, border: "none",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                  overflow: "hidden", marginBottom: 16,
                }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{
                  background: "linear-gradient(90deg, #0f172a 0%, #334155 100%)",
                  padding: "14px 24px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <Text strong style={{ color: "#fff", fontSize: 14 }}>Sectores Requeridos</Text>
                  {selectedSectors.length > 0 && (
                    <span style={{
                      background: "#6366f1", color: "#fff", fontSize: 11, fontWeight: 700,
                      padding: "2px 10px", borderRadius: 20,
                    }}>
                      {selectedSectors.length} seleccionado{selectedSectors.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div style={{ padding: 16 }}>
                  {sectorsQuery.isLoading ? (
                    <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
                  ) : sectors.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 13 }}>No hay sectores configurados.</Text>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {sectors.map((sector: any, idx: number) => {
                        const color = SECTOR_PALETTE[idx % SECTOR_PALETTE.length];
                        const selected = selectedSectors.includes(sector.id);
                        return (
                          <div
                            key={sector.id}
                            onClick={() => toggleSector(sector.id)}
                            style={{
                              padding: "11px 16px",
                              borderRadius: 12,
                              border: `1.5px solid ${selected ? color : "#e2e8f0"}`,
                              background: selected ? `${color}12` : "#fafafa",
                              cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              transition: "all 0.18s",
                              boxShadow: selected ? `0 2px 12px ${color}30` : "none",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{
                                width: 10, height: 10, borderRadius: "50%",
                                background: selected ? color : "#cbd5e1", flexShrink: 0,
                                transition: "background 0.18s",
                              }} />
                              <Text strong style={{ fontSize: 13, color: selected ? color : "#475569" }}>
                                {sector.name}
                              </Text>
                            </div>
                            {selected && (
                              <CheckCircleFilled style={{ color, fontSize: 15 }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>

              {/* Fotos */}
              <Card
                style={{
                  borderRadius: 16, border: "none",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                  overflow: "hidden", marginBottom: 16,
                }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{
                  background: "linear-gradient(90deg, #0369a1 0%, #0ea5e9 100%)",
                  padding: "14px 24px",
                }}>
                  <Text strong style={{ color: "#fff", fontSize: 14 }}>
                    <CameraOutlined style={{ marginRight: 8 }} />Fotos
                  </Text>
                </div>
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                  <PhotoUploadZone
                    label="Antes / Diseño" emoji="📐"
                    files={photosBefore}
                    onAdd={(f) => addPhoto(f, "before")}
                    onRemove={(i) => removePhoto(i, "before")}
                    inputRef={fileBeforeRef}
                  />
                  <Divider style={{ margin: "0" }} />
                  <PhotoUploadZone
                    label="Terminado" emoji="✅"
                    files={photosAfter}
                    onAdd={(f) => addPhoto(f, "after")}
                    onRemove={(i) => removePhoto(i, "after")}
                    inputRef={fileAfterRef}
                  />
                </div>
              </Card>

              {/* Save */}
              <div style={{
                background: "#fff",
                borderRadius: 16,
                padding: "20px 24px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
              }}>
                <Button
                  type="primary" size="large" icon={<SaveOutlined />}
                  htmlType="submit" loading={saving}
                  style={{
                    width: "100%", height: 48, borderRadius: 12, fontSize: 15, fontWeight: 700,
                    background: "linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)",
                    border: "none",
                    boxShadow: "0 4px 16px rgba(99,102,241,0.4)",
                  }}
                >
                  Guardar Orden
                </Button>
                <Button
                  size="large" onClick={() => router.back()}
                  style={{ width: "100%", marginTop: 10, height: 42, borderRadius: 12 }}
                >
                  Cancelar
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}
