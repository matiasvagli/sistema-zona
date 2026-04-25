"use client";

import { AdminGuard } from "@/components/AdminGuard";
import { useForm } from "@refinedev/antd";
import { Form, Input, Checkbox, Row, Col, Card, Typography, Space, Divider, Button } from "antd";
import { 
  UserOutlined, 
  IdcardOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  PlusCircleOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  EditOutlined
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";

const { Text, Title } = Typography;

export default function ClientEdit() {
  const { id } = useParams<{ id: string }>();
  const { formProps, saveButtonProps } = useForm({
    resource: "clients",
    id: id,
    redirect: "list"
  });
  const router = useRouter();

  return (
    <AdminGuard>
      <div style={{ padding: "32px", background: "#f1f5f9", minHeight: "100vh" }}>
        
        {/* ── Header Premium ────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)",
          borderRadius: "20px",
          padding: "32px 40px",
          marginBottom: "32px",
          boxShadow: "0 12px 30px rgba(49, 46, 129, 0.2)",
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
              <EditOutlined />
            </div>
            <div>
              <Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 800, letterSpacing: "-1px" }}>
                Editar Expediente de Cliente
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px" }}>
                Actualice los datos comerciales e información de contacto
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
            {/* Columna Izquierda: Identificación */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space size={12}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfeff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0891b2" }}>
                      <SolutionOutlined />
                    </div>
                    <Text strong style={{ fontSize: 16 }}>Identificación Fiscal</Text>
                  </Space>
                }
                variant="borderless"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", height: "100%" }}
              >
                <Form.Item
                  label={<Text strong type="secondary">Nombre / Razón Social</Text>}
                  name="name"
                  rules={[{ required: true, message: "Este campo es obligatorio" }]}
                >
                  <Input size="large" prefix={<UserOutlined style={{ color: "#0891b2" }} />} style={{ borderRadius: "10px" }} />
                </Form.Item>

                <Form.Item
                  label={<Text strong type="secondary">CUIT / Identificación</Text>}
                  name="tax_id"
                  rules={[{ required: true, message: "El CUIT es obligatorio para facturación" }]}
                >
                  <Input size="large" prefix={<IdcardOutlined style={{ color: "#0891b2" }} />} style={{ borderRadius: "10px" }} />
                </Form.Item>

                <Divider />

                <div style={{ 
                  padding: "20px", 
                  background: "#f0fdf4", 
                  borderRadius: "12px", 
                  border: "1px solid #dcfce7" 
                }}>
                  <Form.Item name="is_active" valuePropName="checked" noStyle>
                    <Checkbox>
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: "14px" }}>
                          <SafetyCertificateOutlined style={{ color: "#16a34a", marginRight: "8px" }} /> 
                          Estado de Cliente: Activo
                        </Text>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Define si el cliente puede recibir nuevos presupuestos.
                        </Text>
                      </Space>
                    </Checkbox>
                  </Form.Item>
                </div>
              </Card>
            </Col>

            {/* Columna Derecha: Contacto y Ubicación */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space size={12}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
                      <PhoneOutlined />
                    </div>
                    <Text strong style={{ fontSize: 16 }}>Canales de Comunicación</Text>
                  </Space>
                }
                variant="borderless"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", height: "100%" }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label={<Text strong type="secondary">Email Corporativo</Text>} name="email">
                      <Input size="large" prefix={<MailOutlined style={{ color: "#94a3b8" }} />} placeholder="correo@empresa.com" style={{ borderRadius: "10px" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={<Text strong type="secondary">Teléfono</Text>} name="phone">
                      <Input size="large" prefix={<PhoneOutlined style={{ color: "#94a3b8" }} />} placeholder="+54 9 ..." style={{ borderRadius: "10px" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label={<Text strong type="secondary">Dirección Comercial</Text>} name="address">
                  <Input.TextArea rows={3} placeholder="Sede central, oficinas o punto de entrega..." style={{ borderRadius: "10px", padding: "12px" }} />
                </Form.Item>

                <Form.Item label={<Text strong type="secondary">Observaciones Internas</Text>} name="notes">
                  <Input.TextArea rows={2} placeholder="Notas sobre facturación, plazos o convenios..." style={{ borderRadius: "10px", padding: "12px" }} />
                </Form.Item>
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
                background: "#312e81",
                border: "none",
                boxShadow: "0 8px 20px rgba(49, 46, 129, 0.3)"
              }}
            >
              Actualizar Cliente
            </Button>
          </div>
        </Form>
      </div>
    </AdminGuard>
  );
}
