import 'antd/dist/reset.css';
import { Layout, Space, Avatar, FloatButton } from 'antd';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { getCurrentUser, logout } from './services/auth.service';
import { UserT } from './types/user.type';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import About from './components/About';
import DetailArticle from './components/DetailArticle';
import Profile from './components/Profile';
import HotelList from './components/HotelList';
import HotelDetails from './components/HotelDetails';
import HotelManagement from './components/HotelManagement';
import Favorites from './components/Favorites';
import Messages from './components/Messages';
import Packages from './components/Packages';
import { LogoutOutlined, HomeOutlined, DashboardOutlined, InfoCircleOutlined, HeartFilled, SearchOutlined, AppstoreOutlined, MessageOutlined } from '@ant-design/icons';
import Copyright from './components/Copyright';
import './App.css';

const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserT | undefined>(undefined);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentUser(undefined);
    window.location.href = '/';
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center' }}>
          <nav style={{ flex: 1 }}>
            <Space size="large">
              <Link to="/">
                <img
                  src="/src/assets/small_Coventry_University.png"
                  alt="Coventry University"
                  style={{ height: 40 }}
                />
              </Link>
              
              <Link to="/hotels">
                <HomeOutlined style={{ fontSize: 24 }} />
              </Link>
              <Link to="/dashboard">
                <DashboardOutlined style={{ fontSize: 24 }} />
              </Link>
              <Link to="/about">
                <InfoCircleOutlined style={{ fontSize: 24 }} />
              </Link>
              {currentUser?.role === 'operator' && (
                <Link to="/hotel-management">
                  <AppstoreOutlined style={{ fontSize: 24 }} />
                </Link>
              )}
              <Link to="/Home">
                <SearchOutlined style={{ fontSize: 24 }} />
              </Link>
            </Space>
          </nav>
          <nav>
            {currentUser ? (
              <Space size="large">
                <Link to="/profile">
                  {currentUser.avatarUrl && currentUser.avatarUrl.includes('http') ? (
                    <Avatar size="large" src={currentUser.avatarUrl} />
                  ) : (
                    <Avatar size="large" style={{ backgroundColor: '#87d068' }}>
                      {currentUser.username.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                </Link>
                <Link to="/favorites">
                  <HeartFilled style={{ fontSize: 24 }} />
                </Link>
                <Link to="/messages">
                  <MessageOutlined style={{ fontSize: 24 }} />
                </Link>
                <a onClick={handleLogout} style={{ cursor: 'pointer' }}>
                  <LogoutOutlined style={{ fontSize: 24 }} />
                </a>
              </Space>
            ) : (
              <Space size="large">
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </Space>
            )}
          </nav>
        </Header>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/hotels" />} /> {/* Redirect root to /hotels */}
            <Route path="/hotels" element={<HotelList />} />
            <Route path="/hotel/:id" element={<HotelDetails />} />
            <Route path="/hotel-management" element={<HotelManagement />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/:aid" element={<DetailArticle />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/packages" element={<Packages />} />
          </Routes>
        </Content>
        <Footer style={{ textAlign: 'center', background: '#fff' }}>
          <Copyright />
          <img src="/src/assets/SHAPE_logo.png" alt="SHAPE Logo" style={{ height: 40, float: 'right' }} />
        </Footer>
        <FloatButton.BackTop />
      </Layout>
    </Router>
  );
};

export default App;