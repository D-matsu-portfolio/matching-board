import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Container, Card, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';

export default function PostingDetails() {
  const { id } = useParams(); // Get posting ID from URL
  const [posting, setPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState({ applied: false, loading: true });

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  useEffect(() => {
    const fetchPosting = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('postings')
          .select(`
            *,
            companies (*)
          `)
          .eq('id', id)
          .single(); // Fetch a single record

        if (error) throw error;
        setPosting(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosting();
  }, [id]);

  useEffect(() => {
    // Check if the user has already applied once session and posting are loaded
    if (session && posting) {
      const checkApplication = async () => {
        try {
          setApplicationStatus({ ...applicationStatus, loading: true });
          const { data, error } = await supabase
            .from('applications')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('posting_id', posting.id)
            .maybeSingle(); // Use maybeSingle to avoid error if no record found

          if (error) throw error;
          if (data) {
            setApplicationStatus({ applied: true, loading: false });
          } else {
            setApplicationStatus({ applied: false, loading: false });
          }
        } catch (err) {
          setError(err.message);
        }
      };
      checkApplication();
    } else {
       setApplicationStatus({ applied: false, loading: false });
    }
  }, [session, posting]);

  const handleApply = async () => {
    if (!session) {
      alert('応募するにはログインが必要です。');
      return;
    }
    try {
      setApplicationStatus({ ...applicationStatus, loading: true });
      const userId = session.user.id;

      // Self-healing: Ensure a profile exists for the user before applying.
      // An upsert will create the profile if it's missing, fixing inconsistent data.
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId });
      
      if (profileError) throw profileError;

      // Now that the profile is guaranteed to exist, create the application.
      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          user_id: userId,
          posting_id: posting.id,
        });
      if (applicationError) throw applicationError;

      setApplicationStatus({ applied: true, loading: false });
      alert('応募が完了しました！');
    } catch (err) {
      setError(err.message);
      setApplicationStatus({ ...applicationStatus, loading: false });
    }
  };

  if (loading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }

  if (error) {
    return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (!posting) {
    return <Container className="mt-5"><Alert variant="warning">募集が見つかりません。</Alert></Container>;
  }

  return (
    <div className="page-container">
      <Container style={{ maxWidth: '900px', width: '100%' }}>
        <Row>
          <Col md={8}>
            <Card>
              <Card.Header as="h4">{posting.companies?.name || '企業情報なし'}</Card.Header>
              <Card.Body>
                <Card.Title as="h2">{posting.title}</Card.Title>
                <div className="mb-3">
                  <span className="text-muted"><strong>勤務地:</strong> {posting.location || 'N/A'}</span>
                  <span className="mx-2">|</span>
                  <span className="text-muted"><strong>ポジション:</strong> {posting.position_type || 'N/A'}</span>
                </div>
                <hr />
                <Card.Text style={{ whiteSpace: 'pre-wrap' }}>
                  {posting.description}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>応募する</Card.Title>
                {session ? (
                  applicationStatus.loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : applicationStatus.applied ? (
                    <Alert variant="success">応募済みです</Alert>
                  ) : (
                    <div className="d-grid">
                      <Button variant="primary" onClick={handleApply}>このポジションに応募する</Button>
                    </div>
                  )
                ) : (
                  <Alert variant="info">
                    <Link to="/login">ログイン</Link>して応募してください。
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Link to="/" className="btn btn-outline-secondary mt-4">募集一覧に戻る</Link>
      </Container>
    </div>
  );
}
