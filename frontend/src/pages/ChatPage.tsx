import { Result } from 'antd';
import { MessageOutlined } from '@ant-design/icons';

export default function ChatPage() {
  return (
    <Result
      icon={<MessageOutlined />}
      title="Глобальный чат"
      subTitle="Раздел в разработке. Скоро здесь появится глобальный чат команды."
    />
  );
}
