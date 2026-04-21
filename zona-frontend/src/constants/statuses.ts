export type TaskStatus = "pendiente" | "en_proceso" | "completada" | "bloqueada";
export type OTStatus   = "pendiente" | "en_proceso" | "pausada" | "completada" | "cancelada";
export type BudgetStatus = "borrador" | "aprobado" | "rechazado" | "facturado" | "vencido";

export interface StatusConfig {
  color: string;
  label: string;
}

export interface TaskStatusConfig extends StatusConfig {
  bg: string;
  dot: string;
}

export const TASK_STATUS: Record<TaskStatus, TaskStatusConfig> = {
  pendiente:  { color: "#595959", bg: "#f5f5f5", label: "Pendiente",  dot: "#8c8c8c" },
  en_proceso: { color: "#003eb3", bg: "#e6f4ff", label: "En proceso", dot: "#1890ff" },
  completada: { color: "#237804", bg: "#f6ffed", label: "Completada", dot: "#52c41a" },
  bloqueada:  { color: "#a8071a", bg: "#fff1f0", label: "Bloqueada",  dot: "#ff4d4f" },
};

export const OT_STATUS: Record<OTStatus, StatusConfig> = {
  pendiente:  { color: "#8c8c8c", label: "Pendiente"  },
  en_proceso: { color: "#1890ff", label: "En proceso" },
  pausada:    { color: "#fa8c16", label: "Pausada"    },
  completada: { color: "#52c41a", label: "Completada" },
  cancelada:  { color: "#ff4d4f", label: "Cancelada"  },
};

export const BUDGET_STATUS: Record<BudgetStatus, StatusConfig> = {
  borrador:  { color: "default", label: "Borrador"  },
  aprobado:  { color: "success", label: "Aprobado"  },
  rechazado: { color: "error",   label: "Rechazado" },
  facturado: { color: "blue",    label: "Facturado" },
  vencido:   { color: "error",   label: "Vencido"   },
};

export const SECTOR_COLORS = [
  { light: "#e6f4ff", border: "#1890ff", solid: "#1890ff", dark: "#0958d9" },
  { light: "#f9f0ff", border: "#722ed1", solid: "#722ed1", dark: "#531dab" },
  { light: "#fff7e6", border: "#fa8c16", solid: "#fa8c16", dark: "#d46b08" },
  { light: "#f6ffed", border: "#52c41a", solid: "#52c41a", dark: "#389e0d" },
  { light: "#fff1f0", border: "#ff4d4f", solid: "#ff4d4f", dark: "#cf1322" },
  { light: "#e6fffb", border: "#13c2c2", solid: "#13c2c2", dark: "#08979c" },
];
