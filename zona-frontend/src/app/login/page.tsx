"use client";

import { useLogin } from "@refinedev/core";
import { Button, Checkbox, Form, Input, Layout, Typography, Card } from "antd";

const { Title } = Typography;

export default function Login() {
  const { mutate: login, isLoading } = useLogin();

  const onFinish = (values: any) => {
    login(values);
  };

  return (
    <Layout
      style={{
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
      }}
    >
      <Card style={{ width: 400, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2}>Zona - Gestión</Title>
          <Typography.Text type="secondary">Inicia sesión para continuar</Typography.Text>
        </div>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Por favor ingresa tu usuario" }]}
          >
            <Input size="large" placeholder="Usuario" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Por favor ingresa tu contraseña" }]}
          >
            <Input.Password size="large" placeholder="Contraseña" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              size="large"
              style={{ borderRadius: 6 }}
            >
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Layout>
  );
}
