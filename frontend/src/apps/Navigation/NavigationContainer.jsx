import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Layout, Menu } from 'antd';

import { useAppContext } from '@/context/appContext';

import useLanguage from '@/locale/useLanguage';

import useResponsive from '@/hooks/useResponsive';

import {
  SettingOutlined,
  CustomerServiceOutlined,
  ContainerOutlined,
  FileSyncOutlined,
  DashboardOutlined,
  TagOutlined,
  TagsOutlined,
  UserOutlined,
  CreditCardOutlined,
  MenuOutlined,
  FileOutlined,
  ShopOutlined,
  FilterOutlined,
  WalletOutlined,
  ReconciliationOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Navigation() {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileSidebar /> : <Sidebar collapsible={false} />;
}

function Sidebar({ collapsible, isMobile = false }) {
  let location = useLocation();

  const { appContextAction } = useAppContext();
  const { navMenu } = appContextAction;
  const [currentPath, setCurrentPath] = useState(location.pathname.slice(1));

  const translate = useLanguage();
  const navigate = useNavigate();

  const items = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link to={'/'}>{translate('dashboard')}</Link>,
    },
    {
      key: 'customer',
      icon: <CustomerServiceOutlined />,
      label: <Link to={'/customer'}>{translate('customers')}</Link>,
    },

    {
      key: 'invoice',
      icon: <ContainerOutlined />,
      label: <Link to={'/invoice'}>{translate('invoices')}</Link>,
    },
    {
      key: 'quote',
      icon: <FileSyncOutlined />,
      label: <Link to={'/quote'}>{translate('quote')}</Link>,
    },
    {
      key: 'payment',
      icon: <CreditCardOutlined />,
      label: <Link to={'/payment'}>{translate('payments')}</Link>,
    },

    {
      key: 'paymentMode',
      label: <Link to={'/payment/mode'}>{translate('payments_mode')}</Link>,
      icon: <WalletOutlined />,
    },
    {
      key: 'taxes',
      label: <Link to={'/taxes'}>{translate('taxes')}</Link>,
      icon: <ShopOutlined />,
    },
    {
      key: 'generalSettings',
      label: <Link to={'/settings'}>{translate('settings')}</Link>,
      icon: <SettingOutlined />,
    },
    {
      key: 'about',
      label: <Link to={'/about'}>{translate('about')}</Link>,
      icon: <ReconciliationOutlined />,
    },
  ];

  useEffect(() => {
    if (location)
      if (currentPath !== location.pathname) {
        if (location.pathname === '/') {
          setCurrentPath('dashboard');
        } else setCurrentPath(location.pathname.slice(1));
      }
  }, [location, currentPath]);

  const onCollapse = () => {
    navMenu.collapse();
  };

  return (
    <Sider
      collapsible={collapsible}
      collapsed={collapsible ? isNavMenuClose : collapsible}
      onCollapse={onCollapse}
      className="navigation"
      width={256}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100vh',
        position: isMobile ? 'absolute' : 'sticky',
        top: 0,
        left: 0,
      }}
      theme={'light'}
    >
      <div
        className="brandLogo"
        onClick={() => navigate('/')}
        style={{
          cursor: 'pointer',
        }}
      >
        <span className="brandLogoMark">IG</span>
        <span className="brandLogoName">
          ic_goz<strong>_crm</strong>
        </span>
      </div>
      <Menu
        items={items}
        mode="inline"
        theme={'light'}
        selectedKeys={[currentPath]}
        style={{
          width: 256,
        }}
      />
    </Sider>
  );
}

function MobileSidebar() {
  const [visible, setVisible] = useState(false);
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };

  return (
    <>
      <Button
        type="text"
        size="large"
        onClick={showDrawer}
        className="mobile-sidebar-btn"
        style={{ ['marginLeft']: 25 }}
      >
        <MenuOutlined style={{ fontSize: 18 }} />
      </Button>
      <Drawer
        width={250}
        // style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}
        placement={'left'}
        closable={false}
        onClose={onClose}
        open={visible}
      >
        <Sidebar collapsible={false} isMobile={true} />
      </Drawer>
    </>
  );
}
