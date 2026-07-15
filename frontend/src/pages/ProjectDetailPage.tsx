import { lazy, Suspense, useEffect, useState } from 'react';
import { Typography, Table, Button, Modal, Form, Input, Space, Popconfirm, message, Card, Tabs, Select, Avatar, Pagination, Spin, Empty, Popover, DatePicker, Tag, Checkbox, theme, Result } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  UserAddOutlined,
  FilterOutlined,
  HeartOutlined,
  HeartFilled,
  PushpinOutlined,
  PushpinFilled,
  MessageOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { getProject, updateProject, deleteProject, getProjectMembers, addProjectMember, removeProjectMember } from '../api/projectsApi';
import { getVersions, deleteVersion } from '../api/versionsApi';
import { getUsers } from '../api/usersApi';
import { useAuth } from '../auth/AuthContext';
import { usePinnedTabs } from '../pinned/PinnedTabsContext';
import { useFillPageSize } from '../hooks/useFillPageSize';
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, isProjectLocked, isProjectReadOnly } from '../projectStatus';
import type { VersionWithDetails, ProjectMember, Role } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ProjectBoardTab = lazy(() => import('./ProjectBoardTab').then(m => ({ default: m.ProjectBoardTab })));

const ROLE_COLORS: Record<Role, string> = { Admin: 'purple', Developer: 'blue', Viewer: 'default' };

const PROJECT_TAB_KEYS = ['versions', 'members', 'materials', 'chat', 'board'] as const;
type ProjectTabKey = (typeof PROJECT_TAB_KEYS)[number];

