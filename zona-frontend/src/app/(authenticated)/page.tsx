"use client";

import { useGetIdentity } from "@refinedev/core";
import { Typography, Row, Col, Card, Button, List, Avatar, Tag, Badge, Divider, Progress } from "antd";
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
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dynamic from 'next/dynamic';

const Area = dynamic(() => import('@ant-design/plots').then(mod => mod.Area), { ssr: false });

const { Title, Text } = Typography;

const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const activityConfig = {
  success: { color: '#52c41a', bg: '#f6ffed', icon: <CheckCircleOutlined /> },
  info:    { color: '#1890ff', bg: '#e6f7ff', icon: <InfoCircleOutlined /> },
  warning: { color: '#faad14', bg: '#fffbe6', icon: <WarningOutlined /> },
  processing: { color: '#722ed1', bg: '#f9f0ff', icon: <ThunderboltOutlined /> },
};

const pipelineStages = [
  { label: 'Diseño',      count: 5,  color: '#1890ff' },
  { label: 'Producción',  count: 8,  color: '#722ed1' },
  { label: 'Instalación', count: 3,  color: '#faad14' },
  { label: 'Entregado',   count: 12, color: '#52c41a' },
];
const pipelineTotal = pipelineStages.reduce((s, x) => s + x.count, 0);

