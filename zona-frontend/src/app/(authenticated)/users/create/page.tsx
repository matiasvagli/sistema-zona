"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Checkbox, Row, Col, Card, Typography, Divider, Space } from "antd";
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  IdcardOutlined, 
  AppstoreOutlined, 
  SafetyCertificateOutlined 
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function UserCreate() {
  const { formProps, saveButtonProps } = useForm();

  const { selectProps: sectorSelectProps } = useSelect({
    resource: "sectors",
    optionLabel: "name",
    optionValue: "id",
  });

  return (
    <Create saveButtonProps={saveButtonProps} title="Registrar Nuevo Usuario">
      <Form {...formProps} layout="vertical">
        <Row gutter={24}>
          {/* Columna Izquierda: Credenciales */}
          <Col xs={24} lg={12}>
            <Card 
              title={<Space><LockOutlined /> <Text strong>Credenciales de Acceso</Text></Space>}
              variant="borderless"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '12px', height: '100%' }}
            >
              <Form.Item
                label="Nombre de Usuario"
                name="username"
                rules={[{ required: true, message: "El nombre de usuario es obligatorio" }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="ej: jsmith" />
              </Form.Item>

              <Form.Item
                label="Contraseña"
                name="password"
                rules={[{ required: true, message: "La contraseña es obligatoria" }]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Mínimo 8 caracteres" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[{ type: "email", message: "Ingrese un email válido" }]}
              >
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="usuario@ejemplo.com" />
              </Form.Item>
            </Card>
          </Col>

          {/* Columna Derecha: Perfil y Permisos */}
          <Col xs={24} lg={12}>
            <Card 
              title={<Space><IdcardOutlined /> <Text strong>Perfil y Organización</Text></Space>}
              variant="borderless"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '12px', height: '100%' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Nombre" name="first_name">
                    <Input placeholder="Ej: Juan" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Apellido" name="last_name">
                    <Input placeholder="Ej: Pérez" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item 
                label="Sector Asignado" 
                name="sector"
                help="Los usuarios de sector solo ven su propio pipeline"
              >
                <Select 
                  {...sectorSelectProps} 
                  allowClear 
                  placeholder="Seleccionar sector..." 
                  suffixIcon={<AppstoreOutlined />}
                />
              </Form.Item>

              <Divider style={{ margin: '16px 0' }} />

              <div style={{ 
                background: '#f9f9f9', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #f0f0f0'
              }}>
                <Form.Item 
                  name="is_staff" 
                  valuePropName="checked" 
                  initialValue={false}
                  noStyle
                >
                  <Checkbox>
                    <Space direction="vertical" size={0}>
                      <Text strong><SafetyCertificateOutlined style={{ color: '#1890ff' }} /> Permisos de Administrador</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Permite el acceso total a la gestión de clientes, productos y usuarios.
                      </Text>
                    </Space>
                  </Checkbox>
                </Form.Item>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </Create>
  );
}
