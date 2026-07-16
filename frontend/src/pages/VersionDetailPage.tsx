import { Space, Typography, Descriptions, Card, Spin, Empty, Button } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { getVersion } from '../api/versionsApi';
import { getProject } from '../api/projectsApi';
import { useAuth } from '../auth/AuthContext';
import { isProjectReadOnly } from '../projectStatus';

const { Title, Text } = Typography;

export default function VersionDetailPage() {
  const { id, versionId } = useParams();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
  });

  const { data: version, isLoading: versionLoading } = useQuery({
    queryKey: ['version', Number(versionId)],
    queryFn: () => getVersion(Number(versionId)),
  });

  if (projectLoading || versionLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project || !version) {
    return <Empty description="Версия не найдена" style={{ marginTop: 80 }} />;
  }

  const canEditVersion = (user?.role === 'Developer' || user?.role === 'Admin') && !isProjectReadOnly(project.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 20 }}>
        <Space align="baseline" wrap size={6}>
          <Text type="secondary"><Link to="/projects" style={{ color: 'inherit' }}>Проекты</Link></Text>
          <Text type="secondary">/</Text>
          <Text type="secondary"><Link to={`/projects/${projectId}`} style={{ color: 'inherit' }}>{project.name}</Link></Text>
          <Text type="secondary">/</Text>
          <Title level={3} style={{ margin: 0 }}>Версия {version.version}</Title>
          <Text type="secondary">— {version.description}</Text>
        </Space>
        {canEditVersion && (
          <Button icon={<EditOutlined />} onClick={() => navigate(`/projects/${projectId}/versions/${versionId}/edit`)}>
            Редактировать версию
          </Button>
        )}
      </Space>

      <Card>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Статус">Опубликована</Descriptions.Item>
          <Descriptions.Item label="Дата публикации">{dayjs(version.createdAt).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="Автор публикации">{version.authorName}</Descriptions.Item>
          <Descriptions.Item label="Изменения">
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {version.changes.map(change => <li key={change.id}>{change.description}</li>)}
            </ul>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
