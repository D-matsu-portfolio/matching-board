import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Container, Row, Col, Card, Spinner, Alert, Form, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

// Helper function to generate a simple avatar placeholder
const CompanyLogo = ({ company, size = 50 }) => {
  const placeholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(company?.name || 'C')}&background=random&size=${size*2}&color=fff`;
  // In a real app, you'd fetch the logo_url from storage. For now, we assume it's a full URL.
  const logoUrl = company?.logo_url || placeholder;

  return (
    <img 
      src={logoUrl} 
      alt={`${company?.name || 'Company'} logo`}
      width={size} 
      height={size} 
      className="rounded-3 me-3"
    />
  );
};

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

    const timerId = setTimeout(() => {
      fetchPostings();
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm, locationFilter]);

  return (
    <div className="page-container">
      <Container style={{ maxWidth: '1140px', width: '100%' }}>
        <h1 className="mb-4">募集一覧</h1>

        <Card className="mb-4 p-3 shadow-sm">
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
          <div className="text-center py-5"><Spinner animation="border" /></div>
        ) : error ? (
          <Alert variant="danger">エラーが発生しました: {error}</Alert>
        ) : postings.length === 0 ? (
          <Card className="text-center p-5">
            <p className="mb-0">該当する募集はありません。</p>
          </Card>
        ) : (
          <Row>
            {postings.map((posting) => (
              <Col md={12} key={posting.id} className="mb-3">
                <Card className="h-100 shadow-sm">
                  <Card.Body className="d-flex align-items-center">
                    <CompanyLogo company={posting.companies} />
                    <div className="flex-grow-1">
                      <Card.Title className="mb-1">{posting.title}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">{posting.companies?.name || '不明な企業'}</Card.Subtitle>
                      <div>
                        {posting.location && <Badge pill bg="secondary" className="me-1 fw-normal">{posting.location}</Badge>}
                        {posting.position_type && <Badge pill bg="info" className="fw-normal">{posting.position_type}</Badge>}
                      </div>
                    </div>
                    <div className="ms-auto text-end">
                      <Link to={`/postings/${posting.id}`} className="btn btn-primary">
                        詳細を見る
                      </Link>
                      <small className="d-block text-muted mt-2">
                        {new Date(posting.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}