export default function Dashboard() {
  const { data: user } = useGetIdentity<any>();
  const chartData = [
    { time: 'Lun', value: 3 },
    { time: 'Mar', value: 4 },
    { time: 'Mie', value: 3.5 },
    { time: 'Jue', value: 5 },
    { time: 'Vie', value: 4.9 },
    { time: 'Sab', value: 6 },
    { time: 'Dom', value: 7 },
  ];

  const chartConfig = {
    data: chartData,
    xField: 'time',
    yField: 'value',
    smooth: true,
    areaStyle: { fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff' },
    line: { color: '#1890ff' },
    tooltip: { formatter: (d: { time: string; value: number }) => ({ name: 'OTs', value: d.value }) },
  };

  const stats = [
    { title: 'Clientes',     value: 124, icon: <UserOutlined />,         color: '#1890ff', trend: '+12%', up: true },
    { title: 'OTs Activas',  value: 18,  icon: <RocketOutlined />,        color: '#722ed1', trend: '+5%',  up: true },
    { title: 'Presupuestos', value: 45,  icon: <FileTextOutlined />,      color: '#faad14', trend: '-2%',  up: false },
    { title: 'Productos',    value: 320, icon: <ShoppingCartOutlined />,  color: '#52c41a', trend: '+8%',  up: true },
  ];

  const activities = [
    { title: 'OT #452 Completada',      time: 'hace 5 min',   user: 'Juan Pérez',  type: 'success'    as const },
    { title: 'Nuevo Presupuesto #12',   time: 'hace 12 min',  user: 'Ana García',  type: 'info'       as const },
    { title: 'Stock Crítico: Lona',     time: 'hace 1 hora',  user: 'Sistema',     type: 'warning'    as const },
    { title: 'OT #455 Iniciada',        time: 'hace 2 horas', user: 'Carlos Ruiz', type: 'processing' as const },
  ];

  const quickActions = [
    { label: 'Nueva OT',         icon: <PlusOutlined />,      color: '#1890ff' },
    { label: 'Presupuesto',      icon: <FileTextOutlined />,  color: '#722ed1' },
    { label: 'Agendar',          icon: <CalendarOutlined />,  color: '#faad14' },
    { label: 'Mantenimiento',    icon: <ToolOutlined />,      color: '#52c41a' },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100%' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1890ff 0%, #001529 100%)',
        padding: '36px 40px',
        borderRadius: '20px',
        marginBottom: '24px',
        color: '#fff',
        boxShadow: '0 10px 30px rgba(24,144,255,0.3)'
      }}>
        <Row align="middle" justify="space-between" wrap>
          <Col>
            <Title level={1} style={{ color: '#fff', margin: 0, fontSize: '30px', lineHeight: 1.2 }}>
              ¡Hola, {user?.username || 'Admin'}! 👋
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', display: 'block', marginTop: 6 }}>
              {today.charAt(0).toUpperCase() + today.slice(1)}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', display: 'block', marginTop: 4 }}>
              Resumen de la actividad de hoy en Zona.
            </Text>
          </Col>
          <Col style={{ marginTop: 12 }}>
            <Button
              size="large"
              icon={<PlusOutlined />}
              style={{ background: '#fff', color: '#1890ff', border: 'none', height: '46px', borderRadius: '12px', fontWeight: 700, marginRight: 12 }}
            >
              Nueva OT
            </Button>
            <Button
              size="large"
              icon={<BellOutlined />}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', height: '46px', borderRadius: '12px' }}
            />
          </Col>
        </Row>

        {/* Quick Actions */}
        <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '24px 0 16px' }} />
        <Row gutter={[12, 12]}>
          {quickActions.map((a) => (
            <Col key={a.label}>
              <Button
                icon={a.icon}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff',
                  borderRadius: '10px',
                  height: '38px',
                  fontWeight: 500,
                }}
              >
                {a.label}
              </Button>
            </Col>
          ))}
        </Row>
      </div>

      {/* Stats */}
      <Row gutter={[20, 20]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card
              variant="borderless"
              style={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', borderTop: `3px solid ${stat.color}` }}
              styles={{ body: { padding: '20px' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '13px' }}>{stat.title}</Text>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                    <Title level={2} style={{ margin: 0, lineHeight: 1 }}>{stat.value}</Title>
                    <Tag
                      icon={stat.up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      color={stat.up ? 'success' : 'error'}
                      style={{ border: 'none', borderRadius: '6px', fontWeight: 600 }}
                    >
                      {stat.trend}
                    </Tag>
                  </div>
                </div>
                <div style={{
                  background: `${stat.color}18`,
                  padding: '14px',
                  borderRadius: '14px',
                  color: stat.color,
                  fontSize: '22px'
                }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]}>
        {/* Chart */}
        <Col xs={24} lg={16}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Tendencia de Producción</Title>}
            variant="borderless"
            style={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            extra={
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="small" type="primary">Semana</Button>
                <Button size="small">Mes</Button>
              </div>
            }
          >
            <div style={{ height: '260px' }}>
              <Area {...chartConfig} />
            </div>

            {/* Pipeline overview */}
            <Divider style={{ margin: '16px 0 12px' }} />
            <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: 10 }}>Estado del Pipeline ({pipelineTotal} OTs activas)</Text>
            <Row gutter={[16, 8]}>
              {pipelineStages.map((s) => (
                <Col xs={12} sm={6} key={s.label}>
                  <Text style={{ fontSize: '12px', color: s.color, fontWeight: 600 }}>{s.label}</Text>
                  <Progress
                    percent={Math.round((s.count / pipelineTotal) * 100)}
                    strokeColor={s.color}
                    size="small"
                    format={() => <span style={{ fontSize: 11 }}>{s.count}</span>}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Activity */}
        <Col xs={24} lg={8}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Actividad Reciente</Title>}
            variant="borderless"
            style={{ borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}
            extra={<Badge count={2} size="small"><BellOutlined /></Badge>}
          >
            <List
              itemLayout="horizontal"
              dataSource={activities}
              renderItem={(item) => {
                const cfg = activityConfig[item.type];
                return (
                  <List.Item style={{ padding: '10px 0' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={cfg.icon}
                          style={{ backgroundColor: cfg.bg, color: cfg.color, flexShrink: 0 }}
                        />
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: '13px' }}>{item.title}</Text>
                          <Text type="secondary" style={{ fontSize: '11px', whiteSpace: 'nowrap', marginLeft: 8 }}>{item.time}</Text>
                        </div>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: '12px' }}>{item.user}</Text>
                      }
                    />
                  </List.Item>
                );
              }}
            />
            <Divider style={{ margin: '8px 0' }} />
            <Button type="link" style={{ padding: 0, fontSize: '13px' }}>Ver toda la actividad →</Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
