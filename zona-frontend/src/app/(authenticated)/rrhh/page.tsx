"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useList } from "@refinedev/core";
import {
  Typography, Table, Tag, Button, Input, Space, Avatar, Spin, Empty, Tooltip,
} from "antd";
import {
  UserOutlined, SearchOutlined, PlusOutlined, EyeOutlined, TeamOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function RRHHPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { result, query } = useList({
    resource: "employees",
    pagination: { pageSize: 200 },
    sorters: [{ field: "last_name", order: "asc" }],
  });

  const allData: any[] = result?.data || [];

  const data = useMemo(() => {
    if (!search.trim()) return allData;
    const q = search.toLowerCase();
    return allData.filter((e) =>
      e.first_name?.toLowerCase().includes(q) ||
      e.last_name?.toLowerCase().includes(q) ||
      e.legajo?.toLowerCase().includes(q) ||
      e.dni?.toLowerCase().includes(q)
    );
  }, [allData, search]);

  const columns = [
    {
      title: "Legajo",
      dataIndex: "legajo",
      width: 90,
      render: (legajo: string) => <Tag color="blue">{legajo}</Tag>,
    },
    {
      title: "Empleado",
      render: (_: any, r: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ background: "#e0f2fe", color: "#0369a1" }} />
          <div>
            <Text strong>{r.last_name}, {r.first_name}</Text>
            {r.username && <Text type="secondary" style={{ display: "block", fontSize: 12 }}>{r.username}</Text>}
          </div>
        </Space>
      ),
    },
    {
      title: "DNI",
      dataIndex: "dni",
      width: 110,
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "Sector",
      dataIndex: "sector_name",
      width: 130,
      render: (v: string) => v ? <Tag>{v}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: "Teléfono",
      dataIndex: "phone",
      width: 130,
      render: (v: string) => v || <Text type="secondary">—</Text>,
    },
    {
      title: "Ingreso",
      dataIndex: "fecha_ingreso",
      width: 100,
      render: (v: string) => v ? dayjs(v).format("DD/MM/YYYY") : <Text type="secondary">—</Text>,
    },
    {
      title: "Estado",
      dataIndex: "is_active",
      width: 90,
      render: (v: boolean) => <Tag color={v ? "success" : "default"}>{v ? "Activo" : "Inactivo"}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_: any, r: any) => (
        <Button type="text" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); router.push(`/rrhh/${r.id}`); }} />
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined style={{ marginRight: 10, color: "#0891b2" }} />
            Recursos Humanos
          </Title>
          <Text type="secondary">Gestión de empleados y legajos</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => router.push("/rrhh/create")}>
          Nuevo Empleado
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Buscar por nombre, legajo o DNI..."
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 320 }}
        />
      </div>

      {query.isLoading ? (
        <div style={{ textAlign: "center", padding: 80 }}><Spin size="large" /></div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20, showSizeChanger: false }}
            locale={{ emptyText: <Empty description="Sin empleados" /> }}
            onRow={(r) => ({ onClick: () => router.push(`/rrhh/${r.id}`), style: { cursor: "pointer" } })}
          />
        </div>
      )}
    </div>
  );
}
