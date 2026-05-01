"use client";

import React, { useState } from "react";
import { Select, Button, Divider, Space, Modal, Form, Input, notification, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { axiosInstance } from "@/utils/axios-instance";
import { API_URL as API } from "@/config/api";

interface ClientSelectProps {
  value?: any;
  onChange?: (val: any) => void;
  style?: React.CSSProperties;
  size?: "small" | "middle" | "large";
}

export function ClientSelect({ value, onChange, style, size }: ClientSelectProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const { result: clientsResult, query: clientsQuery } = useList({
    resource: "clients",
    pagination: { pageSize: 100 },
  });

  const clients: any[] = clientsResult?.data || [];

  const handleCreate = async (values: any) => {
    setLoading(true);
    try {
      const { data: newClient } = await axiosInstance.post(`${API}/clients/`, values);
      notification.success({ message: "Cliente creado correctamente" });
      setModalOpen(false);
      form.resetFields();
      
      await clientsQuery.refetch();
      
      if (onChange) {
        onChange(newClient.id);
      }
    } catch (error) {
      notification.error({ message: "Error al crear cliente" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Select
        size={size}
        style={style}
        placeholder="Seleccionar cliente"
        allowClear
        showSearch
        value={value}
        onChange={onChange}
        filterOption={(input, option) =>
          String(option?.children || "").toLowerCase().includes(input.toLowerCase())
        }
        notFoundContent={clientsQuery.isLoading ? <Spin size="small" /> : "No data"}
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: "8px 0" }} />
            <Space style={{ padding: "0 8px 4px" }}>
              <Button type="text" icon={<PlusOutlined />} onClick={(e) => { e.preventDefault(); setModalOpen(true); }}>
                Agregar cliente
              </Button>
            </Space>
          </>
        )}
      >
        {clients.map((c) => (
          <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
        ))}
      </Select>

      <Modal
        title="Nuevo Cliente"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Crear"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Razón Social / Nombre" rules={[{ required: true, message: "Requerido" }]}>
            <Input placeholder="Ej: Empresa S.A. o Juan Pérez" />
          </Form.Item>
          <Form.Item name="tax_id" label="CUIT / Identificación Fiscal (opcional)">
            <Input placeholder="20-XXXXXXXX-X" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: "email", message: "Email inválido" }]}>
            <Input placeholder="ejemplo@correo.com" />
          </Form.Item>
          <Form.Item name="phone" label="Teléfono">
            <Input placeholder="+54 9 11 1234-5678" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
