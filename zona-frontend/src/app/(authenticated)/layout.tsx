"use client";

import { Authenticated } from "@refinedev/core";
import { ThemedLayout } from "@refinedev/antd";
import { Spin, Typography } from "antd";
import { AppTitle } from "@/components/AppTitle";
import { OTNotificationManager } from "@/components/notifications/OTNotificationManager";
import { PendingReservationsBanner } from "@/components/notifications/PendingReservationsBanner";
import { NotificationToast } from "@/components/notifications/NotificationToast";

import { usePathname } from "next/navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPrintView = pathname?.endsWith("/remito");

  if (isPrintView) {
    return (
      <Authenticated 
        key="print-layout" 
        loading={<Spin size="large" />}
      >
        {children}
      </Authenticated>
    );
  }

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
        <PendingReservationsBanner />
        {children}
        <OTNotificationManager />
        <NotificationToast />
      </ThemedLayout>
    </Authenticated>
  );
}
