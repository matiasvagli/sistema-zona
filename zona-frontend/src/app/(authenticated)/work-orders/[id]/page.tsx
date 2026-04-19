"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useList } from "@refinedev/core";
import {
  Typography, Card, Tag, Button, Select, DatePicker, Tooltip,
  Divider, Spin, notification, Modal, Empty, Row, Col, Progress, Input,
} from "antd";
import {
  ArrowLeftOutlined, PlusOutlined, DeleteOutlined, PlayCircleOutlined,
  CheckCircleOutlined, StopOutlined, ClockCircleOutlined, FireOutlined,
  EditOutlined, SaveOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const API = "http://localhost:8000/api/v1";

const statusConfig: Record<string, { color: string; label: string }> = {
  pendiente:  { color: "default",    label: "Pendiente"  },
  en_proceso: { color: "processing", label: "En Proceso" },
  pausada:    { color: "warning",    label: "Pausada"    },
  completada: { color: "success",    label: "Completada" },
  cancelada:  { color: "error",      label: "Cancelada"  },
};

const taskStatusConfig: Record<string, { color: string; label: string }> = {
  pendiente:  { color: "#8c8c8c", label: "Pendiente"  },
  en_proceso: { color: "#1890ff", label: "En Proceso" },
  completada: { color: "#52c41a", label: "Completada" },
  bloqueada:  { color: "#ff4d4f", label: "Bloqueada"  },
};

function calcProgress(tasks: any[]) {
  if (!tasks?.length) return 0;
  return Math.round((tasks.filter((t) => t.status === "completada").length / tasks.length) * 100);
}

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [ot, setOt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit mode para campos del header
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState<any>({});

  // Modal agregar sector
  const [addSectorOpen, setAddSectorOpen] = useState(false);
  const [sectorToAdd, setSectorToAdd] = useState<number | null>(null);
  const [addingTask, setAddingTask] = useState(false);

  // Modal fecha estimada
  const [estimateModal, setEstimateModal] = useState<{ open: boolean; taskId: number | null }>({ open: false, taskId: null });
  const [estimateDate, setEstimateDate] = useState<any>(null);

  const { result: sectorsResult } = useList({
    resource: "sectors",
    sorters: [{ field: "order", order: "asc" }],
  });
  const allSectors: any[] = sectorsResult?.data || [];

  const fetchOT = async () => {
    try {
      const { data } = await axiosInstance.get(`${API}/work-orders/${id}/`);
      setOt(data);
      setEditFields({
        title: data.title,
        status: data.status,
        priority: data.priority,
        notes: data.notes,
        due_date: data.due_date ? dayjs(data.due_date) : null,
      });
    } catch {
      notification.error({ message: "No se pudo cargar la OT" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOT(); }, [id]);

  const saveHeader = async () => {
    setSaving(true);
    try {
      await axiosInstance.patch(`${API}/work-orders/${id}/`, {
        title: editFields.title,
        status: editFields.status,
        priority: editFields.priority,
        notes: editFields.notes,
        due_date: editFields.due_date ? dayjs(editFields.due_date).toISOString() : null,
      });
      notification.success({ message: "OT actualizada" });
      setEditMode(false);
      fetchOT();
    } catch {
      notification.error({ message: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const addSector = async () => {
    if (!sectorToAdd) return;
    setAddingTask(true);
    try {
      await axiosInstance.post(`${API}/sector-tasks/`, {
        work_order: Number(id),
        sector: sectorToAdd,
        status: "pendiente",
      });
      notification.success({ message: "Sector agregado" });
      setAddSectorOpen(false);
      setSectorToAdd(null);
      fetchOT();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "Error al agregar sector" });
    } finally {
      setAddingTask(false);
    }
  };

  const removeSector = async (taskId: number) => {
    try {
      await axiosInstance.delete(`${API}/sector-tasks/${taskId}/`);
      notification.success({ message: "Sector eliminado" });
      fetchOT();
    } catch {
      notification.error({ message: "Error al eliminar sector" });
    }
  };

  const changeTaskStatus = async (taskId: number, action: "start" | "complete" | "block") => {
    try {
      await axiosInstance.post(`${API}/sector-tasks/${taskId}/${action}/`);
      fetchOT();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "No se pudo cambiar el estado" });
    }
  };

  const saveEstimate = async () => {
    if (!estimateModal.taskId || !estimateDate) return;
    try {
      await axiosInstance.post(`${API}/sector-tasks/${estimateModal.taskId}/set-estimate/`, {
        estimated_finish: dayjs(estimateDate).toISOString(),
      });
      notification.success({ message: "Fecha estimada guardada" });
      setEstimateModal({ open: false, taskId: null });
      setEstimateDate(null);
      fetchOT();
    } catch {
      notification.error({ message: "Error al guardar fecha" });
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>;
  if (!ot) return null;

  const tasks: any[] = ot.tasks || [];
  const progress = calcProgress(tasks);
  const assignedSectorIds = tasks.map((t: any) => t.sector);
  const availableSectors = allSectors.filter((s) => !assignedSectorIds.includes(s.id));
  const statusCfg = statusConfig[ot.status] || { color: "default", label: ot.status };

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => router.push("/work-orders")} />
        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>Orden de Trabajo #{ot.id}</Text>
          <Title level={2} style={{ margin: 0 }}>{ot.title}</Title>
        </div>
        {!editMode ? (
          <Button icon={<EditOutlined />} onClick={() => setEditMode(true)}>Editar</Button>
        ) : (
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveHeader}>
            Guardar cambios
          </Button>
        )}
      </div>

      <Row gutter={[20, 20]}>
        {/* Info principal */}
        <Col xs={24} lg={16}>

          {/* Card info */}
          <Card
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 20 }}
          >
            {editMode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Título</Text>
                  <Input
                    value={editFields.title}
                    onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                    size="large"
                  />
                </div>
                <Row gutter={16}>
                  <Col xs={12}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Estado</Text>
                    <Select
                      value={editFields.status}
                      onChange={(v) => setEditFields({ ...editFields, status: v })}
                      style={{ width: "100%" }}
                      size="large"
                    >
                      <Option value="pendiente">Pendiente</Option>
                      <Option value="en_proceso">En Proceso</Option>
                      <Option value="pausada">Pausada</Option>
                      <Option value="completada">Completada</Option>
                      <Option value="cancelada">Cancelada</Option>
                    </Select>
                  </Col>
                  <Col xs={12}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Prioridad</Text>
                    <Select
                      value={editFields.priority}
                      onChange={(v) => setEditFields({ ...editFields, priority: v })}
                      style={{ width: "100%" }}
                      size="large"
                    >
                      <Option value="normal">Normal</Option>
                      <Option value="inmediata">
                        <span style={{ color: "#ff4d4f" }}><FireOutlined style={{ marginRight: 6 }} />Inmediata</span>
                      </Option>
                    </Select>
                  </Col>
                </Row>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Vencimiento</Text>
                  <DatePicker
                    value={editFields.due_date}
                    onChange={(d) => setEditFields({ ...editFields, due_date: d })}
                    style={{ width: "100%" }}
                    format="DD/MM/YYYY"
                    size="large"
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Notas</Text>
                  <TextArea
                    value={editFields.notes}
                    onChange={(e) => setEditFields({ ...editFields, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button onClick={() => setEditMode(false)}>Cancelar</Button>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Estado</Text>
                  <div style={{ marginTop: 4 }}>
                    <Tag color={statusCfg.color} style={{ fontSize: 13, padding: "2px 10px" }}>{statusCfg.label}</Tag>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Prioridad</Text>
                  <div style={{ marginTop: 4 }}>
                    {ot.priority === "inmediata"
                      ? <Tag color="red" icon={<FireOutlined />} style={{ fontSize: 13, padding: "2px 10px" }}>Inmediata</Tag>
                      : <Tag style={{ fontSize: 13, padding: "2px 10px" }}>Normal</Tag>}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Cliente</Text>
                  <Text strong style={{ display: "block", marginTop: 4 }}>{ot.client_name || "—"}</Text>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Vencimiento</Text>
                  <Text strong style={{ display: "block", marginTop: 4 }}>
                    {ot.due_date ? dayjs(ot.due_date).format("DD/MM/YYYY") : "—"}
                  </Text>
                </div>
                {ot.notes && (
                  <div style={{ width: "100%" }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Notas</Text>
                    <Text style={{ display: "block", marginTop: 4 }}>{ot.notes}</Text>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Sectores */}
          <Card
            title={<Text strong style={{ fontSize: 15 }}>Sectores de producción</Text>}
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            extra={
              availableSectors.length > 0 && (
                <Button
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => setAddSectorOpen(true)}
                >
                  Agregar sector
                </Button>
              )
            }
          >
            {tasks.length === 0 ? (
              <Empty
                description="No hay sectores asignados"
                style={{ padding: "20px 0" }}
              >
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddSectorOpen(true)}
                  disabled={availableSectors.length === 0}
                >
                  Agregar sector
                </Button>
              </Empty>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tasks.map((task: any, idx: number) => {
                  const cfg = taskStatusConfig[task.status] || { color: "#8c8c8c", label: task.status };
                  const overdue = task.estimated_finish && task.status !== "completada"
                    && dayjs().isAfter(dayjs(task.estimated_finish));

                  return (
                    <div
                      key={task.id}
                      style={{
                        background: "#fafafa",
                        border: "1px solid #f0f0f0",
                        borderRadius: 12,
                        padding: "14px 16px",
                        borderLeft: `4px solid ${cfg.color}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Text strong style={{ fontSize: 14 }}>{idx + 1}. {task.sector_name}</Text>
                          <Tag
                            style={{ color: cfg.color, borderColor: cfg.color, background: `${cfg.color}15`, margin: 0 }}
                          >
                            {cfg.label}
                          </Tag>
                        </div>

                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {task.status === "pendiente" && (
                            <Button
                              size="small"
                              type="primary"
                              icon={<PlayCircleOutlined />}
                              onClick={() => changeTaskStatus(task.id, "start")}
                            >
                              Iniciar
                            </Button>
                          )}
                          {task.status === "en_proceso" && (
                            <>
                              <Button
                                size="small"
                                style={{ borderColor: "#52c41a", color: "#52c41a" }}
                                icon={<CheckCircleOutlined />}
                                onClick={() => changeTaskStatus(task.id, "complete")}
                              >
                                Completar
                              </Button>
                              <Button
                                size="small"
                                danger
                                icon={<StopOutlined />}
                                onClick={() => changeTaskStatus(task.id, "block")}
                              >
                                Bloquear
                              </Button>
                            </>
                          )}
                          {task.status === "bloqueada" && (
                            <Button
                              size="small"
                              type="primary"
                              icon={<PlayCircleOutlined />}
                              onClick={() => changeTaskStatus(task.id, "start")}
                            >
                              Reanudar
                            </Button>
                          )}
                          {(task.status === "en_proceso" || task.status === "pendiente") && (
                            <Tooltip title="Establecer fecha estimada de fin">
                              <Button
                                size="small"
                                icon={<ClockCircleOutlined />}
                                onClick={() => {
                                  setEstimateModal({ open: true, taskId: task.id });
                                  setEstimateDate(task.estimated_finish ? dayjs(task.estimated_finish) : null);
                                }}
                              />
                            </Tooltip>
                          )}
                          <Tooltip title="Quitar sector">
                            <Button
                              size="small"
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => removeSector(task.id)}
                            />
                          </Tooltip>
                        </div>
                      </div>

                      {/* Fechas */}
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                        {task.started_at && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Inicio: {dayjs(task.started_at).format("DD/MM HH:mm")}
                          </Text>
                        )}
                        {task.estimated_finish && (
                          <Text style={{ fontSize: 12, color: overdue ? "#ff4d4f" : "#52c41a" }}>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            Est. fin: {dayjs(task.estimated_finish).format("DD/MM HH:mm")}
                            {overdue && " ⚠ Vencido"}
                          </Text>
                        )}
                        {task.finished_at && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />
                            Terminó: {dayjs(task.finished_at).format("DD/MM HH:mm")}
                          </Text>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Sidebar progreso */}
        <Col xs={24} lg={8}>
          <Card
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
          >
            <Title level={5} style={{ marginTop: 0 }}>Progreso general</Title>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <Progress
                type="circle"
                percent={progress}
                strokeColor={progress === 100 ? "#52c41a" : "#1890ff"}
                size={120}
              />
            </div>
            <Divider style={{ margin: "12px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.map((task: any) => {
                const cfg = taskStatusConfig[task.status] || { color: "#8c8c8c", label: task.status };
                return (
                  <div key={task.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 13 }}>{task.sector_name}</Text>
                    <Tag style={{ color: cfg.color, borderColor: cfg.color, background: `${cfg.color}15`, margin: 0, fontSize: 11 }}>
                      {cfg.label}
                    </Tag>
                  </div>
                );
              })}
            </div>
            <Divider style={{ margin: "12px 0" }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Creada: {dayjs(ot.created_at).format("DD/MM/YYYY HH:mm")}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Modal: agregar sector */}
      <Modal
        title="Agregar sector"
        open={addSectorOpen}
        onCancel={() => { setAddSectorOpen(false); setSectorToAdd(null); }}
        onOk={addSector}
        okText="Agregar"
        confirmLoading={addingTask}
        okButtonProps={{ disabled: !sectorToAdd }}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Seleccioná el sector que querés sumar a esta OT:
        </Text>
        <Select
          style={{ width: "100%" }}
          placeholder="Elegir sector..."
          onChange={(v) => setSectorToAdd(v)}
          size="large"
        >
          {availableSectors.map((s) => (
            <Option key={s.id} value={s.id}>{s.name}</Option>
          ))}
        </Select>
      </Modal>

      {/* Modal: fecha estimada */}
      <Modal
        title="Fecha estimada de finalización"
        open={estimateModal.open}
        onCancel={() => { setEstimateModal({ open: false, taskId: null }); setEstimateDate(null); }}
        onOk={saveEstimate}
        okText="Guardar"
        okButtonProps={{ disabled: !estimateDate }}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
          Ingresá la fecha y hora estimada en que este sector finaliza:
        </Text>
        <DatePicker
          showTime
          style={{ width: "100%" }}
          value={estimateDate}
          onChange={(d) => setEstimateDate(d)}
          format="DD/MM/YYYY HH:mm"
          size="large"
        />
      </Modal>
    </div>
  );
}
