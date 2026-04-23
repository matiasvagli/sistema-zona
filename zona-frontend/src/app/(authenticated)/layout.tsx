"use client";

import { Authenticated } from "@refinedev/core";
import { ThemedLayout } from "@refinedev/antd";
import { Spin, Typography } from "antd";
import { AppTitle } from "@/components/AppTitle";
import { OTNotificationManager } from "@/components/notifications/OTNotificationManager";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Authenticated 
        key="authenticated-layout" 
        loading={
            <div style={{ 
                height: "100vh", 
                display: "flex", 
                flexDirection: "column",
                justifyContent: "center", 
                alignItems: "center",
                background: "#f0f2f5",
                gap: "16px"
            }}>
                <Spin size="large" />
                <Typography.Text type="secondary">Cargando sistema...</Typography.Text>
            </div>
        }
    >
      <ThemedLayout Title={AppTitle} Header={() => null}>
        {children}
        <OTNotificationManager />
      </ThemedLayout>
    </Authenticated>
  );
}
