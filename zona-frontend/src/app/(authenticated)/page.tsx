"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGetIdentity, useList } from "@refinedev/core";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { ChatFloatingButton } from "@/components/ChatDrawer";
import { axiosInstance } from "@/utils/axios-instance";
import {
  Typography, Row, Col, Card, Button, List, Avatar, Tag,
  Divider, Progress, Spin, Drawer, Tooltip, Empty, Space, Badge, Select,
} from "antd";
import {
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  RocketOutlined,
  PlusOutlined,
  ToolOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  FireOutlined,
  RightOutlined,
  ArrowRightOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { ChatDrawer } from "@/components/ChatDrawer";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

const { Title, Text } = Typography;

const today = new Date().toLocaleDateString("es-AR", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});

const taskStatusConfig: Record<string, { color: string; label: string }> = {
  pendiente: { color: "default", label: "Pendiente" },
  en_proceso: { color: "processing", label: "En Proceso" },
  completada: { color: "success", label: "Completada" },
  bloqueada: { color: "error", label: "Bloqueada" },
};

const otStatusColor: Record<string, string> = {
  pendiente: "#8c8c8c",
  en_proceso: "#1890ff",
  pausada: "#faad14",
  completada: "#52c41a",
  cancelada: "#ff4d4f",
};

