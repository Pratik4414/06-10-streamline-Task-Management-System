import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProject, getTasks } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import MonitorProgress from '../components/MonitorProgress';
import './MonitorProgressPage.css';

const MonitorProgressPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      const projectData = await getProject(projectId);
      const projectTasks = await getTasks(projectId);
      
      if (projectData && projectData.data) {
        setProject(projectData.data);
        setTasks(projectTasks.data || []);
      } else {
        setError('Project not found');
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      setError('Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="monitor-progress-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading project data...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="monitor-progress-page-error">
        <h2>{error || 'Project not found'}</h2>
        <button onClick={() => navigate('/projects')} className="btn-primary">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="monitor-progress-page">
      <div className="monitor-progress-header">
        <button 
          onClick={() => navigate(`/projects/${projectId}`)} 
          className="back-btn"
        >
          <ArrowLeft size={20} />
          Back to Project
        </button>
        <h1>Monitor Progress - {project.name}</h1>
      </div>
      
      <div className="monitor-progress-content">
        <MonitorProgress project={project} tasks={tasks} />
      </div>
    </div>
  );
};

export default MonitorProgressPage;