export default function ProjectDetailPage() {
  const { token } = theme.useToken();
  const { id } = useParams();
  const projectId = Number(id);
  const { user } = useAuth();
  const { isPinned, togglePin } = usePinnedTabs();
  const navigate = useNavigate();
  const location = useLocation();
  const fromUser = (location.state as { fromUser?: { id: number; name: string } } | null)?.fromUser;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab');
  const activeTab: ProjectTabKey = PROJECT_TAB_KEYS.includes(activeTabParam as ProjectTabKey) ? (activeTabParam as ProjectTabKey) : 'versions';
  const queryClient = useQueryClient();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [versionSearch, setVersionSearch] = useState('');
  const [versionDateRange, setVersionDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [versionPage, setVersionPage] = useState(1);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<Role[]>([]);
  const [memberPage, setMemberPage] = useState(1);
  const [addMemberId, setAddMemberId] = useState<number | null>(null);
  const [likedVersionIds, setLikedVersionIds] = useState<Set<number>>(new Set());
  const [likedMemberIds, setLikedMemberIds] = useState<Set<number>>(new Set());
  const [form] = Form.useForm();
  const [headerNode, setHeaderNode] = useState<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!headerNode) return;
    const observer = new ResizeObserver(([entry]) => setHeaderHeight((entry.target as HTMLElement).offsetHeight));
    observer.observe(headerNode);
    return () => observer.disconnect();
  }, [headerNode]);

  const canEditVersionsByRole = user?.role === 'Developer' || user?.role === 'Admin';
  const canEditProjectByRole = user?.role === 'Admin';

  const toggleInSet = (setter: typeof setLikedVersionIds, id: number) =>
    setter(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['versions', projectId],
    queryFn: () => getVersions(projectId),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => getProjectMembers(projectId),
  });

  const { data: allUsers = [] } = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const { containerRef, pageSize, rowHeight, isMeasured } = useFillPageSize(3, !isLoading);

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

  const addMemberMutation = useMutation({
    mutationFn: (userId: number) => addProjectMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      setAddMemberId(null);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeProjectMember(projectId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-members', projectId] }),
  });

  useEffect(() => setVersionPage(1), [versionSearch, versionDateRange, pageSize]);
  useEffect(() => setMemberPage(1), [memberSearch, memberRoleFilter, pageSize]);

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

  const filteredVersions = versions.filter(v => {
    const matchesSearch = v.version.toLowerCase().includes(versionSearch.toLowerCase()) || v.description.toLowerCase().includes(versionSearch.toLowerCase());
    const matchesDate =
      !versionDateRange || (!dayjs(v.createdAt).isBefore(versionDateRange[0], 'day') && !dayjs(v.createdAt).isAfter(versionDateRange[1], 'day'));
    return matchesSearch && matchesDate;
  });
  const pagedVersions = filteredVersions.slice((versionPage - 1) * pageSize, versionPage * pageSize);
  const versionNumbers = new Map(versions.map((v, index) => [v.id, index + 1]));

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.email.toLowerCase().includes(memberSearch.toLowerCase());
    const matchesRole = memberRoleFilter.length === 0 || memberRoleFilter.includes(m.role);
    return matchesSearch && matchesRole;
  });
  const pagedMembers = filteredMembers.slice((memberPage - 1) * pageSize, memberPage * pageSize);
  const memberNumbers = new Map(members.map((m, index) => [m.id, index + 1]));

  const availableUsers = allUsers.filter(u => !members.some(m => m.id === u.id));

  const isBoardTab = !isLocked && activeTab === 'board';

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        ...(isBoardTab ? { margin: '-32px -24px' } : {}),
      }}
    >
      {isBoardTab && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, display: 'flex' }}>
          <Suspense
            fallback={
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
              </div>
            }
          >
            <ProjectBoardTab projectId={projectId} topInset={headerHeight} />
          </Suspense>
        </div>
      )}

      <div
        ref={setHeaderNode}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          ...(isBoardTab ? { padding: '32px 24px 0', background: token.colorBgLayout } : { flex: 1, minHeight: 0 }),
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
          {isBoardTab ? (
            <>
              <Text type="secondary"><Link to={`/projects/${projectId}`} style={{ color: 'inherit' }}>{project.name}</Link></Text>
              <Text type="secondary">/</Text>
              <Title level={3} style={{ margin: 0 }}>Проектная доска</Title>
            </>
          ) : (
            <>
              <Title level={3} style={{ margin: 0 }}>{project.name}</Title>
              <Tag color={PROJECT_STATUS_COLORS[project.status]}>{PROJECT_STATUS_LABELS[project.status]}</Tag>
              <Text type="secondary">— {project.description}</Text>
            </>
          )}
        </Space>
        <Space wrap>
          {readOnly && !isBoardTab && (
            <Text type="secondary">Проект доступен только для просмотра</Text>
          )}
          {canEditProject && (
            <Button icon={<EditOutlined />} onClick={() => { form.setFieldsValue(project); setEditModalOpen(true); }}>
              Редактировать проект
            </Button>
          )}
          {canEditProjectByRole && (
            <Button
              icon={isPinned(`/projects/${projectId}`) ? <PushpinFilled /> : <PushpinOutlined />}
              onClick={() => togglePin({ key: `/projects/${projectId}`, label: project.name, type: 'project' })}
            >
              {isPinned(`/projects/${projectId}`) ? 'Открепить' : 'Закрепить'}
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
        style={isBoardTab ? undefined : { flex: 1, minHeight: 0 }}
        styles={{
          header: isBoardTab ? { display: 'none' } : undefined,
          body: isBoardTab ? { display: 'none' } : { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
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
                      { title: 'Дата создания', dataIndex: 'createdAt' },
                      { title: 'Автор', dataIndex: 'authorName' },
                      { title: 'Краткое описание', dataIndex: 'description' },
                      canEditVersions
                        ? {
                            title: 'Действия',
                            key: 'actions',
                            render: (_: unknown, row: VersionWithDetails) => (
                              <Space>
                                <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/projects/${projectId}/versions/${row.id}/edit`)} />
                                <Button size="small" icon={<MessageOutlined />} onClick={() => message.info('Функция пока в разработке')} />
                                <Popconfirm title="Удалить версию?" onConfirm={() => deleteVersionMutation.mutate(row.id)} okText="Удалить" cancelText="Отмена">
                                  <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </Space>
                            ),
                          }
                        : { title: '', key: 'actions', render: () => null },
                      {
                        title: 'Лайк',
                        key: 'like',
                        width: 80,
                        render: (_: unknown, row: VersionWithDetails) => (
                          <Button
                            type="text"
                            size="small"
                            icon={likedVersionIds.has(row.id) ? <HeartFilled style={{ color: '#eb2f96' }} /> : <HeartOutlined />}
                            onClick={() => toggleInSet(setLikedVersionIds, row.id)}
                          />
                        ),
                      },
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
                    placeholder="Поиск участников"
                    allowClear
                    onChange={e => setMemberSearch(e.target.value)}
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
                            value={memberRoleFilter}
                            onChange={value => setMemberRoleFilter(value as Role[])}
                            options={(['Admin', 'Developer', 'Viewer'] as Role[]).map(r => ({ label: r, value: r }))}
                          />
                          {memberRoleFilter.length > 0 && (
                            <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => setMemberRoleFilter([])}>
                              Сбросить
                            </Button>
                          )}
                        </div>
                      }
                    >
                      <Button icon={<FilterOutlined />}>Фильтр{memberRoleFilter.length > 0 ? ` (${memberRoleFilter.length})` : ''}</Button>
                    </Popover>
                    {canEditProject && (
                      <>
                        <Select
                          placeholder="Выберите пользователя"
                          style={{ width: 240, maxWidth: '100%' }}
                          value={addMemberId}
                          options={availableUsers.map(u => ({ value: u.id, label: `${u.name} (${u.email})` }))}
                          onChange={setAddMemberId}
                          notFoundContent="Все пользователи уже добавлены"
                        />
                        <Button
                          type="primary"
                          icon={<UserAddOutlined />}
                          disabled={addMemberId === null}
                          loading={addMemberMutation.isPending}
                          onClick={() => addMemberId !== null && addMemberMutation.mutate(addMemberId)}
                        >
                          Добавить участника
                        </Button>
                      </>
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
                      locale={{ emptyText: 'В проекте пока нет участников' }}
                      columns={[
                        {
                          title: 'N',
                          key: 'index',
                          width: 50,
                          render: (_: unknown, row: ProjectMember) => memberNumbers.get(row.id),
                        },
                        {
                          title: 'Участник',
                          dataIndex: 'name',
                          render: (name: string, row: ProjectMember) => (
                            <Space>
                              <Avatar src={row.avatarUrl} icon={!row.avatarUrl ? <UserOutlined /> : undefined} size="small" />
                              <Link to={`/users/${row.id}`} state={{ fromProject: { id: projectId, name: project?.name ?? '' } }}>{name}</Link>
                            </Space>
                          ),
                        },
                        { title: 'Email', dataIndex: 'email' },
                        {
                          title: 'Роль',
                          dataIndex: 'role',
                          render: (role: Role) => <Tag color={ROLE_COLORS[role]} style={{ width: 84, textAlign: 'center' }}>{role}</Tag>,
                        },
                        { title: 'Дата добавления', dataIndex: 'addedAt' },
                        canEditProject
                          ? {
                              title: 'Действия',
                              key: 'actions',
                              render: (_: unknown, row: ProjectMember) => (
                                <Space>
                                  <Button size="small" icon={<MessageOutlined />} onClick={() => message.info('Функция пока в разработке')} />
                                  <Popconfirm title="Убрать участника из проекта?" onConfirm={() => removeMemberMutation.mutate(row.id)} okText="Убрать" cancelText="Отмена">
                                    <Button size="small" danger icon={<DeleteOutlined />} />
                                  </Popconfirm>
                                </Space>
                              ),
                            }
                          : { title: '', key: 'actions', render: () => null },
                        {
                          title: 'Лайк',
                          key: 'like',
                          width: 80,
                          render: (_: unknown, row: ProjectMember) => (
                            <Button
                              type="text"
                              size="small"
                              icon={likedMemberIds.has(row.id) ? <HeartFilled style={{ color: '#eb2f96' }} /> : <HeartOutlined />}
                              onClick={() => toggleInSet(setLikedMemberIds, row.id)}
                            />
                          ),
                        },
                      ]}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 24px', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                    <Pagination current={memberPage} pageSize={pageSize} total={filteredMembers.length} onChange={setMemberPage} />
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
                <Empty description="Этот раздел пока что в разработке" />
              </div>
            ),
          },
          {
            key: 'chat',
            label: 'Проектный чат',
            children: (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="Этот раздел пока что в разработке" />
              </div>
            ),
          },
          {
            key: 'board',
            label: 'Проектная доска',
            children: null,
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
    </div>
  );
}
