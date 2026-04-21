"use client";

import React from "react";
import { Typography, Button, Tag, Input, Select, DatePicker } from "antd";
import { 
  ArrowLeftOutlined, EditOutlined, SaveOutlined, 
  RocketOutlined 
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

interface WorkOrderHeaderProps {
  ot: any;
  editMode: boolean;
  setEditMode: (val: boolean) => void;
  editFields: any;
  setEditFields: (fields: any) => void;
  saveHeader: () => void;
  saving: boolean;
  handleInvoice?: () => void;
  canEdit?: boolean;
}

export const WorkOrderHeader: React.FC<WorkOrderHeaderProps> = ({
  ot,
  editMode,
  setEditMode,
  editFields,
  setEditFields,
  saveHeader,
  saving,
  handleInvoice,
  canEdit = false,
}) => {
  const router = useRouter();

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1677ff 100%)",
      padding: "28px 36px 90px",
      margin: "-24px -24px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push("/work-orders")}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            borderRadius: 10,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 16,
            }}>
              <RocketOutlined />
            </div>
            {!editMode ? (
              <Title level={3} style={{ color: "#fff", margin: 0, fontSize: 22, fontWeight: 800 }}>
                {ot.title}
              </Title>
            ) : (
              <Input
                value={editFields.title}
                onChange={(e) => setEditFields({ ...editFields, title: e.target.value })}
                style={{ maxWidth: 400 }}
              />
            )}
            <Tag style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff", borderRadius: 20, fontSize: 11,
            }}>
              OT #{ot.id}
            </Tag>
          </div>
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 2, display: "block" }}>
            Gestioná el progreso de los sectores y materiales de esta orden
          </Text>
        </div>
        {canEdit && (!editMode ? (
          <div style={{ display: "flex", gap: 10 }}>
            {ot.budget && (
              <Button
                type="primary"
                onClick={handleInvoice}
                style={{ 
                  borderRadius: 10, 
                  fontWeight: 600, 
                  background: "#3b82f6", 
                  borderColor: "#3b82f6",
                  boxShadow: "0 4px 12px rgba(59,130,246,0.3)"
                }}
              >
                Pasar a Facturación
              </Button>
            )}
            <Button
              icon={<EditOutlined />}
              onClick={() => setEditMode(true)}
              style={{ borderRadius: 10, fontWeight: 600 }}
            >
              Editar OT
            </Button>
          </div>
        ) : (
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={saveHeader}
            style={{ borderRadius: 10, fontWeight: 600, background: "#52c41a", borderColor: "#52c41a" }}
          >
            Guardar Cambios
          </Button>
        ))}
      </div>
    </div>
  );
};
