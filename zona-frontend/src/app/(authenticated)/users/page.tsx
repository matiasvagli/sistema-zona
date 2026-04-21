"use client";

import { List, useTable, EditButton, DeleteButton } from "@refinedev/antd";
import { API_URL as API } from "@/config/api";
import { Table, Space, Tag, Select, message } from "antd";
import { useCustomMutation, useGetIdentity } from "@refinedev/core";

export default function UserList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  const { data: identity } = useGetIdentity<any>();
  const isCeo = identity?.rol === 'ceo';

  const { mutate } = useCustomMutation();

  const handleRoleChange = (userId: number, newRole: string) => {
    mutate({
      url: `${API}/users/${userId}/change_role/`,
      method: "patch",
      values: { rol: newRole },
    }, {
      onSuccess: () => {
        message.success("Rol actualizado con éxito");
        // Forzar recarga de la tabla si fuera necesario, o el provider lo maneja
      },
      onError: (err: any) => {
        message.error(err?.response?.data?.error || "Error al actualizar el rol");
      }
    });
  };

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="username" title="Usuario" />
        <Table.Column dataIndex="first_name" title="Nombre" />
        <Table.Column dataIndex="last_name" title="Apellido" />
        <Table.Column 
            dataIndex="rol" 
            title="Rol" 
            render={(value, record: any) => (
              <Select 
                defaultValue={value || "empleado"} 
                style={{ width: 120 }} 
                onChange={(newRole) => handleRoleChange(record.id, newRole)}
                options={[
                  { value: 'ceo', label: 'CEO', disabled: !isCeo },
                  { value: 'admin', label: 'Admin' },
                  { value: 'empleado', label: 'Empleado' },
                ]}
              />
            )}
        />
        <Table.Column 
            title="Sectores Asignados" 
            render={(_, record: any) => {
              const memberships = record.sector_memberships || [];
              if (memberships.length === 0) return <span style={{ color: "#aaa" }}>Sin sectores</span>;
              return (
                <Space size={[0, 4]} wrap>
                  {memberships.map((m: any) => (
                    <Tag key={m.id} color="purple">{m.sector_name}</Tag>
                  ))}
                </Space>
              );
            }}
        />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
