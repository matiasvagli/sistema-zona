"use client";

import { useLogin } from "@refinedev/core";
import { Button, Checkbox, Form, Input, Layout, Typography, Card } from "antd";
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function Login() {
  const { mutate: login, isLoading } = useLogin();

  const onFinish = (values: any) => {
    login(values);
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      background: "#fff"
    }}>
      {/* Columna Izquierda: Formulario */}
      <div style={{
        flex: "0 0 500px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        padding: "100px 80px 40px 80px",
        zIndex: 2,
        background: "#f8fafc", // Gris pizarra ultra suave (muy pro)
        borderRight: "1px solid #e2e8f0"
      }}>
        <div style={{ marginBottom: 50 }}>
          <img
            src="/logo1.png"
            alt="Zona Urbana"
            style={{ width: "300px", marginBottom: "32px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.05))" }}
          />
          <Title level={1} style={{ margin: 0, color: "#0f172a", fontWeight: 900, letterSpacing: "-1.5px", fontSize: "36px", lineHeight: "1.2" }}>
            Sistema de Gestión.
          </Title>
          <Typography.Text style={{ color: "#64748b", fontSize: "16px", fontWeight: 500, display: "block", marginTop: "8px" }}>
            Ingresa a la plataforma administrativa.
          </Typography.Text>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          size="large"
          style={{ width: "100%" }}
        >
          <Form.Item
            name="username"
            label={<span style={{ fontWeight: 600, color: "#475569", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Usuario</span>}
            rules={[{ required: true, message: "El usuario es obligatorio" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Ej: administrador"
              style={{ borderRadius: 12, height: 52, border: "1px solid #cbd5e1" }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 600, color: "#475569", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Contraseña</span>}
            rules={[{ required: true, message: "La contraseña es obligatoria" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
              placeholder="••••••••"
              style={{ borderRadius: 12, height: 52, border: "1px solid #cbd5e1" }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32, marginBottom: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              block
              style={{ 
                height: 52, 
                borderRadius: 12, 
                background: "#0f172a", 
                border: "none",
                fontSize: "16px",
                fontWeight: 700,
                boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.25)"
              }}
            >
              Iniciar Sesión
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center" }}>
            <Typography.Text type="secondary" style={{ fontSize: "13px" }}>
              ¿Olvidaste tus datos? <span style={{ color: "#0f172a", fontWeight: 600, cursor: "pointer" }}>Contacta a tu administrador</span>
            </Typography.Text>
          </div>
        </Form>

        <div style={{ marginTop: "auto", paddingBottom: 40 }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            background: "#f1f5f9", 
            padding: "8px 12px", 
            borderRadius: "8px",
            marginBottom: "20px",
            width: "fit-content"
          }}>
            <SafetyCertificateOutlined style={{ color: "#10b981", fontSize: "16px" }} />
            <span style={{ color: "#065f46", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Sistema Protegido Anti-Bot
            </span>
          </div>

          <Typography.Text type="secondary" style={{ fontSize: "12px", lineHeight: "1.6", display: "block" }}>
            Desarrollado por <span style={{ fontWeight: 600, color: "#475569" }}>Matias Vagliviello</span> <br />
            Zona Urbana © 2026. Todos los derechos reservados. <br />
            <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "11px" }}>● Acceso restringido - Solo personal autorizado</span>
          </Typography.Text>
        </div>
      </div>

      {/* Columna Derecha: Imagen de Impacto */}
      <div style={{
        flex: 1,
        backgroundImage: "url('/zonanoche.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
        alignItems: "flex-end",
        padding: "80px"
      }}>
        {/* Overlay gradiente para que el texto resalte */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)",
          zIndex: 1
        }} />

        <div style={{ position: "relative", zIndex: 2, color: "#fff" }}>
          <Title style={{ color: "#fff", fontSize: "48px", fontWeight: 900, marginBottom: 16, lineHeight: 1 }}>
            Publicidad que <br /> se hace notar.
          </Title>
          <Typography.Text style={{ color: "rgba(255,255,255,0.8)", fontSize: "18px" }}>
            Panel de control avanzado para la gestión de medios <br /> en vía pública.
          </Typography.Text>
        </div>
      </div>
    </div>
  );
}
