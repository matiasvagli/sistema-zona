"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetIdentity, useList } from "@refinedev/core";
import {
  Typography, Row, Col, Card, Button, List, Avatar, Tag, Badge,
  Divider, Progress, Spin, Drawer, Tooltip, Empty, Tabs, Space, Table,
} from "antd";
import {
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  RocketOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  CalendarOutlined,
  ToolOutlined,
  BellOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  FireOutlined,
  RightOutlined,
} from "@ant-design/icons";
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
  pendiente:  { color: "default",    label: "Pendiente"  },
  en_proceso: { color: "processing", label: "En Proceso" },
  completada: { color: "success",    label: "Completada" },
  bloqueada:  { color: "error",      label: "Bloqueada"  },
};

const otStatusColor: Record<string, string> = {
  pendiente:   "#8c8c8c",
  en_proceso:  "#1890ff",
  pausada:     "#faad14",
  completada:  "#52c41a",
  cancelada:   "#ff4d4f",
};

function calcProgress(tasks: any[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.status === "completada").length;
  return Math.round((done / tasks.length) * 100);
}

function nextEstimate(tasks: any[]): string | null {
  const active = tasks
    .filter((t) => t.status === "en_proceso" && t.estimated_finish)
    .sort((a, b) => dayjs(a.estimated_finish).diff(dayjs(b.estimated_finish)));
  if (active.length === 0) return null;
  return dayjs(active[0].estimated_finish).format("DD/MM HH:mm");
}

