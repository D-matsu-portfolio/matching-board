import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function MyApplications({ session }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('applications')
          .select(`
            id,
            created_at,
            status,
            postings ( id, title, companies ( name ) )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setApplications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [session]);

  const handleMessageClick = async (application) => {
    try {
      // Check if a conversation already exists for this application
      let { data: conversation, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('application_id', application.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (conversation) {
        navigate(`/messages/${conversation.id}`);
      } else {
        // This case should ideally be handled by the company initiating contact,
        // but we can provide a read-only or "wait for reply" state if needed.
        alert("企業からの返信をお待ちください。");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h2>応募履歴・メッセージ</h2>
      {applications.length === 0 ? (
        <p>まだ応募した案件はありません。</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>企業名</th>
              <th>募集タイトル</th>
              <th>応募日時</th>
              <th>ステータス</th>
              <th>メッセージ</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.id}>
                <td>{app.postings.companies.name}</td>
                <td>{app.postings.title}</td>
                <td>{new Date(app.created_at).toLocaleString()}</td>
                <td><Badge bg="primary">{app.status}</Badge></td>
                <td>
                  <Button variant="outline-primary" size="sm" onClick={() => handleMessageClick(app)}>
                    メッセージを確認
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
