"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useList, useGetIdentity } from "@refinedev/core";
import {
  Tag, Typography, Spin, Tooltip, Button, Progress,
  notification, Modal, DatePicker, Input, InputNumber, Select, Tabs, Popconfirm,
} from "antd";
import {
  ClockCircleOutlined, WarningOutlined, FireOutlined,
  PlayCircleOutlined, CheckCircleOutlined, StopOutlined, PlusOutlined, CloseOutlined,
  ReloadOutlined, EyeOutlined, ShoppingCartOutlined, EditOutlined, MessageOutlined,
  DownOutlined, AppstoreOutlined, HistoryOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";
import { FinishedWorksTab } from "./FinishedWorksTab";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

const { Title, Text } = Typography;


import { API_URL as API } from "@/config/api";
import { TASK_STATUS, OT_STATUS, SECTOR_COLORS } from "@/constants/statuses";
import { timeLeft } from "@/utils/time";


function WOTable({
  wos,
  sectors,
  taskMap,
  canEditSector,
  actionLoading,
  changeStatus,
  setMatTaskId,
  setMatTaskSectorId,
  setMatModal,
  setEstimateModal,
  setEstimateDate,
  setNotesModal,
  setViewNote,
  router,
  dimmed,
  onDeliver,
  deliveryLoading,
}: any) {
  const COL_WIDTH = 170;
  const LEFT_WIDTH = 260;

  return (
    <div style={{ overflowX: "auto", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", minWidth: LEFT_WIDTH + sectors.length * COL_WIDTH }}>
        <thead>
          <tr>
            <th style={{
              width: LEFT_WIDTH, minWidth: LEFT_WIDTH,
              padding: "14px 20px",
              background: "#1e293b", color: "#fff",
              textAlign: "left", fontSize: 13, fontWeight: 700,
              borderRight: "1px solid rgba(255,255,255,0.1)",
              position: "sticky", left: 0, zIndex: 3,
            }}>
              Orden de Trabajo
            </th>
            {sectors.map((sector: any, idx: number) => {
              const palette = SECTOR_COLORS[idx % SECTOR_COLORS.length];
              const sectorTasks = Object.values(taskMap).flatMap((wt: any) =>
                Object.entries(wt).filter(([sId]) => Number(sId) === sector.id).map(([, t]) => t)
              ) as any[];
              const activeCount = sectorTasks.filter((t: any) => t.status === "en_proceso").length;
              const overdueCount = sectorTasks.filter((t: any) =>
                t.status !== "completada" && t.estimated_finish && timeLeft(t.estimated_finish).overdue
              ).length;
              return (
                <th key={sector.id} style={{
                  width: COL_WIDTH, minWidth: COL_WIDTH,
                  padding: "14px 16px",
                  background: overdueCount > 0 ? "#7f1d1d" : palette.solid,
                  color: "#fff",
                  textAlign: "center", fontSize: 13, fontWeight: 700,
                  borderRight: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: overdueCount > 0 ? "inset 0 -3px 0 #fca5a5" : undefined,
                  transition: "background 0.3s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {overdueCount > 0 && <WarningOutlined style={{ fontSize: 13, color: "#fca5a5" }} />}
                    {sector.name}
                  </div>
                  {overdueCount > 0 ? (
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#fca5a5", marginTop: 2 }}>
                      ⚠ {overdueCount} vencida{overdueCount > 1 ? "s" : ""}
                    </div>
                  ) : activeCount > 0 ? (
                    <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>
                      {activeCount} activa{activeCount > 1 ? "s" : ""}
                    </div>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {wos.map((wo: any, rowIdx: number) => {
            const woTasks = taskMap[wo.id] || {};
            const allTasks = Object.values(woTasks);
            const completedCount = allTasks.filter((t: any) => t.status === "completada").length;
            const otProgress = allTasks.length ? Math.round((completedCount / allTasks.length) * 100) : 0;
            const otSt = OT_STATUS[wo.status as keyof typeof OT_STATUS] ?? OT_STATUS.pendiente;
            const isEven = rowIdx % 2 === 0;
            const isInmediata = wo.priority === "inmediata";
            const hasOverdue = (allTasks as any[]).some((t) =>
              t.status !== "completada" && t.estimated_finish && timeLeft(t.estimated_finish).overdue
            );

            const rowBg = dimmed
              ? (isEven ? "#fafafa" : "#f5f5f5")
              : isInmediata
                ? (isEven ? "#fff8f6" : "#fff3f0")
                : (isEven ? "#fff" : "#fafafa");

            return (
              <tr key={wo.id} style={{ background: rowBg }}>
                {/* OT info cell */}
                <td style={{
                  padding: "14px 20px",
                  borderRight: "1px solid #e2e8f0",
                  borderBottom: "1px solid #e2e8f0",
                  verticalAlign: "middle",
                  background: rowBg,
                  position: "sticky",
                  left: 0,
                  zIndex: 2,
                  minWidth: LEFT_WIDTH,
                  borderLeft: hasOverdue && !dimmed ? "4px solid #ef4444" : isInmediata && !dimmed ? "4px solid #ff4d4f" : undefined,
                  opacity: dimmed ? 0.7 : 1,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <Text type="secondary" style={{ fontSize: 11, whiteSpace: "nowrap" }}>OT #{wo.id}</Text>
                        {isInmediata && (
                          <Tooltip title="Prioridad inmediata">
                            <FireOutlined style={{ color: "#ff4d4f", fontSize: 12 }} />
                          </Tooltip>
                        )}
                        {hasOverdue && !dimmed && (
                          <Tooltip title="Tiene sectores vencidos">
                            <WarningOutlined style={{ color: "#ef4444", fontSize: 12 }} />
                          </Tooltip>
                        )}
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: otSt.color,
                          background: otSt.color + "18",
                          padding: "1px 6px", borderRadius: 4,
                        }}>
                          {otSt.label.toUpperCase()}
                        </span>
                      </div>
                      <Text strong style={{ fontSize: 13, display: "block", lineHeight: 1.3, marginBottom: 2 }} ellipsis={{ tooltip: wo.title }}>
                        {wo.title}
                      </Text>
                      {wo.client_name && (
                        <Text type="secondary" style={{ fontSize: 11 }}>{wo.client_name}</Text>
                      )}
                    </div>
                    <Tooltip title="Ver OT completa">
                      <Button
                        size="small" type="text" icon={<EyeOutlined />}
                        onClick={() => router.push(`/work-orders/${wo.id}`)}
                        style={{ flexShrink: 0, marginLeft: 4 }}
                      />
                    </Tooltip>
                  </div>
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
                  {onDeliver && (
                    <Popconfirm
                      title="¿Marcar como entregada?"
                      description="Confirma que esta OT fue entregada al cliente."
                      onConfirm={() => onDeliver(wo.id)}
                      okText="Entregar" cancelText="Cancelar"
                      okButtonProps={{ style: { background: "#7c3aed", borderColor: "#7c3aed" } }}
                    >
                      <Button
                        size="small"
                        loading={deliveryLoading === wo.id}
                        style={{ marginTop: 8, width: "100%", background: "#f5f3ff", borderColor: "#a78bfa", color: "#7c3aed", fontWeight: 600 }}
                      >
                        Marcar como entregada
                      </Button>
                    </Popconfirm>
                  )}
                </td>

                {/* Sector task cells */}
                {sectors.map((sector: any) => {
                  const task = woTasks[sector.id];

                  if (!task) {
                    return (
                      <td key={sector.id} style={{
                        borderRight: "1px solid #e2e8f0",
                        borderBottom: "1px solid #e2e8f0",
                        background: isEven ? "#fafafa" : "#f5f5f5",
                        textAlign: "center", padding: 12, verticalAlign: "middle",
                      }}>
                        <span style={{ color: "#d9d9d9", fontSize: 18 }}>—</span>
                      </td>
                    );
                  }

                  const st = TASK_STATUS[task.status as keyof typeof TASK_STATUS] ?? TASK_STATUS.pendiente;
                  const isBlocked = task.status === "bloqueada";
                  const tLeft = task.estimated_finish ? timeLeft(task.estimated_finish) : null;
                  const isOverdue = !!(tLeft?.overdue && task.status !== "completada");
                  const loading = actionLoading === task.id;

                  return (
                    <td key={sector.id} style={{
                      borderRight: "1px solid #e2e8f0",
                      borderBottom: isOverdue ? "2px solid #ef4444" : "1px solid #e2e8f0",
                      borderTop: isOverdue ? "2px solid #ef4444" : undefined,
                      padding: "10px 12px",
                      verticalAlign: "middle",
                      background: isOverdue ? "#fff1f0" : isBlocked ? "#fff1f0" : st.bg,
                      outline: isOverdue ? "2px solid #ef4444" : undefined,
                      outlineOffset: isOverdue ? "-2px" : undefined,
                    }}>
                      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
                        <Text style={{ fontSize: 11, fontWeight: 600, color: st.color }}>
                          {isBlocked && <WarningOutlined style={{ marginRight: 3 }} />}
                          {st.label}
                        </Text>
                      </div>

                      {tLeft && task.status !== "completada" && (
                        <div style={{
                          fontSize: 11,
                          color: tLeft.overdue ? "#fff" : tLeft.urgent ? "#ff4d4f" : "#52c41a",
                          background: tLeft.overdue ? "#ef4444" : undefined,
                          borderRadius: tLeft.overdue ? 4 : undefined,
                          padding: tLeft.overdue ? "2px 6px" : undefined,
                          display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8,
                          fontWeight: tLeft.overdue ? 700 : 400,
                        }}>
                          <ClockCircleOutlined style={{ fontSize: 10 }} />
                          {tLeft.text}
                        </div>
                      )}

                      {task.status !== "completada" && canEditSector(sector.id) && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {(task.status === "pendiente" || task.status === "bloqueada") && (
                            <Button
                              size="small" type="primary" icon={<PlayCircleOutlined />}
                              loading={loading} onClick={() => changeStatus(task.id, "start")}
                              style={{ fontSize: 11, height: 24, borderRadius: 5, paddingInline: 7 }}
                            >
                              {task.status === "bloqueada" ? "Reanudar" : "Iniciar"}
                            </Button>
                          )}
                          {task.status === "en_proceso" && (
                            <>
                              <Button
                                size="small" icon={<CheckCircleOutlined />}
                                loading={loading} onClick={() => changeStatus(task.id, "complete")}
                                style={{ fontSize: 11, height: 24, borderRadius: 5, paddingInline: 7, color: "#52c41a", borderColor: "#52c41a" }}
                              >
                                Listo
                              </Button>
                              <Button
                                size="small" danger icon={<StopOutlined />}
                                loading={loading} onClick={() => changeStatus(task.id, "block")}
                                style={{ fontSize: 11, height: 24, borderRadius: 5, paddingInline: 7 }}
                              >
                                Bloquear
                              </Button>
                            </>
                          )}
                          <Tooltip title="Asignar Materiales">
                            <Button
                              size="small" icon={<ShoppingCartOutlined />}
                              onClick={() => { setMatTaskId(task.id); setMatTaskSectorId(sector.id); setMatModal(true); }}
                              style={{ fontSize: 11, height: 24, width: 24, borderRadius: 5, padding: 0, background: "#fa8c16", color: "#fff", border: "none" }}
                            />
                          </Tooltip>
                          <Tooltip title="Establecer fecha estimada">
                            <Button
                              size="small" icon={<ClockCircleOutlined />}
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

                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        {task.notes ? (
                          <div
                            onClick={() => setViewNote({ open: true, text: task.notes, sector: sector.name })}
                            style={{ fontSize: 10, color: "#595959", background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 4, padding: "2px 6px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "pointer" }}
                          >
                            <MessageOutlined style={{ marginRight: 3 }} />
                            {task.notes.length > 15 ? task.notes.slice(0, 15) + "…" : task.notes}
                          </div>
                        ) : canEditSector(sector.id) ? (
                          <span style={{ fontSize: 10, color: "#bfbfbf" }}>Sin nota</span>
                        ) : null}
                        {canEditSector(sector.id) && (
                          <Tooltip title="Editar nota">
                            <Button
                              size="small" type="text" icon={<EditOutlined />}
                              onClick={() => setNotesModal({ open: true, taskId: task.id, current: task.notes || "" })}
                              style={{ fontSize: 10, height: 18, width: 18, padding: 0, color: "#8c8c8c", flexShrink: 0 }}
                            />
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PipelinePage() {
  const router = useRouter();
  const { data: identity } = useGetIdentity<any>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [estimateModal, setEstimateModal] = useState<{ open: boolean; taskId: number | null }>({ open: false, taskId: null });
  const [estimateDate, setEstimateDate] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [notesModal, setNotesModal] = useState<{ open: boolean; taskId: number | null; current: string }>({ open: false, taskId: null, current: "" });
  const [savingNotes, setSavingNotes] = useState(false);
  const [viewNote, setViewNote] = useState<{ open: boolean; text: string; sector: string }>({ open: false, text: "", sector: "" });
  const [matModal, setMatModal] = useState(false);
  const [matTaskId, setMatTaskId] = useState<number | null>(null);
  const [matTaskSectorId, setMatTaskSectorId] = useState<number | null>(null);
  const [savingMat, setSavingMat] = useState(false);
  // Carrito de materiales
  type MatItem = { product: number; qty: number; notes: string };
  const [matItems, setMatItems] = useState<MatItem[]>([]);
  const [matInputProduct, setMatInputProduct] = useState<number | null>(null);
  const [matInputQty, setMatInputQty] = useState<number>(1);
  const [matInputNotes, setMatInputNotes] = useState("");

  const matAddToCart = () => {
    if (!matInputProduct || !matInputQty) return;
    setMatItems((prev) => [...prev, { product: matInputProduct, qty: matInputQty, notes: matInputNotes }]);
    setMatInputProduct(null);
    setMatInputQty(1);
    setMatInputNotes("");
  };

  const matReset = () => {
    setMatModal(false); setMatTaskId(null); setMatTaskSectorId(null);
    setMatItems([]); setMatInputProduct(null); setMatInputQty(1); setMatInputNotes("");
  };
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showFinished, setShowFinished] = useState(false);
  const [deliveryLoading, setDeliveryLoading] = useState<number | null>(null);

  const markDelivered = async (woId: number) => {
    setDeliveryLoading(woId);
    try {
      await axiosInstance.post(`${API}/work-orders/${woId}/mark-delivered/`);
      notification.success({ message: "OT marcada como entregada" });
      refresh();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "No se pudo marcar como entregada" });
    } finally {
      setDeliveryLoading(null);
    }
  };

  const saveNotes = async () => {
    if (!notesModal.taskId) return;
    setSavingNotes(true);
    try {
      await axiosInstance.patch(`${API}/sector-tasks/${notesModal.taskId}/`, { notes: notesModal.current });
      notification.success({ message: "Nota guardada" });
      setNotesModal({ open: false, taskId: null, current: "" });
      refresh();
    } catch {
      notification.error({ message: "No se pudo guardar la nota" });
    } finally {
      setSavingNotes(false);
    }
  };

  const { query: sectorsQuery, result: sectorsResult } = useList({
    resource: "sectors",
    sorters: [{ field: "order", order: "asc" }],
    queryOptions: { 
      queryKey: ["sectors", refreshKey],
      refetchInterval: 15000, // Los sectores no cambian tanto
    } as any,
  });

  const { query: tasksQuery, result: tasksResult } = useList({
    resource: "sector-tasks",
    pagination: { pageSize: 500 },
    queryOptions: { 
      queryKey: ["sector-tasks", refreshKey],
      refetchInterval: 10000,
    } as any,
  });

  const { query: woQuery, result: woResult } = useList({
    resource: "work-orders",
    pagination: { pageSize: 200 },
    filters: [{ field: "status__in", operator: "in", value: ["pendiente", "en_proceso", "pausada", "completada"] }],
    queryOptions: { 
      queryKey: ["work-orders-pipeline", refreshKey],
      refetchInterval: 10000,
    } as any,
  });

  const { result: productsResult } = useList({ resource: "products", pagination: { pageSize: 200 } });
  const allProducts: any[] = productsResult?.data || [];
  // Productos disponibles para el sector activo: los del sector + los globales (sector=null)
  const modalProducts = allProducts.filter(
    (p) => !p.sector || p.sector === matTaskSectorId
  );

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

  const sendMaterials = async () => {
    if (!matItems.length || !matTaskId) return;
    setSavingMat(true);
    try {
      const results = await Promise.all(
        matItems.map((item) =>
          axiosInstance.post(`${API}/material-reservations/`, {
            sector_task: matTaskId, product: item.product, quantity: item.qty, notes: item.notes,
          })
        )
      );
      const warnings = results.map((r) => r.data.warning).filter(Boolean);
      if (warnings.length > 0) {
        notification.warning({
          message: "Pedido enviado con advertencias de stock",
          description: warnings.join(" / "),
          duration: 10,
        });
      } else {
        notification.success({ message: `${matItems.length} material${matItems.length > 1 ? "es" : ""} solicitado${matItems.length > 1 ? "s" : ""} — pendientes de aprobación` });
      }
      matReset();
      refresh();
    } catch (e: any) {
      notification.error({ message: e?.response?.data?.detail || "Error al solicitar materiales" });
    } finally { setSavingMat(false); }
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

  const sectors: any[] = sectorsResult?.data || [];
  const tasks: any[] = tasksResult?.data || [];
  const workOrders: any[] = woResult?.data || [];

  const isAdminOrCeo = identity?.is_staff || identity?.rol === 'ceo' || identity?.rol === 'admin';

  const editableSectorIds: Set<number> | null = isAdminOrCeo
    ? null
    : (() => {
        const memberships: any[] = identity?.sector_memberships || [];
        if (memberships.length > 0) {
          return new Set(memberships.filter((m: any) => m.puede_editar).map((m: any) => m.sector));
        }
        return identity?.sector ? new Set([identity.sector]) : new Set<number>();
      })();

  const canEditSector = (sectorId: number) =>
    editableSectorIds === null || editableSectorIds.has(sectorId);

  const taskMap: Record<number, Record<number, any>> = {};
  tasks.forEach((t) => {
    if (!taskMap[t.work_order]) taskMap[t.work_order] = {};
    taskMap[t.work_order][t.sector] = t;
  });

  const allWOs = workOrders.filter((wo) => taskMap[wo.id] && Object.keys(taskMap[wo.id]).length > 0);

  // Split: OTs con producción completada (backend las marca automáticamente) → "Para entregar"
  const finishedWOs = allWOs.filter((wo) => wo.status === "completada");
  const finishedIds = new Set(finishedWOs.map((wo) => wo.id));

  // Pipeline activo: solo estados activos (excluir completada/entregada/facturada/cancelada)
  let pipelineWOs = allWOs.filter((wo) => !finishedIds.has(wo.id) && wo.status !== "entregada" && wo.status !== "facturada" && wo.status !== "cancelada");
  if (filterPriority) pipelineWOs = pipelineWOs.filter((wo) => wo.priority === filterPriority);
  if (filterStatus)   pipelineWOs = pipelineWOs.filter((wo) => wo.status === filterStatus);

  // Inmediata siempre arriba, luego por id desc
  pipelineWOs.sort((a, b) => {
    if (a.priority === "inmediata" && b.priority !== "inmediata") return -1;
    if (b.priority === "inmediata" && a.priority !== "inmediata") return 1;
    return b.id - a.id;
  });

  const totalActive  = pipelineWOs.length;
  const inProgress   = pipelineWOs.filter((wo) => wo.status === "en_proceso").length;
  const blocked      = tasks.filter((t) => t.status === "bloqueada" && !finishedIds.has(t.work_order)).length;

  const sharedProps = {
    sectors, taskMap, canEditSector, actionLoading, changeStatus,
    setMatTaskId, setMatTaskSectorId, setMatModal, setEstimateModal, setEstimateDate,
    setNotesModal, setViewNote, router,
  };

  const deliveryProps = { onDeliver: markDelivered, deliveryLoading };

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Pipeline de Producción</Title>
          <Text type="secondary">Línea de trabajo por orden y sector</Text>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, background: "#e6f7ff", border: "none", color: "#1890ff" }}>
            {totalActive} órdenes activas
          </Tag>
          <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, background: "#e6f4ff", border: "none", color: "#722ed1" }}>
            {inProgress} en proceso
          </Tag>
          {blocked > 0 && (
            <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, background: "#fff1f0", border: "none", color: "#ff4d4f" }}>
              <WarningOutlined style={{ marginRight: 4 }} />{blocked} bloqueada{blocked > 1 ? "s" : ""}
            </Tag>
          )}
          {finishedWOs.length > 0 && (
            <Tag style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, background: "#f6ffed", border: "none", color: "#52c41a" }}>
              {finishedWOs.length} finalizada{finishedWOs.length > 1 ? "s" : ""}
            </Tag>
          )}
          <Button icon={<ReloadOutlined />} onClick={refresh} />
          {isAdminOrCeo && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/work-orders/create")}>
              Nueva OT
            </Button>
          )}
        </div>
      </div>

      <Tabs 
        defaultActiveKey="1" 
        size="large"
        tabBarStyle={{
          marginBottom: 24,
          padding: "0 8px",
          background: "#fff",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          border: "none",
        }}
        items={[
          {
            key: "1",
            label: (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px" }}>
                <AppstoreOutlined style={{ fontSize: 18 }} />
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.3px" }}>
                  Pipeline Activo
                </span>
              </div>
            ),
            children: (
              <div style={{ animation: "fadeIn 0.3s" }}>
                {/* Filtros */}
                <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                  <Select
                    placeholder="Prioridad"
                    allowClear
                    style={{ width: 140 }}
                    value={filterPriority}
                    onChange={(v) => setFilterPriority(v ?? null)}
                    options={[
                      { value: "normal",    label: "Normal"    },
                      { value: "inmediata", label: "🔴 Inmediata" },
                    ]}
                  />
                  <Select
                    placeholder="Estado"
                    allowClear
                    style={{ width: 150 }}
                    value={filterStatus}
                    onChange={(v) => setFilterStatus(v ?? null)}
                    options={[
                      { value: "pendiente",  label: "Pendiente"  },
                      { value: "en_proceso", label: "En proceso" },
                      { value: "pausada",    label: "Pausada"    },
                    ]}
                  />
                  {(filterPriority || filterStatus) && (
                    <Button size="small" onClick={() => { setFilterPriority(null); setFilterStatus(null); }}>
                      Limpiar
                    </Button>
                  )}
                </div>

                {/* Pipeline activo */}
                {pipelineWOs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 0" }}>
                    <Text type="secondary" style={{ fontSize: 16 }}>No hay órdenes activas en el pipeline.</Text>
                  </div>
                ) : (
                  <WOTable wos={pipelineWOs} dimmed={false} {...sharedProps} />
                )}

                {/* Sección trabajos finalizados (histórico del pipeline activo) */}
                {finishedWOs.length > 0 && (
                  <div style={{ marginTop: 32 }}>
                    <div
                      onClick={() => setShowFinished((v) => !v)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        cursor: "pointer", marginBottom: showFinished ? 12 : 0,
                        padding: "10px 16px",
                        background: "#f6ffed",
                        border: "1px solid #b7eb8f",
                        borderRadius: 10,
                        userSelect: "none",
                      }}
                    >
                      <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                      <Text strong style={{ color: "#237804", fontSize: 14 }}>
                        Para entregar ({finishedWOs.length})
                      </Text>
                      <DownOutlined
                        style={{
                          fontSize: 11, color: "#52c41a", marginLeft: "auto",
                          transform: showFinished ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      />
                    </div>
                    {showFinished && (
                      <WOTable wos={finishedWOs} dimmed={true} {...sharedProps} {...deliveryProps} />
                    )}
                  </div>
                )}
              </div>
            )
          },
          {
            key: "2",
            label: (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px" }}>
                <HistoryOutlined style={{ fontSize: 18 }} />
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.3px" }}>
                  Historial de Finalizados
                </span>
              </div>
            ),
            children: (
              <div style={{ animation: "fadeIn 0.3s" }}>
                <FinishedWorksTab />
              </div>
            )
          }
        ]}
      />

      {/* Modal ver nota completa */}
      <Modal
        title={`Nota — ${viewNote.sector}`}
        open={viewNote.open}
        onCancel={() => setViewNote({ open: false, text: "", sector: "" })}
        footer={null}
      >
        <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{viewNote.text}</p>
      </Modal>

      {/* Modal nota de sector */}
      <Modal
        title="Nota del sector"
        open={notesModal.open}
        onCancel={() => setNotesModal({ open: false, taskId: null, current: "" })}
        onOk={saveNotes}
        confirmLoading={savingNotes}
        okText="Guardar"
      >
        <Input.TextArea
          rows={3}
          placeholder="Ej: Faltan 2 piezas, usar plantilla B, cuidado con el borde..."
          value={notesModal.current}
          onChange={(e) => setNotesModal((prev) => ({ ...prev, current: e.target.value }))}
          maxLength={500}
          showCount
        />
      </Modal>

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
          showTime style={{ width: "100%" }}
          value={estimateDate} onChange={(d) => setEstimateDate(d)}
          format="DD/MM/YYYY HH:mm" size="large"
        />
      </Modal>

      {/* Modal Pedir Materiales */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ShoppingCartOutlined style={{ fontSize: 18, color: "#fa8c16" }} />
            <span>Pedir materiales</span>
            {matItems.length > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, background: "#fa8c16", color: "#fff", borderRadius: 20, padding: "1px 10px" }}>
                {matItems.length}
              </span>
            )}
          </div>
        }
        open={matModal}
        onOk={sendMaterials}
        onCancel={matReset}
        confirmLoading={savingMat}
        okText={matItems.length > 0 ? `Enviar ${matItems.length} pedido${matItems.length > 1 ? "s" : ""}` : "Enviar pedido"}
        cancelText="Cancelar"
        width={580}
        okButtonProps={{ disabled: matItems.length === 0, style: matItems.length > 0 ? { background: "#fa8c16", borderColor: "#fa8c16" } : {} }}
      >
        {/* Formulario agregar ítem */}
        <div style={{
          background: "#fafafa", border: "1px solid #e2e8f0",
          borderRadius: 10, padding: "14px 16px", marginBottom: 16,
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#8c8c8c", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Agregar material
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <p style={{ marginBottom: 4, fontSize: 12, fontWeight: 500 }}>Producto</p>
              <Select
                showSearch placeholder="Buscar producto..."
                style={{ width: "100%" }} optionFilterProp="label"
                onChange={setMatInputProduct} value={matInputProduct}
                options={modalProducts.map((p: any) => {
                  const available = p.available_qty ?? p.stock_qty;
                  const hasReserved = Number(p.reserved_qty) > 0;
                  return {
                    value: p.id,
                    label: `${p.name} (${p.unit}) — disponible: ${available}${hasReserved ? ` (total: ${p.stock_qty}, reservado: ${p.reserved_qty})` : ""}`,
                  };
                })}
              />
            </div>
            <div style={{ flex: "0 0 100px" }}>
              <p style={{ marginBottom: 4, fontSize: 12, fontWeight: 500 }}>Cantidad</p>
              <InputNumber
                min={0.01} step={0.5} style={{ width: "100%" }}
                value={matInputQty} onChange={(v) => setMatInputQty(v || 1)}
              />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <p style={{ marginBottom: 4, fontSize: 12, fontWeight: 500 }}>Notas</p>
              <Input
                placeholder="Ej: color rojo, 2.5 mts..."
                value={matInputNotes} onChange={(e) => setMatInputNotes(e.target.value)}
                onPressEnter={matAddToCart}
              />
            </div>
            <Button
              type="primary" icon={<PlusOutlined />}
              onClick={matAddToCart}
              disabled={!matInputProduct || !matInputQty}
              style={{ flexShrink: 0, height: 32 }}
            >
              Agregar
            </Button>
          </div>
        </div>

        {/* Lista de ítems del carrito */}
        {matItems.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "24px 0", color: "#bfbfbf",
            border: "1px dashed #d9d9d9", borderRadius: 8,
          }}>
            <ShoppingCartOutlined style={{ fontSize: 28, display: "block", marginBottom: 6 }} />
            <span style={{ fontSize: 13 }}>Todavía no agregaste materiales</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#8c8c8c", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              Lista de pedido
            </p>
            {matItems.map((item, idx) => {
              const prod = allProducts.find((p: any) => p.id === item.product);
              const available = Number(prod?.available_qty ?? prod?.stock_qty ?? 0);
              const overStock = item.qty > available;
              return (
                <div key={idx} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: overStock ? "#fff7e6" : "#fff",
                  border: `1px solid ${overStock ? "#ffd591" : "#e2e8f0"}`,
                  borderRadius: 8, padding: "8px 12px",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    background: overStock ? "#fff1e6" : "#fff7e6",
                    border: `1px solid ${overStock ? "#fa8c16" : "#ffd591"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 13, fontWeight: 700, color: "#fa8c16",
                  }}>
                    {overStock ? <WarningOutlined style={{ fontSize: 13 }} /> : idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 13, display: "block" }} ellipsis>
                      {prod?.name ?? "—"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {item.qty} {prod?.unit ?? ""}
                      {item.notes && <> · {item.notes}</>}
                    </Text>
                    {overStock && (
                      <Text style={{ fontSize: 11, color: "#d46b08" }}>
                        ⚠ Solo hay {available} {prod?.unit} disponibles — el admin decidirá
                      </Text>
                    )}
                  </div>
                  <Button
                    type="text" size="small" danger
                    icon={<CloseOutlined style={{ fontSize: 11 }} />}
                    onClick={() => setMatItems((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ flexShrink: 0, opacity: 0.6 }}
                  />
                </div>
              );
            })}
          </div>
        )}

        <p style={{ color: "#8c8c8c", fontSize: 12, marginTop: 14 }}>
          Los pedidos quedarán pendientes de aprobación por el equipo admin antes de descontar stock.
        </p>
      </Modal>
    </div>
  );
}
