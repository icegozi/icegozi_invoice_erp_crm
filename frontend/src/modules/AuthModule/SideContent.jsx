import { Space, Layout, Divider, Typography } from 'antd';
import useLanguage from '@/locale/useLanguage';
import { useSelector } from 'react-redux';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function SideContent() {
  const translate = useLanguage();

  return (
    <Content
      style={{
        padding: '150px 30px 30px',
        width: '100%',
        maxWidth: '450px',
        margin: '0 auto',
      }}
      className="sideContent"
    >
      <div style={{ width: '100%' }}>
        <div
          style={{
            margin: '0 0 40px',
            fontSize: 40,
            fontWeight: 800,
            color: '#1640D6',
            letterSpacing: '0.5px',
          }}
        >
          ic_goz_crm
        </div>

        <Title level={1} style={{ fontSize: 28 }}>
          Quản lý Hóa đơn / Báo giá / Thanh toán
        </Title>
        <Text>Giải pháp ERP / CRM cho doanh nghiệp của bạn</Text>

        <div className="space20"></div>
      </div>
    </Content>
  );
}
