"use client";

import { List, useTable } from "@refinedev/antd";
import { Table, Tag } from "antd";

export default function AdSpaceList() {
  const { tableProps } = useTable();

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="name" title="Nombre" />
        <Table.Column dataIndex="location_desc" title="Ubicación" />
        <Table.Column dataIndex="dimensions" title="Dimensiones" />
        <Table.Column 
            dataIndex="is_active" 
            title="Estado" 
            render={(value) => <Tag color={value ? "green" : "red"}>{value ? "ACTIVO" : "INACTIVO"}</Tag>} 
        />
      </Table>
    </List>
  );
}
