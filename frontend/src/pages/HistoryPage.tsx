import { Result } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';

export default function HistoryPage() {
  return (
    <Result
      icon={<HistoryOutlined />}
      title="Глобальная история"
      subTitle="Раздел в разработке. Скоро здесь появится глобальная история изменений."
    />
  );
}
