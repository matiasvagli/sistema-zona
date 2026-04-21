"use client";

import { Edit, useForm } from "@refinedev/antd";
import { API_URL as API } from "@/config/api";
import { Form, Input, InputNumber, Checkbox, Table, Button, Space, message, Select, Card } from "antd";
import { useList, useCustomMutation, useCreate, useDelete } from "@refinedev/core";
import { useState } from "react";

export default function SectorEdit({ params }: any) {
  const { formProps, saveButtonProps, id } = useForm();
  const sectorId = id || params?.id;

  const { data: usersData } = useList({ resource: "users" });
  const { data: membershipsData, refetch } = useList({
    resource: "sector-memberships",
    filters: [{ field: "sector", operator: "eq", value: sectorId }],
    queryOptions: { enabled: !!sectorId },
  });

  const { mutate: updateMembership } = useCustomMutation();
  const { mutate: createMembership } = useCreate();
  const { mutate: deleteMembership } = useDelete();

  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  const handleAddUser = () => {
    if (!selectedUser || !sectorId) return;
    createMembership({
      resource: "sector-memberships",
      values: {
        usuario: selectedUser,
        sector: sectorId,
        puede_ver: true,
        puede_crear: false,
        puede_editar: false,
        puede_eliminar: false
      }
    }, {
      onSuccess: () => {
        message.success("Usuario agregado al sector");
        setSelectedUser(null);
        refetch();
      },
      onError: (err) => message.error("Error al agregar usuario: " + err.message)
    });
  };

  const handleUpdatePerm = (membershipId: number, field: string, checked: boolean) => {
    updateMembership({
      url: `${API}/sector-memberships/${membershipId}/`,
      method: "patch",
      values: { [field]: checked },
    }, {
      onSuccess: () => message.success("Permiso actualizado"),
      onError: () => message.error("Error al actualizar permiso")
    });
  };

  const handleRemove = (membershipId: number) => {
    deleteMembership({
      resource: "sector-memberships",
      id: membershipId,
    }, {
      onSuccess: () => {
        message.success("Usuario removido del sector");
        refetch();
      }
    });
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Edit saveButtonProps={saveButtonProps} title="Editar Sector">
        <Form {...formProps} layout="vertical">
          <Form.Item
            label="Nombre del Sector"
            name="name"
            rules={[{ required: true, message: "Por favor ingrese el nombre" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Orden en el Pipeline"
            name="order"
            help="Define la posición de izquierda a derecha en el tablero"
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="is_active" valuePropName="checked">
            <Checkbox>Sector Activo</Checkbox>
          </Form.Item>
        </Form>
      </Edit>

      <Card title="Permisos de Usuarios en este Sector">
        <Space style={{ marginBottom: 16 }}>
          <Select 
            style={{ width: 200 }}
            placeholder="Seleccionar Usuario"
            value={selectedUser}
            onChange={setSelectedUser}
            options={usersData?.data?.map((u: { id: number; username: string }) => ({ value: u.id, label: u.username })) || []}
          />
          <Button type="primary" onClick={handleAddUser} disabled={!selectedUser}>
            Agregar Usuario
          </Button>
        </Space>

        <Table 
          dataSource={membershipsData?.data || []} 
          rowKey="id"
          pagination={false}
        >
          <Table.Column dataIndex="username" title="Usuario" />
          <Table.Column 
            title="Puede Ver" 
            render={(_, record: any) => (
              <Checkbox 
                defaultChecked={record.puede_ver} 
                onChange={(e) => handleUpdatePerm(record.id, 'puede_ver', e.target.checked)} 
              />
            )} 
          />
          <Table.Column 
            title="Puede Crear" 
            render={(_, record: any) => (
              <Checkbox 
                defaultChecked={record.puede_crear} 
                onChange={(e) => handleUpdatePerm(record.id, 'puede_crear', e.target.checked)} 
              />
            )} 
          />
          <Table.Column 
            title="Puede Editar" 
            render={(_, record: any) => (
              <Checkbox 
                defaultChecked={record.puede_editar} 
                onChange={(e) => handleUpdatePerm(record.id, 'puede_editar', e.target.checked)} 
              />
            )} 
          />
          <Table.Column 
            title="Puede Eliminar" 
            render={(_, record: any) => (
              <Checkbox 
                defaultChecked={record.puede_eliminar} 
                onChange={(e) => handleUpdatePerm(record.id, 'puede_eliminar', e.target.checked)} 
              />
            )} 
          />
          <Table.Column 
            title="Acciones" 
            render={(_, record: any) => (
              <Button danger size="small" onClick={() => handleRemove(record.id)}>
                Quitar
              </Button>
            )} 
          />
        </Table>
      </Card>
    </Space>
  );
}
