
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import './Layout.css';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const isManager = user?.role === 'manager';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="app-layout">
            <aside className="main-sidebar">
                <div className="sidebar-header">
                    <div className="logo">T</div>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className="nav-link" title="Dashboard"><LayoutDashboard size={22} /></NavLink>
                    <NavLink to="/projects" className="nav-link" title="Projects"><FolderKanban size={22} /></NavLink>
                    <NavLink to="/tasks" className="nav-link" title="Tasks"><CheckSquare size={22} /></NavLink>
                    {isManager && <NavLink to="/team" className="nav-link" title="Team"><Users size={22} /></NavLink>}
                </nav>
                <div className="sidebar-footer">
                    <NavLink to="/settings" className="nav-link" title="Settings"><Settings size={22} /></NavLink>
                    <button onClick={handleLogout} className="nav-link" title="Logout"><LogOut size={22} /></button>
                </div>
            </aside>
            <div className="content-wrapper">
                {children}
            </div>
        </div>
    );
};

export default Layout;