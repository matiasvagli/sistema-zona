"use client";

import { Typography } from "antd";

export const AppTitle = ({ collapsed }: { collapsed: boolean }) => (
    <div style={{ 
        padding: collapsed ? "16px 0" : "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        justifyContent: collapsed ? "center" : "flex-start"
    }}>
        {/* AQUÍ PODRÁS PONER TU LOGO MÁS ADELANTE */}
        {/* Ejemplo: <img src="/logo.png" alt="Logo" style={{ width: '32px' }} /> */}
        <div style={{ 
            width: "32px", 
            height: "32px", 
            background: "linear-gradient(135deg, #1890ff 0%, #001529 100%)", 
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "18px",
            boxShadow: "0 4px 10px rgba(24, 144, 255, 0.3)"
        }}>
            Z
        </div>
        {!collapsed && (
            <Typography.Title level={4} style={{ margin: 0, color: "#001529", fontSize: "18px", fontWeight: 700 }}>
                Zona Urbana
            </Typography.Title>
        )}
    </div>
);
