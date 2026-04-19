"use client";

import { List, useTable, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Tag } from "antd";

export default function ProductList() {
  const { tableProps } = useTable();

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="name" title="Producto" />
        <Table.Column dataIndex="unit" title="Unidad" />
        <Table.Column 
            dataIndex="stock_qty" 
            title="Stock" 
            render={(value, record: any) => (
                <Tag color={value <= record.alert_qty ? "red" : "green"}>
                    {value}
                </Tag>
            )}
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
