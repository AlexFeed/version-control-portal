import { useEffect } from 'react';
import { Typography, Form, Input, Button, Space, Card, Tag, Divider, Empty, theme } from 'antd';
import { PlusOutlined, MinusCircleOutlined, HolderOutlined, TagsOutlined, UnorderedListOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProject } from '../api/projectsApi';
import { getVersion, createVersion, updateVersion } from '../api/versionsApi';

const { Title, Text, Paragraph } = Typography;

interface VersionFormValues {
  version: string;
  description: string;
  changes: { text: string }[];
}

export default function VersionFormPage() {
  const { token } = theme.useToken();
  const { id, versionId } = useParams();
  const projectId = Number(id);
  const isEditMode = Boolean(versionId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<VersionFormValues>();

  const { data: project } = useQuery({ queryKey: ['project', projectId], queryFn: () => getProject(projectId) });

  const { data: existingVersion } = useQuery({
    queryKey: ['version', versionId],
    queryFn: () => getVersion(Number(versionId)),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingVersion) {
      form.setFieldsValue({
        version: existingVersion.version,
        description: existingVersion.description,
        changes: existingVersion.changes.map(c => ({ text: c.description })),
      });
    }
  }, [existingVersion, form]);

  const saveMutation = useMutation({
    mutationFn: (values: VersionFormValues) => {
      const payload = {
        version: values.version,
        description: values.description,
        changeDescriptions: values.changes.map(c => c.text),
      };
      return isEditMode ? updateVersion(Number(versionId), payload) : createVersion(projectId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects-with-versions'] });
      navigate(`/projects/${projectId}`);
    },
  });

  const watchedVersion = Form.useWatch('version', form);
  const watchedDescription = Form.useWatch('description', form);
  const watchedChanges = Form.useWatch('changes', form);
  const previewChanges = (watchedChanges ?? []).filter((c): c is { text: string } => Boolean(c?.text));
  const hasPreviewContent = Boolean(watchedVersion) || Boolean(watchedDescription) || previewChanges.length > 0;

  const sectionHeading = (icon: React.ReactNode, label: string) => (
    <>
      <Space size={8} align="center">
        <span style={{ color: token.colorPrimary, fontSize: 15, display: 'flex' }}>{icon}</span>
        <Text strong style={{ fontSize: 15 }}>{label}</Text>
      </Space>
      <Divider style={{ margin: '12px 0 20px' }} />
    </>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Space align="baseline" wrap size={6} style={{ marginBottom: 20 }}>
        <Text type="secondary"><Link to="/projects" style={{ color: 'inherit' }}>Проекты</Link></Text>
        <Text type="secondary">/</Text>
        <Text type="secondary"><Link to={`/projects/${projectId}`} style={{ color: 'inherit' }}>{project?.name ?? ''}</Link></Text>
        <Text type="secondary">/</Text>
        <Title level={3} style={{ margin: 0 }}>{isEditMode ? 'Редактирование версии' : 'Новая версия'}</Title>
        <Text type="secondary">— Заполните информацию о версии проекта.</Text>
      </Space>

      <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', flexWrap: 'wrap', flex: 1, minHeight: 0 }}>
        <Card
          style={{ flex: '1 1 540px', minWidth: 320, display: 'flex', flexDirection: 'column' }}
          styles={{ body: { padding: 28, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 } }}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{ changes: [{ text: '' }] }}
            onFinish={values => saveMutation.mutate(values)}
            style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
          >
            {sectionHeading(<TagsOutlined />, 'Основная информация')}

            <Form.Item label="Номер версии" name="version" rules={[{ required: true, message: 'Введите номер версии' }]}>
              <Input size="large" placeholder="Например: 1.2.0" />
            </Form.Item>

            <Form.Item label="Краткое описание" name="description" rules={[{ required: true, message: 'Введите краткое описание' }]}>
              <Input.TextArea rows={3} maxLength={200} showCount placeholder="Краткое описание версии" />
            </Form.Item>

            <div style={{ marginTop: 8 }}>
              {sectionHeading(<UnorderedListOutlined />, 'Список изменений')}
            </div>

            <Form.List name="changes">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      flex: 1,
                      minHeight: 120,
                      overflowY: 'auto',
                      paddingRight: 2,
                    }}
                  >
                    {fields.map(({ key, name, ...restField }, index) => (
                      <div
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: token.borderRadius,
                          border: `1px solid ${token.colorBorderSecondary}`,
                          background: token.colorFillQuaternary,
                          flexShrink: 0,
                        }}
                      >
                        <HolderOutlined style={{ color: token.colorTextQuaternary, cursor: 'grab' }} />
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            flexShrink: 0,
                            borderRadius: '50%',
                            background: token.colorPrimaryBg,
                            color: token.colorPrimary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {index + 1}
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, 'text']}
                          rules={[{ required: true, message: 'Введите изменение' }]}
                          style={{ marginBottom: 0, flex: 1 }}
                        >
                          <Input variant="borderless" placeholder="Описание изменения" />
                        </Form.Item>
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
                      </div>
                    ))}
                  </div>
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block style={{ marginTop: 12, flexShrink: 0 }}>
                    Добавить изменение
                  </Button>
                </div>
              )}
            </Form.List>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 20,
                paddingTop: 20,
                borderTop: `1px solid ${token.colorBorderSecondary}`,
                flexShrink: 0,
              }}
            >
              <Button onClick={() => navigate(`/projects/${projectId}`)}>Отмена</Button>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={saveMutation.isPending}>
                {isEditMode ? 'Сохранить' : 'Создать версию'}
              </Button>
            </div>
          </Form>
        </Card>

        <Card
          style={{ flex: '1 1 300px', minWidth: 280, maxWidth: 380, display: 'flex', flexDirection: 'column' }}
          styles={{ body: { padding: 24, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowY: 'auto' } }}
          title={<Space size={8}><EyeOutlined style={{ color: token.colorPrimary }} />Предпросмотр</Space>}
        >
          {hasPreviewContent ? (
            <>
              <Tag color="blue" style={{ fontSize: 14, padding: '3px 12px', borderRadius: token.borderRadius, alignSelf: 'flex-start' }}>
                Версия {watchedVersion || '—'}
              </Tag>
              <Paragraph
                style={{ marginTop: 14, marginBottom: 18, color: watchedDescription ? undefined : token.colorTextQuaternary }}
              >
                {watchedDescription || 'Краткое описание появится здесь'}
              </Paragraph>
              <Text type="secondary" style={{ fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                Изменения
              </Text>
              {previewChanges.length > 0 ? (
                <ul style={{ margin: '10px 0 0', paddingLeft: 20 }}>
                  {previewChanges.map((change, index) => (
                    <li key={index} style={{ marginBottom: 4 }}>{change.text}</li>
                  ))}
                </ul>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>Пока нет изменений</Text>
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty description="Заполните форму, чтобы увидеть предпросмотр" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
