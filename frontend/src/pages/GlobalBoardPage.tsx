import { Result } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

export default function GlobalBoardPage() {
  return (
    <Result
      icon={<AppstoreOutlined />}
      title="Глобальная доска"
      subTitle="Раздел в разработке. Скоро здесь появится глобальная доска."
    />
  );
}
