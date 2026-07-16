import { useState } from 'react';
import { Card, Form, Input, Button, Typography, theme, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { authApi } from '../api/authApi';

const { Title } = Typography;

interface LoginFormValues {
  login?: string;
  password?: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const { token } = theme.useToken();

  const onFinish = async (values: LoginFormValues) => {
    if (!values.login || !values.password) {
      message.error('Логин и пароль обязательны');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authApi.login({ login: values.login, password: values.password });
      localStorage.setItem('auth_token', res.access_token);
      
      const tokenStr = res.access_token.split('.')[1];
      const payload = JSON.parse(atob(tokenStr));
      
      const roleMapped = payload.role === 'ADMIN' ? 'Admin' : payload.role === 'DEVELOPER' ? 'Developer' : 'Viewer';
      
      login(payload.sub, values.login, roleMapped, values.login);
      message.success('Вход выполнен успешно!');
      navigate('/projects');
    } catch (e: any) {
      message.error(e.message || 'Ошибка входа. Проверьте логин и пароль.');
    } finally {
      setSubmitting(false);
    }
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
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Логин" name="login" rules={[{ required: true, message: 'Пожалуйста, введите логин' }]}>
            <Input prefix={<UserOutlined />} placeholder="Введите логин (например, admin)" />
          </Form.Item>
          <Form.Item label="Пароль" name="password" rules={[{ required: true, message: 'Пожалуйста, введите пароль' }, { min: 6, message: 'Пароль должен содержать минимум 6 символов' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Введите пароль (например, admin123)" />
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
