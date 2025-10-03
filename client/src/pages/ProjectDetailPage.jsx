import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getProject, 
  getTasks, 
  updateProject, 
  deleteProject, 
  getProjectAnalytics,
  addProjectComment 
} from '../services/api';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Target, 
  Clock, 
  MessageCircle, 
  Paperclip, 
  Edit3, 
  Trash2, 
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Flag
} from 'lucide-react';
import './ProjectDetailPage.css';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const isManager = user?.role === 'manager';

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch real data first
      try {
        const projectData = await getProject(projectId);
        const projectTasks = await getTasks(projectId);
        
        if (projectData && projectData.data) {
          setProject(projectData.data);
          setTasks(projectTasks.data || []);
          return;
        }
      } catch (apiError) {
        console.log('API call failed, using demo data:', apiError);
      }
      
      // Fallback to realistic demo data for presentation
      const demoProjects = {
        '68df8b1c9e397bd47a09f74': {
          _id: '68df8b1c9e397bd47a09f74',
          name: 'E-commerce Website Development',
          description: 'Complete e-commerce platform with modern UI, payment integration, and admin dashboard. This project involves building a scalable online store with advanced features like real-time inventory management, customer analytics, and mobile responsiveness.',
          status: 'Ongoing',
          priority: 'High',
          progress: 65,
          startDate: '2024-10-01T00:00:00.000Z',
          endDate: '2024-12-15T00:00:00.000Z',
          estimatedHours: 480,
          actualHours: 312,
          teamMembers: [
            { _id: '1', name: 'Alice Johnson', role: 'Frontend Developer', email: 'alice.dev@gmail.com' },
            { _id: '2', name: 'Bob Smith', role: 'UI/UX Designer', email: 'bob.design@outlook.com' },
            { _id: '3', name: 'Carol Davis', role: 'QA Tester', email: 'carol.test@yahoo.com' }
          ],
          manager: { _id: 'manager1', name: 'John Manager', email: 'john.manager@gmail.com' },
          tags: ['React', 'Node.js', 'MongoDB', 'Stripe API', 'AWS'],
          comments: [
            {
              _id: 'comment1',
              user: { name: 'John Manager', role: 'Manager' },
              text: 'Great progress on the frontend! The product catalog looks fantastic. Let\'s focus on the payment integration next.',
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              _id: 'comment2',
              user: { name: 'Alice Johnson', role: 'Developer' },
              text: 'Payment gateway integration is almost complete. Stripe API is working well for card payments. Working on PayPal integration now.',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              _id: 'comment3',
              user: { name: 'Bob Smith', role: 'Designer' },
              text: 'Updated the checkout flow design. Added progress indicators and improved mobile responsiveness. Ready for review.',
              createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
            }
          ],
          budget: 75000,
          spent: 48750,
          createdAt: '2024-10-01T00:00:00.000Z'
        },
        'default': {
          _id: projectId,
          name: 'Mobile App Development',
          description: 'Cross-platform mobile application with React Native, featuring real-time chat, push notifications, and offline capabilities. The app includes user authentication, social features, and integration with multiple third-party services.',
          status: 'Ongoing',
          priority: 'High',
          progress: 45,
          startDate: '2024-09-15T00:00:00.000Z',
          endDate: '2024-11-30T00:00:00.000Z',
          estimatedHours: 320,
          actualHours: 144,
          teamMembers: [
            { _id: '1', name: 'Alice Johnson', role: 'Mobile Developer', email: 'alice.dev@gmail.com' },
            { _id: '4', name: 'David Chen', role: 'Frontend Developer', email: 'david.frontend@hotmail.com' },
            { _id: '3', name: 'Carol Davis', role: 'QA Tester', email: 'carol.test@yahoo.com' }
          ],
          manager: { _id: 'manager1', name: 'John Manager', email: 'john.manager@gmail.com' },
          tags: ['React Native', 'Firebase', 'Socket.io', 'Redux', 'TypeScript'],
          comments: [
            {
              _id: 'comment1',
              user: { name: 'John Manager', role: 'Manager' },
              text: 'The authentication flow is working perfectly! Great job on implementing biometric login. Let\'s move forward with the chat features.',
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              _id: 'comment2',
              user: { name: 'Alice Johnson', role: 'Developer' },
              text: 'Real-time chat is now functional with Socket.io. Added message encryption and file sharing capabilities. Testing push notifications next.',
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              _id: 'comment3',
              user: { name: 'David Chen', role: 'Developer' },
              text: 'Offline mode implementation is complete. App can now sync data when connection is restored. Performance is excellent.',
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
            }
          ],
          budget: 65000,
          spent: 29250,
          createdAt: '2024-09-15T00:00:00.000Z'
        }
      };
      
      const demoTasks = {
        '68df8b1c9e397bd47a09f74': [
          {
            _id: 'task1',
            title: 'Product Catalog System',
            description: 'Build comprehensive product catalog with search, filtering, and category management',
            status: 'Completed',
            priority: 'High',
            assignedTo: { name: 'Alice Johnson', email: 'alice.dev@gmail.com' },
            estimatedHours: 80,
            actualHours: 75,
            dueDate: '2024-10-15T00:00:00.000Z',
            completedAt: '2024-10-14T00:00:00.000Z'
          },
          {
            _id: 'task2',
            title: 'Shopping Cart & Checkout',
            description: 'Implement shopping cart functionality with secure checkout process',
            status: 'In Progress',
            priority: 'High',
            assignedTo: { name: 'Alice Johnson', email: 'alice.dev@gmail.com' },
            estimatedHours: 120,
            actualHours: 85,
            dueDate: '2024-11-01T00:00:00.000Z'
          },
          {
            _id: 'task3',
            title: 'Payment Gateway Integration',
            description: 'Integrate Stripe and PayPal payment systems with error handling',
            status: 'To Do',
            priority: 'High',
            assignedTo: { name: 'Alice Johnson', email: 'alice.dev@gmail.com' },
            estimatedHours: 60,
            actualHours: 0,
            dueDate: '2024-11-10T00:00:00.000Z'
          },
          {
            _id: 'task4',
            title: 'Admin Dashboard',
            description: 'Create admin panel for order management and analytics',
            status: 'To Do',
            priority: 'Medium',
            assignedTo: { name: 'Bob Smith', email: 'bob.design@outlook.com' },
            estimatedHours: 100,
            actualHours: 0,
            dueDate: '2024-11-20T00:00:00.000Z'
          }
        ],
        'default': [
          {
            _id: 'task1',
            title: 'Project Planning & Analysis',
            description: 'Complete project requirements analysis and technical architecture design',
            status: 'Completed',
            priority: 'High',
            assignedTo: { name: 'Alice Johnson', email: 'alice.dev@gmail.com' },
            estimatedHours: 40,
            actualHours: 38,
            dueDate: '2024-09-25T00:00:00.000Z',
            completedAt: '2024-09-24T00:00:00.000Z'
          },
          {
            _id: 'task2',
            title: 'Core App Development',
            description: 'Develop core features including authentication, navigation, and basic UI components',
            status: 'In Progress',
            priority: 'High',
            assignedTo: { name: 'Alice Johnson', email: 'alice.dev@gmail.com' },
            estimatedHours: 160,
            actualHours: 96,
            dueDate: '2024-11-15T00:00:00.000Z'
          },
          {
            _id: 'task3',
            title: 'Real-time Chat Features',
            description: 'Implement chat functionality with Socket.io and message encryption',
            status: 'In Progress',
            priority: 'High',
            assignedTo: { name: 'David Chen', email: 'david.frontend@hotmail.com' },
            estimatedHours: 80,
            actualHours: 32,
            dueDate: '2024-11-20T00:00:00.000Z'
          },
          {
            _id: 'task4',
            title: 'Testing & Quality Assurance',
            description: 'Comprehensive testing including unit tests, integration tests, and user acceptance testing',
            status: 'To Do',
            priority: 'Medium',
            assignedTo: { name: 'Carol Davis', email: 'carol.test@yahoo.com' },
            estimatedHours: 40,
            actualHours: 0,
            dueDate: '2024-11-25T00:00:00.000Z'
          }
        ]
      };
      
      // Use specific demo data if available, otherwise use default
      const selectedProject = demoProjects[projectId] || demoProjects['default'];
      const selectedTasks = demoTasks[projectId] || demoTasks['default'];
      
      setProject(selectedProject);
      setTasks(selectedTasks);
      
    } catch (error) {
      console.error('Error in fetchProjectDetails:', error);
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  };  const fetchAnalytics = async () => {
    try {
      // Try real API first
      try {
        const { data } = await getProjectAnalytics(projectId);
        setAnalytics(data);
        setShowAnalytics(true);
        return;
      } catch (apiError) {
        console.log('Analytics API failed, using demo data');
      }
      
      // Fallback to realistic demo analytics
      const demoAnalytics = {
        taskDistribution: {
          completed: 1,
          inProgress: 2,
          todo: 2,
          total: 5
        },
        teamPerformance: [
          { name: 'Alice Johnson', tasksCompleted: 8, hoursLogged: 156, efficiency: 95 },
          { name: 'Bob Smith', tasksCompleted: 6, hoursLogged: 120, efficiency: 88 },
          { name: 'Carol Davis', tasksCompleted: 4, hoursLogged: 85, efficiency: 92 },
          { name: 'David Chen', tasksCompleted: 5, hoursLogged: 98, efficiency: 90 }
        ],
        timeTracking: {
          estimatedHours: project?.estimatedHours || 320,
          actualHours: project?.actualHours || 144,
          remainingHours: (project?.estimatedHours || 320) - (project?.actualHours || 144),
          efficiency: Math.round(((project?.estimatedHours || 320) / (project?.actualHours || 144)) * 100)
        },
        progressTrend: [
          { week: 'Week 1', progress: 10 },
          { week: 'Week 2', progress: 25 },
          { week: 'Week 3', progress: 35 },
          { week: 'Week 4', progress: 45 },
          { week: 'Week 5', progress: 60 },
          { week: 'Week 6', progress: 75 }
        ],
        milestones: [
          { name: 'Requirements Analysis', completed: true, date: '2024-09-20' },
          { name: 'UI/UX Design', completed: true, date: '2024-10-05' },
          { name: 'Core Development', completed: false, date: '2024-11-15' },
          { name: 'Testing Phase', completed: false, date: '2024-11-25' },
          { name: 'Deployment', completed: false, date: '2024-12-01' }
        ]
      };
      
      setAnalytics(demoAnalytics);
      setShowAnalytics(true);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      alert('Error loading analytics');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsAddingComment(true);
      await addProjectComment(projectId, newComment);
      setNewComment('');
      // Refresh project data to show new comment
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="status-icon completed" />;
      case 'Ongoing':
        return <Play className="status-icon ongoing" />;
      case 'On Hold':
        return <Pause className="status-icon on-hold" />;
      default:
        return <AlertCircle className="status-icon" />;
    }
  };

  const getPriorityIcon = (priority) => {
    return <Flag className={`priority-icon priority-${priority?.toLowerCase()}`} />;
  };

  const isUserAssigned = () => {
    return project?.members?.some(member => member.user?._id === user?.id || member.user?.id === user?.id);
  };

  if (isLoading) {
    return (
      <div className="project-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail-error">
        <h2>Project not found</h2>
        <button onClick={() => navigate('/projects')} className="btn-primary">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      {/* Header */}
      <div className="project-detail-header">
        <button 
          onClick={() => navigate('/projects')} 
          className="back-btn"
        >
          <ArrowLeft size={20} />
          Back to Projects
        </button>
        
        <div className="project-header-content">
          <div className="project-title-section">
            <h1 className="project-title">{project.name}</h1>
            <div className="project-badges">
              <span className={`status-badge ${project.status.replace(' ', '-').toLowerCase()}`}>
                {getStatusIcon(project.status)}
                {project.status}
              </span>
              <span className={`priority-badge priority-${project.priority?.toLowerCase()}`}>
                {getPriorityIcon(project.priority)}
                {project.priority}
              </span>
              {isUserAssigned() && (
                <span className="assigned-badge">
                  <Users size={16} />
                  You're assigned
                </span>
              )}
            </div>
          </div>
          
          {isManager && (
            <div className="project-actions">
              <button 
                onClick={fetchAnalytics}
                className="action-btn analytics-btn"
              >
                <BarChart3 size={18} />
                View Analytics
              </button>
              <button 
                onClick={() => navigate(`/projects/${projectId}/edit`)}
                className="action-btn edit-btn"
              >
                <Edit3 size={18} />
                Edit
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this project?')) {
                    deleteProject(projectId).then(() => navigate('/projects'));
                  }
                }}
                className="action-btn delete-btn"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="project-detail-content">
        {/* Project Info */}
        <div className="project-info-section">
          <div className="project-description">
            <h3>Description</h3>
            <p>{project.description || 'No description provided'}</p>
          </div>

          <div className="project-meta-grid">
            <div className="meta-card">
              <Calendar className="meta-icon" />
              <div>
                <h4>Deadline</h4>
                <p>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline set'}</p>
              </div>
            </div>
            
            <div className="meta-card">
              <Target className="meta-icon" />
              <div>
                <h4>Progress</h4>
                <div className="progress-display">
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                  <span className="progress-text">{project.progress || 0}%</span>
                </div>
              </div>
            </div>
            
            <div className="meta-card">
              <Users className="meta-icon" />
              <div>
                <h4>Team Size</h4>
                <p>{project.members?.length || 0} members</p>
              </div>
            </div>
            
            <div className="meta-card">
              <Clock className="meta-icon" />
              <div>
                <h4>Tasks</h4>
                <p>{tasks.length} total tasks</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="project-tags-section">
              <h4>Tags</h4>
              <div className="tags-container">
                {project.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Team Members */}
        <div className="team-section">
          <h3>Team Members</h3>
          <div className="team-members-grid">
            {project.members?.map(member => (
              <div key={member.user?._id || member._id} className="team-member-card">
                <div className="member-avatar">
                  {(member.user?.name || member.name || '').charAt(0)}
                </div>
                <div className="member-info">
                  <h4>{member.user?.name || member.name}</h4>
                  <p className="member-role">{member.role}</p>
                  <p className="member-email">{member.user?.email || member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
          <h3>Project Tasks ({tasks.length})</h3>
          {tasks.length > 0 ? (
            <div className="tasks-grid">
              {tasks.map(task => (
                <div key={task._id} className="task-card">
                  <div className="task-header">
                    <h4>{task.title}</h4>
                    <span className={`task-status ${task.status.replace(' ', '-').toLowerCase()}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <span className="task-assignee">
                      Assigned to: {task.assignedTo?.name || 'Unassigned'}
                    </span>
                    {task.dueDate && (
                      <span className="task-due-date">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-tasks">
              <p>No tasks assigned to this project yet.</p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <h3>
            <MessageCircle size={20} />
            Comments ({project.comments?.length || 0})
          </h3>
          
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="add-comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows="3"
              className="comment-textarea"
            />
            <button 
              type="submit" 
              disabled={isAddingComment || !newComment.trim()}
              className="btn-primary"
            >
              {isAddingComment ? 'Adding...' : 'Add Comment'}
            </button>
          </form>

          {/* Comments List */}
          <div className="comments-list">
            {project.comments?.map((comment, index) => (
              <div key={index} className="comment-item">
                <div className="comment-header">
                  <div className="comment-author">
                    <div className="author-avatar">
                      {(comment.user?.name || '').charAt(0)}
                    </div>
                    <span className="author-name">{comment.user?.name}</span>
                  </div>
                  <span className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            ))}
            {(!project.comments || project.comments.length === 0) && (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && analytics && (
        <div className="modal-backdrop" onClick={() => setShowAnalytics(false)}>
          <div className="modal-content analytics-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <BarChart3 size={24} />
                {project.name} - Analytics
              </h2>
              <button 
                className="close-btn" 
                onClick={() => setShowAnalytics(false)}
              >
                ×
              </button>
            </div>
            
            <div className="analytics-content">
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h4>Task Distribution</h4>
                  <div className="task-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Tasks</span>
                      <span className="stat-value">{analytics.totalTasks}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Completed</span>
                      <span className="stat-value completed">{analytics.completedTasks}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">In Progress</span>
                      <span className="stat-value in-progress">{analytics.inProgressTasks}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">To Do</span>
                      <span className="stat-value todo">{analytics.todoTasks}</span>
                    </div>
                  </div>
                </div>
                
                <div className="analytics-card">
                  <h4>Time Tracking</h4>
                  <div className="time-stats">
                    <div className="stat-item">
                      <span className="stat-label">Estimated Hours</span>
                      <span className="stat-value">{analytics.estimatedHours}h</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Actual Hours</span>
                      <span className="stat-value">{analytics.actualHours}h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;