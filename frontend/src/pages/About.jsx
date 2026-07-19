import { Button, Result } from 'antd';

import useLanguage from '@/locale/useLanguage';

const About = () => {
  const translate = useLanguage();
  return (
    <Result
      status="info"
      title={'ic_goz_crm'}
      subTitle={'Ứng  dụng CSDL MongoDB vào bài toán quản lý khách hàng và hóa đơn. '}
      extra={
        <>
          <p>Phiên bản: 1.0.0</p>
          <p>
            Liên hệ : <a href="mailto:haxuanphuc92@gmail.com">haxuanphuc92@gmail.com</a>
          </p>
          <p style={{ color: '#8c8c8c', fontSize: 13 }}>
            Nhóm 3 - CSDL nâng cao
          </p>
          <Button
            type="primary"
            onClick={() => {
              window.open(`mailto:haxuanphuc92@gmail.com`);
            }}
          >
            {translate('Feetback')}
          </Button>
        </>
      }
    />
  );
};

export default About;
