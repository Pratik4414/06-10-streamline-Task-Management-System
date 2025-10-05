import React, { useState } from 'react';
import { updateTask } from '../services/api';
import { Play, Pause, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import './UpdateTaskStatus.css';

const UpdateTaskStatus = ({ task, onUpdate, onClose }) => {
  const [status, setStatus] = useState(task.status);
  const [actualHours, setActualHours] = useState(task.actualHours || 0);
  const [progressNote, setProgressNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = [
    { value: 'To Do', icon: Clock, label: 'To Do', color: '#8A63D2' },
    { value: 'In Progress', icon: Play, label: 'In Progress', color: '#f59e0b' },
    { value: 'Done', icon: CheckCircle, label: 'Done', color: '#10b981' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const updateData = {
        status,
        actualHours: parseFloat(actualHours),
        progressNote: progressNote.trim()
      };

      const response = await updateTask(task._id, updateData);
      
      if (response.data) {
        onUpdate(response.data);
        onClose();
      } else {
        setError('Failed to update task status');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHoursProgress = () => {
    if (!task.estimatedHours) return 0;
    return Math.min((actualHours / task.estimatedHours) * 100, 100);
  };

  return (
    <div className="update-status-modal-backdrop" onClick={onClose}>
      <div className="update-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Task Status</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="task-info">
          <h3>{task.title}</h3>
          <p className="task-description">{task.description}</p>
          <div className="task-meta">
            <span className={`priority-badge ${task.priority?.toLowerCase()}`}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span className="due-date">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="update-form">
          {/* Status Selection */}
          <div className="form-section">
            <label>Task Status *</label>
            <div className="status-options">
              {statusOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`status-option ${status === option.value ? 'active' : ''}`}
                    onClick={() => setStatus(option.value)}
                    style={{ 
                      borderColor: status === option.value ? option.color : 'transparent',
                      backgroundColor: status === option.value ? `${option.color}20` : 'transparent'
                    }}
                  >
                    <IconComponent size={20} color={option.color} />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hours Tracking */}
          <div className="form-section">
            <label htmlFor="actualHours">
              Actual Hours Worked
              {task.estimatedHours && (
                <span className="estimate-info">
                  (Estimated: {task.estimatedHours}h)
                </span>
              )}
            </label>
            <input
              type="number"
              id="actualHours"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              min="0"
              step="0.5"
              placeholder="Enter hours worked"
            />
            {task.estimatedHours > 0 && (
              <div className="hours-progress-bar">
                <div 
                  className="hours-progress-fill" 
                  style={{ 
                    width: `${getHoursProgress()}%`,
                    backgroundColor: getHoursProgress() > 100 ? '#ef4444' : '#10b981'
                  }}
                />
                <span className="hours-progress-text">
                  {Math.round(getHoursProgress())}% of estimated time
                </span>
              </div>
            )}
          </div>

          {/* Progress Note */}
          <div className="form-section">
            <label htmlFor="progressNote">
              <MessageSquare size={16} />
              Progress Note
            </label>
            <textarea
              id="progressNote"
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              placeholder="Describe what you've accomplished, any blockers, or next steps..."
              rows="4"
            />
            <span className="char-count">{progressNote.length} characters</span>
          </div>

          {/* Current Progress Summary */}
          <div className="progress-summary">
            <h4>Current Progress</h4>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-label">Status:</span>
                <span className="stat-value">{task.status} → {status}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Hours:</span>
                <span className="stat-value">
                  {task.actualHours || 0}h → {actualHours}h
                </span>
              </div>
              {task.estimatedHours && (
                <div className="stat">
                  <span className="stat-label">Remaining:</span>
                  <span className="stat-value">
                    {Math.max(task.estimatedHours - actualHours, 0)}h
                  </span>
                </div>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Action Buttons */}
          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTaskStatus;
