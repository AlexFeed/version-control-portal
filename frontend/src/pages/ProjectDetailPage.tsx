import { useEffect, useState } from 'react';
import { Typography, Table, Button, Modal, Form, Input, Space, Popconfirm, message, Card, Tabs, Avatar, Pagination, Spin, Empty, Popover, DatePicker, Tag, Checkbox, theme, Result } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { getProject, updateProject, deleteProject, getProjectMembers, updateProjectMembers } from '../api/projectsApi';
import { getVersions, deleteVersion } from '../api/versionsApi';
import { useAuth } from '../auth/AuthContext';
import { useFillPageSize } from '../hooks/useFillPageSize';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, isProjectLocked, isProjectReadOnly } from '../projectStatus';
import type { VersionWithDetails, User, Role } from '../types';
import { ProjectMembersModal } from '../components/ProjectMembersModal';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PROJECT_TAB_KEYS = ['versions', 'members', 'materials', 'chat', 'board'] as const;
type ProjectTabKey = (typeof PROJECT_TAB_KEYS)[number];

const ROLE_COLORS: Record<Role, string> = { Admin: 'purple', Developer: 'blue', Viewer: 'default' };

export default function ProjectDetailPage() {
  const { token } = theme.useToken();
  const { id } = useParams();
  const projectId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromUser = (location.state as { fromUser?: { id: number; name: string } } | null)?.fromUser;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab');
  const activeTab: ProjectTabKey = PROJECT_TAB_KEYS.includes(activeTabParam as ProjectTabKey) ? (activeTabParam as ProjectTabKey) : 'versions';
  const queryClient = useQueryClient();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  
  // Versions Tab state
  const [versionSearch, setVersionSearch] = useState('');
  const [versionDateRange, setVersionDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [versionPage, setVersionPage] = useState(1);
  
  // Members Tab state
  const [membersSearch, setMembersSearch] = useState('');
  const [membersRoleFilter, setMembersRoleFilter] = useState<Role[]>([]);
  const [membersPage, setMembersPage] = useState(1);

  const [form] = Form.useForm();
  const [headerNode, setHeaderNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!headerNode) return;
    const observer = new ResizeObserver(() => {});
    observer.observe(headerNode);
    return () => observer.disconnect();
  }, [headerNode]);

  const canEditVersionsByRole = user?.role === 'Developer' || user?.role === 'Admin';
  const canEditProjectByRole = user?.role === 'Admin';

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', projectId],
    queryFn: () => getVersions(projectId),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => getProjectMembers(projectId),
  });

  const { containerRef, pageSize, rowHeight, isMeasured } = useFillPageSize(3, !versionsLoading && !membersLoading);

  const updateProjectMutation = useMutation({
    mutationFn: (values: { name: string; description: string }) => updateProject(projectId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects-with-versions'] });
      setEditModalOpen(false);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-with-versions'] });
      navigate('/projects');
    },
  });

  const deleteVersionMutation = useMutation({
    mutationFn: (versionId: number) => deleteVersion(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
      message.success('Версия удалена');
    },
  });

  const updateMembersMutation = useMutation({
    mutationFn: (userIds: number[]) => updateProjectMembers(projectId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });

  useEffect(() => setVersionPage(1), [versionSearch, versionDateRange, pageSize]);
  useEffect(() => setMembersPage(1), [membersSearch, membersRoleFilter, pageSize]);

  if (projectLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return <Empty description="Проект не найден" style={{ marginTop: 80 }} />;
  }

  const isLocked = isProjectLocked(project.status) && user?.role !== 'Admin';
  const readOnly = isProjectReadOnly(project.status);
  const canEditVersions = canEditVersionsByRole && !readOnly;
  const canEditProject = canEditProjectByRole && !readOnly;

  // Pagination for Versions
  const filteredVersions = versions.filter((v: VersionWithDetails) => {
    const matchesSearch = v.version.toLowerCase().includes(versionSearch.toLowerCase()) || v.description.toLowerCase().includes(versionSearch.toLowerCase());
    const matchesDate =
      !versionDateRange || (!dayjs(v.createdAt).isBefore(versionDateRange[0], 'day') && !dayjs(v.createdAt).isAfter(versionDateRange[1], 'day'));
    return matchesSearch && matchesDate;
  });
  const pagedVersions = filteredVersions.slice((versionPage - 1) * pageSize, versionPage * pageSize);
  const versionNumbers = new Map(versions.map((v: VersionWithDetails, index: number) => [v.id, index + 1]));

  const filteredMembers = members.filter((m: User) => {
    const matchesSearch = m.name.toLowerCase().includes(membersSearch.toLowerCase());
    const matchesRole = membersRoleFilter.length === 0 || membersRoleFilter.includes(m.role);
    return matchesSearch && matchesRole;
  });
  const pagedMembers = filteredMembers.slice((membersPage - 1) * pageSize, membersPage * pageSize);
  const memberNumbers = new Map(members.map((m: User, index: number) => [m.id, index + 1]));

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      <div
        ref={setHeaderNode}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1, 
          minHeight: 0,
        }}
      >
      <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
        <Space align="baseline" wrap size={6}>
          {fromUser ? (
            <>
              <Text type="secondary"><Link to="/users" style={{ color: 'inherit' }}>Пользователи</Link></Text>
              <Text type="secondary">/</Text>
              <Text type="secondary"><Link to={`/users/${fromUser.id}`} style={{ color: 'inherit' }}>{fromUser.name}</Link></Text>
              <Text type="secondary">/</Text>
            </>
          ) : (
            <>
              <Text type="secondary"><Link to="/projects" style={{ color: 'inherit' }}>Проекты</Link></Text>
              <Text type="secondary">/</Text>
            </>
          )}
          <>
            <Title level={3} style={{ margin: 0 }}>{project.name}</Title>
            <Tag color={PROJECT_STATUS_COLORS[project.status]}>{PROJECT_STATUS_LABELS[project.status]}</Tag>
            <Text type="secondary">— {project.description}</Text>
          </>
        </Space>
        <Space wrap>
          {readOnly && (
            <Text type="secondary">Проект доступен только для просмотра</Text>
          )}
          {canEditProject && (
            <Button icon={<EditOutlined />} onClick={() => { form.setFieldsValue(project); setEditModalOpen(true); }}>
              Редактировать проект
            </Button>
          )}
          {canEditProject && (
            <Popconfirm title="Удалить проект?" onConfirm={() => deleteProjectMutation.mutate()} okText="Удалить" cancelText="Отмена">
              <Button danger icon={<DeleteOutlined />}>Удалить проект</Button>
            </Popconfirm>
          )}
        </Space>
      </Space>

      {isLocked ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Result
            icon={<LockOutlined />}
            title="Проект закрыт"
            subTitle="Этот проект заблокирован, его содержимое недоступно для просмотра."
            extra={<Button type="primary" onClick={() => navigate('/projects')}>На главную</Button>}
          />
        </div>
      ) : (
      <Tabs
        activeKey={activeTab}
        onChange={key => setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('tab', key);
          return next;
        }, { replace: true })}
        destroyOnHidden
        style={{ flex: 1, minHeight: 0 }}
        styles={{
          content: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
        }}
        items={[
          {
            key: 'versions',
            label: 'Версии',
            children: (
              <>
                <div style={{ display: 'flex', gap: 8, width: '100%', marginBottom: 16, flexWrap: 'wrap' }}>
                  <Input.Search
                    placeholder="Поиск версий"
                    allowClear
                    onChange={e => setVersionSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <Space wrap>
                    <Popover
                      trigger="click"
                      placement="bottomRight"
                      content={
                        <div style={{ width: 260 }}>
                          <RangePicker
                            value={versionDateRange}
                            onChange={dates => setVersionDateRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)}
                          />
                          {versionDateRange && (
                            <Button type="link" size="small" style={{ padding: 0, marginTop: 8, display: 'block' }} onClick={() => setVersionDateRange(null)}>
                              Сбросить
                            </Button>
                          )}
                        </div>
                      }
                    >
                      <Button icon={<FilterOutlined />}>Фильтр{versionDateRange ? ' (1)' : ''}</Button>
                    </Popover>
                    {canEditVersions && (
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate(`/projects/${projectId}/new-version`)}>
                        Создать версию
                      </Button>
                    )}
                  </Space>
                </div>

                <Card
                  style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                  styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}
                >
                  <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
                  {(versionsLoading || !isMeasured) && (
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
                    dataSource={pagedVersions}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    onRow={() => (rowHeight ? { style: { height: rowHeight } } : {})}
                    columns={[
                      {
                        title: 'N',
                        key: 'index',
                        width: 50,
                        render: (_: unknown, row: VersionWithDetails) => versionNumbers.get(row.id),
                      },
                      {
                        title: 'Версия',
                        dataIndex: 'version',
                        render: (versionLabel: string, row: VersionWithDetails) => (
                          <Link to={`/projects/${projectId}/versions/${row.id}`}>{versionLabel}</Link>
                        ),
                      },
                      { title: 'Дата создания', dataIndex: 'createdAt', render: (text: string) => text ? dayjs(text).format('DD.MM.YYYY HH:mm') : '—' },
                      { title: 'Автор', dataIndex: 'authorName' },
                      { title: 'Краткое описание', dataIndex: 'description' },
                      canEditVersions
                        ? {
                            title: 'Действия',
                            key: 'actions',
                            render: (_: unknown, row: VersionWithDetails) => (
                              <Space>
                                <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/projects/${projectId}/versions/${row.id}/edit`)} />
                                <Popconfirm title="Удалить версию?" onConfirm={() => deleteVersionMutation.mutate(row.id)} okText="Удалить" cancelText="Отмена">
                                  <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </Space>
                            ),
                          }
                        : { title: '', key: 'actions', render: () => null },
                    ]}
                  />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 24px', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                    <Pagination current={versionPage} pageSize={pageSize} total={filteredVersions.length} onChange={setVersionPage} />
                  </div>
                </Card>
              </>
            ),
          },
          {
            key: 'members',
            label: 'Участники',
            children: (
              <>
                <div style={{ display: 'flex', gap: 8, width: '100%', marginBottom: 16, flexWrap: 'wrap' }}>
                  <Input.Search
                    placeholder="Поиск участников..."
                    allowClear
                    onChange={e => setMembersSearch(e.target.value)}
                    style={{ flex: 1, minWidth: 200 }}
                  />
                  <Space wrap>
                    <Popover
                      trigger="click"
                      placement="bottomRight"
                      content={
                        <div style={{ width: 180 }}>
                          <Checkbox.Group
                            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                            value={membersRoleFilter}
                            onChange={value => setMembersRoleFilter(value as Role[])}
                            options={(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => ({ label: r, value: r }))}
                          />
                          {membersRoleFilter.length > 0 && (
                            <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => setMembersRoleFilter([])}>
                              Сбросить
                            </Button>
                          )}
                        </div>
                      }
                    >
                      <Button icon={<FilterOutlined />}>Фильтр{membersRoleFilter.length > 0 ? ` (${membersRoleFilter.length})` : ''}</Button>
                    </Popover>
                    {user?.role === 'Admin' && (
                      <Button type="primary" icon={<PlusOutlined />} onClick={() => setMembersModalOpen(true)}>
                        Добавить участника
                      </Button>
                    )}
                  </Space>
                </div>

                <Card
                  style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                  styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}
                >
                  <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
                  {(membersLoading || !isMeasured) && (
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
                    dataSource={pagedMembers}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    onRow={() => (rowHeight ? { style: { height: rowHeight } } : {})}
                    columns={[
                      {
                        title: 'N',
                        key: 'index',
                        width: 50,
                        render: (_: any, row: User) => memberNumbers.get(row.id) as any,
                      },
                      {
                        title: 'Пользователь',
                        dataIndex: 'name',
                        render: (name: string, row: User) => (
                          <Space>
                            <Avatar src={row.avatarUrl} icon={!row.avatarUrl ? <UserOutlined /> : undefined} size="small" />
                            <Link 
                              to={`/users/${row.id}`}
                              onClick={(e) => {
                                if (user?.role !== 'Admin') {
                                  e.preventDefault();
                                  message.error('Доступ к профилям пользователей есть только у администраторов');
                                }
                              }}
                            >
                              {name}
                            </Link>
                          </Space>
                        ),
                      },
                      {
                        title: 'Роль',
                        dataIndex: 'role',
                        render: (role: Role) => (
                          <Tag color={ROLE_COLORS[role]} style={{ width: 84, textAlign: 'center' }}>{role}</Tag>
                        ),
                      },
                      {
                        title: 'Действия',
                        key: 'actions',
                        render: (_: any, row: User) => (
                          user?.role === 'Admin' && row.role !== 'Admin' ? (
                            <Popconfirm 
                              title="Удалить из проекта?" 
                              onConfirm={() => {
                                const newUserIds = members.filter((m: User) => m.id !== row.id).map((m: User) => m.id);
                                updateMembersMutation.mutate(newUserIds);
                              }} 
                              okText="Удалить" 
                              cancelText="Отмена"
                            >
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          ) : null
                        ),
                      },
                    ]}
                  />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 24px', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                    <Pagination current={membersPage} pageSize={pageSize} total={filteredMembers.length} onChange={setMembersPage} />
                  </div>
                </Card>
              </>
            ),
          },
          {
            key: 'materials',
            label: 'Материалы',
            children: (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Result title="Материалы" subTitle="Раздел в разработке. Скоро здесь появятся материалы проекта." />
              </div>
            ),
          },
          {
            key: 'chat',
            label: 'Проектный чат',
            children: (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Result title="Проектный чат" subTitle="Раздел в разработке. Скоро здесь появится чат проекта." />
              </div>
            ),
          },
          {
            key: 'board',
            label: 'Проектная доска',
            children: (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Result title="Проектная доска" subTitle="Раздел в разработке. Скоро здесь появится доска проекта." />
              </div>
            ),
          },
        ]}
      />
      )}
      </div>

      <Modal
        title="Редактировать проект"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={updateProjectMutation.isPending}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical" onFinish={values => updateProjectMutation.mutate(values)}>
          <Form.Item label="Название" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Описание" name="description" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <ProjectMembersModal
        open={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        onSave={(userIds) => updateMembersMutation.mutateAsync(userIds)}
        initialSelectedIds={members.map((m: User) => m.id)}
      />
    </div>
  );
}