export default function Dashboard() {
  const { data: user, isLoading: userLoading } = useGetIdentity<any>();
  const router = useRouter();
  const [selectedOT, setSelectedOT] = useState<any>(null);

  useEffect(() => {
    if (!userLoading && user && !user.is_staff) {
      router.push("/pipeline");
    }
  }, [user, userLoading, router]);

  const { query: otQuery, result: otResult } = useList({
    resource: "work-orders",
    filters: [{ field: "status", operator: "ne" as any, value: "cancelada" }],
    sorters: [{ field: "created_at", order: "desc" }],
    pagination: { pageSize: 10 },
  });

  const { result: usersResult } = useList({ resource: "users", pagination: { pageSize: 50 } });
  const { result: tasksResult } = useList({ resource: "sector-tasks", pagination: { pageSize: 200 } });
  const { result: clientsResult } = useList({ resource: "clients", pagination: { pageSize: 50 } });

  const otLoading = otQuery.isLoading;
  const workOrdersData = otResult;

  if (userLoading || (user && !user.is_staff)) {
    return <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>;
  }

  const workOrders: any[] = (workOrdersData?.data || []) as any[];
  const activeOTs = workOrders.filter((o) => o.status !== "completada");

  const stats = [
    { title: "Clientes",     value: 124, icon: <UserOutlined />,        color: "#1890ff", trend: "+12%", up: true  },
    { title: "OTs Activas",  value: activeOTs.length, icon: <RocketOutlined />,       color: "#722ed1", trend: "+5%",  up: true  },
    { title: "Presupuestos", value: 45,  icon: <FileTextOutlined />,     color: "#faad14", trend: "-2%",  up: false },
    { title: "Productos",    value: 320, icon: <ShoppingCartOutlined />, color: "#52c41a", trend: "+8%",  up: true  },
  ];


  const quickActions = [
    { label: "Nueva OT",      icon: <PlusOutlined />,     color: "#1890ff", path: "/work-orders/create" },
    { label: "Presupuesto",   icon: <FileTextOutlined />, color: "#722ed1", path: "/budgets/create" },
    { label: "Nuevo Cliente", icon: <UserOutlined />,     color: "#faad14", path: "/clients/create" },
    { label: "Mantenimiento", icon: <ToolOutlined />,     color: "#52c41a", path: "/inventory" },
  ];

  const renderSummary = () => (
    <>
      <Row gutter={[20, 20]} style={{ marginBottom: "24px" }}>
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card
              variant="borderless"
              style={{ borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden", borderTop: `3px solid ${stat.color}` }}
              styles={{ body: { padding: "20px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <Text type="secondary" style={{ fontSize: "13px" }}>{stat.title}</Text>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                    <Title level={2} style={{ margin: 0, lineHeight: 1 }}>{stat.value}</Title>
                    <Tag
                      icon={stat.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      color={stat.up ? "success" : "error"}
                      style={{ border: "none", borderRadius: "6px", fontWeight: 600 }}
                    >
                      {stat.trend}
                    </Tag>
                  </div>
                </div>
                <div style={{ background: `${stat.color}18`, padding: "14px", borderRadius: "14px", color: stat.color, fontSize: "22px" }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Cola de Trabajos</Title>}
            variant="borderless"
            style={{ borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => router.push("/work-orders/create")}>Nueva OT</Button>}
          >
            {otLoading ? (
              <div style={{ textAlign: "center", padding: 40 }}><Spin /></div>
            ) : workOrders.length === 0 ? (
              <Empty description="No hay órdenes de trabajo activas" />
            ) : (
              <List
                dataSource={workOrders}
                renderItem={(ot: any) => {
                  const tasks: any[] = ot.tasks || [];
                  const progress = calcProgress(tasks);
                  const statusColor = otStatusColor[ot.status] || "#8c8c8c";

                  return (
                    <List.Item
                      style={{ padding: "14px 0", cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                      onClick={() => setSelectedOT(ot)}
                    >
                      <div style={{ width: "100%" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <Text strong style={{ color: "#1890ff", fontSize: 13 }}>#{ot.id}</Text>
                          <Text strong style={{ fontSize: 13, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ot.title}</Text>
                          <Tag
                            color={ot.status === "en_proceso" ? "processing" : ot.status === "completada" ? "success" : ot.status === "pausada" ? "warning" : "default"}
                            style={{ fontSize: 11, margin: 0 }}
                          >
                            {ot.status === "en_proceso" ? "En proceso" : ot.status === "completada" ? "Completada" : ot.status === "pausada" ? "Pausada" : "Pendiente"}
                          </Tag>
                          {ot.priority === "inmediata"
                            ? <Tag color="red" icon={<FireOutlined />} style={{ fontSize: 11, margin: 0 }}>Inmediata</Tag>
                            : <Tag style={{ fontSize: 11, margin: 0, color: "#8c8c8c" }}>Normal</Tag>
                          }
                          {tasks.length > 0 && (
                            <Tooltip title="Sectores">
                              <span style={{ display: "flex", gap: 4 }}>
                                {tasks.map((t: any) => (
                                  <span key={t.id} style={{
                                    width: 8, height: 8, borderRadius: "50%",
                                    background: t.status === "completada" ? "#52c41a" : t.status === "en_proceso" ? "#1890ff" : t.status === "bloqueada" ? "#ff4d4f" : "#d9d9d9",
                                    display: "inline-block",
                                  }} />
                                ))}
                              </span>
                            </Tooltip>
                          )}
                          <RightOutlined style={{ color: "#bfbfbf", fontSize: 11 }} />
                        </div>
                        <Progress percent={progress} size="small" strokeColor={statusColor} showInfo={false} />
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Equipo</Title>}
            variant="borderless"
            style={{ borderRadius: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", height: "100%" }}
            extra={<Text type="secondary" style={{ fontSize: 12 }}>{(usersResult?.data || []).filter((u: any) => !u.is_staff).length} operarios</Text>}
          >
            {(usersResult?.data || []).length === 0 ? (
              <Empty description="Sin empleados registrados" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={(usersResult?.data || []) as any[]}
                renderItem={(emp: any) => {
                  const empTasks = (tasksResult?.data || []).filter((t: any) => t.assigned_to === emp.id);
                  const activeTask = empTasks.find((t: any) => t.status === "en_proceso");
                  const initials = emp.username?.slice(0, 2).toUpperCase() || "??";
                  const isActive = !!activeTask;
                  return (
                    <List.Item style={{ padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <Avatar
                            style={{ background: isActive ? "#1890ff" : "#d9d9d9", color: "#fff", fontWeight: 700, fontSize: 13 }}
                          >
                            {initials}
                          </Avatar>
                          <span style={{
                            position: "absolute", bottom: 0, right: 0,
                            width: 10, height: 10, borderRadius: "50%",
                            background: isActive ? "#52c41a" : "#d9d9d9",
                            border: "2px solid #fff",
                          }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text strong style={{ fontSize: 13, display: "block" }}>{emp.username}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {emp.sector_name || (emp.is_staff ? "Admin" : "Sin sector")}
                          </Text>
                        </div>
                        {isActive ? (
                          <Tooltip title={activeTask.work_order_title}>
                            <Tag color="processing" style={{ fontSize: 11, margin: 0 }}>Trabajando</Tag>
                          </Tooltip>
                        ) : (
                          <Tag style={{ fontSize: 11, margin: 0, color: "#8c8c8c" }}>Libre</Tag>
                        )}
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
      </Row>
    </>
  );

  return (
    <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100%" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #1890ff 0%, #001529 100%)",
        padding: "36px 40px",
        borderRadius: "20px",
        marginBottom: "24px",
        color: "#fff",
        boxShadow: "0 10px 30px rgba(24,144,255,0.3)",
      }}>
        <Row align="middle" justify="space-between" wrap>
          <Col>
            <Title level={1} style={{ color: "#fff", margin: 0, fontSize: "30px", lineHeight: 1.2 }}>
              ¡Hola, {user?.username || "Admin"}! 👋
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", display: "block", marginTop: 6 }}>
              {today.charAt(0).toUpperCase() + today.slice(1)}
            </Text>
          </Col>
          <Col style={{ marginTop: 12 }}>
            <Button
              size="large"
              icon={<PlusOutlined />}
              onClick={() => router.push("/work-orders/create")}
              style={{ background: "#fff", color: "#1890ff", border: "none", height: "46px", borderRadius: "12px", fontWeight: 700 }}
            >
              Nueva OT
            </Button>
          </Col>
        </Row>

        <Divider style={{ borderColor: "rgba(255,255,255,0.2)", margin: "24px 0 16px" }} />
        <Row gutter={[12, 12]}>
          {quickActions.map((a) => (
            <Col key={a.label}>
              <Button
                icon={a.icon}
                onClick={() => router.push(a.path)}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff",
                  borderRadius: "10px",
                  height: "38px",
                  fontWeight: 500,
                }}
              >
                {a.label}
              </Button>
            </Col>
          ))}
        </Row>
      </div>

      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: "1",
            label: <Space><ThunderboltOutlined /> Resumen Operativo</Space>,
            children: renderSummary(),
          },
          {
            key: "2",
            label: <Space><UserOutlined /> Gestión de Clientes</Space>,
            children: (
              <Card 
                variant="borderless" 
                style={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/clients/create")}>Añadir Cliente</Button>}
              >
                <List
                  dataSource={(clientsResult?.data || []) as any[]}
                  renderItem={(c: any) => (
                    <List.Item
                      style={{ padding: "10px 0", cursor: "pointer" }}
                      actions={[<Button key="edit" size="small" type="link" onClick={() => router.push(`/clients/edit/${c.id}`)}>Editar</Button>]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} style={{ background: "#1890ff" }} />}
                        title={<Text strong>{c.name}</Text>}
                        description={<Text type="secondary" style={{ fontSize: 12 }}>{[c.tax_id, c.email, c.phone].filter(Boolean).join(" · ")}</Text>}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Drawer para detalle de OT */}
      <Drawer
        title={selectedOT && `OT #${selectedOT.id} — ${selectedOT.title}`}
        open={!!selectedOT}
        onClose={() => setSelectedOT(null)}
        width={480}
      >
        {selectedOT && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Text strong>Cliente: {selectedOT.client_name}</Text>
            <Divider style={{ margin: '8px 0' }} />
            <Text strong>Progreso por sectores:</Text>
            {selectedOT.tasks?.map((task: any) => (
              <div key={task.id} style={{ background: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>{task.sector_name}</Text>
                  <Tag color={taskStatusConfig[task.status]?.color}>{task.status}</Tag>
                </div>
                <Progress percent={task.status === 'completada' ? 100 : task.status === 'en_proceso' ? 50 : 0} size="small" />
              </div>
            ))}
            <Button type="primary" block style={{ marginTop: 20 }} onClick={() => router.push("/pipeline")}>Ver en Pipeline completo</Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
