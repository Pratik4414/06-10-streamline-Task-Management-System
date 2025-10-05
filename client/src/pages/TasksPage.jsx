
import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, getProjects, getTeamMembers, deleteTask } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, X, Trash2, Edit, FileText } from 'lucide-react';
import UpdateTaskStatus from '../components/UpdateTaskStatus.jsx';
import SubmitReport from '../components/SubmitReport.jsx';
import './TasksPage.css';

// --- Create Task Modal Component ---
const CreateTaskModal = ({ projects, team, setShowModal, setTasks, setColumns }) => {
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Debug logging
    console.log('CreateTaskModal - Projects available:', projects);
    console.log('CreateTaskModal - Team members available:', team);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // <-- Set loading to true
        setError('');

        const taskData = {
            title: e.target.title.value,
            project: e.target.project.value,
            assignedTo: e.target.assignedTo.value,
            priority: e.target.priority.value,
            status: 'To Do',
        };

        const res = await createTask(taskData);
        setIsSubmitting(false); // <-- Set loading to false

        if (res._id) {
            setColumns(prevColumns => ({
                ...prevColumns,
                'To Do': [res, ...prevColumns['To Do']]
            }));
            setTasks(prevTasks => [res, ...prevTasks]);
            setShowModal(false);
        } else {
            // *** THIS IS THE FIX ON THE FRONTEND ***
            // Display the specific error message from the server.
            setError(res.error || "Failed to create task. Please try again.");
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Create New Task</h2>
                    <button onClick={() => setShowModal(false)} className="close-button"><X size={24}/></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <input name="title" placeholder="Task Title" required />
                    <select name="project" required>
                        <option value="">Select Project</option>
                        {projects && projects.length > 0 ? (
                            projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)
                        ) : (
                            <option disabled>No projects available</option>
                        )}
                    </select>
                    <select name="assignedTo" required>
                        <option value="">Assign To</option>
                        {team && team.length > 0 ? (
                            team.map(m => <option key={m._id} value={m._id}>{m.name}</option>)
                        ) : (
                            <option disabled>No team members available</option>
                        )}
                    </select>
                    <select name="priority" defaultValue="Medium">
                        <option>Low</option><option>Medium</option><option>High</option>
                    </select>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? <div className="spinner"></div> : 'Create Task'}
                    </button>
                </form>
            </div>
        </div>
    );
};


// --- Main Tasks Page Component ---
const TasksPage = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [columns, setColumns] = useState({ 'To Do': [], 'In Progress': [], 'Done': [] });
    const [projects, setProjects] = useState([]);
    const [team, setTeam] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const isManager = user?.role === 'manager';

    const groupTasksByStatus = useCallback((tasksToGroup) => {
        return tasksToGroup.reduce((acc, task) => {
            const { status } = task;
            if (!acc[status]) acc[status] = [];
            acc[status].push(task);
            return acc;
        }, { 'To Do': [], 'In Progress': [], 'Done': [] });
    }, []);

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        
        try {
            await deleteTask(taskId);
            // Remove task from state
            setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));
            setColumns(prevColumns => {
                const newColumns = { ...prevColumns };
                Object.keys(newColumns).forEach(status => {
                    newColumns[status] = newColumns[status].filter(t => t._id !== taskId);
                });
                return newColumns;
            });
        } catch (error) {
            console.error('Failed to delete task:', error);
            alert('Failed to delete task. Please try again.');
        }
    };

    const handleUpdateTask = (updatedTask) => {
        setTasks(prevTasks => prevTasks.map(t => t._id === updatedTask._id ? updatedTask : t));
        setColumns(groupTasksByStatus(tasks.map(t => t._id === updatedTask._id ? updatedTask : t)));
    };

    const handleSubmitReport = async (reportData) => {
        console.log('Report submitted:', reportData);
        alert('Report submitted successfully! Your manager will review it soon.');
    };
    
    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            getTasks(),
            isManager ? getProjects() : Promise.resolve({ data: [] }),
            isManager ? getTeamMembers() : Promise.resolve({ data: [] })
        ]).then(([tasksRes, projectsRes, teamRes]) => {
            console.log('TasksPage - Raw responses:', { tasksRes, projectsRes, teamRes });
            console.log('TasksPage - Projects data:', projectsRes.data);
            console.log('TasksPage - Team data:', teamRes.data);
            
            setTasks(tasksRes.data || tasksRes);
            setColumns(groupTasksByStatus(tasksRes.data || tasksRes));
            setProjects(projectsRes.data || []);
            setTeam(teamRes.data || []);
        }).catch(err => {
            console.error("Failed to load task page data", err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, [isManager, groupTasksByStatus]);
    
    if (isLoading) {
        return <div className="loading-state">Loading tasks...</div>
    }

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Task Board</h1>
                {isManager && <button className="btn-primary" onClick={() => setShowCreateModal(true)}><Plus size={18}/> Create Task</button>}
            </header>
            <div className="kanban-board">
                {Object.keys(columns).map(status => (
                    <div key={status} className="kanban-column">
                        <h3 className="column-title">{status} <span>({columns[status].length})</span></h3>
                        <div className="column-tasks">
                            {columns[status].map(task => (
                                <div key={task._id} className="kanban-task">
                                    <div className="task-header-row">
                                        <p className="task-title">{task.title}</p>
                                        <div className="task-actions">
                                            {isManager && status === 'To Do' && (
                                                <button 
                                                    className="task-action-btn delete-btn"
                                                    onClick={() => handleDeleteTask(task._id)}
                                                    title="Delete task"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            {!isManager && (
                                                <>
                                                    <button 
                                                        className="task-action-btn update-btn"
                                                        onClick={() => {
                                                            setSelectedTask(task);
                                                            setShowUpdateModal(true);
                                                        }}
                                                        title="Update status"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        className="task-action-btn report-btn"
                                                        onClick={() => {
                                                            setSelectedTask(task);
                                                            setShowReportModal(true);
                                                        }}
                                                        title="Submit report"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="task-footer">
                                        <div className="assignee-info">
                                            Assigned to: {task.assignedTo?.name || 'Unassigned'}
                                        </div>
                                        <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {showCreateModal && <CreateTaskModal projects={projects} team={team} setShowModal={setShowCreateModal} setTasks={setTasks} setColumns={setColumns} />}
            {showUpdateModal && selectedTask && (
                <UpdateTaskStatus 
                    task={selectedTask}
                    onUpdate={handleUpdateTask}
                    onClose={() => {
                        setShowUpdateModal(false);
                        setSelectedTask(null);
                    }}
                />
            )}
            {showReportModal && selectedTask && (
                <SubmitReport
                    task={selectedTask}
                    onSubmit={handleSubmitReport}
                    onClose={() => {
                        setShowReportModal(false);
                        setSelectedTask(null);
                    }}
                />
            )}
        </div>
    );
};

export default TasksPage;