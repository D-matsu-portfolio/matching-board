import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

export default function Applicants({ session }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        setLoading(true);
        setError(null);
        const { user } = session;

        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.id);

        if (companiesError) throw companiesError;
        if (companies.length === 0) {
          setApplicants([]);
          return;
        }

        const companyIds = companies.map(c => c.id);

        const { data: applications, error: applicationsError } = await supabase
          .from('applications')
          .select(`
            id,
            created_at,
            status,
            profiles ( id, username, full_name, avatar_url ),
            postings ( id, title, company_id )
          `)
          .in('postings.company_id', companyIds)
          .order('created_at', { ascending: false });
        
        if (applicationsError) throw applicationsError;

        setApplicants(applications);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, [session]);

  const handleMessageClick = async (application) => {
    try {
      let { data: conversation, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('application_id', application.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (conversation) {
        navigate(`/messages/${conversation.id}`);
      } else {
        const { data: newConversation, error: insertError } = await supabase
          .from('conversations')
          .insert({
            application_id: application.id,
            user_id: application.profiles.id,
            company_owner_id: session.user.id,
          })
          .select('id')
          .single();
        
        if (insertError) throw insertError;
        
        navigate(`/messages/${newConversation.id}`);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="text-center"><Spinner animation="border" /></div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>応募者管理</h2>
      </div>
      {applicants.length === 0 ? (
        <p>まだ応募者はいません。</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>応募者名</th>
              <th>応募先の募集</th>
              <th>応募日時</th>
              <th>ステータス</th>
              <th>アクション</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map(app => (
              <tr key={app.id}>
                <td>{app.profiles?.full_name || app.profiles?.username || 'N/A'}</td>
                <td>
                  <Link to={`/postings/${app.postings?.id}`}>
                    {app.postings?.title || '削除された募集'}
                  </Link>
                </td>
                <td>{new Date(app.created_at).toLocaleString()}</td>
                <td><Badge bg="primary">{app.status}</Badge></td>
                <td>
                  <Button variant="outline-primary" size="sm" onClick={() => handleMessageClick(app)} disabled={!app.profiles || !app.postings}>
                    メッセージを送る
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