import { useState } from 'react';
import { Card, Form, Input, Select, Button, Typography, theme } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { findLoginUser } from '../api/usersApi';
import type { Role } from '../types';

const { Title } = Typography;

interface LoginFormValues {
  email?: string;
  password?: string;
  role: Role;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { token } = theme.useToken();

  const onFinish = (values: LoginFormValues) => {
    setSubmitting(true);
    const matchedUser = findLoginUser(values.email, values.role);
    login(matchedUser.id, matchedUser.name, values.role, values.email || matchedUser.email, matchedUser.avatarUrl);
    navigate('/projects');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: token.colorBgLayout, padding: 16 }}>
      <Card
        style={{ width: 400, maxWidth: '100%', boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)' }}
        styles={{ body: { padding: 32 } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0 }}>Вход в систему</Title>
        </div>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ role: 'Admin' }}>
          <Form.Item label="Email" name="email">
            <Input prefix={<UserOutlined />} placeholder="Введите email (необязательно)" />
          </Form.Item>
          <Form.Item label="Пароль" name="password">
            <Input.Password prefix={<LockOutlined />} placeholder="Введите пароль (необязательно)" />
          </Form.Item>
          <Form.Item label="Роль (для демонстрации)" name="role" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'Viewer', label: 'Viewer' },
                { value: 'Developer', label: 'Developer' },
                { value: 'Admin', label: 'Admin' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
