"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, Row, Col, Card, Typography, Divider, Space, Button } from "antd";
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  IdcardOutlined, 
  AppstoreOutlined, 
  SafetyCertificateOutlined,
  UserAddOutlined,
  ArrowLeftOutlined,
  KeyOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function UserCreate() {
  const { formProps, saveButtonProps } = useForm({
    resource: "users",
    redirect: "list"
  });
  const router = useRouter();

  const { selectProps: sectorSelectProps } = useSelect({
    resource: "sectors",
    optionLabel: "name",
    optionValue: "id",
  });

  return (
    <AdminGuard>
      <div style={{ padding: "32px", background: "#f1f5f9", minHeight: "100vh" }}>
        
        {/* ── Header Premium ────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
          borderRadius: "20px",
          padding: "32px 40px",
          marginBottom: "32px",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decoración abstracta */}
          <div style={{ position: "absolute", top: "-20%", right: "-5%", width: "300px", height: "300px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />

          <Space size={24}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              border: "1px solid rgba(255,255,255,0.2)"
            }}>
              <UserAddOutlined />
            </div>
            <div>
              <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, letterSpacing: "-1px" }}>
                Nuevo Usuario del Sistema
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px" }}>
                Cree una nueva cuenta de acceso y defina sus privilegios iniciales
              </Text>
            </div>
          </Space>

          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.back()}
            style={{ 
              borderRadius: "12px", 
              height: "44px", 
              padding: "0 24px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              fontWeight: 600
            }}
          >
            Volver al listado
          </Button>
        </div>

        <Form {...formProps} layout="vertical">
          <Row gutter={[32, 32]}>
            {/* Columna Izquierda: Credenciales */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space size={12}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#334155" }}>
                      <LockOutlined />
                    </div>
                    <Text strong style={{ fontSize: 16 }}>Seguridad y Acceso</Text>
                  </Space>
                }
                variant="borderless"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", height: "100%" }}
              >
                <Form.Item
                  label={<Text strong type="secondary">Nombre de Usuario (ID)</Text>}
                  name="username"
                  rules={[{ required: true, message: "Este campo es obligatorio" }]}
                >
                  <Input size="large" prefix={<UserOutlined style={{ color: "#64748b" }} />} placeholder="ej: martinp" style={{ borderRadius: "10px" }} />
                </Form.Item>

                <Form.Item
                  label={<Text strong type="secondary">Contraseña Temporal</Text>}
                  name="password"
                  rules={[{ required: true, message: "La contraseña es obligatoria" }]}
                >
                  <Input.Password size="large" prefix={<KeyOutlined style={{ color: "#64748b" }} />} placeholder="Mínimo 8 caracteres" style={{ borderRadius: "10px" }} />
                </Form.Item>

                <Form.Item
                  label={<Text strong type="secondary">Correo Institucional</Text>}
                  name="email"
                  rules={[{ type: "email", message: "Ingrese un correo válido" }]}
                >
                  <Input size="large" prefix={<MailOutlined style={{ color: "#64748b" }} />} placeholder="usuario@sistema-zona.com" style={{ borderRadius: "10px" }} />
                </Form.Item>
              </Card>
            </Col>

            {/* Columna Derecha: Perfil */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space size={12}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea5e9" }}>
                      <IdcardOutlined />
                    </div>
                    <Text strong style={{ fontSize: 16 }}>Perfil y Organización</Text>
                  </Space>
                }
                variant="borderless"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", height: "100%" }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<Text strong type="secondary">Nombre</Text>} name="first_name">
                      <Input size="large" style={{ borderRadius: "10px" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<Text strong type="secondary">Apellido</Text>} name="last_name">
                      <Input size="large" style={{ borderRadius: "10px" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item 
                  label={<Text strong type="secondary">Asignación de Sector</Text>} 
                  name="sector"
                  help="El sector define qué pipeline verá el usuario por defecto"
                >
                  <Select 
                    {...sectorSelectProps} 
                    size="large"
                    allowClear 
                    placeholder="Seleccione un sector..." 
                    style={{ borderRadius: "10px" }}
                    suffixIcon={<AppstoreOutlined />}
                  />
                </Form.Item>

                <Divider />

                <div style={{ 
                  padding: "20px", 
                  background: "#f8fafc", 
                  borderRadius: "12px", 
                  border: "1px solid #e2e8f0" 
                }}>
                  <Form.Item 
                    name="is_staff" 
                    valuePropName="checked" 
                    initialValue={false}
                    noStyle
                  >
                    <Checkbox>
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: "14px" }}>
                          <SafetyCertificateOutlined style={{ color: "#334155", marginRight: "8px" }} /> 
                          Privilegios de Administrador
                        </Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Habilita el acceso a configuraciones globales y gestión de personal.
                        </Text>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                </div>
              </Card>
            </Col>
          </Row>

          <div style={{ 
            marginTop: "32px", 
            display: "flex", 
            justifyContent: "flex-end",
            gap: "16px"
          }}>
            <Button 
              size="large" 
              onClick={() => router.back()}
              style={{ borderRadius: "12px", height: "50px", padding: "0 32px" }}
            >
              Cancelar
            </Button>
            <Button 
              type="primary" 
              size="large" 
              {...saveButtonProps} 
              style={{ 
                height: "50px",
                padding: "0 48px", 
                borderRadius: "12px", 
                fontWeight: 700,
                fontSize: "16px",
                background: "#1e293b",
                border: "none",
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.3)"
              }}
            >
              Crear Usuario
            </Button>
          </div>
        </Form>
      </div>
    </AdminGuard>
  );
}
