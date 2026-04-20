"use client";

import React from "react";
import { Typography, Button, Empty, Tooltip, Popconfirm } from "antd";
import { ShoppingCartOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface WorkOrderMaterialsProps {
  materials: any[];
  setMatModal: (val: boolean) => void;
  removeMaterial: (id: number) => void;
}

export const WorkOrderMaterials: React.FC<WorkOrderMaterialsProps> = ({
  materials,
  setMatModal,
  removeMaterial,
}) => {
  return (
    <div style={{ 
      background: "#fff", 
      borderRadius: 16, 
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)", 
      overflow: "hidden" 
    }}>
      <div style={{ padding: "18px 28px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
         <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff7e6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fa8c16", fontSize: 14 }}>
              <ShoppingCartOutlined />
            </div>
            <Text strong style={{ fontSize: 15, color: "#0f172a" }}>Materiales Asignados</Text>
         </div>
         <Button size="small" icon={<PlusOutlined />} onClick={() => setMatModal(true)} style={{ borderRadius: 8 }}>
            Agregar
         </Button>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {materials.length === 0 ? (
          <Empty description="Sin materiales asignados" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: "12px 0" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {materials.map((m: any) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fdfdfd", border: "1px solid #f1f1f1", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ padding: "4px 10px", background: "#fff7e6", color: "#d46b08", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>
                    x{m.quantity} {m.product_unit}
                  </div>
                  <div>
                    <Text strong style={{ display: "block", fontSize: 14 }}>{m.product_name}</Text>
                    {m.notes && <Text type="secondary" style={{ fontSize: 12 }}>{m.notes}</Text>}
                  </div>
                </div>
                <Popconfirm title="¿Quitar material?" onConfirm={() => removeMaterial(m.id)}>
                   <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
