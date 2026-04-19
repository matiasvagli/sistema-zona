"use client";

import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Checkbox, Row, Col, Card, Typography, Space, Divider } from "antd";
import { 
  UserOutlined, 
  IdcardOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined, 
  FileTextOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";

const { Text } = Typography;

export default function ClientCreate() {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps} title="Registrar Nuevo Cliente">
      <Form {...formProps} layout="vertical">
        <Row gutter={24}>
          {/* Columna Izquierda: Información Principal */}
          <Col xs={24} lg={12}>
            <Card 
              title={<Space><IdcardOutlined /> <Text strong>Información Identificativa</Text></Space>}
              variant="borderless"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '12px', height: '100%' }}
            >
              <Form.Item
                label="Nombre / Razón Social"
                name="name"
                rules={[{ required: true, message: "El nombre es obligatorio" }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Ej: Juan Pérez o Empresa S.A." />
              </Form.Item>

              <Form.Item
                label="CUIT / Identificación Fiscal"
                name="tax_id"
                rules={[{ required: true, message: "El CUIT es obligatorio" }]}
              >
                <Input prefix={<IdcardOutlined style={{ color: '#bfbfbf' }} />} placeholder="20-XXXXXXXX-X" />
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />

              <div style={{ 
                background: '#f6ffed', 
                padding: '12px 16px', 
                borderRadius: '8px',
                border: '1px solid #b7eb8f'
              }}>
                <Form.Item name="is_active" valuePropName="checked" initialValue={true} noStyle>
                  <Checkbox>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text strong>Cliente Activo</Text>
                    </Space>
                  </Checkbox>
                </Form.Item>
              </div>
            </Card>
          </Col>

          {/* Columna Derecha: Contacto y Ubicación */}
          <Col xs={24} lg={12}>
            <Card 
              title={<Space><PhoneOutlined /> <Text strong>Contacto y Ubicación</Text></Space>}
              variant="borderless"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '12px', height: '100%' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Email de Contacto" name="email" rules={[{ type: 'email', message: 'Email inválido' }]}>
                    <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="ejemplo@correo.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Teléfono / WhatsApp" name="phone">
                    <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="+54 9 ..." />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Dirección Comercial" name="address">
                <Input.TextArea 
                  rows={2} 
                  prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />} 
                  placeholder="Calle, Número, Localidad..." 
                />
              </Form.Item>

              <Form.Item label="Notas Adicionales" name="notes">
                <Input.TextArea 
                  rows={2} 
                  prefix={<FileTextOutlined style={{ color: '#bfbfbf' }} />} 
                  placeholder="Observaciones internas sobre el cliente..." 
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </Create>
  );
}
