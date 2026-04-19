"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useList, useGetIdentity } from "@refinedev/core";
import {
  Tag, Typography, Spin, Badge, Avatar, Tooltip, Button, Progress,
  notification, Modal, DatePicker,
} from "antd";
import {
  ClockCircleOutlined, UserOutlined, WarningOutlined, FireOutlined,
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
  { bg: "#e6f4ff", border: "#1890ff", header: "#1890ff" },
  { bg: "#f9f0ff", border: "#722ed1", header: "#722ed1" },
  { bg: "#fff7e6", border: "#fa8c16", header: "#fa8c16" },
  { bg: "#f6ffed", border: "#52c41a", header: "#52c41a" },
  { bg: "#fff1f0", border: "#ff4d4f", header: "#ff4d4f" },
  { bg: "#e6fffb", border: "#13c2c2", header: "#13c2c2" },
];

const taskStatus: Record<string, { color: string; label: string; bg: string }> = {
  pendiente:  { color: "#8c8c8c", label: "Pendiente",  bg: "#f5f5f5"  },
  en_proceso: { color: "#1890ff", label: "En proceso", bg: "#e6f7ff"  },
  completada: { color: "#52c41a", label: "Completada", bg: "#f6ffed"  },
  bloqueada:  { color: "#ff4d4f", label: "Bloqueada",  bg: "#fff1f0"  },
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
    pagination: { pageSize: 200 },
    queryOptions: { queryKey: ["sector-tasks", refreshKey] } as any,
  });

  const { result: workOrdersResult } = useList({
    resource: "work-orders",
    pagination: { pageSize: 200 },
    queryOptions: { queryKey: ["work-orders", refreshKey] } as any,
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

  const isLoading = sectorsQuery.isLoading || tasksQuery.isLoading;

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
  const workOrders: any[] = workOrdersResult?.data || [];

  if (identity && !identity.is_staff && identity.sector) {
    sectors = sectors.filter((s: any) => s.id === identity.sector);
  }

  const woMap = Object.fromEntries(workOrders.map((w) => [w.id, w]));

  // Stats globales
  const totalTasks   = tasks.length;
  const inProgress   = tasks.filter((t) => t.status === "en_proceso").length;
  const completed    = tasks.filter((t) => t.status === "completada").length;
  const blocked      = tasks.filter((t) => t.status === "bloqueada").length;

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Pipeline de Producción</Title>
          <Text type="secondary">Estado en tiempo real de las órdenes por sector</Text>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Mini stats */}
          <div style={{ display: "flex", gap: 8, marginRight: 8, flexWrap: "wrap" }}>
            <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, background: "#e6f7ff", border: "none", color: "#1890ff" }}>
              {totalTasks} tareas
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
          </div>
          <Button icon={<ReloadOutlined />} onClick={refresh} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/work-orders/create")}>
            Nueva OT
          </Button>
        </div>
      </div>

      {/* Kanban */}
      <div style={{ display: "flex", gap: 20, overflowX: "auto", flex: 1, paddingBottom: 16, alignItems: "flex-start" }}>
        {sectors.map((sector: any, sectorIdx: number) => {
          const palette = SECTOR_COLORS[sectorIdx % SECTOR_COLORS.length];
          const sectorTasks = tasks.filter((t: any) => t.sector === sector.id);
          const sectorInProgress = sectorTasks.filter((t) => t.status === "en_proceso").length;
          const sectorBlocked = sectorTasks.filter((t) => t.status === "bloqueada").length;

          return (
            <div
              key={sector.id}
              style={{
                flex: "0 0 300px",
                borderRadius: 18,
                background: "#ebedf0",
                display: "flex",
                flexDirection: "column",
                maxHeight: "calc(100vh - 220px)",
                overflow: "hidden",
              }}
            >
              {/* Column header */}
              <div style={{
                background: palette.header,
                borderRadius: "18px 18px 0 0",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <Text strong style={{ color: "#fff", fontSize: 15 }}>{sector.name}</Text>
                  {sectorBlocked > 0 && (
                    <Tag color="red" style={{ marginLeft: 8, fontSize: 11 }}>
                      <WarningOutlined /> {sectorBlocked} bloq.
                    </Tag>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {sectorInProgress > 0 && (
                    <span style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 10 }}>
                      {sectorInProgress} activa{sectorInProgress > 1 ? "s" : ""}
                    </span>
                  )}
                  <Badge
                    count={sectorTasks.length}
                    style={{ backgroundColor: "rgba(255,255,255,0.9)", color: palette.header, fontWeight: 700, boxShadow: "none" }}
                  />
                </div>
              </div>

              {/* Cards */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: 10 }}>
                {sectorTasks.length === 0 ? (
                  <div style={{
                    border: `2px dashed ${palette.border}40`,
                    borderRadius: 12,
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "#bfbfbf",
                  }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>Sin trabajos asignados</Text>
                  </div>
                ) : (
                  sectorTasks.map((task: any) => {
                    const st = taskStatus[task.status] || taskStatus.pendiente;
                    const wo = woMap[task.work_order];
                    const allWoTasks = tasks.filter((t) => t.work_order === task.work_order);
                    const otProgress = allWoTasks.length
                      ? Math.round(allWoTasks.filter((t) => t.status === "completada").length / allWoTasks.length * 100)
                      : 0;
                    const isUrgent = task.priority === "inmediata" || wo?.priority === "inmediata";
                    const isBlocked = task.status === "bloqueada";
                    const isLoading = actionLoading === task.id;
                    const tLeft = task.estimated_finish ? timeLeft(task.estimated_finish) : null;

                    return (
                      <div
                        key={task.id}
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          padding: "12px 14px",
                          boxShadow: isBlocked
                            ? "0 0 0 2px #ff4d4f40, 0 2px 8px rgba(0,0,0,0.06)"
                            : "0 2px 8px rgba(0,0,0,0.06)",
                          borderLeft: `4px solid ${isUrgent ? "#ff4d4f" : palette.border}`,
                          opacity: task.status === "completada" ? 0.75 : 1,
                          transition: "box-shadow 0.2s",
                        }}
                      >
                        {/* Top: OT id + título + urgente */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              type="secondary"
                              style={{ fontSize: 11, display: "block" }}
                            >
                              OT #{task.work_order}
                              {wo?.client_name && ` · ${wo.client_name}`}
                            </Text>
                            <Text
                              strong
                              style={{ fontSize: 13, display: "block", lineHeight: 1.3, marginTop: 2 }}
                              ellipsis={{ tooltip: task.work_order_title }}
                            >
                              {task.work_order_title}
                            </Text>
                          </div>
                          {isUrgent && (
                            <Tooltip title="Prioridad inmediata">
                              <FireOutlined style={{ color: "#ff4d4f", fontSize: 14, marginLeft: 6, flexShrink: 0 }} />
                            </Tooltip>
                          )}
                        </div>

                        {/* Status badge */}
                        <div style={{ marginBottom: 10 }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: st.bg,
                            color: st.color,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}>
                            {isBlocked && <WarningOutlined />}
                            {st.label.toUpperCase()}
                          </span>
                        </div>

                        {/* Progreso OT general */}
                        {allWoTasks.length > 1 && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <Text type="secondary" style={{ fontSize: 10 }}>Avance OT</Text>
                              <Text type="secondary" style={{ fontSize: 10 }}>{otProgress}%</Text>
                            </div>
                            <Progress
                              percent={otProgress}
                              size="small"
                              showInfo={false}
                              strokeColor={otProgress === 100 ? "#52c41a" : palette.header}
                              trailColor="#f0f0f0"
                            />
                          </div>
                        )}

                        {/* Tiempo estimado */}
                        {task.estimated_finish && tLeft && (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginBottom: 10,
                            color: tLeft.urgent ? "#ff4d4f" : "#52c41a",
                            fontSize: 12,
                            fontWeight: 500,
                          }}>
                            <ClockCircleOutlined />
                            {tLeft.text}
                          </div>
                        )}

                        {/* Footer: acciones + avatar */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {task.status === "pendiente" && (
                              <Button
                                size="small"
                                type="primary"
                                icon={<PlayCircleOutlined />}
                                loading={isLoading}
                                onClick={() => changeStatus(task.id, "start")}
                                style={{ fontSize: 11, height: 26, borderRadius: 6 }}
                              >
                                Iniciar
                              </Button>
                            )}
                            {task.status === "en_proceso" && (
                              <>
                                <Button
                                  size="small"
                                  icon={<CheckCircleOutlined />}
                                  loading={isLoading}
                                  onClick={() => changeStatus(task.id, "complete")}
                                  style={{ fontSize: 11, height: 26, borderRadius: 6, color: "#52c41a", borderColor: "#52c41a" }}
                                >
                                  Listo
                                </Button>
                                <Button
                                  size="small"
                                  danger
                                  icon={<StopOutlined />}
                                  loading={isLoading}
                                  onClick={() => changeStatus(task.id, "block")}
                                  style={{ fontSize: 11, height: 26, borderRadius: 6 }}
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
                                loading={isLoading}
                                onClick={() => changeStatus(task.id, "start")}
                                style={{ fontSize: 11, height: 26, borderRadius: 6 }}
                              >
                                Reanudar
                              </Button>
                            )}
                            {task.status !== "completada" && (
                              <Tooltip title="Establecer fecha estimada">
                                <Button
                                  size="small"
                                  icon={<ClockCircleOutlined />}
                                  onClick={() => {
                                    setEstimateModal({ open: true, taskId: task.id });
                                    setEstimateDate(task.estimated_finish ? dayjs(task.estimated_finish) : null);
                                  }}
                                  style={{ fontSize: 11, height: 26, borderRadius: 6, width: 26, padding: 0 }}
                                />
                              </Tooltip>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <Tooltip title="Ver OT completa">
                              <Button
                                size="small"
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={() => router.push(`/work-orders/${task.work_order}`)}
                                style={{ width: 24, height: 24, padding: 0 }}
                              />
                            </Tooltip>
                            <Tooltip title={task.assigned_to_name || "Sin asignar"}>
                              <Avatar
                                size={26}
                                icon={<UserOutlined />}
                                style={{ background: task.assigned_to_name ? palette.header : "#d9d9d9", cursor: "default", flexShrink: 0 }}
                              />
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {sectors.length === 0 && (
          <div style={{ textAlign: "center", padding: 80, width: "100%" }}>
            <Text type="secondary" style={{ fontSize: 16 }}>No hay sectores configurados.</Text>
          </div>
        )}
      </div>

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
