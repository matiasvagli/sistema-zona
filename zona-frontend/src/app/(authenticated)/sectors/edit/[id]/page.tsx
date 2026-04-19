"use client";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Checkbox } from "antd";

export default function SectorEdit() {
  const { formProps, saveButtonProps } = useForm();

  return (
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
  );
}
