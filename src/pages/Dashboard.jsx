import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, Button, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';

// Import management components
import Profile from '../components/Profile';
import Companies from '../components/Companies';
import Postings from '../components/Postings';
import Applicants from '../components/Applicants';
import MyApplications from '../components/MyApplications';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session) {
          navigate('/login');
        } else {
          setSession(session);
        }
      } catch (err) {
        setError(err.message);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    getSession();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/'); // Redirect to public postings page on sign out
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (session) {
    return (
      <div className="page-container pt-4">
        <Container style={{ maxWidth: '1140px', width: '100%' }}>
          <Tabs defaultActiveKey="profile" id="dashboard-tabs" className="mb-3">
            <Tab eventKey="profile" title="プロフィール">
              <Profile session={session} />
            </Tab>
            <Tab eventKey="my-applications" title="応募履歴">
              <MyApplications session={session} />
            </Tab>
            <Tab eventKey="companies" title="企業管理">
              <Companies session={session} />
            </Tab>
            <Tab eventKey="postings" title="募集管理">
              <Postings session={session} />
            </Tab>
            <Tab eventKey="applicants" title="応募者管理">
              <Applicants session={session} />
            </Tab>
          </Tabs>
        </Container>
      </div>
    );
  }

  return null; // Should be redirected, but as a fallback
}