"use client";

import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { useNotificationProvider, ThemedLayout, ErrorComponent } from "@refinedev/antd";
import routerProvider from "@refinedev/nextjs-router";
import { App as AntdApp, ConfigProvider, theme, Typography } from "antd";
import "@refinedev/antd/dist/reset.css";

import { authProvider } from "@/providers/authProvider";
import { dataProvider } from "@/providers/dataProvider";
import { axiosInstance } from "@/utils/axios-instance";

import { API_URL } from "@/config/api";
//cambio de color del panel latera del dashboard para que se note
export const RefineContext = ({ children }: { children: React.ReactNode }) => {
    return (
        <RefineKbarProvider>
            <ConfigProvider
                theme={{
                    algorithm: theme.defaultAlgorithm,
                    token: {
                        colorPrimary: "#1677ff",
                    },
                }}
            >
                <AntdApp>
                    <Refine
                        dataProvider={dataProvider}
                        authProvider={authProvider}
                        routerProvider={routerProvider}
                        accessControlProvider={{
                            can: async ({ resource, action }) => {
                                const user = (authProvider.getIdentity ? await authProvider.getIdentity() : null) as any;
                                const rol = user?.rol || 'empleado';
                                const isAdmin = rol === 'ceo' || rol === 'admin' || user?.is_staff;

                                if (user?.is_superuser || isAdmin) {
                                    return { can: true };
                                }

                                // Empleados: SOLO Dashboard, OTs, Pipeline, Sectores y Tareas (solo lectura)
                                if (rol === 'empleado') {
                                    if (["create", "edit", "delete"].includes(action)) {
                                        return { can: false };
                                    }
                                    const allowedForEmpleado = ["dashboard", "work-orders", "pipeline", "sectors", "sector-tasks"];
                                    if (allowedForEmpleado.includes(resource || "")) {
                                        return { can: true };
                                    }
                                }

                                return {
                                    can: false,
                                    reason: "No tienes permisos para acceder a este recurso",
                                };
                            },
                        }}
                        notificationProvider={useNotificationProvider}
                        resources={[
                            {
                                name: "dashboard",
                                list: "/",
                                meta: { label: "Dashboard" },
                            },
                            {
                                name: "clients",
                                list: "/clients",
                                create: "/clients/create",
                                edit: "/clients/edit/:id",
                                show: "/clients/show/:id",
                                meta: { label: "Clientes" },
                            },
                            {
                                name: "products",
                                list: "/products",
                                meta: { label: "Inventario" },
                            },
                            {
                                name: "work-orders",
                                list: "/work-orders",
                                create: "/work-orders/create",
                                edit: "/work-orders/edit/:id",
                                show: "/work-orders/:id",
                                meta: { label: "Órdenes de Trabajo" },
                            },
                            {
                                name: "budgets",
                                list: "/budgets",
                                create: "/budgets/create",
                                show: "/budgets/:id",
                                meta: { label: "Presupuestos" },
                            },
                            {
                                name: "budget-items",
                                meta: { hide: true },
                            },
                            {
                                name: "pipeline",
                                list: "/pipeline",
                                meta: { label: "Pipeline" },
                            },
                            {
                                name: "sectors",
                                list: "/sectors",
                                create: "/sectors/create",
                                edit: "/sectors/edit/:id",
                                meta: { label: "Sectores" },
                            },
                            {
                                name: "ad-spaces",
                                list: "/ad-spaces",
                                meta: { label: "Espacios Viales" },
                            },
                            {
                                name: "campaigns",
                                list: "/campaigns",
                                meta: { label: "Campañas" },
                            },
                            {
                                name: "users",
                                list: "/users",
                                create: "/users/create",
                                edit: "/users/edit/:id",
                                meta: { label: "Usuarios" },
                            },
                        ]}
                        options={{
                            syncWithLocation: true,
                            warnWhenUnsavedChanges: true,
                        }}
                    >
                        {children}
                        <RefineKbar />
                    </Refine>
                </AntdApp>
            </ConfigProvider>
        </RefineKbarProvider>
    );
};
