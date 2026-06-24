import { Button, Result } from 'antd';

import useLanguage from '@/locale/useLanguage';

const About = () => {
  const translate = useLanguage();
  return (
    <Result
      status="info"
      title={'InvoiceCRM'}
      subTitle={'Hệ thống quản lý Hóa đơn / Báo giá / Thanh toán / Khách hàng'}
      extra={
        <>
          <p>Phiên bản: 1.0.0</p>
          <p>
            Liên hệ : <a href="mailto:support@your-domain.com">support@your-domain.com</a>
          </p>
          <p style={{ color: '#8c8c8c', fontSize: 13 }}>
            Dựa trên IDURAR ERP/CRM — giấy phép GNU AGPL v3.0
          </p>
          <Button
            type="primary"
            onClick={() => {
              window.open(`mailto:support@your-domain.com`);
            }}
          >
            {translate('Contact us')}
          </Button>
        </>
      }
    />
  );
};

export default About;
