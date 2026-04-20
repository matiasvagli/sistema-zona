"use client";

import { Typography } from "antd";

export const AppTitle = ({ collapsed }: { collapsed: boolean }) => (
    <div style={{
        padding: collapsed ? "16px 0" : "20px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start"
    }}>
        <div style={{
            width: "100%",
            height: collapsed ? "32px" : "65px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            overflow: "hidden"
        }}>
            <img
                src="/logo1.png"
                alt="Zona Urbana"
                style={{
                    width: "auto",
                    height: "48%",
                    objectFit: "contain",
                    marginLeft: collapsed ? "0" : "-8px",
                    marginTop: collapsed ? "0" : "25px",
                    transition: "all 0.3s"
                }}
                onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                        parent.innerHTML = '<span style="color: #001529; font-weight: 900; font-size: 16px;">ZONA URBANA</span>';
                    }
                }}
            />
        </div>
    </div>
);
