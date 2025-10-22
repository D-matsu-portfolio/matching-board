import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Dropdown, Badge } from 'react-bootstrap';
import { BellFill } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';

export default function Notifications({ session }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (session) {
      // Fetch initial notifications
      const fetchNotifications = async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(10); // Get latest 10

        if (error) {
          console.error('Error fetching notifications:', error);
        } else {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      };
      fetchNotifications();

      // Set up real-time subscription
      const channel = supabase.channel(`notifications:${session.user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`
        }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const markAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (!error) {
        setNotifications(notifications.map(n => n.id === notificationId ? {...n, is_read: true} : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="link" id="dropdown-notifications" className="text-decoration-none position-relative">
        <BellFill size={20} color="black" />
        {unreadCount > 0 && (
          <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">
            {unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ minWidth: '300px' }}>
        <Dropdown.Header>通知</Dropdown.Header>
        {notifications.length === 0 ? (
          <Dropdown.ItemText>新しい通知はありません</Dropdown.ItemText>
        ) : (
          notifications.map(notification => (
            <Dropdown.Item 
              as={Link} 
              to={notification.link_to || '#'} 
              key={notification.id}
              onClick={() => !notification.is_read && markAsRead(notification.id)}
              className={!notification.is_read ? 'fw-bold' : ''}
            >
              <small>{notification.message}</small>
              <br />
              <small className="text-muted">{new Date(notification.created_at).toLocaleString()}</small>
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
