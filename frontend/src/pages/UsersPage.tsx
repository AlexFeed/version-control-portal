import { useEffect, useState, type ReactNode } from 'react';
import { Table, Input, Button, Modal, Form, Select, Space, Typography, Popconfirm, Tag, Avatar, Card, Row, Col, Statistic, Pagination, Popover, Checkbox, theme, message, Spin } from 'antd';
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
  PushpinOutlined,
  PushpinFilled,
  StarOutlined,
  StarFilled,
  HeartOutlined,
  HeartFilled,
  FolderAddOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getUsers, createUser, updateUser, updateUserRole, deleteUser, getUserProjects, getActiveProjectCounts } from '../api/usersApi';
import { getProjects, addProjectMember } from '../api/projectsApi';
import { usePinnedTabs } from '../pinned/PinnedTabsContext';
import { useFillPageSize } from '../hooks/useFillPageSize';
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
  const { isPinned, togglePin } = usePinnedTabs();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [addProjectUser, setAddProjectUser] = useState<User | null>(null);
  const [addProjectId, setAddProjectId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const toggleInSet = (setter: typeof setPinnedIds, id: number) =>
    setter(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const { containerRef, pageSize, rowHeight, isMeasured } = useFillPageSize(3, !isLoading);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; email: string } }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
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

  const { data: allProjects = [] } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const { data: activeProjectCounts = {} } = useQuery({ queryKey: ['active-project-counts'], queryFn: getActiveProjectCounts });

  const { data: addProjectUserProjects = [] } = useQuery({
    queryKey: ['user-projects', addProjectUser?.id],
    queryFn: () => getUserProjects(addProjectUser!.id),
    enabled: addProjectUser !== null,
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) => addProjectMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-projects', addProjectUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['active-project-counts'] });
      setAddProjectUser(null);
      setAddProjectId(null);
    },
  });

  const availableProjectsForAdd = allProjects.filter(p => !addProjectUserProjects.some(up => up.id === p.id));

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter.length === 0 || roleFilter.includes(u.role);
    return matchesSearch && matchesRole;
  });
  const sortedUsers = [...filteredUsers].sort((a, b) => Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id)));
  const pagedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);
  const userNumbers = new Map(users.map((u, index) => [u.id, index + 1]));

  useEffect(() => setPage(1), [search, roleFilter, pageSize, pinnedIds]);

  const openEdit = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({ name: user.name, email: user.email });
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
        <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        {(isLoading || !isMeasured) && (
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
          onRow={() => (rowHeight ? { style: { height: rowHeight } } : {})}
          columns={[
            {
              title: 'N',
              key: 'index',
              width: 50,
              render: (_: unknown, row: User) => userNumbers.get(row.id),
            },
            { title: 'СОЗДАН', dataIndex: 'createdAt' },
            {
              title: 'Пользователь',
              dataIndex: 'name',
              render: (name: string, row: User) => (
                <Space>
                  <Avatar src={row.avatarUrl} icon={!row.avatarUrl ? <UserOutlined /> : undefined} size="small" />
                  <Link to={`/users/${row.id}`}>{name}</Link>
                </Space>
              ),
            },
            { title: 'Email', dataIndex: 'email' },
            {
              title: 'Роль',
              dataIndex: 'role',
              render: (role: Role, row: User) => (
                <Select
                  value={role}
                  variant="borderless"
                  style={{ width: 130 }}
                  onChange={(newRole: Role) => roleMutation.mutate({ id: row.id, role: newRole })}
                  options={(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => ({
                    value: r,
                    label: <Tag color={ROLE_COLORS[r]} style={{ width: 84, textAlign: 'center' }}>{r}</Tag>,
                  }))}
                />
              ),
            },
            {
              title: 'Проектов в работе',
              key: 'activeProjects',
              width: 150,
              render: (_: unknown, row: User) => activeProjectCounts[row.id] ?? 0,
            },
            {
              title: 'Действия',
              key: 'actions',
              render: (_: unknown, row: User) => (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                  <Button
                    size="small"
                    type={isPinned(`/users/${row.id}`) ? 'primary' : 'default'}
                    icon={isPinned(`/users/${row.id}`) ? <PushpinFilled /> : <PushpinOutlined />}
                    onClick={() => togglePin({ key: `/users/${row.id}`, label: row.name, type: 'user' })}
                  />
                  <Button size="small" icon={<FolderAddOutlined />} onClick={() => setAddProjectUser(row)} />
                  <Button size="small" icon={<MessageOutlined />} onClick={() => message.info('Функция пока в разработке')} />
                  <Popconfirm title="Удалить пользователя?" onConfirm={() => deleteMutation.mutate(row.id)} okText="Удалить" cancelText="Отмена">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
            {
              title: 'Важность',
              key: 'importance',
              width: 90,
              render: (_: unknown, row: User) => (
                <Space size={4}>
                  <Button
                    type="text"
                    size="small"
                    icon={pinnedIds.has(row.id) ? <StarFilled style={{ color: token.colorPrimary }} /> : <StarOutlined />}
                    onClick={() => toggleInSet(setPinnedIds, row.id)}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={likedIds.has(row.id) ? <HeartFilled style={{ color: '#eb2f96' }} /> : <HeartOutlined />}
                    onClick={() => toggleInSet(setLikedIds, row.id)}
                  />
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
          <Form.Item label="Имя" name="name" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Введите email' }]}>
            <Input />
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
          <Form.Item label="Имя" name="name" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Введите email' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Добавить проект пользователю «${addProjectUser?.name ?? ''}»`}
        open={addProjectUser !== null}
        onCancel={() => {
          setAddProjectUser(null);
          setAddProjectId(null);
        }}
        onOk={() => addProjectUser && addProjectId !== null && addMemberMutation.mutate({ projectId: addProjectId, userId: addProjectUser.id })}
        confirmLoading={addMemberMutation.isPending}
        okText="Добавить"
        okButtonProps={{ disabled: addProjectId === null }}
        cancelText="Отмена"
      >
        <Select
          placeholder="Выберите проект"
          style={{ width: '100%' }}
          value={addProjectId}
          options={availableProjectsForAdd.map(p => ({ value: p.id, label: p.name }))}
          onChange={setAddProjectId}
          notFoundContent="Пользователь уже добавлен во все проекты"
        />
      </Modal>
    </div>
  );
}
