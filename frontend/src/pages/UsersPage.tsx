import { useEffect, useState, type ReactNode } from 'react';
import { Table, Input, Button, Modal, Form, Select, Space, Typography, Popconfirm, Tag, Avatar, Card, Row, Col, Statistic, Pagination, Popover, Checkbox, theme, Spin } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  CodeOutlined,
  EyeOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { getUsers, createUser, updateUser, updateUserRole, deleteUser } from '../api/usersApi';
import { useAuth } from '../auth/AuthContext';
import type { Role, User } from '../types';

const { Title, Text } = Typography;

const ROLE_COLORS: Record<Role, string> = { Admin: 'purple', Developer: 'blue', Viewer: 'default' };

const ROLE_STATS: { role: Role; icon: ReactNode }[] = [
  { role: 'Admin', icon: <SafetyOutlined style={{ color: '#2f54eb' }} /> },
  { role: 'Developer', icon: <CodeOutlined style={{ color: '#2f54eb' }} /> },
  { role: 'Viewer', icon: <EyeOutlined style={{ color: '#2f54eb' }} /> },
];

export default function UsersPage() {
  const { token } = theme.useToken();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const pageSize = 5;

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { login: string; password?: string } }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      editForm.resetFields(['password']);
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter.length === 0 || roleFilter.includes(u.role);
    return matchesSearch && matchesRole;
  });
  
  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const userNumbers = new Map(users.map((u, index) => [u.id, index + 1]));

  useEffect(() => setPage(1), [search, roleFilter, pageSize]);

  const openEdit = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({ login: user.name });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Space align="baseline" wrap style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Пользователи</Title>
        <Text type="secondary">— Управляйте пользователями системы, их ролями и доступом.</Text>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Всего пользователей" value={users.length} prefix={<TeamOutlined style={{ color: '#2f54eb' }} />} />
          </Card>
        </Col>
        {ROLE_STATS.map(({ role, icon }) => (
          <Col xs={24} sm={12} md={6} key={role}>
            <Card>
              <Statistic title={role} value={users.filter(u => u.role === role).length} prefix={icon} />
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ display: 'flex', gap: 8, width: '100%', marginBottom: 20, flexWrap: 'wrap' }}>
        <Input.Search placeholder="Поиск пользователей..." allowClear onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
        <Space wrap>
          <Popover
            trigger="click"
            placement="bottomRight"
            content={
              <div style={{ width: 180 }}>
                <Checkbox.Group
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  value={roleFilter}
                  onChange={value => setRoleFilter(value as Role[])}
                  options={(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => ({ label: r, value: r }))}
                />
                {roleFilter.length > 0 && (
                  <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => setRoleFilter([])}>
                    Сбросить
                  </Button>
                )}
              </div>
            }
          >
            <Button icon={<FilterOutlined />}>Фильтр{roleFilter.length > 0 ? ` (${roleFilter.length})` : ''}</Button>
          </Popover>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Создать пользователя
          </Button>
        </Space>
      </div>

      <Card
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}
      >
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: token.colorBgContainer,
            }}
          >
            <Spin />
          </div>
        )}
        <Table
          rowKey="id"
          loading={false}
          dataSource={pagedUsers}
          pagination={false}
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: 'N',
              key: 'index',
              width: 50,
              render: (_: unknown, row: User) => userNumbers.get(row.id),
            },
            {
              title: 'СОЗДАН',
              dataIndex: 'createdAt',
              render: (text: string) => text ? dayjs(text).format('DD.MM.YYYY HH:mm') : '—'
            },
            {
              title: 'Логин',
              dataIndex: 'name',
              render: (name: string, row: User) => (
                <Space>
                  <Avatar src={row.avatarUrl} icon={!row.avatarUrl ? <UserOutlined /> : undefined} size="small" />
                  <Link to={`/users/${row.id}`}>{name}</Link>
                </Space>
              ),
            },
            {
              title: 'Роль',
              dataIndex: 'role',
              render: (role: Role, row: User) => (
                <Select
                  value={role}
                  variant="borderless"
                  style={{ width: 130 }}
                  disabled={currentUser?.id === row.id || row.role === 'Admin'}
                  onChange={(newRole: Role) => roleMutation.mutate({ id: row.id, role: newRole })}
                  options={(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => ({
                    value: r,
                    label: <Tag color={ROLE_COLORS[r]} style={{ width: 84, textAlign: 'center' }}>{r}</Tag>,
                  }))}
                />
              ),
            },
            {
              title: 'Действия',
              key: 'actions',
              render: (_: unknown, row: User) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                  {currentUser?.id === row.id ? (
                    <Button size="small" danger icon={<DeleteOutlined />} disabled title="Нельзя удалить самого себя" />
                  ) : (
                    <Popconfirm title="Удалить пользователя?" onConfirm={() => deleteMutation.mutate(row.id)} okText="Удалить" cancelText="Отмена">
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]}
        />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 24px', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
          <Pagination current={page} pageSize={pageSize} total={filteredUsers.length} onChange={setPage} />
        </div>
      </Card>

      <Modal
        title="Создать пользователя"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        okText="Создать"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" onFinish={values => createMutation.mutate(values)} initialValues={{ role: 'Viewer' }}>
          <Form.Item label="Логин" name="login" rules={[{ required: true, message: 'Введите логин' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Пароль" name="password" rules={[{ required: true, message: 'Введите пароль' }, { min: 6, message: 'Пароль должен содержать минимум 6 символов' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="Роль" name="role" rules={[{ required: true }]}>
            <Select options={[{ value: 'Viewer' }, { value: 'Developer' }, { value: 'Admin' }]} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Редактировать пользователя"
        open={editingUser !== null}
        onCancel={() => setEditingUser(null)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={values => editingUser && updateMutation.mutate({ id: editingUser.id, data: values })}
        >
          <Form.Item label="Логин" name="login" rules={[{ required: true, message: 'Введите логин' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Новый пароль" name="password" rules={[{ min: 6, message: 'Пароль должен содержать минимум 6 символов' }]}>
            <Input.Password placeholder="Оставьте пустым, чтобы не менять" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
