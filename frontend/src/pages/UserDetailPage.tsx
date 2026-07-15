import { useEffect, useState } from 'react';
import { Typography, Table, Input, Space, Card, Spin, Empty, Button, Modal, Form, Select, Popconfirm, Pagination, Popover, DatePicker, theme } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FilterOutlined, PushpinOutlined, PushpinFilled } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { getUser, updateUser, deleteUser, getUserProjects } from '../api/usersApi';
import { getProjects, addProjectMember, removeProjectMember } from '../api/projectsApi';
import { usePinnedTabs } from '../pinned/PinnedTabsContext';
import { useFillPageSize } from '../hooks/useFillPageSize';
import type { MemberProject } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function UserDetailPage() {
  const { token } = theme.useToken();
  const { id } = useParams();
  const userId = Number(id);
  const location = useLocation();
  const navigate = useNavigate();
  const { isPinned, togglePin } = usePinnedTabs();
  const fromProject = (location.state as { fromProject?: { id: number; name: string } } | null)?.fromProject;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [addProjectId, setAddProjectId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUser(userId),
  });

  const { data: userProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['user-projects', userId],
    queryFn: () => getUserProjects(userId),
  });

  const { data: allProjects = [] } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const { containerRef, pageSize, rowHeight, isMeasured } = useFillPageSize(3, !projectsLoading);

  const addMutation = useMutation({
    mutationFn: (projectId: number) => addProjectMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-projects', userId] });
      setAddProjectId(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (projectId: number) => removeProjectMember(projectId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-projects', userId] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: (values: { name: string; email: string }) => updateUser(userId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditModalOpen(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: () => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

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

  const availableProjects = allProjects.filter(p => !userProjects.some(up => up.id === p.id));

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
          <Button icon={<EditOutlined />} onClick={() => { editForm.setFieldsValue(user); setEditModalOpen(true); }}>
            Редактировать пользователя
          </Button>
          <Button
            icon={isPinned(`/users/${userId}`) ? <PushpinFilled /> : <PushpinOutlined />}
            onClick={() => togglePin({ key: `/users/${userId}`, label: user.name, type: 'user' })}
          >
            {isPinned(`/users/${userId}`) ? 'Открепить' : 'Закрепить'}
          </Button>
          <Popconfirm title="Удалить пользователя?" onConfirm={() => deleteUserMutation.mutate()} okText="Удалить" cancelText="Отмена">
            <Button danger icon={<DeleteOutlined />}>Удалить пользователя</Button>
          </Popconfirm>
        </Space>
      </Space>

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
          <Select
            placeholder="Выберите проект"
            style={{ width: 240, maxWidth: '100%' }}
            value={addProjectId}
            options={availableProjects.map(p => ({ value: p.id, label: p.name }))}
            onChange={setAddProjectId}
            notFoundContent="Пользователь уже добавлен во все проекты"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={addProjectId === null}
            loading={addMutation.isPending}
            onClick={() => addProjectId !== null && addMutation.mutate(addProjectId)}
          >
            Добавить проект
          </Button>
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
              { title: 'Дата добавления', dataIndex: 'addedAt' },
              {
                title: 'Действия',
                key: 'actions',
                render: (_: unknown, row: MemberProject) => (
                  <Popconfirm title="Убрать пользователя из проекта?" onConfirm={() => removeMutation.mutate(row.id)} okText="Убрать" cancelText="Отмена">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
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
          <Form.Item label="Имя" name="name" rules={[{ required: true, message: 'Введите имя' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Введите email' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
