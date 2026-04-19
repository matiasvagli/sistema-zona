"use client";

import { List, useTable, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Space } from "antd";

export default function SectorList() {
  const { tableProps } = useTable({
    syncWithLocation: true,
  });

  return (
    <List title="Gestión de Sectores">
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="name" title="Nombre del Sector" />
        <Table.Column dataIndex="order" title="Orden en Pipeline" />
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
