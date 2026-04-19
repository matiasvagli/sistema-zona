"use client";

import { useList } from "@refinedev/core";
import { Row, Col, Card, Tag, Typography, Spin, Badge, Avatar, Tooltip } from "antd";
import { ClockCircleOutlined, UserOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function PipelinePage() {
  const { data: sectorsData, isLoading: sectorsLoading } = useList({
    resource: "sectors",
    sorters: [{ field: "order", order: "asc" }],
  });

  const { data: tasksData, isLoading: tasksLoading } = useList({
    resource: "sector-tasks",
  });

  if (sectorsLoading || tasksLoading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" tip="Cargando Pipeline..." /></div>;
  }

  const sectors = sectorsData?.data || [];
  const tasks = tasksData?.data || [];

  const getStatusTag = (status: string) => {
    switch (status) {
      case "pendiente": return <Tag color="default">PENDIENTE</Tag>;
      case "en_proceso": return <Tag color="processing">EN PROCESO</Tag>;
      case "completada": return <Tag color="success">COMPLETADA</Tag>;
      case "bloqueada": return <Tag color="error" icon={<WarningOutlined />}>BLOQUEADA</Tag>;
      default: return <Tag>{status.toUpperCase()}</Tag>;
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Pipeline de Producción</Title>
        <Text type="secondary">Visualiza el avance de las órdenes de trabajo a través de los sectores.</Text>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        overflowX: 'auto', 
        paddingBottom: '16px',
        scrollbarWidth: 'thin'
      }}>
        {sectors.map((sector: any) => (
          <div 
            key={sector.id} 
            style={{ 
              flex: '0 0 320px', 
              background: '#ebedf0', 
              borderRadius: '16px', 
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 200px)'
            }}
          >
            <div style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0 4px'
            }}>
              <Title level={4} style={{ margin: 0, fontSize: '16px' }}>{sector.name}</Title>
              <Badge 
                count={tasks.filter((t: any) => t.sector === sector.id).length} 
                style={{ backgroundColor: '#1890ff' }} 
              />
            </div>
            
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                overflowY: 'auto',
                paddingRight: '4px'
            }}>
              {tasks
                .filter((task: any) => task.sector === sector.id)
                .map((task: any) => (
                  <Card 
                    key={task.id} 
                    size="small" 
                    hoverable 
                    variant="borderless"
                    style={{ 
                        borderRadius: '12px', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        borderLeft: `4px solid ${task.priority === 'inmediata' ? '#ff4d4f' : '#1890ff'}` 
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
                      {task.work_order_title}
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      {getStatusTag(task.status)}
                      {task.priority === 'inmediata' && <Tag color="red">URGENTE</Tag>}
                    </div>

                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        fontSize: '12px',
                        color: '#8c8c8c'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ClockCircleOutlined />
                        {task.estimated_finish 
                          ? dayjs(task.estimated_finish).format('DD/MM HH:mm') 
                          : 'Pendiente'}
                      </div>
                      <Tooltip title={task.assigned_to_name || 'Sin asignar'}>
                        <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: task.assigned_to_name ? '#1890ff' : '#d9d9d9' }} />
                      </Tooltip>
                    </div>
                  </Card>
                ))}
              
              {tasks.filter((t: any) => t.sector === sector.id).length === 0 && (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '32px', 
                    color: '#bfbfbf',
                    border: '2px dashed #d9d9d9',
                    borderRadius: '12px'
                }}>
                    Vacío
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
