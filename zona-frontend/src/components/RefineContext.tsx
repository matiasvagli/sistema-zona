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

const API_URL = "http://localhost:8000/api/v1";

export const RefineContext = ({ children }: { children: React.ReactNode }) => {
    return (
        <RefineKbarProvider>
            <ConfigProvider
                theme={{
                    algorithm: theme.defaultAlgorithm, // Cambiamos a default para evitar confusión de pantalla negra
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
                                const permissions = await authProvider.getPermissions();
                                
                                // Si es staff, puede hacer todo
                                if (permissions?.is_staff) {
                                    return { can: true };
                                }

                                // Si no es staff, solo puede ver 'pipeline'
                                if (resource === "pipeline" || resource === "dashboard") {
                                    return { can: true };
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
