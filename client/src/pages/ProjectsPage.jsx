
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getProjects, createProject, getTeamOverview } from '../services/api';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Plus, Users, FolderKanban } from 'lucide-react';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const isManager = user?.role === 'manager';

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);
  
  const CreateProjectModal = () => {
    const [teams, setTeams] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState("");
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
      const newProject = {
        name: e.target.name.value,
        description: e.target.description.value,
        team: selectedTeamId
      };
      try {
        const { data } = await createProject(newProject);
        setProjects([data, ...projects]);
        setShowModal(false);
      } catch (error) {
        console.error("Failed to create project", error);
        alert("Error: Could not create project.");
      }
    };

    return (
      <div className="modal-backdrop" onClick={() => setShowModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2 className="modal-title">Create New Project</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Project Name</label>
              <input name="name" placeholder="e.g., Q4 Marketing Campaign" required />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea name="description" placeholder="A brief description of the project goals." rows="3"></textarea>
            </div>
            <div className="input-group">
              <label>Assign Team</label>
              <select name="team" value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)} required>
                <option value="">Select a team</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name} ({team.members.length} members)</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Project</button>
            </div>
          </form>
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
        {isManager && <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={18}/> New Project</button>}
      </header>
      {projects.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} className="empty-icon"/>
          <h2>No Projects Found</h2>
          <p>{isManager ? "Get started by creating your first project." : "You have not been assigned to any projects yet."}</p>
        </div>
      ) : (
        <div className="projects-grid modern-grid">
          {projects.map(p => (
            <div key={p._id} className="project-card modern-card">
              <div className="card-header">
                <span className={`status-badge ${p.status.replace(' ', '-').toLowerCase()}`}>{p.status}</span>
                <span className="project-dates">
                  {p.startDate && <span>Start: {new Date(p.startDate).toLocaleDateString()}</span>}
                  {p.endDate && <span>End: {new Date(p.endDate).toLocaleDateString()}</span>}
                </span>
              </div>
              <h3 className="project-name">{p.name}</h3>
              <p className="project-description">{p.description}</p>
              <div className="project-team-info">
                <span className="team-label">Team:</span>
                <span className="team-name">{p.team?.name || 'N/A'}</span>
                <span className="manager-label">Manager:</span>
                <span className="manager-name">{p.manager?.name || 'N/A'}</span>
              </div>
              <div className="progress-section">
                <CircularProgressbar
                  value={p.progress || 0}
                  text={`${p.progress || 0}%`}
                  styles={buildStyles({
                    textColor: '#333',
                    pathColor: p.progress > 70 ? '#4BB543' : '#8A63D2',
                    trailColor: '#eee',
                  })}
                />
                <div className="progress-label">Progress</div>
              </div>
              <div className="project-footer">
                <div className="member-avatars">
                  {p.members.slice(0, 5).map(m => (
                    <div key={m.user?._id || m._id} className="avatar" title={m.user?.name || m.name}>
                      {(m.user?.name || m.name || '').charAt(0)}
                    </div>
                  ))}
                  {p.members.length > 5 && <div className="avatar more">+{p.members.length - 5}</div>}
                </div>
                <span className="member-count"><Users size={14}/> {p.members.length} Members</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <CreateProjectModal />}
    </div>
  );
};

export default ProjectsPage;