"use client";

import { AdminGuard } from "@/components/AdminGuard";

import { List, useTable, EditButton, ShowButton, DeleteButton } from "@refinedev/antd";
import { Table, Space } from "antd";

export default function ClientList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  return (
    <AdminGuard>
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="name" title="Nombre" />
        <Table.Column dataIndex="tax_id" title="CUIT" />
        <Table.Column dataIndex="email" title="Email" />
        <Table.Column dataIndex="phone" title="Teléfono" />
        <Table.Column
          title="Acciones"
          dataIndex="actions"
          render={(_, record: any) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
    </AdminGuard>
  );
}
