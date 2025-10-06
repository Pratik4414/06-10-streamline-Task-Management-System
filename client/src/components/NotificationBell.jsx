import React, { useEffect, useState } from 'react';
import { listNotifications, markNotificationRead } from '../services/api';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = async () => {
    const res = await listNotifications({ page: 1, limit: 10 });
    if (res.data?.success) {
      setItems(res.data.items);
      setUnread(res.data.items.filter(i => !i.read).length);
    }
  };

  useEffect(() => { 
    load(); 
    // Poll for notifications every 5 seconds for real-time updates
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const onOpen = () => { setOpen(!open); if (!open) load(); };
  const markRead = async (id) => {
    const res = await markNotificationRead(id);
    if (res.data?.success) {
      setItems(prev => prev.map(i => i._id === id ? { ...i, read: true } : i));
      setUnread(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button className="nav-link" title="Notifications" onClick={onOpen}>
        <span>🔔</span>
        {unread > 0 && <span style={{ marginLeft: 6, fontSize: 12 }}>({unread})</span>}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '120%', width: 320, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, zIndex: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>Notifications</div>
          {items.length === 0 ? (
            <div style={{ color: 'var(--muted)' }}>No notifications</div>
          ) : items.map(n => (
            <div key={n._id} style={{ padding: '8px 6px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{n.title}</div>
              {n.message && <div style={{ color: 'var(--muted)', fontSize: 13 }}>{n.message}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {!n.read && <button className="btn-primary" onClick={() => markRead(n._id)} style={{ padding: '4px 8px' }}>Mark read</button>}
                {n.link && <a className="nav-link" href={n.link} style={{ padding: '4px 8px' }}>Open</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
