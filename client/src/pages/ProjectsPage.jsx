
import React, { useState, useEffect } from 'react';
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
      const [team, setTeam] = useState([]);
      
      useEffect(() => {
          if(isManager) {
              getTeamMembers().then(res => setTeam(res.data));
          }
      }, []);

      const handleSubmit = async (e) => {
          e.preventDefault();
          const selectedMembers = Array.from(e.target.members.selectedOptions, option => option.value);
          const newProject = {
              name: e.target.name.value,
              description: e.target.description.value,
              members: selectedMembers
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
                        <label>Assign Team Members</label>
                        <select name="members" multiple required>
                            {team.map(member => <option key={member._id} value={member._id}>{member.name} ({member.email})</option>)}
                        </select>
                      </div>
                      <div className="modal-actions">
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Create Project</button>
                      </div>
                  </form>
              </div>
          </div>
      )
  };

  if (isLoading) return <div className="loading-state">Loading projects...</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Projects</h1>
        {isManager && <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={18}/> New Project</button>}
      </header>
      {projects.length === 0 ? (
        <div className="empty-state">
            <FolderKanban size={48} className="empty-icon"/>
            <h2>No Projects Found</h2>
            <p>{isManager ? "Get started by creating your first project." : "You have not been assigned to any projects yet."}</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p._id} className="project-card">
              <span className={`status-badge ${p.status.replace(' ', '-').toLowerCase()}`}>{p.status}</span>
              <h3 className="project-name">{p.name}</h3>
              <p className="project-description">{p.description}</p>
              <div className="project-footer">
                <div className="member-avatars">
                    {p.members.slice(0, 3).map(m => <div key={m._id} className="avatar" title={m.name}>{m.name.charAt(0)}</div>)}
                    {p.members.length > 3 && <div className="avatar more">+{p.members.length - 3}</div>}
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