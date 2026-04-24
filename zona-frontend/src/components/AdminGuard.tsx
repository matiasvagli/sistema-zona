"use client";

import { useGetIdentity } from "@refinedev/core";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spin } from "antd";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: user, isLoading } = useGetIdentity<any>();

  const isAdmin = !!(user?.is_staff || user?.is_superuser || user?.rol === "admin" || user?.rol === "ceo");

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      router.replace("/");
    }
  }, [isLoading, user, isAdmin, router]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return <>{children}</>;
}
