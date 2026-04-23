"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGetIdentity, useList } from "@refinedev/core";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { ChatFloatingButton } from "@/components/ChatDrawer";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";
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
  WarningOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
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

import { TASK_STATUS, OT_STATUS } from "@/constants/statuses";
import { calcProgress } from "@/utils/time";

const taskStatusConfig = TASK_STATUS;
const otStatusColor = Object.fromEntries(
  Object.entries(OT_STATUS).map(([k, v]) => [k, v.color])
) as Record<string, string>;

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
        const { data: unreadData } = await axiosInstance.get(`${API}/messages/unread-count/`);
        const mapping: Record<string, number> = {};
        if (unreadData && unreadData.per_sender) {
          Object.keys(unreadData.per_sender).forEach(key => {
            mapping[String(key)] = unreadData.per_sender[key];
          });
        }
        setUnreadPerSender(mapping);

        // 2. Lista de usuarios para el chat (manual)
        const { data: usersData } = await axiosInstance.get(`${API}/users/`);
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
    queryOptions: { refetchInterval: 10000 },
  });

  const { result: tasksResult } = useList({ 
    resource: "sector-tasks", 
    pagination: { pageSize: 200 },
    queryOptions: { refetchInterval: 10000 },
  });

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

  const { result: purchaseReqsResult } = useList({
    resource: "purchase-requests",
    filters: [{ field: "status", operator: "eq", value: "pendiente" }],
    pagination: { pageSize: 50 },
    queryOptions: {
      enabled: canViewBudgets && !!user,
      refetchInterval: 10000,
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
    const allTasks = (tasksResult?.data || []) as any[];

    let filtered = workOrders.filter((o) => {
      // 1. Excluir si el estado ya es completada o cancelada
      if (o.status === "completada" || o.status === "cancelada") return false;

      // 2. Excluir si está "de facto" terminada (todas sus tareas en 'completada')
      // Esto evita que aparezca en la Cola de Trabajos si ya debería estar en Historial
      const tasks = allTasks.filter((t) => t.work_order === o.id);
      const isFinished = tasks.length > 0 && tasks.every((t) => t.status === "completada");

      return !isFinished;
    });

    if (priorityFilter !== "all") {
      filtered = filtered.filter((o) => o.priority === priorityFilter);
    }
    return filtered;
  }, [workOrders, priorityFilter, tasksResult]);

  if (userLoading) {
    return <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>;
  }

  const budgets: any[] = (budgetsResult?.data || []) as any[];
  const clients: any[] = (clientsResult?.data || []) as any[];
  const products: any[] = (productsResult?.data || []) as any[];
  const purchaseReqs: any[] = (purchaseReqsResult?.data || []) as any[];

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
                      border: 1px solid #e2e8f0;
                    }
                    .ot-card:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
                      border-color: #cbd5e1;
                      background: #f8fafc !important;
                    }
                  `}</style>

                  {activeOTs.length === 0 ? (
                    <Empty description="No hay órdenes de trabajo activas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <>
                      {activeOTs.map((ot: any) => {
                        const tasks = (tasksResult?.data || []).filter((t: any) => t.work_order === ot.id);
                        const progress = calcProgress(tasks as { status: string }[]);
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
                              borderLeft: isInmediata ? "4px solid #ff4d4f" : "1px solid #e2e8f0"
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
                  {users.length} personas, {users.filter(u => u.is_online).length} conectados
                </Text>
              </div>
              <Divider style={{ margin: 0 }} />
              {users.length === 0 ? (
                <Empty description="Sin empleados" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
              ) : (
                <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  {[...users].sort((a, b) => {
                    // 1. Prioridad Conectados
                    if (!!a.is_online !== !!b.is_online) return a.is_online ? -1 : 1;
                    
                    // 2. Prioridad Jerarquía (CEO > Admin > Empleado)
                    const getWeight = (u: any) => {
                      if (u.rol === 'ceo') return 0;
                      if (u.rol === 'admin' || u.is_staff) return 1;
                      return 2;
                    };
                    
                    const weightA = getWeight(a);
                    const weightB = getWeight(b);
                    
                    if (weightA !== weightB) return weightA - weightB;
                    
                    // 3. Alfabético por nombre si lo demás es igual
                    return (a.first_name || a.username).localeCompare(b.first_name || b.username);
                  }).map((emp: any, idx: number, arr) => {
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

            {/* Alertas de Inventario (Admin) */}
            {canViewBudgets && (
              <Card
                variant="borderless"
                style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ padding: "18px 24px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(to right, #fff, #f8fafc)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, boxShadow: "0 4px 10px rgba(245,158,11,0.3)" }}>
                      <WarningOutlined />
                    </div>
                    <Title level={5} style={{ margin: 0, color: "#1e293b", fontWeight: 700 }}>Alertas de Inventario</Title>
                  </div>
                  <Button
                    type="link"
                    onClick={() => router.push("/products")}
                    style={{ padding: 0, fontWeight: 600, fontSize: 13, color: "#1677ff" }}
                  >
                    Ver catálogo <ArrowRightOutlined />
                  </Button>
                </div>
                
                {/* Bajo Stock */}
                <div style={{ padding: "16px 24px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
                        <Text strong style={{ fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Productos bajo mínimo</Text>
                    </div>
                </div>
                {products.filter(p => p.stock_bajo).length === 0 ? (
                  <div style={{ padding: "10px 24px 20px", color: "#94a3b8", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                      <CheckCircleOutlined style={{ color: "#10b981" }} /> Stock en niveles óptimos.
                  </div>
                ) : (
                  <div>
                    {products.filter(p => p.stock_bajo).slice(0, 3).map((p: any, idx, arr) => (
                      <div 
                        key={p.id} 
                        style={{ 
                            padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", 
                            borderBottom: idx === arr.length - 1 ? "none" : "1px solid #f1f5f9",
                            cursor: "pointer", transition: "background 0.2s"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        onClick={() => router.push("/products")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                                <ToolOutlined />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <Text strong style={{ fontSize: 13, color: "#1e293b" }}>{p.name}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>Quedan <span style={{ color: "#ef4444", fontWeight: 600 }}>{Number(p.available_qty ?? p.stock_qty).toLocaleString("es-AR")}</span> {p.unit} (Mín: {p.alert_qty})</Text>
                            </div>
                        </div>
                        <RightOutlined style={{ color: "#cbd5e1", fontSize: 10 }} />
                      </div>
                    ))}
                  </div>
                )}

                <Divider style={{ margin: 0, borderColor: "#e2e8f0" }} />

                {/* Pedidos de Compra */}
                <div style={{ padding: "16px 24px 8px", background: "#fafafa" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />
                        <Text strong style={{ fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pedidos de Empleados</Text>
                    </div>
                </div>
                {purchaseReqs.length === 0 ? (
                  <div style={{ padding: "10px 24px 24px", background: "#fafafa", color: "#94a3b8", fontSize: 13 }}>No hay pedidos pendientes.</div>
                ) : (
                  <div style={{ paddingBottom: 12, background: "#fafafa", borderRadius: "0 0 16px 16px" }}>
                    {purchaseReqs.slice(0, 3).map((r: any, idx, arr) => (
                      <div 
                        key={r.id} 
                        style={{ 
                            padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", 
                            borderBottom: idx === arr.length - 1 ? "none" : "1px solid #e2e8f0",
                            cursor: "pointer", transition: "background 0.2s"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        onClick={() => router.push("/products")}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                                <ShoppingOutlined />
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <Text strong style={{ fontSize: 13, color: "#1e293b" }}>{r.product_name}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>Piden <span style={{ color: "#4f46e5", fontWeight: 600 }}>{r.quantity_requested} {r.product_unit}</span> — {r.requested_by_name}</Text>
                            </div>
                        </div>
                        <RightOutlined style={{ color: "#cbd5e1", fontSize: 10 }} />
                      </div>
                    ))}
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
                  <Tag color={taskStatusConfig[task.status as keyof typeof taskStatusConfig]?.color}>{task.status}</Tag>
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
