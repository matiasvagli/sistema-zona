"use client";

import { List, useTable, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Tag } from "antd";

export default function UserList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="username" title="Usuario" />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column dataIndex="first_name" title="Nombre" />
        <Table.Column dataIndex="last_name" title="Apellido" />
        <Table.Column 
            dataIndex="sector_name" 
            title="Sector" 
            render={(value) => value ? <Tag color="blue">{value}</Tag> : <Tag>Admin</Tag>}
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
