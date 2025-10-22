import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Container, Row, Col, Card, Spinner, Alert, Form, Button, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function PublicPostings() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    const fetchPostings = async () => {
      try {
        setLoading(true);
        
        let query = supabase
          .from('postings')
          .select(`
            id,
            title,
            description,
            position_type,
            location,
            created_at,
            companies ( name, logo_url )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (searchTerm) {
          query = query.ilike('title', `%${searchTerm}%`);
        }
        if (locationFilter) {
          query = query.ilike('location', `%${locationFilter}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        setPostings(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search to avoid excessive API calls
    const timerId = setTimeout(() => {
      fetchPostings();
    }, 500); // Fetch after 500ms of inactivity

    return () => clearTimeout(timerId);
  }, [searchTerm, locationFilter]);

  return (
    <div className="page-container">
      <Container style={{ maxWidth: '1140px', width: '100%' }}>
        <h1 className="mb-4">募集一覧</h1>

        <Card className="mb-4 p-3">
          <Form>
            <Row className="align-items-end gy-2">
              <Col xs={12} md={5}>
                <Form.Group controlId="searchTerm">
                  <Form.Label>キーワードで検索</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="例: React, エンジニア"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={5}>
                <Form.Group controlId="locationFilter">
                  <Form.Label>勤務地</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="例: 東京, フルリモート"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} md={2}>
                <div className="d-grid">
                  <Button variant="outline-secondary" onClick={() => { setSearchTerm(''); setLocationFilter(''); }}>
                    クリア
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card>

        {loading ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : error ? (
          <Alert variant="danger">エラーが発生しました: {error}</Alert>
        ) : postings.length === 0 ? (
          <p>該当する募集はありません。</p>
        ) : (
          <Row>
            {postings.map((posting) => (
              <Col md={6} lg={4} key={posting.id} className="mb-4">
                <Card className="h-100">
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>{posting.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">{posting.companies?.name || '不明な企業'}</Card.Subtitle>
                    <Card.Text className="flex-grow-1" style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minHeight: '72px'
                    }}>
                      {posting.description}
                    </Card.Text>
                    <div className="mt-auto">
                      <small className="text-muted">勤務地: {posting.location || '未定'}</small>
                    </div>
                  </Card.Body>
                  <Card.Footer className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      投稿日: {new Date(posting.created_at).toLocaleDateString()}
                    </small>
                    <Link to={`/postings/${posting.id}`} className="btn btn-primary btn-sm">
                      詳細を見る
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}
