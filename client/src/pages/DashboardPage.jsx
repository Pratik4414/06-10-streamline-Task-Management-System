
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getDashboardStats } from '../services/api'; // <-- Import the new API function
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Menu, MoreHorizontal, CheckSquare } from 'lucide-react';
import './DashboardPage.css';

const DashboardPage = () => {
    const { user } = useAuth();
    // State to hold real data from the API
    const [stats, setStats] = useState({
        completedTasksData: [],
        efficiencyData: [],
        scheduleData: []
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Could not fetch dashboard stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);
    
    if (!user || isLoading) return <div className="loading-state">Loading Dashboard...</div>;

    return (
        <div className="dashboard-container">
            {/* Top Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <button className="menu-button"><Menu size={24} /></button>
                    <div className="breadcrumbs">
                        <span>Tasks</span> / <span>Today</span>
                    </div>
                </div>
                <div className="header-right">
                    <a href="#" className="header-link">About</a>
                    <a href="#" className="header-link">Language</a>
                    <a href="#" className="header-link">Conditions</a>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                <main className="dashboard-main">
                    <h1 className="main-title">Task Management</h1>
                    <div className="kanban-placeholder">
                        <p>The main Kanban Board from the Tasks page would be displayed here.</p>
                        <CheckSquare size={48} />
                    </div>
                </main>

                <aside className="dashboard-sidebar">
                    <div className="widget user-profile">
                        <div className="profile-info">
                            <span className="profile-name">{user.name}</span>
                            <span className="profile-role">{user.email}</span>
                        </div>
                        <div className="profile-avatar-wrapper">
                           <div className="profile-avatar">{user.name.charAt(0)}</div>
                        </div>
                    </div>

                    <div className="widget">
                        <h3 className="widget-title">Completed Tasks</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={150}>
                                <BarChart data={stats.completedTasksData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{fill: 'rgba(255, 255, 255, 0.1)'}} contentStyle={{backgroundColor: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px'}}/>
                                    <Bar dataKey="tasks" radius={[4, 4, 0, 0]}>
                                        {stats.completedTasksData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill || '#8A63D2'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="widget">
                        <h3 className="widget-title">Efficiency</h3>
                        <div className="efficiency-grid">
                            {stats.efficiencyData.map(item => (
                                <div key={item.name} className="efficiency-item">
                                    <div className="pie-chart-wrapper">
                                        <ResponsiveContainer width={70} height={70}>
                                            <PieChart>
                                                <Pie data={[{ value: item.value }, { value: 100 - item.value }]} dataKey="value" innerRadius={22} outerRadius={30} startAngle={90} endAngle={450} stroke="none">
                                                    <Cell fill={item.fill || '#8A63D2'}/>
                                                    <Cell fill="var(--bg-secondary)"/>
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <span className="efficiency-value">{item.value}</span>
                                    </div>
                                    <span className="efficiency-author">{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="widget">
                        <h3 className="widget-title">Plan</h3>
                        <ul className="schedule-list">
                            {stats.scheduleData.map(item => (
                                <li key={item.time}>
                                    <span className="schedule-time">{item.time}</span>
                                    <span className="schedule-task">{item.task}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DashboardPage;