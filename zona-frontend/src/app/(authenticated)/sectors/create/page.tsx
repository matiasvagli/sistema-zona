"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Checkbox, Card, Row, Col, Space, Typography, Divider, Button } from "antd";
import { 
  AppstoreOutlined, 
  OrderedListOutlined, 
  PlusCircleOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Text, Title } = Typography;

export default function SectorCreate() {
  const { formProps, saveButtonProps } = useForm({
    resource: "sectors",
    redirect: "list"
  });
  const router = useRouter();

  return (
    <AdminGuard>
      <div style={{ padding: "32px", background: "#f1f5f9", minHeight: "100vh" }}>
        
        {/* ── Header Premium ────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #312e81 0%, #4338ca 60%, #6366f1 100%)",
          borderRadius: "20px",
          padding: "32px 40px",
          marginBottom: "32px",
          boxShadow: "0 12px 30px rgba(67, 56, 202, 0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#fff",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "400px", height: "400px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />

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
              <PlusCircleOutlined />
            </div>
            <div>
              <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, letterSpacing: "-1px" }}>
                Nuevo Sector de Producción
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>
                Defina una nueva etapa en la línea de montaje y producción
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
            Volver
          </Button>
        </div>

        <Row justify="center">
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space size={12}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4338ca" }}>
                    <SettingOutlined />
                  </div>
                  <Text strong style={{ fontSize: 16 }}>Configuración del Sector</Text>
                </Space>
              }
              variant="borderless"
              style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}
            >
              <Form {...formProps} layout="vertical">
                <Form.Item
                  label={<Text strong type="secondary">Nombre del Sector</Text>}
                  name="name"
                  rules={[{ required: true, message: "Este campo es obligatorio" }]}
                >
                  <Input 
                    size="large" 
                    prefix={<AppstoreOutlined style={{ color: "#4338ca" }} />} 
                    placeholder="Ej: Impresión UV, Soldadura, etc." 
                    style={{ borderRadius: "10px" }} 
                  />
                </Form.Item>

                <Form.Item
                  label={<Text strong type="secondary">Orden en el Pipeline</Text>}
                  name="order"
                  initialValue={0}
                  help="Controla la posición secuencial en la vista de producción"
                >
                  <InputNumber 
                    size="large" 
                    min={0} 
                    style={{ width: "100%", borderRadius: "10px" }} 
                    prefix={<OrderedListOutlined style={{ color: "#94a3b8" }} />}
                  />
                </Form.Item>

                <Divider />

                <div style={{ 
                  padding: "20px", 
                  background: "#f0fdf4", 
                  borderRadius: "12px", 
                  border: "1px solid #dcfce7" 
                }}>
                  <Form.Item name="is_active" valuePropName="checked" initialValue={true} noStyle>
                    <Checkbox>
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: "14px" }}>
                          <SafetyCertificateOutlined style={{ color: "#16a34a", marginRight: "8px" }} /> 
                          Sector Operativo
                        </Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Permite asignar tareas y personal a este sector inmediatamente.
                        </Text>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                </div>

                <div style={{ marginTop: "32px", textAlign: "right" }}>
                  <Space size={16}>
                    <Button 
                      size="large" 
                      onClick={() => router.back()}
                      style={{ borderRadius: "10px", height: "48px", padding: "0 24px" }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="primary" 
                      size="large" 
                      {...saveButtonProps} 
                      style={{ 
                        height: "48px",
                        padding: "0 40px", 
                        borderRadius: "10px", 
                        fontWeight: 700,
                        background: "#4338ca",
                        border: "none",
                        boxShadow: "0 8px 20px rgba(67, 56, 202, 0.3)"
                      }}
                    >
                      Crear Sector
                    </Button>
                  </Space>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminGuard>
  );
}
