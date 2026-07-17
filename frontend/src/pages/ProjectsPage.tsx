import { useEffect, useState } from 'react';
import { Table, Input, Button, Modal, Form, Popconfirm, Space, Typography, Card, Row, Col, Statistic, Pagination, Popover, DatePicker, theme, Spin } from 'antd';
import {
  PlusOutlined,
  ProjectOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  TeamOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { getProjects, createProject, updateProject, deleteProject } from '../api/projectsApi';
import { getVersions } from '../api/versionsApi';
import { useAuth } from '../auth/AuthContext';
import { useFillPageSize } from '../hooks/useFillPageSize';

import type { Project } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ProjectRow extends Project {
  versionsCount: number;
  updatedAt: string;
}

export default function ProjectsPage() {
  const { token } = theme.useToken();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const canEditProjects = user?.role === 'Admin';

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['projects-with-versions'],
    queryFn: async (): Promise<ProjectRow[]> => {
      const projects = await getProjects();
      return Promise.all(
        projects.map(async project => {
          const versions = await getVersions(project.id);
          const updatedAt = versions.length > 0 ? versions[0].createdAt : '—';
          const createdAt = versions.length > 0 ? versions[versions.length - 1].createdAt : '—';
          return { ...project, versionsCount: versions.length, updatedAt, createdAt };
        }),
      );
    },
  });

  const { data: activeDevelopersCount = 0 } = useQuery({
    queryKey: ['active-developers', rows.map(r => r.id)],
    queryFn: async (): Promise<number> => {
      const allVersionsNested = await Promise.all(rows.map(row => getVersions(row.id)));
      const allVersions = allVersionsNested.flat();
      const uniqueAuthors = new Set(allVersions.map(v => v.authorId).filter(Boolean));
      return uniqueAuthors.size;
    },
    enabled: rows.length > 0,
  });

  const { containerRef, pageSize, rowHeight, isMeasured } = useFillPageSize(3, !isLoading);

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

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects-with-versions'] }),
  });

  const openEdit = (project: ProjectRow) => {
    setEditingProject(project);
    editForm.setFieldsValue({ name: project.name, description: project.description });
  };

  const filteredRows = rows.filter(row => {
    const matchesSearch = row.name.toLowerCase().includes(search.toLowerCase());
    const matchesDate =
      !dateRange ||
      (row.updatedAt !== '—' && !dayjs(row.updatedAt).isBefore(dateRange[0], 'day') && !dayjs(row.updatedAt).isAfter(dateRange[1], 'day'));
    return matchesSearch && matchesDate;
  });
  
  const today = dayjs();
  const createdTodayCount = rows.filter(row => row.createdAt !== '—' && dayjs(row.createdAt).isSame(today, 'day')).length;
  const updatedTodayCount = rows.filter(row => row.updatedAt !== '—' && dayjs(row.updatedAt).isSame(today, 'day')).length;
  
  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const rowNumbers = new Map(rows.map((row, index) => [row.id, index + 1]));

  useEffect(() => setPage(1), [search, dateRange, pageSize]);

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
            <Statistic title="Активных разработчиков" value={activeDevelopersCount} prefix={<TeamOutlined style={{ color: '#2f54eb' }} />} />
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
              {
                title: 'Создан',
                dataIndex: 'createdAt',
                render: (text: string) => text && text !== '—' ? dayjs(text).format('DD.MM.YYYY HH:mm') : '—',
              },
              { title: 'Название', dataIndex: 'name', render: (name: string, row: ProjectRow) => <Link to={`/projects/${row.id}`}>{name}</Link> },
              { title: 'Описание', dataIndex: 'description' },

              { title: 'Версий', dataIndex: 'versionsCount' },
              { title: 'Обновлено', dataIndex: 'updatedAt', render: (text: string) => text && text !== '—' ? dayjs(text).format('DD.MM.YYYY HH:mm') : '—' },
              canEditProjects
                ? {
                    title: 'Действия',
                    key: 'actions',
                    render: (_: unknown, row: ProjectRow) => (
                      <Space>
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
                        <Popconfirm title="Удалить проект?" onConfirm={() => deleteMutation.mutate(row.id)} okText="Удалить" cancelText="Отмена">
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
    </div>
  );
}
