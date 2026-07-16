import { Typography, Card, Divider, Switch, Button, Avatar, Space, Tag, Upload, message } from 'antd';
import { UserOutlined, LogoutOutlined, CameraOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { updateUserAvatar } from '../api/usersApi';
import { useThemeMode } from '../theme/ThemeContext';
import type { Role } from '../types';

const { Title, Text } = Typography;

const ROLE_COLORS: Record<Role, string> = { Admin: 'purple', Developer: 'blue', Viewer: 'default' };

export default function ProfilePage() {
  const { user, logout, updateAvatar } = useAuth();
  const { darkMode, toggleDarkMode } = useThemeMode();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const avatarMutation = useMutation({
    mutationFn: (file: File) => updateUserAvatar(user!.id, file),
    onSuccess: updatedUser => {
      updateAvatar(updatedUser.avatarUrl ?? '');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', user!.id] });
      message.success('Фото профиля обновлено');
    },
    onError: () => {
      message.error('Ошибка загрузки фото');
    }
  });

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Выберите файл изображения');
      return false;
    }
    avatarMutation.mutate(file);
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Space align="baseline" wrap style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Профиль</Title>
        <Text type="secondary">— Личные данные и настройки аккаунта.</Text>
      </Space>

      <Card style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Avatar size={64} src={user.avatarUrl} icon={!user.avatarUrl ? <UserOutlined /> : undefined} style={{ backgroundColor: '#2f54eb' }} />
          <div>
            <Title level={4} style={{ margin: 0 }}>{user.name}</Title>
            <Tag color={ROLE_COLORS[user.role]}>{user.role}</Tag>
            <div style={{ marginTop: 8 }}>
              <Upload accept="image/*" showUploadList={false} beforeUpload={handleAvatarSelect}>
                <Button size="small" icon={<CameraOutlined />} loading={avatarMutation.isPending}>
                  Изменить фото
                </Button>
              </Upload>
            </div>
          </div>
        </div>

        <Divider />

        <Title level={5}>Настройки</Title>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Text>Тёмная тема</Text>
          <Switch checked={darkMode} onChange={toggleDarkMode} />
        </div>

        <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
          Выйти
        </Button>
      </Card>
    </div>
  );
}
