"use client";

import React, { useEffect, useState } from "react";
import { Alert, Button } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useGetIdentity } from "@refinedev/core";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";
import { useRouter } from "next/navigation";

export const PendingReservationsBanner: React.FC = () => {
    const router = useRouter();
    const { data: user } = useGetIdentity<any>();
    const [count, setCount] = useState(0);
    const [dismissed, setDismissed] = useState(false);

    const isAdmin = !!(user?.is_staff || user?.rol === "admin" || user?.rol === "ceo");

    useEffect(() => {
        if (!isAdmin) return;
        const fetch = async () => {
            try {
                const { data } = await axiosInstance.get(`${API}/material-reservations/?status=pendiente`);
                const total = Array.isArray(data) ? data.length : (data.count ?? (data.results?.length ?? 0));
                setCount(total);
                if (total > 0) setDismissed(false);
            } catch {
                // silently fail
            }
        };
        fetch();
        const interval = setInterval(fetch, 60000);
        return () => clearInterval(interval);
    }, [isAdmin]);

    if (!isAdmin || count === 0 || dismissed) return null;

    return (
        <div style={{ padding: "12px 24px 0" }}>
            <Alert
                icon={<InboxOutlined />}
                showIcon
                type="warning"
                message={
                    <span style={{ fontWeight: 600 }}>
                        {count === 1
                            ? "Tenés 1 reserva de material pendiente de aprobación"
                            : `Tenés ${count} reservas de materiales pendientes de aprobación`}
                    </span>
                }
                action={
                    <Button
                        size="small"
                        type="primary"
                        danger
                        onClick={() => router.push("/products")}
                        style={{ borderRadius: 6, marginRight: 8 }}
                    >
                        Ver ahora
                    </Button>
                }
                closable
                onClose={() => setDismissed(true)}
                style={{ borderRadius: 10 }}
            />
        </div>
    );
};
