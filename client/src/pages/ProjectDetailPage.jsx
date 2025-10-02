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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const isManager = user?.role === 'manager';

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      console.log('=== ProjectDetailPage Debug START ===');
      console.log('Project ID from URL params:', id);
      console.log('Current user:', user);
      console.log('Auth token exists:', !!token);
      console.log('Full token:', token);
      
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      console.log('Making API call to getProject with ID:', id);
      console.log('API URL will be: /api/projects/' + id);
      
      // Test direct API call with debugging
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Raw fetch response:', response);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const projectData = await response.json();
      console.log('Project data parsed:', projectData);
      
      if (projectData) {
        setProject(projectData);
        console.log('Project set successfully');
      } else {
        console.log('No project data in response');
        setError('Project not found');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('401')) {
        console.log('Authentication failed, redirecting to login');
        navigate('/login');
      } else if (error.message.includes('404')) {
        console.log('Project not found (404)');
        setError('Project not found');
      } else {
        console.log('Other error occurred:', error.message);
        setError('Failed to load project details: ' + error.message);
      }
    } finally {
      setIsLoading(false);
      console.log('=== ProjectDetailPage Debug END ===');
    }
  };  const fetchAnalytics = async () => {
    try {
      const { data } = await getProjectAnalytics(projectId);
      setAnalytics(data);
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