function calcProgress(tasks: any[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "completada").length;
  return Math.round((done / tasks.length) * 100);
}

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useGetIdentity<any>();
  const router = useRouter();
  usePresenceHeartbeat();
  const [selectedOT, setSelectedOT] = useState<any>(null);
  const [chatUser, setChatUser] = useState<any>(null);
  const [unreadPerSender, setUnreadPerSender] = useState<Record<string, number>>({});
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const [users, setUsers] = useState<any[]>([]);

  // Polling para mensajes no leídos y lista de usuarios para el chat
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Mensajes no leídos
        const { data: unreadData } = await axiosInstance.get("http://localhost:8000/api/v1/messages/unread-count/");
        const mapping: Record<string, number> = {};
        if (unreadData && unreadData.per_sender) {
          Object.keys(unreadData.per_sender).forEach(key => {
            mapping[String(key)] = unreadData.per_sender[key];
          });
        }
        setUnreadPerSender(mapping);

        // 2. Lista de usuarios para el chat (manual)
        const { data: usersData } = await axiosInstance.get("http://localhost:8000/api/v1/users/");
        setUsers(usersData.results || usersData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
    const id = setInterval(fetchData, 8000);
    return () => clearInterval(id);
  }, []);

  // Lógica de permisos por rol - Forzamos a boolean
  const canViewBudgets = !!(user?.rol === "admin" || user?.rol === "ceo" || user?.is_staff);

  const { query: otQuery, result: otResult } = useList({
    resource: "work-orders",
    filters: [{ field: "status", operator: "ne" as any, value: "cancelada" }],
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 8 },
  });

  const { result: tasksResult } = useList({ resource: "sector-tasks", pagination: { pageSize: 200 } });
  
  const { result: clientsResult } = useList({
    resource: "clients",
    pagination: { pageSize: 50 },
    queryOptions: { 
      enabled: canViewBudgets && !!user
    }
  });

  const { result: budgetsResult } = useList({
    resource: "budgets",
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 10 },
    queryOptions: {
      enabled: canViewBudgets && !!user
    }
  });

  const { result: productsResult } = useList({
    resource: "products",
    pagination: { pageSize: 10 },
    queryOptions: { 
      enabled: canViewBudgets && !!user
    }
  });

  const workOrders: any[] = (otResult?.data || []) as any[];
  const activeOTs = useMemo(() => {
    let filtered = workOrders.filter((o) => o.status !== "completada" && o.status !== "cancelada");
    if (priorityFilter !== "all") {
      filtered = filtered.filter((o) => o.priority === priorityFilter);
    }
    return filtered;
  }, [workOrders, priorityFilter]);

  if (userLoading) {
    return <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>;
  }

  const budgets: any[] = (budgetsResult?.data || []) as any[];
  const clients: any[] = (clientsResult?.data || []) as any[];
  const products: any[] = (productsResult?.data || []) as any[];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  const quickActions = [
    ...(canViewBudgets ? [{ label: "Nueva OT", icon: <PlusOutlined />, color: "#1677ff", bg: "rgba(22,119,255,0.12)", path: "/work-orders/create" }] : []),
    ...(canViewBudgets ? [{ label: "Presupuesto", icon: <FileTextOutlined />, color: "#9254de", bg: "rgba(146,84,222,0.12)", path: "/budgets/create" }] : []),
    ...(canViewBudgets ? [{ label: "Nuevo Cliente", icon: <UserOutlined />, color: "#fa8c16", bg: "rgba(250,140,22,0.12)", path: "/clients/create" }] : []),
    ...(canViewBudgets ? [{ label: "Mantenimiento", icon: <ToolOutlined />, color: "#52c41a", bg: "rgba(82,196,26,0.12)", path: "/inventory" }] : []),
  ];

  const statCards = [
    ...(canViewBudgets ? [{
      title: "Clientes",
      value: clients.length,
      icon: <UserOutlined />,
      color: "#1677ff",
      bg: "#e6f4ff",
      path: "/clients",
      sub: `${clients.filter(c => c.is_active !== false).length} activos`,
    }] : []),
    {
      title: "OTs Activas",
      value: activeOTs.length,
      icon: <RocketOutlined />,
      color: "#7c3aed",
      bg: "#f3e8ff",
      path: "/work-orders",
      sub: `${workOrders.filter(o => o.status === "en_proceso").length} en proceso`,
    },
    ...(canViewBudgets ? [{
      title: "Presupuestos",
      value: budgets.length,
      icon: <FileTextOutlined />,
      color: "#d97706",
      bg: "#fffbeb",
      path: "/budgets",
      sub: `${budgets.filter(b => b.status === "aprobado").length} aprobados`,
    }] : []),
    ...(canViewBudgets ? [{
      title: "Productos",
      value: products.length,
      icon: <ShoppingCartOutlined />,
      color: "#059669",
      bg: "#ecfdf5",
      path: "/products",
      sub: "en inventario",
    }] : []),
  ];

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100%" }}>

      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1677ff 100%)",
        borderRadius: "20px",
        padding: "0",
        marginBottom: "24px",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(15,23,42,0.25)",
      }}>
        <div style={{ padding: "28px 32px" }}>
          <Row align="middle" wrap={false} gutter={16}>
            {/* Saludo */}
            <Col flex="auto">
              <div style={{ display: "flex", alignItems: "center", position: "relative", minHeight: 80 }}>
                <div>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {greeting()}
                  </Text>
                  <Title level={2} style={{ color: "#fff", margin: "2px 0 0", fontSize: 26, fontWeight: 800 }}>
                    {user?.first_name || user?.username || "Admin"} 👋
                  </Title>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2, display: "block" }}>
                    {today.charAt(0).toUpperCase() + today.slice(1)}
                  </Text>
                </div>

                {/* Logo Flotante - No afecta el tamaño del recuadro */}
                <img
                  src="/logo-header.png"
                  alt="Logo"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    height: 150, // Ahora podés ponerle 100 o más y no se agranda el azul
                    opacity: 0.7,
                    objectFit: "contain",
                    pointerEvents: "none"
                  }}
                  onError={(e) => e.currentTarget.style.display = 'none'}
                />
              </div>
            </Col>

            {/* Acciones rápidas inline */}
            <Col flex="none">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => router.push(a.path)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      background: a.bg,
                      border: `1px solid ${a.color}40`,
                      borderRadius: 12,
                      padding: "10px 14px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      minWidth: 72,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
                  >
                    <span style={{ color: a.color, fontSize: 18 }}>{a.icon}</span>
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </Col>
          </Row>
        </div>

        {/* ─── STAT STRIP ─── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          {statCards.map((s, i) => (
            <div
              key={s.title}
              onClick={() => router.push(s.path)}
              style={{
                padding: "16px 24px",
                cursor: "pointer",
                borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 14,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: s.color, fontSize: 18, flexShrink: 0,
              }}>
                {s.icon}
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>{s.title}</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MAIN CONTENT ───────────────────────────────────────────── */}
      <Row gutter={[20, 20]}>

        {/* Cola de Trabajos */}
        <Col xs={24} lg={16}>
          <Card
            variant="borderless"
            style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e6f4ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#1677ff" }}>
                  <ThunderboltOutlined />
                </div>
                <Title level={5} style={{ margin: 0 }}>Cola de Trabajos</Title>
                <Tag style={{ margin: 0, fontSize: 11, borderRadius: 20 }}>{activeOTs.length} activos</Tag>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Select
                  size="small"
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  style={{ width: 120 }}
                  options={[
                    { label: "Todas", value: "all" },
                    { label: "Normal", value: "normal" },
                    { label: "Inmediata", value: "inmediata" },
                  ]}
                  dropdownStyle={{ borderRadius: 8 }}
                />
                {canViewBudgets && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => router.push("/work-orders/create")}
                    style={{ borderRadius: 8 }}
                  >
                    Nueva OT
                  </Button>
                )}
              </div>
            </div>
            <Divider style={{ margin: 0 }} />

            <div style={{ padding: "24px" }}>
              {otQuery.isLoading ? (
                <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <style>{`
                    .ot-card {
                      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                      border: 1px solid #f1f5f9;
                    }
                    .ot-card:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
                      border-color: #e2e8f0;
                      background: #f8fafc !important;
                    }
                  `}</style>
                  
                  {activeOTs.length === 0 ? (
                    <Empty description="No hay órdenes de trabajo activas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <>
                      {activeOTs.map((ot: any) => {
                        const tasks = (tasksResult?.data || []).filter((t: any) => t.work_order === ot.id);
                        const progress = calcProgress(tasks);
                        const isInmediata = ot.priority === "inmediata";
                        
                        return (
                          <div 
                            key={ot.id} 
                            className="ot-card"
                            onClick={() => router.push(`/work-orders/${ot.id}`)}
                            style={{
                              padding: "12px 16px",
                              borderRadius: "12px",
                              background: "#fff",
                              cursor: "pointer",
                              borderLeft: isInmediata ? "4px solid #ff4d4f" : "1px solid #f1f5f9"
                            }}
                          >
                            <Row align="middle" gutter={16}>
                              <Col flex="auto">
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", background: "#f8fafc", padding: "2px 6px", borderRadius: 4 }}>#{ot.id}</span>
                                  <Text strong style={{ fontSize: 14, color: "#1e293b" }}>{ot.title}</Text>
                                  {isInmediata && <Tag color="volcano" style={{ fontSize: 9, margin: 0, borderRadius: 4, height: 18, lineHeight: '16px' }}>INMEDIATA</Tag>}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <UserOutlined style={{ fontSize: 10, color: "#94a3b8" }} />
                                    <span style={{ fontSize: 11, color: "#64748b" }}>{ot.client_name || "Sin cliente"}</span>
                                  </div>
                                  {ot.due_date && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                      <CalendarOutlined style={{ fontSize: 10, color: dayjs(ot.due_date).isBefore(dayjs()) ? "#ff4d4f" : "#94a3b8" }} />
                                      <span style={{ fontSize: 11, color: dayjs(ot.due_date).isBefore(dayjs()) ? "#ff4d4f" : "#64748b", fontWeight: dayjs(ot.due_date).isBefore(dayjs()) ? 600 : 400 }}>
                                        {dayjs(ot.due_date).format("DD/MM HH:mm")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </Col>
                              
                              <Col style={{ width: 140 }}>
                                <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: progress === 100 ? "#10b981" : "#64748b" }}>{progress}%</span>
                                  <div style={{ display: "flex", gap: 2 }}>
                                    {tasks.slice(0, 4).map((t: any) => (
                                      <div key={t.id} style={{ 
                                        width: 6, height: 6, borderRadius: "50%", 
                                        background: t.status === "completada" ? "#10b981" : t.status === "en_proceso" ? "#3b82f6" : "#e2e8f0"
                                      }} />
                                    ))}
                                  </div>
                                </div>
                                <Progress 
                                  percent={progress} 
                                  size="small" 
                                  strokeColor={progress === 100 ? "#10b981" : "#3b82f6"}
                                  trailColor="#f1f5f9"
                                  showInfo={false}
                                  strokeWidth={4}
                                />
                              </Col>

                              <Col>
                                <RightOutlined style={{ fontSize: 12, color: "#cbd5e1" }} />
                              </Col>
                            </Row>
                          </div>
                        );
                      })}
                      <div style={{ padding: "12px 0", textAlign: "center" }}>
                        <Button type="link" size="small" onClick={() => router.push("/work-orders")}>
                          Ver todas las órdenes <ArrowRightOutlined />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* Columna derecha */}
        <Col xs={24} lg={8}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Equipo */}
            <Card
              variant="borderless"
              style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ padding: "18px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "#f3e8ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", fontSize: 14 }}>
                    <UserOutlined />
                  </div>
                  <Title level={5} style={{ margin: 0 }}>Equipo</Title>
                  {unreadPerSender["group"] > 0 && (
                    <Badge count="Nuevo" style={{ backgroundColor: "#52c41a", fontSize: 10, marginLeft: 8 }} />
                  )}
                </div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {users.length} personas
                </Text>
              </div>
              <Divider style={{ margin: 0 }} />
              {users.length === 0 ? (
                <Empty description="Sin empleados" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
              ) : (
                <div>
                  {users.slice(0, 6).map((emp: any, idx: number, arr) => {
                    const initials = (emp.first_name?.[0] || emp.username?.[0] || "?").toUpperCase() +
                      (emp.last_name?.[0] || emp.username?.[1] || "?").toUpperCase();
                    const isOnline = !!emp.is_online;
                    const isMe = emp.id === user?.id;
                    const isLast = idx === arr.length - 1;
                    const empUnread: number = (unreadPerSender[String(emp.id)] ?? unreadPerSender[emp.id] ?? 0) as number;

                    return (
                      <div key={emp.id} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 20px",
                        borderBottom: isLast ? "none" : "1px solid #f5f5f5",
                      }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <Badge
                            count={empUnread}
                            size="small"
                            offset={[-2, 2]}
                          >
                            <Avatar style={{ background: isOnline ? "#7c3aed" : "#e2e8f0", color: isOnline ? "#fff" : "#64748b", fontWeight: 700, fontSize: 12 }}>
                              {initials}
                            </Avatar>
                          </Badge>
                          <span style={{
                            position: "absolute", bottom: 0, right: 0,
                            width: 10, height: 10, borderRadius: "50%",
                            background: isOnline ? "#22c55e" : "#cbd5e1",
                            border: "2px solid #fff",
                            boxShadow: isOnline ? "0 0 0 2px rgba(34,197,94,0.25)" : "none",
                            transition: "all 0.3s",
                            zIndex: 10
                          }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <Text strong style={{ fontSize: 13 }}>
                              {emp.first_name ? `${emp.first_name} ${emp.last_name || ""}`.trim() : emp.username}
                            </Text>
                            {isMe && <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 11 }}>(vos)</span>}
                          </div>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {emp.sector_name || (emp.is_staff ? "Admin" : "Sin sector")} · {isOnline ? <span style={{ color: "#22c55e", fontWeight: 600 }}>Online</span> : "Offline"}
                          </Text>
                        </div>
                        {!isMe && (
                          <Tooltip title={empUnread > 0 ? `Tenés ${empUnread} mensajes sin leer de ${emp.first_name || emp.username}` : `Escribirle a ${emp.first_name || emp.username}`}>
                            <Button
                              size="middle"
                              type="text"
                              icon={<MessageOutlined />}
                              shape="circle"
                              style={{
                                color: empUnread > 0 ? "#ff4d4f" : "#7c3aed",
                                background: empUnread > 0 ? "#fff1f0" : "transparent",
                                flexShrink: 0
                              }}
                              onClick={() => setChatUser(emp)}
                            />
                          </Tooltip>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Presupuestos recientes */}
            {canViewBudgets && (
              <Card
                variant="borderless"
                style={{ borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ padding: "18px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", fontSize: 14 }}>
                      <FileTextOutlined />
                    </div>
                    <Title level={5} style={{ margin: 0 }}>Presupuestos</Title>
                  </div>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => router.push("/budgets/create")}
                    style={{ borderRadius: 8, fontSize: 12 }}
                  >
                    Nuevo
                  </Button>
                </div>

                <div style={{ display: "flex", gap: 6, padding: "0 20px 12px", flexWrap: "wrap" }}>
                  {[
                    { label: "Borrador", count: budgets.filter(b => b.status === "borrador").length, color: "#8c8c8c", bg: "#f5f5f5" },
                    { label: "Aprobado", count: budgets.filter(b => b.status === "aprobado").length, color: "#059669", bg: "#ecfdf5" },
                    { label: "Facturado", count: budgets.filter(b => b.status === "facturado").length, color: "#1677ff", bg: "#e6f4ff" },
                    { label: "Rechazado", count: budgets.filter(b => b.status === "rechazado").length, color: "#dc2626", bg: "#fef2f2" },
                  ].map(s => s.count > 0 ? (
                    <span key={s.label} style={{
                      padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      color: s.color, background: s.bg,
                    }}>
                      {s.count} {s.label}
                    </span>
                  ) : null)}
                </div>

                <Divider style={{ margin: 0 }} />
                {budgets.length === 0 ? (
                  <Empty description="Sin presupuestos" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
                ) : (
                  <div>
                    {budgets.slice(0, 5).map((b: any, idx: number, arr) => {
                      const stMap: Record<string, { color: string; label: string }> = {
                        borrador: { color: "default", label: "Borrador" },
                        aprobado: { color: "success", label: "Aprobado" },
                        rechazado: { color: "error", label: "Rechazado" },
                        facturado: { color: "blue", label: "Facturado" },
                      };
                      const st = stMap[b.status] || stMap.borrador;
                      const isLast = idx === arr.length - 1;
                      return (
                        <div
                          key={b.id}
                          onClick={() => router.push(`/budgets/${b.id}`)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "10px 20px",
                            borderBottom: isLast ? "none" : "1px solid #f5f5f5",
                            cursor: "pointer",
                            transition: "background 0.1s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Text type="secondary" style={{ fontSize: 10 }}>PRE-{String(b.id).padStart(4, "0")}</Text>
                              <Text strong style={{ fontSize: 12 }} ellipsis>{b.client_name}</Text>
                            </div>
                          </div>
                          <Tag color={st.color as any} style={{ fontSize: 10, margin: 0 }}>{st.label}</Tag>
                          {b.total_amount != null && (
                            <Text strong style={{ fontSize: 12, color: "#059669", flexShrink: 0 }}>
                              ${Number(b.total_amount).toLocaleString("es-AR")}
                            </Text>
                          )}
                          <RightOutlined style={{ color: "#d9d9d9", fontSize: 10 }} />
                        </div>
                      );
                    })}
                    <div style={{ padding: "10px 20px", borderTop: "1px solid #f0f0f0" }}>
                      <Button type="link" size="small" onClick={() => router.push("/budgets")} style={{ padding: 0, fontSize: 12 }}>
                        Ver todos <ArrowRightOutlined />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

          </div>
        </Col>
      </Row>

      {/* Drawer detalle OT */}
      <Drawer
        title={selectedOT && `OT #${selectedOT.id} — ${selectedOT.title}`}
        open={!!selectedOT}
        onClose={() => setSelectedOT(null)}
        width={480}
      >
        {selectedOT && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Text strong>Cliente: {selectedOT.client_name}</Text>
            <Divider style={{ margin: "4px 0" }} />
            <Text strong>Progreso por sectores:</Text>
            {selectedOT.tasks?.map((task: any) => (
              <div key={task.id} style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text>{task.sector_name}</Text>
                  <Tag color={taskStatusConfig[task.status]?.color}>{task.status}</Tag>
                </div>
                <Progress percent={task.status === "completada" ? 100 : task.status === "en_proceso" ? 50 : 0} size="small" />
              </div>
            ))}
            <Button
              type="primary"
              block
              style={{ marginTop: 20 }}
              onClick={() => router.push(`/work-orders/${selectedOT.id}`)}
            >
              Ver orden completa
            </Button>
          </div>
        )}
      </Drawer>
      {user?.id && <ChatFloatingButton currentUserId={user.id} />}

      {/* Chat directo a un miembro del equipo */}
      {chatUser && user?.id && (
        <ChatDrawer
          open={!!chatUser}
          onClose={() => setChatUser(null)}
          currentUserId={user.id}
          recipientId={chatUser.id}
          recipientName={chatUser.first_name ? `${chatUser.first_name} ${chatUser.last_name || ""}`.trim() : chatUser.username}
        />
      )}
    </div>
  );
}
