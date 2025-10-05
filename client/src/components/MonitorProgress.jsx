import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Clock, CheckCircle2, AlertCircle, Users, Calendar } from 'lucide-react';
import './MonitorProgress.css';

const MonitorProgress = ({ project, tasks = [] }) => {
  const [progressData, setProgressData] = useState({
    overall: 0,
    taskCompletion: { todo: 0, inProgress: 0, done: 0 },
    timeTracking: { estimated: 0, actual: 0, remaining: 0 },
    teamPerformance: [],
    weeklyProgress: []
  });

  useEffect(() => {
    calculateProgress();
  }, [project, tasks]);

  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) {
      // Use demo data if no real tasks
      setProgressData({
        overall: project?.progress || 0,
        taskCompletion: {
          todo: 5,
          inProgress: 2,
          done: 3
        },
        timeTracking: {
          estimated: project?.estimatedHours || 320,
          actual: project?.actualHours || 144,
          remaining: (project?.estimatedHours || 320) - (project?.actualHours || 144)
        },
        teamPerformance: [
          { name: 'Alice Developer', completed: 8, inProgress: 2, efficiency: 92 },
          { name: 'Bob Designer', completed: 6, inProgress: 1, efficiency: 88 },
          { name: 'Carol Tester', completed: 4, inProgress: 1, efficiency: 95 }
        ],
        weeklyProgress: [
          { week: 'Week 1', progress: 10 },
          { week: 'Week 2', progress: 25 },
          { week: 'Week 3', progress: 35 },
          { week: 'Week 4', progress: 48 },
          { week: 'Week 5', progress: project?.progress || 65 }
        ]
      });
      return;
    }

    // Calculate from actual tasks
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'Done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const todoTasks = tasks.filter(t => t.status === 'To Do').length;
    
    const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    
    setProgressData({
      overall: overallProgress,
      taskCompletion: {
        todo: todoTasks,
        inProgress: inProgressTasks,
        done: doneTasks
      },
      timeTracking: {
        estimated: totalEstimated,
        actual: totalActual,
        remaining: totalEstimated - totalActual
      },
      teamPerformance: calculateTeamPerformance(tasks),
      weeklyProgress: generateWeeklyProgress(overallProgress)
    });
  };

  const calculateTeamPerformance = (tasks) => {
    const teamMap = {};
    tasks.forEach(task => {
      const member = task.assignedTo?.name || 'Unassigned';
      if (!teamMap[member]) {
        teamMap[member] = { completed: 0, inProgress: 0, total: 0 };
      }
      teamMap[member].total++;
      if (task.status === 'Done') teamMap[member].completed++;
      if (task.status === 'In Progress') teamMap[member].inProgress++;
    });

    return Object.entries(teamMap).map(([name, data]) => ({
      name,
      completed: data.completed,
      inProgress: data.inProgress,
      efficiency: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
    }));
  };

  const generateWeeklyProgress = (current) => {
    const weeks = 5;
    const increment = current / weeks;
    return Array.from({ length: weeks }, (_, i) => ({
      week: `Week ${i + 1}`,
      progress: Math.round(increment * (i + 1))
    }));
  };

  const COLORS = ['#8A63D2', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  const pieData = [
    { name: 'Completed', value: progressData.taskCompletion.done, color: '#10b981' },
    { name: 'In Progress', value: progressData.taskCompletion.inProgress, color: '#f59e0b' },
    { name: 'To Do', value: progressData.taskCompletion.todo, color: '#8A63D2' }
  ];

  return (
    <div className="monitor-progress-container">
      <h2 className="monitor-title">
        <TrendingUp size={24} />
        Monitor Progress - {project?.name}
      </h2>

      {/* Overall Progress Section */}
      <div className="progress-overview">
        <div className="progress-card main-progress">
          <h3>Overall Project Progress</h3>
          <div className="circular-progress">
            <svg className="progress-ring" width="200" height="200">
              <circle
                className="progress-ring-circle-bg"
                stroke="#2A2F45"
                strokeWidth="20"
                fill="transparent"
                r="80"
                cx="100"
                cy="100"
              />
              <circle
                className="progress-ring-circle"
                stroke="url(#gradient)"
                strokeWidth="20"
                fill="transparent"
                r="80"
                cx="100"
                cy="100"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - progressData.overall / 100)}`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8A63D2" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <text x="100" y="105" textAnchor="middle" className="progress-text">
                {progressData.overall}%
              </text>
            </svg>
          </div>
          <p className="progress-label">Project Completion</p>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon done">
              <CheckCircle2 size={24} />
            </div>
            <div className="metric-content">
              <h4>{progressData.taskCompletion.done}</h4>
              <p>Tasks Completed</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon progress">
              <Clock size={24} />
            </div>
            <div className="metric-content">
              <h4>{progressData.taskCompletion.inProgress}</h4>
              <p>In Progress</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon pending">
              <AlertCircle size={24} />
            </div>
            <div className="metric-content">
              <h4>{progressData.taskCompletion.todo}</h4>
              <p>Pending Tasks</p>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon team">
              <Users size={24} />
            </div>
            <div className="metric-content">
              <h4>{project?.members?.length || 3}</h4>
              <p>Team Members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Task Distribution Pie Chart */}
        <div className="chart-card">
          <h3>Task Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Progress Line Chart */}
        <div className="chart-card">
          <h3>Weekly Progress Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={progressData.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#383E5E" />
              <XAxis dataKey="week" stroke="#A3AED0" />
              <YAxis stroke="#A3AED0" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#2A2F45', border: '1px solid #383E5E', borderRadius: '8px' }}
              />
              <Line 
                type="monotone" 
                dataKey="progress" 
                stroke="#8A63D2" 
                strokeWidth={3}
                dot={{ fill: '#8A63D2', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Performance */}
      <div className="team-performance-section">
        <h3>Team Performance</h3>
        <div className="performance-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={progressData.teamPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#383E5E" />
              <XAxis dataKey="name" stroke="#A3AED0" />
              <YAxis stroke="#A3AED0" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#2A2F45', border: '1px solid #383E5E', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" />
              <Bar dataKey="inProgress" fill="#f59e0b" name="In Progress" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Member Cards */}
        <div className="team-cards">
          {progressData.teamPerformance.map((member, index) => (
            <div key={index} className="team-member-card">
              <div className="member-avatar">
                {member.name.charAt(0)}
              </div>
              <div className="member-info">
                <h4>{member.name}</h4>
                <div className="member-stats">
                  <span className="stat">✅ {member.completed} completed</span>
                  <span className="stat">🔄 {member.inProgress} in progress</span>
                </div>
                <div className="efficiency-bar">
                  <div className="efficiency-fill" style={{ width: `${member.efficiency}%` }}></div>
                  <span className="efficiency-label">{member.efficiency}% efficiency</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Tracking */}
      <div className="time-tracking-section">
        <h3>
          <Clock size={20} />
          Time Tracking
        </h3>
        <div className="time-cards">
          <div className="time-card">
            <h4>Estimated Hours</h4>
            <p className="time-value">{progressData.timeTracking.estimated}h</p>
          </div>
          <div className="time-card">
            <h4>Actual Hours</h4>
            <p className="time-value actual">{progressData.timeTracking.actual}h</p>
          </div>
          <div className="time-card">
            <h4>Remaining Hours</h4>
            <p className="time-value remaining">{progressData.timeTracking.remaining}h</p>
          </div>
          <div className="time-card">
            <h4>Efficiency Rate</h4>
            <p className="time-value efficiency">
              {progressData.timeTracking.estimated > 0 
                ? Math.round((progressData.timeTracking.estimated / (progressData.timeTracking.actual || 1)) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitorProgress;
