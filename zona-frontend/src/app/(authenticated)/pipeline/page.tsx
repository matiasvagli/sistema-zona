"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useList, useGetIdentity } from "@refinedev/core";
import {
  Tag, Typography, Spin, Tooltip, Button, Progress,
  notification, Modal, DatePicker,
} from "antd";
import {
  ClockCircleOutlined, WarningOutlined, FireOutlined,
  PlayCircleOutlined, CheckCircleOutlined, StopOutlined, PlusOutlined,
  ReloadOutlined, EyeOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

const { Title, Text } = Typography;

const API = "http://localhost:8000/api/v1";

const SECTOR_COLORS = [
  { light: "#e6f4ff", border: "#1890ff", solid: "#1890ff", dark: "#0958d9" },
  { light: "#f9f0ff", border: "#722ed1", solid: "#722ed1", dark: "#531dab" },
  { light: "#fff7e6", border: "#fa8c16", solid: "#fa8c16", dark: "#d46b08" },
  { light: "#f6ffed", border: "#52c41a", solid: "#52c41a", dark: "#389e0d" },
  { light: "#fff1f0", border: "#ff4d4f", solid: "#ff4d4f", dark: "#cf1322" },
  { light: "#e6fffb", border: "#13c2c2", solid: "#13c2c2", dark: "#08979c" },
];

const TASK_STATUS: Record<string, { color: string; bg: string; label: string; dot: string }> = {
  pendiente:  { color: "#595959", bg: "#f5f5f5", label: "Pendiente",  dot: "#8c8c8c" },
  en_proceso: { color: "#003eb3", bg: "#e6f4ff", label: "En proceso", dot: "#1890ff" },
  completada: { color: "#237804", bg: "#f6ffed", label: "Completada", dot: "#52c41a" },
  bloqueada:  { color: "#a8071a", bg: "#fff1f0", label: "Bloqueada",  dot: "#ff4d4f" },
};

const OT_STATUS: Record<string, { color: string; label: string }> = {
  pendiente:  { color: "#8c8c8c", label: "Pendiente"  },
  en_proceso: { color: "#1890ff", label: "En proceso" },
  pausada:    { color: "#fa8c16", label: "Pausada"    },
  completada: { color: "#52c41a", label: "Completada" },
  cancelada:  { color: "#ff4d4f", label: "Cancelada"  },
};

function timeLeft(estimated: string): { text: string; urgent: boolean } {
  const diff = dayjs(estimated).diff(dayjs(), "hour");
  if (diff < 0) return { text: `Venció hace ${Math.abs(diff)}h`, urgent: true };
  if (diff < 4) return { text: `${diff}h restantes`, urgent: true };
  if (diff < 24) return { text: `${diff}h restantes`, urgent: false };
  return { text: dayjs(estimated).format("DD/MM HH:mm"), urgent: false };
}

export default function PipelinePage() {
  const router = useRouter();
  const { data: identity } = useGetIdentity<any>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [estimateModal, setEstimateModal] = useState<{ open: boolean; taskId: number | null }>({ open: false, taskId: null });
  const [estimateDate, setEstimateDate] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const { query: sectorsQuery, result: sectorsResult } = useList({
    resource: "sectors",
    sorters: [{ field: "order", order: "asc" }],
    queryOptions: { queryKey: ["sectors", refreshKey] } as any,
  });

  const { query: tasksQuery, result: tasksResult } = useList({
    resource: "sector-tasks",
    pagination: { pageSize: 500 },
    queryOptions: { queryKey: ["sector-tasks", refreshKey] } as any,
  });

  const { query: woQuery, result: woResult } = useList({
    resource: "work-orders",
    pagination: { pageSize: 200 },
    filters: [{ field: "status__in", operator: "in", value: ["pendiente", "en_proceso", "pausada"] }],
    queryOptions: { queryKey: ["work-orders-pipeline", refreshKey] } as any,
  });

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const changeStatus = async (taskId: number, action: "start" | "complete" | "block") => {
    setActionLoading(taskId);
    try {
      await axiosInstance.post(`${API}/sector-tasks/${taskId}/${action}/`);
      refresh();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "No se pudo cambiar el estado" });
    } finally {
      setActionLoading(null);
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
      refresh();
    } catch {
      notification.error({ message: "Error al guardar la fecha" });
    }
  };

  const isLoading = sectorsQuery.isLoading || tasksQuery.isLoading || woQuery.isLoading;

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Cargando pipeline...</Text>
      </div>
    );
  }

  let sectors: any[] = sectorsResult?.data || [];
  const tasks: any[] = tasksResult?.data || [];
  const workOrders: any[] = woResult?.data || [];

  // Filter sectors by user's sector if not staff
  if (identity && !identity.is_staff && identity.sector) {
    sectors = sectors.filter((s: any) => s.id === identity.sector);
  }

  // Build task map: taskMap[workOrderId][sectorId] = task
  const taskMap: Record<number, Record<number, any>> = {};
  tasks.forEach((t) => {
    if (!taskMap[t.work_order]) taskMap[t.work_order] = {};
    taskMap[t.work_order][t.sector] = t;
  });

  // Only show WOs that have at least one sector task
  const activeWOs = workOrders.filter((wo) => taskMap[wo.id] && Object.keys(taskMap[wo.id]).length > 0);

  // Global stats
  const totalWOs   = activeWOs.length;
  const inProgress = activeWOs.filter((wo) => wo.status === "en_proceso").length;
  const blocked    = tasks.filter((t) => t.status === "bloqueada").length;
  const completed  = tasks.filter((t) => t.status === "completada").length;

  const COL_WIDTH = 170;
  const LEFT_WIDTH = 260;

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Pipeline de Producción</Title>
          <Text type="secondary">Línea de trabajo por orden y sector</Text>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, background: "#e6f7ff", border: "none", color: "#1890ff" }}>
            {totalWOs} órdenes activas
          </Tag>
          <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, background: "#e6f4ff", border: "none", color: "#722ed1" }}>
            {inProgress} en proceso
          </Tag>
          {blocked > 0 && (
            <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, background: "#fff1f0", border: "none", color: "#ff4d4f" }}>
              <WarningOutlined style={{ marginRight: 4 }} />{blocked} bloqueada{blocked > 1 ? "s" : ""}
            </Tag>
          )}
          <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, background: "#f6ffed", border: "none", color: "#52c41a" }}>
            {completed} completada{completed > 1 ? "s" : ""}
          </Tag>
          <Button icon={<ReloadOutlined />} onClick={refresh} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/work-orders/create")}>
            Nueva OT
          </Button>
        </div>
      </div>

      {activeWOs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <Text type="secondary" style={{ fontSize: 16 }}>No hay órdenes activas en el pipeline.</Text>
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: LEFT_WIDTH + sectors.length * COL_WIDTH }}>

            {/* Header row */}
            <thead>
              <tr>
                {/* OT column header */}
                <th style={{
                  width: LEFT_WIDTH,
                  minWidth: LEFT_WIDTH,
                  padding: "14px 20px",
                  background: "#1e293b",
                  color: "#fff",
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 700,
                  borderRight: "1px solid rgba(255,255,255,0.1)",
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                }}>
                  Orden de Trabajo
                </th>
                {/* Sector column headers */}
                {sectors.map((sector, idx) => {
                  const palette = SECTOR_COLORS[idx % SECTOR_COLORS.length];
                  const sectorTasks = tasks.filter((t) => t.sector === sector.id);
                  const activeCount = sectorTasks.filter((t) => t.status === "en_proceso").length;
                  return (
                    <th
                      key={sector.id}
                      style={{
                        width: COL_WIDTH,
                        minWidth: COL_WIDTH,
                        padding: "14px 16px",
                        background: palette.solid,
                        color: "#fff",
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        borderRight: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      <div>{sector.name}</div>
                      {activeCount > 0 && (
                        <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
                          {activeCount} activa{activeCount > 1 ? "s" : ""}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Work order rows */}
            <tbody>
              {activeWOs.map((wo, rowIdx) => {
                const woTasks = taskMap[wo.id] || {};
                const allTasks = Object.values(woTasks);
                const completedCount = allTasks.filter((t: any) => t.status === "completada").length;
                const otProgress = allTasks.length ? Math.round((completedCount / allTasks.length) * 100) : 0;
                const otSt = OT_STATUS[wo.status] || OT_STATUS.pendiente;
                const isEven = rowIdx % 2 === 0;

                return (
                  <tr key={wo.id} style={{ background: isEven ? "#fff" : "#fafafa" }}>

                    {/* OT info cell (sticky left) */}
                    <td style={{
                      padding: "14px 20px",
                      borderRight: "1px solid #e2e8f0",
                      borderBottom: "1px solid #e2e8f0",
                      verticalAlign: "middle",
                      background: isEven ? "#fff" : "#fafafa",
                      position: "sticky",
                      left: 0,
                      zIndex: 2,
                      minWidth: LEFT_WIDTH,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <Text type="secondary" style={{ fontSize: 11, whiteSpace: "nowrap" }}>OT #{wo.id}</Text>
                            {wo.priority === "inmediata" && (
                              <Tooltip title="Prioridad inmediata">
                                <FireOutlined style={{ color: "#ff4d4f", fontSize: 12 }} />
                              </Tooltip>
                            )}
                            <span style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: otSt.color,
                              background: otSt.color + "18",
                              padding: "1px 6px",
                              borderRadius: 4,
                            }}>
                              {otSt.label.toUpperCase()}
                            </span>
                          </div>
                          <Text
                            strong
                            style={{ fontSize: 13, display: "block", lineHeight: 1.3, marginBottom: 2 }}
                            ellipsis={{ tooltip: wo.title }}
                          >
                            {wo.title}
                          </Text>
                          {wo.client_name && (
                            <Text type="secondary" style={{ fontSize: 11 }}>{wo.client_name}</Text>
                          )}
                        </div>
                        <Tooltip title="Ver OT completa">
                          <Button
                            size="small"
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => router.push(`/work-orders/${wo.id}`)}
                            style={{ flexShrink: 0, marginLeft: 4 }}
                          />
                        </Tooltip>
                      </div>

                      {/* Overall progress */}
                      {allTasks.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <Text type="secondary" style={{ fontSize: 10 }}>Avance general</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>{otProgress}%</Text>
                          </div>
                          <Progress
                            percent={otProgress}
                            size="small"
                            showInfo={false}
                            strokeColor={otProgress === 100 ? "#52c41a" : "#1890ff"}
                            trailColor="#e2e8f0"
                          />
                        </div>
                      )}
                    </td>

                    {/* Sector task cells */}
                    {sectors.map((sector) => {
                      const task = woTasks[sector.id];

                      if (!task) {
                        return (
                          <td
                            key={sector.id}
                            style={{
                              borderRight: "1px solid #e2e8f0",
                              borderBottom: "1px solid #e2e8f0",
                              background: isEven ? "#fafafa" : "#f5f5f5",
                              textAlign: "center",
                              padding: 12,
                              verticalAlign: "middle",
                            }}
                          >
                            <span style={{ color: "#d9d9d9", fontSize: 18 }}>—</span>
                          </td>
                        );
                      }

                      const st = TASK_STATUS[task.status] || TASK_STATUS.pendiente;
                      const isBlocked = task.status === "bloqueada";
                      const tLeft = task.estimated_finish ? timeLeft(task.estimated_finish) : null;
                      const loading = actionLoading === task.id;

                      return (
                        <td
                          key={sector.id}
                          style={{
                            borderRight: "1px solid #e2e8f0",
                            borderBottom: "1px solid #e2e8f0",
                            padding: "10px 12px",
                            verticalAlign: "middle",
                            background: isBlocked ? "#fff1f0" : st.bg,
                          }}
                        >
                          {/* Status label */}
                          <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{
                              display: "inline-block",
                              width: 7, height: 7,
                              borderRadius: "50%",
                              background: st.dot,
                              flexShrink: 0,
                            }} />
                            <Text style={{ fontSize: 11, fontWeight: 600, color: st.color }}>
                              {isBlocked && <WarningOutlined style={{ marginRight: 3 }} />}
                              {st.label}
                            </Text>
                          </div>

                          {/* Time estimate */}
                          {tLeft && (
                            <div style={{
                              fontSize: 11,
                              color: tLeft.urgent ? "#ff4d4f" : "#52c41a",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              marginBottom: 8,
                            }}>
                              <ClockCircleOutlined style={{ fontSize: 10 }} />
                              {tLeft.text}
                            </div>
                          )}

                          {/* Action buttons */}
                          {task.status !== "completada" && (
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {(task.status === "pendiente" || task.status === "bloqueada") && (
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={<PlayCircleOutlined />}
                                  loading={loading}
                                  onClick={() => changeStatus(task.id, "start")}
                                  style={{ fontSize: 11, height: 24, borderRadius: 5, paddingInline: 7 }}
                                >
                                  {task.status === "bloqueada" ? "Reanudar" : "Iniciar"}
                                </Button>
                              )}
                              {task.status === "en_proceso" && (
                                <>
                                  <Button
                                    size="small"
                                    icon={<CheckCircleOutlined />}
                                    loading={loading}
                                    onClick={() => changeStatus(task.id, "complete")}
                                    style={{ fontSize: 11, height: 24, borderRadius: 5, paddingInline: 7, color: "#52c41a", borderColor: "#52c41a" }}
                                  >
                                    Listo
                                  </Button>
                                  <Button
                                    size="small"
                                    danger
                                    icon={<StopOutlined />}
                                    loading={loading}
                                    onClick={() => changeStatus(task.id, "block")}
                                    style={{ fontSize: 11, height: 24, borderRadius: 5, paddingInline: 7 }}
                                  >
                                    Bloquear
                                  </Button>
                                </>
                              )}
                              <Tooltip title="Establecer fecha estimada">
                                <Button
                                  size="small"
                                  icon={<ClockCircleOutlined />}
                                  onClick={() => {
                                    setEstimateModal({ open: true, taskId: task.id });
                                    setEstimateDate(task.estimated_finish ? dayjs(task.estimated_finish) : null);
                                  }}
                                  style={{ fontSize: 11, height: 24, width: 24, borderRadius: 5, padding: 0 }}
                                />
                              </Tooltip>
                            </div>
                          )}

                          {task.status === "completada" && (
                            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal fecha estimada */}
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
