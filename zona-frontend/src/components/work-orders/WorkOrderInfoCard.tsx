"use client";

import React from "react";
import { Typography, Row, Col, Input, Select, DatePicker, Tag, Button, Tooltip } from "antd";
import { FireOutlined, UserAddOutlined, FileAddOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface WorkOrderInfoCardProps {
  ot: any;
  editMode: boolean;
  setEditMode: (val: boolean) => void;
  editFields: any;
  setEditFields: (fields: any) => void;
  statusCfg: { color: string; label: string };
  isAdmin?: boolean;
  onAssignClient?: () => void;
  onCreateBudget?: () => void;
}

export const WorkOrderInfoCard: React.FC<WorkOrderInfoCardProps> = ({
  ot,
  editMode,
  setEditMode,
  editFields,
  setEditFields,
  statusCfg,
  isAdmin,
  onAssignClient,
  onCreateBudget,
}) => {
  return (
    <div style={{ 
      background: "#fff", 
      borderRadius: 16, 
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)", 
      padding: "24px 28px", 
      marginBottom: 24 
    }}>
      {editMode ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Título</Text>
            <Input
              value={editFields.title}
              onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
              size="large"
            />
          </div>
          <Row gutter={16}>
            <Col xs={12}>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Estado</Text>
              <Select
                value={editFields.status}
                onChange={(v) => setEditFields({ ...editFields, status: v })}
                style={{ width: "100%" }}
                size="large"
              >
                <Option value="pendiente">Pendiente</Option>
                <Option value="en_proceso">En Proceso</Option>
                <Option value="pausada">Pausada</Option>
                <Option value="completada">Completada</Option>
                <Option value="cancelada">Cancelada</Option>
              </Select>
            </Col>
            <Col xs={12}>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Prioridad</Text>
              <Select
                value={editFields.priority}
                onChange={(v) => setEditFields({ ...editFields, priority: v })}
                style={{ width: "100%" }}
                size="large"
              >
                <Option value="normal">Normal</Option>
                <Option value="inmediata">
                  <span style={{ color: "#ff4d4f" }}><FireOutlined style={{ marginRight: 6 }} />Inmediata</span>
                </Option>
              </Select>
            </Col>
          </Row>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Vencimiento</Text>
            <DatePicker
              value={editFields.due_date}
              onChange={(d) => setEditFields({ ...editFields, due_date: d })}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              size="large"
            />
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Notas</Text>
            <TextArea
              value={editFields.notes}
              onChange={(e) => setEditFields({ ...editFields, notes: e.target.value })}
              rows={3}
            />
          </div>
          <Button onClick={() => setEditMode(false)}>Cancelar</Button>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Estado</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color={statusCfg.color} style={{ fontSize: 13, padding: "2px 10px" }}>{statusCfg.label}</Tag>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Prioridad</Text>
            <div style={{ marginTop: 4 }}>
              {ot.priority === "inmediata"
                ? <Tag color="red" icon={<FireOutlined />} style={{ fontSize: 13, padding: "2px 10px" }}>Inmediata</Tag>
                : <Tag style={{ fontSize: 13, padding: "2px 10px" }}>Normal</Tag>}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Tipo de OT</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="geekblue" style={{ fontSize: 13, padding: "2px 10px" }}>
                {{ general: 'General', instalacion_espacio_vial: '🏗️ Instalación EV', mantenimiento_espacio_vial: '🔧 Mantenimiento EV', campana: '📢 Campaña', civil: '🧱 Civil', electrico: '⚡ Eléctrico' }[ot.work_type as string] || ot.work_type || 'General'}
              </Tag>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Cliente</Text>
            <div style={{ marginTop: 4 }}>
              {ot.client_name
                ? <Text strong>{ot.client_name}</Text>
                : isAdmin
                  ? <Button size="small" type="dashed" icon={<UserAddOutlined />} onClick={onAssignClient}>Asignar cliente</Button>
                  : <Text type="secondary">—</Text>
              }
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Vencimiento</Text>
            <Text strong style={{ display: "block", marginTop: 4 }}>
              {ot.due_date ? dayjs(ot.due_date).format("DD/MM/YYYY") : "—"}
            </Text>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>Presupuesto</Text>
            <div style={{ marginTop: 4 }}>
              {ot.budget_title
                ? <Tag color="blue">{ot.budget_title}</Tag>
                : isAdmin
                  ? <Tooltip title={!ot.client ? "Primero asigná un cliente" : ""}>
                      <Button size="small" type="dashed" icon={<FileAddOutlined />} onClick={onCreateBudget} disabled={!ot.client}>Crear presupuesto</Button>
                    </Tooltip>
                  : <Text type="secondary" style={{ fontSize: 12 }}>Sin vincular</Text>
              }
            </div>
          </div>
          {ot.structure_name && (
            <div style={{ flex: 1, minWidth: 180 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Estructura</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color="purple" style={{ fontSize: 13, padding: "2px 10px" }}>{ot.structure_name}</Tag>
              </div>
            </div>
          )}
          {ot.campaign_name && (
            <div style={{ flex: 1, minWidth: 180 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Campaña</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color="orange" style={{ fontSize: 13, padding: "2px 10px" }}>📢 {ot.campaign_name}</Tag>
              </div>
            </div>
          )}
          {ot.notes && (
            <div style={{ width: "100%" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Notas</Text>
              <Text style={{ display: "block", marginTop: 4 }}>{ot.notes}</Text>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
