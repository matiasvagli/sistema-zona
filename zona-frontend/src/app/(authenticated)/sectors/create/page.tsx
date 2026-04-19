"use client";

import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Checkbox, Card, Row, Col, Space, Typography, Divider } from "antd";
import { 
  AppstoreOutlined, 
  OrderedListOutlined, 
  CheckCircleOutlined 
} from "@ant-design/icons";

const { Text } = Typography;

export default function SectorCreate() {
  const { formProps, saveButtonProps } = useForm();

  return (
    <Create saveButtonProps={saveButtonProps} title="Registrar Nuevo Sector de Producción">
      <Row justify="center">
        <Col xs={24} md={16} lg={12}>
          <Card 
            variant="borderless" 
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderRadius: '12px' }}
          >
            <Form {...formProps} layout="vertical">
              <Form.Item
                label="Nombre del Sector"
                name="name"
                rules={[{ required: true, message: "El nombre es obligatorio" }]}
              >
                <Input 
                  prefix={<AppstoreOutlined style={{ color: '#bfbfbf' }} />} 
                  placeholder="Ej: Herrería, Impresión, Armado..." 
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Orden en el Tablero (Pipeline)"
                name="order"
                initialValue={0}
                help="Define en qué posición aparecerá este sector en el pipeline"
              >
                <InputNumber 
                  prefix={<OrderedListOutlined style={{ color: '#bfbfbf' }} />}
                  min={0} 
                  style={{ width: "100%" }} 
                  size="large"
                />
              </Form.Item>

              <Divider />

              <div style={{ 
                background: '#f6ffed', 
                padding: '16px', 
                borderRadius: '8px',
                border: '1px solid #b7eb8f'
              }}>
                <Form.Item name="is_active" valuePropName="checked" initialValue={true} noStyle>
                  <Checkbox>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text strong>Sector Operativo</Text>
                    </Space>
                  </Checkbox>
                </Form.Item>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </Create>
  );
}
