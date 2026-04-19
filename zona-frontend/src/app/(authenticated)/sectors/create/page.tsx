"use client";

import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber } from "antd";

export default function SectorCreate() {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Nombre del Sector"
          name="name"
          rules={[{ required: true }]}
        >
          <Input placeholder="Ej: Impresión, Corte, Armado..." />
        </Form.Item>
        <Form.Item
          label="Orden (posición en el pipeline)"
          name="order"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Create>
  );
}
