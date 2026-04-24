"use client";

import { AdminGuard } from "@/components/AdminGuard";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, Row, Col, Card, Typography, Divider, Space, Switch, Table, notification } from "antd";
import { useParams } from "next/navigation";
import { useList } from "@refinedev/core";
import { useState } from "react";
import {
  UserOutlined, LockOutlined, MailOutlined, IdcardOutlined,
  AppstoreOutlined, SafetyCertificateOutlined, TeamOutlined,
} from "@ant-design/icons";
import { axiosInstance } from "@/utils/axios-instance";

const { Text } = Typography;
import { API_URL as API } from "@/config/api";

export default function UserEdit() {
  const { id: userId } = useParams<{ id: string }>();
  const { formProps, saveButtonProps } = useForm();
  const [savingMembership, setSavingMembership] = useState<number | null>(null);

  const { result: sectorsResult } = useList({
    resource: "sectors",
    sorters: [{ field: "order", order: "asc" }],
    pagination: { pageSize: 100 },
  });

  const { query: membershipsQuery } = useList({
    resource: "sector-memberships",
    filters: [{ field: "usuario", operator: "eq", value: Number(userId) }],
    pagination: { pageSize: 100 },
  });
  const refetchMemberships = membershipsQuery.refetch;

  const sectors: any[] = sectorsResult?.data || [];
  const memberships: any[] = membershipsQuery.data?.data || [];
  const membershipMap: Record<number, any> = Object.fromEntries(
    memberships.map((m: any) => [m.sector, m])
  );

  const togglePermission = async (sectorId: number, field: string, value: boolean) => {
    setSavingMembership(sectorId);
    try {
      const existing = membershipMap[sectorId];

      if (!existing) {
        // Crear membresía nueva
        const payload: any = {
          usuario: Number(userId),
          sector: sectorId,
          puede_ver: false,
          puede_editar: false,
          puede_crear: false,
          puede_eliminar: false,
          [field]: value,
        };
        // Activar puede_ver si se activa cualquier otro permiso
        if (value && field !== 'puede_ver') payload.puede_ver = true;
        await axiosInstance.post(`${API}/sector-memberships/`, payload);
      } else {
        const updates: any = { [field]: value };
        // Desactivar puede_ver apaga todo
        if (field === 'puede_ver' && !value) {
          updates.puede_editar = false;
          updates.puede_crear = false;
          updates.puede_eliminar = false;
        }
        // Activar cualquier permiso de escritura activa puede_ver
        if (['puede_editar', 'puede_crear', 'puede_eliminar'].includes(field) && value) {
          updates.puede_ver = true;
        }
        await axiosInstance.patch(`${API}/sector-memberships/${existing.id}/`, updates);
      }

      await refetchMemberships();
    } catch {
      notification.error({ message: "No se pudo actualizar el permiso" });
    } finally {
      setSavingMembership(null);
    }
  };

  const sectorColumns = [
    {
      title: "Sector",
      dataIndex: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Ver",
      width: 70,
      align: "center" as const,
      render: (_: any, sector: any) => {
        const m = membershipMap[sector.id];
        return (
          <Switch
            size="small"
            checked={!!m?.puede_ver}
            loading={savingMembership === sector.id}
            onChange={(v) => togglePermission(sector.id, "puede_ver", v)}
          />
        );
      },
    },
    {
      title: "Editar",
      width: 80,
      align: "center" as const,
      render: (_: any, sector: any) => {
        const m = membershipMap[sector.id];
        return (
          <Switch
            size="small"
            checked={!!m?.puede_editar}
            loading={savingMembership === sector.id}
            onChange={(v) => togglePermission(sector.id, "puede_editar", v)}
          />
        );
      },
    },
    {
      title: "Crear",
      width: 70,
      align: "center" as const,
      render: (_: any, sector: any) => {
        const m = membershipMap[sector.id];
        return (
          <Switch
            size="small"
            checked={!!m?.puede_crear}
            loading={savingMembership === sector.id}
            onChange={(v) => togglePermission(sector.id, "puede_crear", v)}
          />
        );
      },
    },
    {
      title: "Eliminar",
      width: 80,
      align: "center" as const,
      render: (_: any, sector: any) => {
        const m = membershipMap[sector.id];
        return (
          <Switch
            size="small"
            checked={!!m?.puede_eliminar}
            loading={savingMembership === sector.id}
            onChange={(v) => togglePermission(sector.id, "puede_eliminar", v)}
          />
        );
      },
    },
  ];

  return (
    <AdminGuard>
    <>
      <Edit saveButtonProps={saveButtonProps} title="Editar Perfil de Usuario">
        <Form {...formProps} layout="vertical">
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Card
                title={<Space><LockOutlined /> <Text strong>Credenciales y Acceso</Text></Space>}
                variant="borderless"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '12px', height: '100%' }}
              >
                <Form.Item
                  label="Nombre de Usuario"
                  name="username"
                  rules={[{ required: true, message: "El nombre de usuario es obligatorio" }]}
                >
                  <Input prefix={<UserOutlined style={{ color: '#1890ff' }} />} />
                </Form.Item>

                <Form.Item
                  label="Actualizar Contraseña"
                  name="password"
                  help="Dejar en blanco para mantener la contraseña actual"
                >
                  <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nueva contraseña" />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ type: "email", message: "Ingrese un email válido" }]}
                >
                  <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} />
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={<Space><IdcardOutlined /> <Text strong>Información Personal</Text></Space>}
                variant="borderless"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '12px', height: '100%' }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Nombre" name="first_name">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Apellido" name="last_name">
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Sector Primario" name="sector">
                  <Select
                    allowClear
                    placeholder="Seleccionar sector..."
                    suffixIcon={<AppstoreOutlined />}
                    options={sectors.map((s: any) => ({ value: s.id, label: s.name }))}
                  />
                </Form.Item>

                <Divider style={{ margin: '16px 0' }} />

                <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                  <Form.Item name="is_staff" valuePropName="checked" noStyle>
                    <Checkbox>
                      <Space direction="vertical" size={0}>
                        <Text strong><SafetyCertificateOutlined style={{ color: '#1890ff' }} /> Permisos de Administrador</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Define si el usuario tiene acceso total al panel de administración.
                        </Text>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </Edit>

      {/* Sección de permisos por sector — fuera del form principal */}
      <Card
        title={<Space><TeamOutlined /> <Text strong>Permisos por Sector</Text></Space>}
        style={{ marginTop: 24, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        extra={
          <Text type="secondary" style={{ fontSize: 12 }}>
            Los cambios se guardan automáticamente
          </Text>
        }
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
          <b>Ver</b>: puede ver las tareas del sector en el pipeline. &nbsp;
          <b>Editar</b>: puede iniciar/completar/bloquear tareas y poner fechas. &nbsp;
          <b>Crear</b>: puede agregar materiales a las OTs. &nbsp;
          <b>Eliminar</b>: puede eliminar registros del sector.
        </Text>
        <Table
          dataSource={sectors}
          columns={sectorColumns}
          rowKey="id"
          pagination={false}
          size="small"
          loading={!sectorsResult?.data}
        />
      </Card>
    </>
    </AdminGuard>
  );
}
