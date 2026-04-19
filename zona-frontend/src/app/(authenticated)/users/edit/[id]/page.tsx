"use client";

import { Edit, useForm, useSelect } from "@refinedev/antd";
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

export default function UserEdit() {
  const { formProps, saveButtonProps } = useForm();

  const { selectProps: sectorSelectProps } = useSelect({
    resource: "sectors",
    optionLabel: "name",
    optionValue: "id",
  });

  return (
    <Edit saveButtonProps={saveButtonProps} title="Editar Perfil de Usuario">
      <Form {...formProps} layout="vertical">
        <Row gutter={24}>
          {/* Columna Izquierda: Credenciales */}
          <Col xs={24} lg={12}>
            <Card 
              title={<Space><LockOutlined /> <Text strong>Credenciales y Acceso</Text></Space>}
              variant="borderless"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '12px', height: '100%' }}
            >
              <Form.Item
                label="Nombre de Usuario"
                name="username"
                rules={[{ required: true, message: "El nombre de usuario es obligatorio" }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#1890ff' }} />} />
              </Form.Item>

              <Form.Item
                label="Actualizar Contraseña"
                name="password"
                help="Dejar en blanco para mantener la contraseña actual"
              >
                <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Nueva contraseña" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[{ type: "email", message: "Ingrese un email válido" }]}
              >
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} />
              </Form.Item>
            </Card>
          </Col>

          {/* Columna Derecha: Perfil y Permisos */}
          <Col xs={24} lg={12}>
            <Card 
              title={<Space><IdcardOutlined /> <Text strong>Información Personal</Text></Space>}
              variant="borderless"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '12px', height: '100%' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="Nombre" name="first_name">
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Apellido" name="last_name">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item 
                label="Sector Asignado" 
                name="sector"
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
                  noStyle
                >
                  <Checkbox>
                    <Space direction="vertical" size={0}>
                      <Text strong><SafetyCertificateOutlined style={{ color: '#1890ff' }} /> Permisos de Administrador</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Define si el usuario tiene acceso total al panel de administración.
                      </Text>
                    </Space>
                  </Checkbox>
                </Form.Item>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </Edit>
  );
}
