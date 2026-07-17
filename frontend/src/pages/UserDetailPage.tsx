import { useEffect, useState } from 'react';
import { Typography, Table, Input, Space, Card, Spin, Empty, Button, Modal, Form, Popconfirm, Pagination, Popover, DatePicker, theme } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { getUser, updateUser, deleteUser, getUserProjects } from '../api/usersApi';
import { addProjectMember, removeProjectMember, updateProject } from '../api/projectsApi';
import { useAuth } from '../auth/AuthContext';
import { useFillPageSize } from '../hooks/useFillPageSize';
import { UserProjectsModal } from '../components/UserProjectsModal';
import type { MemberProject } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function UserDetailPage() {
  const { token } = theme.useToken();
  const { id } = useParams();
  const userId = Number(id);
  const { user: loggedInUser } = useAuth();
  const canEditProjects = loggedInUser?.role === 'Admin';
  const location = useLocation();
  const navigate = useNavigate();
  const fromProject = (location.state as { fromProject?: { id: number; name: string } } | null)?.fromProject;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [editingProject, setEditingProject] = useState<MemberProject | null>(null);
  const [editProjectForm] = Form.useForm();
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
  });

  const { data: userProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['user-projects', userId],
    queryFn: () => getUserProjects(userId),
  });

  const { containerRef, pageSize, rowHeight, isMeasured } = useFillPageSize(3, !projectsLoading);

  const handleSaveProjects = async (projectIds: number[]) => {
    const currentProjectIds = userProjects.map(p => p.id);
    const toAdd = projectIds.filter(id => !currentProjectIds.includes(id));
    const toRemove = currentProjectIds.filter(id => !projectIds.includes(id));

    await Promise.all([
      ...toAdd.map(projectId => addProjectMember(projectId, userId)),
      ...toRemove.map(projectId => removeProjectMember(projectId, userId))
    ]);
    queryClient.invalidateQueries({ queryKey: ['user-projects', userId] });
  };

  const removeMutation = useMutation({
    mutationFn: (projectId: number) => removeProjectMember(projectId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-projects', userId] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: (values: { login: string; password?: string }) => updateUser(userId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditModalOpen(false);
      editForm.resetFields(['password']);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: () => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  const updateProjectMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description: string } }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-projects', userId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditingProject(null);
    },
  });

  const openEditProject = (project: MemberProject) => {
    setEditingProject(project);
    editProjectForm.setFieldsValue({ name: project.name, description: project.description });
  };

  useEffect(() => setPage(1), [search, dateRange, pageSize]);

  if (userLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Empty description="Пользователь не найден" style={{ marginTop: 80 }} />;
  }

  const filteredProjects = userProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesDate = !dateRange || (!dayjs(p.addedAt).isBefore(dateRange[0], 'day') && !dayjs(p.addedAt).isAfter(dateRange[1], 'day'));
    return matchesSearch && matchesDate;
  });
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);
  const projectNumbers = new Map(userProjects.map((p, index) => [p.id, index + 1]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
        <Space align="baseline" wrap size={6}>
          {fromProject ? (
            <>
              <Text type="secondary"><Link to="/projects" style={{ color: 'inherit' }}>Проекты</Link></Text>
              <Text type="secondary">/</Text>
              <Text type="secondary"><Link to={`/projects/${fromProject.id}`} style={{ color: 'inherit' }}>{fromProject.name}</Link></Text>
              <Text type="secondary">/</Text>
            </>
          ) : (
            <>
              <Text type="secondary"><Link to="/users" style={{ color: 'inherit' }}>Пользователи</Link></Text>
              <Text type="secondary">/</Text>
            </>
          )}
          <Title level={3} style={{ margin: 0 }}>{user.name}</Title>
          <Text type="secondary">— Роль: {user.role}</Text>
        </Space>
        <Space wrap>
          <Button icon={<EditOutlined />} onClick={() => { editForm.setFieldsValue({ login: user.name }); setEditModalOpen(true); }}>
            Редактировать пользователя
          </Button>
          <Popconfirm title="Удалить пользователя?" onConfirm={() => deleteUserMutation.mutate()} okText="Удалить" cancelText="Отмена">
            <Button danger icon={<DeleteOutlined />}>Удалить пользователя</Button>
          </Popconfirm>
        </Space>
      </Space>

      <div style={{ width: '100%', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Проекты пользователя</Title>
      </div>
      <div style={{ display: 'flex', gap: 8, width: '100%', marginBottom: 20, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="Поиск проектов"
          allowClear
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <Space wrap>
          <Popover
            trigger="click"
            placement="bottomRight"
            content={
              <div style={{ width: 260 }}>
                <RangePicker value={dateRange} onChange={dates => setDateRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)} />
                {dateRange && (
                  <Button type="link" size="small" style={{ padding: 0, marginTop: 8, display: 'block' }} onClick={() => setDateRange(null)}>
                    Сбросить
                  </Button>
                )}
              </div>
            }
          >
            <Button icon={<FilterOutlined />}>Фильтр{dateRange ? ' (1)' : ''}</Button>
          </Popover>
          {canEditProjects && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setProjectsModalOpen(true)}
            >
              Добавить проект
            </Button>
          )}
        </Space>
      </div>

      <Card
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}
      >
        <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          {(projectsLoading || !isMeasured) && (
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
            dataSource={pagedProjects}
            pagination={false}
            scroll={{ x: 'max-content' }}
            onRow={() => (rowHeight ? { style: { height: rowHeight } } : {})}
            locale={{ emptyText: 'Пользователь не участвует ни в одном проекте' }}
            columns={[
              {
                title: 'N',
                key: 'index',
                width: 50,
                render: (_: unknown, row: MemberProject) => projectNumbers.get(row.id),
              },
              {
                title: 'Название',
                dataIndex: 'name',
                render: (name: string, row: MemberProject) => (
                  <Link to={`/projects/${row.id}`} state={{ fromUser: { id: userId, name: user.name } }}>
                    {name}
                  </Link>
                ),
              },
              { title: 'Описание', dataIndex: 'description' },
              { 
                title: 'Дата участия', 
                dataIndex: 'addedAt',
                render: (val: string) => val ? dayjs(val).format('DD.MM.YYYY HH:mm') : ''
              },
              {
                title: 'Действия',
                key: 'actions',
                render: (_: unknown, row: MemberProject) => (
                  <Space>
                    {canEditProjects && (
                      <Button size="small" icon={<EditOutlined />} onClick={() => openEditProject(row)} />
                    )}
                    {user.role !== 'Admin' && (
                      <Popconfirm title="Убрать пользователя из проекта?" onConfirm={() => removeMutation.mutate(row.id)} okText="Убрать" cancelText="Отмена">
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
          <Pagination current={page} pageSize={pageSize} total={filteredProjects.length} onChange={setPage} />
        </div>
      </Card>

      <Modal
        title="Редактировать пользователя"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => editForm.submit()}
        confirmLoading={updateUserMutation.isPending}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={editForm} layout="vertical" onFinish={values => updateUserMutation.mutate(values)}>
          <Form.Item label="Логин" name="login" rules={[{ required: true, message: 'Введите логин' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Новый пароль" name="password" rules={[{ min: 6, message: 'Пароль должен содержать минимум 6 символов' }]}>
            <Input.Password placeholder="Оставьте пустым, чтобы не менять" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Редактировать проект"
        open={editingProject !== null}
        onCancel={() => setEditingProject(null)}
        onOk={() => editProjectForm.submit()}
        confirmLoading={updateProjectMut.isPending}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form
          form={editProjectForm}
          layout="vertical"
          onFinish={values => editingProject && updateProjectMut.mutate({ id: editingProject.id, data: values })}
        >
          <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Описание" name="description" rules={[{ required: true, message: 'Введите описание' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <UserProjectsModal
        open={projectsModalOpen}
        onClose={() => setProjectsModalOpen(false)}
        onSave={handleSaveProjects}
        initialSelectedIds={userProjects.map(p => p.id)}
      />
    </div>
  );
}
