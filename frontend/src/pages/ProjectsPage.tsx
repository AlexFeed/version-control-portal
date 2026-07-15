import { useEffect, useState } from 'react';
import { Table, Input, Button, Modal, Form, Select, Popconfirm, Space, Typography, Card, Row, Col, Statistic, Pagination, Popover, DatePicker, theme, message, Spin, Tag } from 'antd';
import {
  PlusOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  TeamOutlined,
  FilterOutlined,
  PushpinOutlined,
  PushpinFilled,
  StarOutlined,
  StarFilled,
  HeartOutlined,
  HeartFilled,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { getProjects, createProject, updateProject, updateProjectStatus, deleteProject, getProjectMembers, addProjectMember } from '../api/projectsApi';
import { getVersions } from '../api/versionsApi';
import { getUsers } from '../api/usersApi';
import { useAuth } from '../auth/AuthContext';
import { usePinnedTabs } from '../pinned/PinnedTabsContext';
import { useFillPageSize } from '../hooks/useFillPageSize';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, PROJECT_STATUS_OPTIONS } from '../projectStatus';
import type { Project, ProjectStatus } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ProjectRow extends Project {
  versionsCount: number;
  updatedAt: string;
}

export default function ProjectsPage() {
  const { token } = theme.useToken();
  const { user } = useAuth();
  const { isPinned, togglePin } = usePinnedTabs();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [addMemberProject, setAddMemberProject] = useState<ProjectRow | null>(null);
  const [addMemberUserId, setAddMemberUserId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const canEditProjects = user?.role === 'Admin';

  const toggleInSet = (setter: typeof setPinnedIds, id: number) =>
    setter(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['projects-with-versions'],
    queryFn: async (): Promise<ProjectRow[]> => {
      const projects = await getProjects();
      return Promise.all(
        projects.map(async project => {
          const versions = await getVersions(project.id);
          const updatedAt = versions[0]?.createdAt ?? '—';
          return { ...project, versionsCount: versions.length, updatedAt };
        }),
      );
    },
  });

  const { containerRef, pageSize, rowHeight, isMeasured } = useFillPageSize(3, !isLoading);

  const { data: allUsers = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers });

  const { data: usersInProgressCount = 0 } = useQuery({
    queryKey: ['users-with-active-project', rows.map(r => r.id)],
    queryFn: async (): Promise<number> => {
      const members = await Promise.all(rows.map(row => getProjectMembers(row.id)));
      return new Set(members.flat().map(m => m.id)).size;
    },
    enabled: rows.length > 0,
  });

  const { data: addMemberProjectMembers = [] } = useQuery({
    queryKey: ['project-members', addMemberProject?.id],
    queryFn: () => getProjectMembers(addMemberProject!.id),
    enabled: addMemberProject !== null,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-with-versions'] });
      setModalOpen(false);
      form.resetFields();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description: string } }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-with-versions'] });
      setEditingProject(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ProjectStatus }) => updateProjectStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects-with-versions'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects-with-versions'] }),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: number; userId: number }) => addProjectMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', addMemberProject?.id] });
      setAddMemberProject(null);
      setAddMemberUserId(null);
    },
  });

  const openEdit = (project: ProjectRow) => {
    setEditingProject(project);
    editForm.setFieldsValue({ name: project.name, description: project.description });
  };

  const availableUsersForAddMember = allUsers.filter(u => !addMemberProjectMembers.some(m => m.id === u.id));

  const filteredRows = rows.filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(search.toLowerCase());
    const matchesDate =
      !dateRange ||
      (row.updatedAt !== '—' && !dayjs(row.updatedAt).isBefore(dateRange[0], 'day') && !dayjs(row.updatedAt).isAfter(dateRange[1], 'day'));
    return matchesSearch && matchesDate;
  });
  const today = dayjs();
  const createdTodayCount = rows.filter(row => dayjs(row.createdAt).isSame(today, 'day')).length;
  const updatedTodayCount = rows.filter(row => row.updatedAt !== '—' && dayjs(row.updatedAt).isSame(today, 'day')).length;
  const sortedRows = [...filteredRows].sort((a, b) => Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id)));
  const pagedRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
  const rowNumbers = new Map(rows.map((row, index) => [row.id, index + 1]));

  useEffect(() => setPage(1), [search, dateRange, pageSize, pinnedIds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Space align="baseline" wrap style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Проекты</Title>
        <Text type="secondary">— Управляйте проектами, версиями и участниками команды.</Text>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Всего проектов" value={rows.length} prefix={<ProjectOutlined style={{ color: '#2f54eb' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Создано сегодня" value={createdTodayCount} prefix={<ClockCircleOutlined style={{ color: '#2f54eb' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Обновлено сегодня" value={updatedTodayCount} prefix={<SyncOutlined style={{ color: '#2f54eb' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Пользователей в работе" value={usersInProgressCount} prefix={<TeamOutlined style={{ color: '#2f54eb' }} />} />
          </Card>
        </Col>
      </Row>

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
                <RangePicker
                  value={dateRange}
                  onChange={dates => setDateRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)}
                />
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
          {user?.role === 'Admin' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Создать проект
            </Button>
          )}
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
            dataSource={pagedRows}
            pagination={false}
            scroll={{ x: 'max-content' }}
            onRow={() => (rowHeight ? { style: { height: rowHeight } } : {})}
            columns={[
              {
                title: 'N',
                key: 'index',
                width: 50,
                render: (_: unknown, row: ProjectRow) => rowNumbers.get(row.id),
              },
              { title: 'СОЗДАН', dataIndex: 'createdAt' },
              { title: 'Название', dataIndex: 'name', render: (name: string, row: ProjectRow) => <Link to={`/projects/${row.id}`}>{name}</Link> },
              { title: 'Описание', dataIndex: 'description' },
              {
                title: 'Статус',
                dataIndex: 'status',
                render: (status: ProjectStatus, row: ProjectRow) =>
                  canEditProjects ? (
                    <Select<ProjectStatus>
                      value={status}
                      variant="borderless"
                      style={{ width: 150 }}
                      popupMatchSelectWidth={false}
                      onChange={value => updateStatusMutation.mutate({ id: row.id, status: value })}
                      options={PROJECT_STATUS_OPTIONS.map(opt => ({
                        value: opt.value,
                        label: (
                          <Tag color={PROJECT_STATUS_COLORS[opt.value]} style={{ width: '100%', textAlign: 'center' }}>
                            {opt.label}
                          </Tag>
                        ),
                      }))}
                    />
                  ) : (
                    <Tag color={PROJECT_STATUS_COLORS[status]} style={{ width: 118, textAlign: 'center' }}>
                      {PROJECT_STATUS_LABELS[status]}
                    </Tag>
                  ),
              },
              { title: 'Версий', dataIndex: 'versionsCount' },
              { title: 'Обновлено', dataIndex: 'updatedAt' },
              canEditProjects
                ? {
                    title: 'Действия',
                    key: 'actions',
                    render: (_: unknown, row: ProjectRow) => (
                      <Space>
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                        <Button
                          size="small"
                          type={isPinned(`/projects/${row.id}`) ? 'primary' : 'default'}
                          icon={isPinned(`/projects/${row.id}`) ? <PushpinFilled /> : <PushpinOutlined />}
                          onClick={() => togglePin({ key: `/projects/${row.id}`, label: row.name, type: 'project' })}
                        />
                        <Button size="small" icon={<UserAddOutlined />} onClick={() => setAddMemberProject(row)} />
                        <Button size="small" icon={<MessageOutlined />} onClick={() => message.info('Функция пока в разработке')} />
                        <Popconfirm title="Удалить проект?" onConfirm={() => deleteMutation.mutate(row.id)} okText="Удалить" cancelText="Отмена">
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    ),
                  }
                : { title: '', key: 'actions', render: () => null },
              {
                title: 'Важность',
                key: 'importance',
                width: 90,
                render: (_: unknown, row: ProjectRow) => (
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
          <Pagination current={page} pageSize={pageSize} total={filteredRows.length} onChange={setPage} />
        </div>
      </Card>

      <Modal
        title="Создать проект"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        okText="Создать"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" onFinish={values => createMutation.mutate(values)}>
          <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Описание" name="description" rules={[{ required: true, message: 'Введите описание' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Редактировать проект"
        open={editingProject !== null}
        onCancel={() => setEditingProject(null)}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={values => editingProject && updateMutation.mutate({ id: editingProject.id, data: values })}
        >
          <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Описание" name="description" rules={[{ required: true, message: 'Введите описание' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Добавить участника в проект «${addMemberProject?.name ?? ''}»`}
        open={addMemberProject !== null}
        onCancel={() => {
          setAddMemberProject(null);
          setAddMemberUserId(null);
        }}
        onOk={() => addMemberProject && addMemberUserId !== null && addMemberMutation.mutate({ projectId: addMemberProject.id, userId: addMemberUserId })}
        confirmLoading={addMemberMutation.isPending}
        okText="Добавить"
        okButtonProps={{ disabled: addMemberUserId === null }}
        cancelText="Отмена"
      >
        <Select
          placeholder="Выберите пользователя"
          style={{ width: '100%' }}
          value={addMemberUserId}
          options={availableUsersForAddMember.map(u => ({ value: u.id, label: u.name }))}
          onChange={setAddMemberUserId}
          notFoundContent="Все пользователи уже добавлены"
        />
      </Modal>
    </div>
  );
}
