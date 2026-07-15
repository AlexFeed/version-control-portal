import { Result } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export default function GlobalSearchPage() {
  return (
    <Result
      icon={<SearchOutlined />}
      title="Глобальный поиск"
      subTitle="Раздел в разработке. Скоро здесь появится глобальный поиск."
    />
  );
}
