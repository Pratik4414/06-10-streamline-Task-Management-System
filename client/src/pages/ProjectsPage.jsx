
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { 
  getProjects, 
  createProject, 
  updateProject, 
  deleteProject,
  getProjectAnalytics,
  addProjectComment,
  getTeamOverview,
  uploadProjectFile 
} from '../services/api';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { 
  Plus, 
  Users, 
  FolderKanban, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Calendar, 
  Target, 
  MessageCircle, 
  Paperclip,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Upload,
  X,
  Tag,
  FileText,
  Download
} from 'lucide-react';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const isManager = user?.role === 'manager';

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    filterAndSortProjects();
  }, [projects, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const { data } = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortProjects = () => {
    let filtered = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'deadline') {
        aValue = new Date(aValue || '9999-12-31');
        bValue = new Date(bValue || '9999-12-31');
      }
      
      if (sortBy === 'progress') {
        aValue = a.progress || 0;
        bValue = b.progress || 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProjects(filtered);
  };

  const handleCreateProject = async (projectData) => {
    try {
      const { data } = await createProject(projectData);
      setProjects([data, ...projects]);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to create project", error);
      alert("Error: Could not create project.");
    }
  };

  const handleUpdateProject = async (projectData) => {
    try {
      const { data } = await updateProject(editingProject._id, projectData);
      setProjects(projects.map(p => p._id === editingProject._id ? data : p));
      setEditingProject(null);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to update project", error);
      alert("Error: Could not update project.");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p._id !== projectId));
    } catch (error) {
      console.error("Failed to delete project", error);
      alert("Error: Could not delete project.");
    }
  };

  const handleViewAnalytics = async (project) => {
    try {
      setSelectedProject(project);
      const { data } = await getProjectAnalytics(project._id);
      setAnalytics(data);
      setShowAnalytics(true);
    } catch (error) {
      console.error("Failed to fetch analytics", error);
      alert("Error: Could not load analytics.");
    }
  };

  const ProjectModal = () => {
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState(editingProject?.team?._id || "");
    const [formData, setFormData] = useState({
      name: editingProject?.name || '',
      description: editingProject?.description || '',
      priority: editingProject?.priority || 'Medium',
      deadline: editingProject?.deadline ? new Date(editingProject.deadline).toISOString().split('T')[0] : '',
      tags: editingProject?.tags?.join(', ') || ''
    });

    useEffect(() => {
      if (isManager) {
        getTeamOverview().then(res => {
          if (res.data && res.data.teams) setTeams(res.data.teams);
        });
      }
    }, []);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedTeamId) {
        alert("Please select a team for this project.");
        return;
      }

      const projectData = {
        ...formData,
        team: selectedTeamId,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      if (editingProject) {
        await handleUpdateProject(projectData);
      } else {
        await handleCreateProject(projectData);
      }
    };

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    return (
      <div className="modal-backdrop" onClick={() => {
        setShowModal(false);
        setEditingProject(null);
      }}>
        <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
          <h2 className="modal-title">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="input-group">
                <label>Project Name</label>
                <input 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Q4 Marketing Campaign" 
                  required 
                />
              </div>
              <div className="input-group">
                <label>Priority</label>
                <select 
                  name="priority" 
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            
            <div className="input-group">
              <label>Description</label>
              <textarea 
                name="description" 
                value={formData.description}
                onChange={handleChange}
                placeholder="A brief description of the project goals." 
                rows="3"
              />
            </div>
            
            <div className="form-row">
              <div className="input-group">
                <label>Assign Team</label>
                <select 
                  name="team" 
                  value={selectedTeamId} 
                  onChange={e => setSelectedTeamId(e.target.value)} 
                  required
                >
                  <option value="">Select a team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>
                      {team.name} ({team.members.length} members)
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Deadline</label>
                <input 
                  type="date" 
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="input-group">
              <label>Tags (comma-separated)</label>
              <input 
                name="tags" 
                value={formData.tags}
                onChange={handleChange}
                placeholder="web, react, nodejs, ecommerce"
              />
            </div>
            
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => {
                  setShowModal(false);
                  setEditingProject(null);
                }} 
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingProject ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AnalyticsModal = () => {
    if (!analytics || !selectedProject) return null;

    return (
      <div className="modal-backdrop" onClick={() => setShowAnalytics(false)}>
        <div className="modal-content analytics-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">
              <BarChart3 size={24} />
              {selectedProject.name} - Analytics
            </h2>
            <button 
              className="close-btn" 
              onClick={() => setShowAnalytics(false)}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>Task Distribution</h3>
              <div className="task-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Tasks</span>
                  <span className="stat-value">{analytics.totalTasks}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completed</span>
                  <span className="stat-value done">{analytics.completedTasks}</span>
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
              <h3>Time Tracking</h3>
              <div className="time-stats">
                <div className="stat-item">
                  <span className="stat-label">Estimated Hours</span>
                  <span className="stat-value">{analytics.estimatedHours}h</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Actual Hours</span>
                  <span className="stat-value">{analytics.actualHours}h</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Efficiency</span>
                  <span className={`stat-value ${analytics.efficiency > 100 ? 'over' : 'under'}`}>
                    {analytics.efficiency}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="analytics-card">
              <h3>Team Performance</h3>
              <div className="team-performance">
                {analytics.teamPerformance.map(member => (
                  <div key={member.userId} className="member-performance">
                    <span className="member-name">{member.name}</span>
                    <div className="performance-bar">
                      <div 
                        className="performance-fill" 
                        style={{ width: `${member.completionRate}%` }}
                      />
                    </div>
                    <span className="completion-rate">{member.completionRate}%</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="analytics-card">
              <h3>Project Health</h3>
              <div className="health-indicators">
                <div className="health-item">
                  <span className="health-label">On Schedule</span>
                  <span className={`health-status ${analytics.onSchedule ? 'good' : 'warning'}`}>
                    {analytics.onSchedule ? 'Yes' : 'Behind'}
                  </span>
                </div>
                <div className="health-item">
                  <span className="health-label">Budget Status</span>
                  <span className="health-status good">On Track</span>
                </div>
                <div className="health-item">
                  <span className="health-label">Risk Level</span>
                  <span className={`health-status ${analytics.riskLevel === 'Low' ? 'good' : analytics.riskLevel === 'Medium' ? 'warning' : 'danger'}`}>
                    {analytics.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="loading-state">Loading projects...</div>;

  // Quick stats for summary
  const totalProjects = projects.length;
  const ongoing = projects.filter(p => p.status === 'Ongoing').length;
  const completed = projects.filter(p => p.status === 'Completed').length;
  const onHold = projects.filter(p => p.status === 'On Hold').length;

  return (
    <div className="page-container">
      <header className="page-header modern-header">
        <div>
          <h1>Projects</h1>
          <div className="project-stats">
            <span><b>{totalProjects}</b> Total</span>
            <span className="ongoing"><b>{ongoing}</b> Ongoing</span>
            <span className="completed"><b>{completed}</b> Completed</span>
            <span className="onhold"><b>{onHold}</b> On Hold</span>
          </div>
        </div>
        {isManager && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={18}/> New Project
          </button>
        )}
      </header>

      {/* Enhanced Search and Filter Section */}
      <div className="controls-section">
        <div className="search-box">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters">
          <div className="filter-group">
            <Filter size={16} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
          
          <div className="filter-group">
            <Target size={16} />
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Sort by Name</option>
              <option value="deadline">Sort by Deadline</option>
              <option value="progress">Sort by Progress</option>
              <option value="priority">Sort by Priority</option>
            </select>
          </div>
          
          <button 
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} className="empty-icon"/>
          <h2>No Projects Found</h2>
          <p>
            {projects.length === 0 
              ? (isManager ? "Get started by creating your first project." : "You have not been assigned to any projects yet.")
              : "No projects match your current filters. Try adjusting your search criteria."
            }
          </p>
        </div>
      ) : (
        <div className="projects-grid modern-grid">
          {filteredProjects.map(project => (
            <div 
              key={project._id} 
              className="project-card modern-card"
              onClick={() => navigate(`/projects/${project._id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="card-header">
                <div className="status-priority">
                  <span className={`status-badge ${project.status.replace(' ', '-').toLowerCase()}`}>
                    {project.status}
                  </span>
                  <span className={`priority-badge priority-${project.priority?.toLowerCase()}`}>
                    {project.priority}
                  </span>
                </div>
                
                {isManager && (
                  <div className="card-actions">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewAnalytics(project);
                      }}
                      className="action-btn analytics-btn"
                      title="View Analytics"
                    >
                      <BarChart3 size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                        setShowModal(true);
                      }}
                      className="action-btn edit-btn"
                      title="Edit Project"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project._id);
                      }}
                      className="action-btn delete-btn"
                      title="Delete Project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <h3 className="project-name">{project.name}</h3>
              <p className="project-description">{project.description}</p>
              
              {project.tags && project.tags.length > 0 && (
                <div className="project-tags">
                  {project.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag">
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="tag more-tags">+{project.tags.length - 3}</span>
                  )}
                </div>
              )}
              
              <div className="project-meta">
                <div className="meta-item">
                  <Calendar size={14} />
                  <span>
                    {project.deadline 
                      ? new Date(project.deadline).toLocaleDateString()
                      : 'No deadline'
                    }
                  </span>
                </div>
                <div className="meta-item">
                  <Users size={14} />
                  <span>{project.members?.length || 0} members</span>
                </div>
              </div>
              
              <div className="progress-section">
                <div className="progress-info">
                  <span className="progress-label">Progress</span>
                  <span className="progress-percentage">{project.progress || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${project.progress || 0}%`,
                      backgroundColor: project.progress > 70 ? '#4BB543' : project.progress > 30 ? '#8A63D2' : '#EAB308'
                    }}
                  />
                </div>
              </div>
              
              <div className="project-footer">
                <div className="member-avatars">
                  {project.members?.slice(0, 5).map(member => (
                    <div 
                      key={member.user?._id || member._id} 
                      className="avatar" 
                      title={`${member.user?.name || member.name} (${member.role})`}
                    >
                      {(member.user?.name || member.name || '').charAt(0)}
                    </div>
                  ))}
                  {project.members?.length > 5 && (
                    <div className="avatar more">+{project.members.length - 5}</div>
                  )}
                </div>
                
                <div className="project-stats-icons">
                  {project.comments?.length > 0 && (
                    <div className="stat-icon" title={`${project.comments.length} comments`}>
                      <MessageCircle size={14} />
                      <span>{project.comments.length}</span>
                    </div>
                  )}
                  {project.attachments?.length > 0 && (
                    <div className="stat-icon" title={`${project.attachments.length} files`}>
                      <Paperclip size={14} />
                      <span>{project.attachments.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showModal && <ProjectModal />}
      {showAnalytics && <AnalyticsModal />}
    </div>
  );
};

export default ProjectsPage;