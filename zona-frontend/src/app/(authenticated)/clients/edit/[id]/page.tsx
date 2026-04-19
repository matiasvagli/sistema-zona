"use client";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Checkbox } from "antd";

export default function ClientEdit() {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Nombre"
          name="name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="CUIT"
          name="tax_id"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Email" name="email">
          <Input />
        </Form.Item>
        <Form.Item label="Teléfono" name="phone">
          <Input />
        </Form.Item>
        <Form.Item label="Dirección" name="address">
          <Input.TextArea />
        </Form.Item>
        <Form.Item label="Notas" name="notes">
          <Input.TextArea />
        </Form.Item>
        <Form.Item name="is_active" valuePropName="checked">
          <Checkbox>Activo</Checkbox>
        </Form.Item>
      </Form>
    </Edit>
  );
}
