"use client";

import React, { useState } from "react";
import { Typography, Button, Empty, Tag, Tooltip, Modal, Input, notification } from "antd";
import { axiosInstance } from "@/utils/axios-instance";

const API = "http://localhost:8000/api/v1";
import {
  ToolOutlined, PlusOutlined, PlayCircleOutlined,
  CheckCircleOutlined, StopOutlined, ClockCircleOutlined,
  DeleteOutlined, EditOutlined, MessageOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

interface WorkOrderSectorsProps {
  tasks: any[];
  availableSectors: any[];
  setAddSectorOpen: (val: boolean) => void;
  changeTaskStatus: (taskId: number, action: "start" | "complete" | "block") => void;
  removeSector: (taskId: number) => void;
  setEstimateModal: (val: { open: boolean; taskId: number | null }) => void;
  setEstimateDate: (date: any) => void;
  taskStatusConfig: Record<string, { color: string; label: string }>;
  canEditSector: (sectorId: number) => boolean;
}

export const WorkOrderSectors: React.FC<WorkOrderSectorsProps> = ({
  tasks,
  availableSectors,
  setAddSectorOpen,
  changeTaskStatus,
  removeSector,
  setEstimateModal,
  setEstimateDate,
  taskStatusConfig,
  canEditSector,
}) => {
  const [notesModal, setNotesModal] = useState<{ open: boolean; taskId: number | null; current: string }>({ open: false, taskId: null, current: "" });
  const [savingNotes, setSavingNotes] = useState(false);

  const saveNotes = async () => {
    if (!notesModal.taskId) return;
    setSavingNotes(true);
    try {
      await axiosInstance.patch(`${API}/sector-tasks/${notesModal.taskId}/`, { notes: notesModal.current });
      notification.success({ message: "Nota guardada" });
      setNotesModal({ open: false, taskId: null, current: "" });
    } catch {
      notification.error({ message: "No se pudo guardar la nota" });
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div style={{ 
      background: "#fff", 
      borderRadius: 16, 
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)", 
      overflow: "hidden",
      marginBottom: 24 
    }}>
      <div style={{ padding: "18px 28px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
         <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", fontSize: 14 }}>
              <ToolOutlined />
            </div>
            <Text strong style={{ fontSize: 15, color: "#0f172a" }}>Sectores de Producción</Text>
         </div>
         {availableSectors.length > 0 && (
           <Button size="small" icon={<PlusOutlined />} onClick={() => setAddSectorOpen(true)} style={{ borderRadius: 8 }}>
             Agregar sector
           </Button>
         )}
      </div>

      <div style={{ padding: "24px 28px" }}>
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
              style={{ borderRadius: 8 }}
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
                    background: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    borderRadius: 12,
                    padding: "14px 16px",
                    borderLeft: `4px solid ${cfg.color}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Text strong style={{ fontSize: 14 }}>{idx + 1}. {task.sector_name}</Text>
                      <Tag
                        style={{ color: cfg.color, borderColor: cfg.color, background: `${cfg.color}15`, margin: 0, borderRadius: 20 }}
                      >
                        {cfg.label}
                      </Tag>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {task.status === "pendiente" && canEditSector(task.sector) && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => changeTaskStatus(task.id, "start")}
                          style={{ borderRadius: 6 }}
                        >
                          Iniciar
                        </Button>
                      )}
                      {task.status === "en_proceso" && canEditSector(task.sector) && (
                        <>
                          <Button
                            size="small"
                            style={{ borderColor: "#52c41a", color: "#52c41a", borderRadius: 6 }}
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
                            style={{ borderRadius: 6 }}
                          >
                            Bloquear
                          </Button>
                        </>
                      )}
                      {task.status === "bloqueada" && canEditSector(task.sector) && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<PlayCircleOutlined />}
                          onClick={() => changeTaskStatus(task.id, "start")}
                          style={{ borderRadius: 6 }}
                        >
                          Reanudar
                        </Button>
                      )}
                      {(task.status === "en_proceso" || task.status === "pendiente") && canEditSector(task.sector) && (
                        <Tooltip title="Establecer fecha estimada de fin">
                          <Button
                            size="small"
                            icon={<ClockCircleOutlined />}
                            onClick={() => {
                              setEstimateModal({ open: true, taskId: task.id });
                              setEstimateDate(task.estimated_finish ? dayjs(task.estimated_finish) : null);
                            }}
                            style={{ borderRadius: 6 }}
                          />
                        </Tooltip>
                      )}
                      {canEditSector(task.sector) && (
                        <Tooltip title="Quitar sector">
                          <Button
                            size="small"
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => removeSector(task.id)}
                          />
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {task.started_at && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <PlayCircleOutlined style={{ marginRight: 4 }} />
                        Inicio: {dayjs(task.started_at).format("DD/MM HH:mm")}
                      </Text>
                    )}
                    {task.estimated_finish && (
                      <Text style={{ fontSize: 12, color: overdue ? "#ff4d4f" : "#059669" }}>
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

                  {/* Nota del sector */}
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    {task.notes ? (
                      <div style={{ flex: 1, fontSize: 13, color: "#595959", background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 6, padding: "6px 10px" }}>
                        <MessageOutlined style={{ marginRight: 6, color: "#faad14" }} />
                        {task.notes}
                      </div>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 12 }}>Sin nota</Text>
                    )}
                    {canEditSector(task.sector) && (
                      <Tooltip title={task.notes ? "Editar nota" : "Agregar nota"}>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => setNotesModal({ open: true, taskId: task.id, current: task.notes || "" })}
                          style={{ flexShrink: 0 }}
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
          autoFocus
        />
      </Modal>
    </div>
  );
};
