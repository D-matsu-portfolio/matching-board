import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Button, Card, Form, Spinner, Alert, Modal, Row, Col } from 'react-bootstrap';

export default function Postings({ session }) {
  const [loading, setLoading] = useState(true);
  const [postings, setPostings] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPosting, setCurrentPosting] = useState({
    id: null, title: '', description: '', position_type: '', location: '', company_id: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [session]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { user } = session;
      
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('owner_id', user.id);
      if (companyError) throw companyError;
      setCompanies(companyData);

      const companyIds = companyData.map(c => c.id);
      if (companyIds.length > 0) {
        const { data: postingData, error: postingError } = await supabase
          .from('postings')
          .select('*, companies(name)')
          .in('company_id', companyIds)
          .order('created_at', { ascending: false });
        if (postingError) throw postingError;
        setPostings(postingData);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (posting = null) => {
    if (companies.length === 0) {
      alert('募集を作成するには、まず企業を登録してください。');
      return;
    }
    if (posting) {
      setIsEditing(true);
      setCurrentPosting(posting);
    } else {
      setIsEditing(false);
      setCurrentPosting({
        id: null, title: '', description: '', position_type: '', location: '', company_id: companies[0].id
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, title, description, position_type, location, company_id } = currentPosting;

    if (!company_id) {
        setError('企業を選択してください。');
        return;
    }

    try {
      if (id) {
        const { error } = await supabase
          .from('postings')
          .update({ title, description, position_type, location, company_id, updated_at: new Date() })
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('postings')
          .insert({ title, description, position_type, location, company_id });
        if (error) throw error;
      }
      
      fetchInitialData();
      handleCloseModal();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (postingId) => {
    if (window.confirm('本当にこの募集を削除しますか？')) {
      try {
        const { error } = await supabase.from('postings').delete().eq('id', postingId);
        if (error) throw error;
        fetchInitialData();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>募集管理</h2>
        <Button onClick={() => handleShowModal()} variant="primary">＋ 新しい募集を追加</Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Row>
          {postings.length === 0 ? (
            <Col><p>まだ募集が登録されていません。</p></Col>
          ) : (
            postings.map(posting => (
              <Col md={12} key={posting.id} className="mb-4">
                <Card>
                  <Card.Body>
                    <Card.Title>{posting.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">{posting.companies.name}</Card.Subtitle>
                    <Card.Text>{posting.description}</Card.Text>
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">ポジション: {posting.position_type || 'N/A'}</small>
                      <small className="text-muted">勤務地: {posting.location || 'N/A'}</small>
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <Button variant="outline-secondary" size="sm" onClick={() => handleShowModal(posting)}>編集</Button>{' '}
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(posting.id)}>削除</Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? '募集情報の編集' : '新しい募集の作成'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>企業</Form.Label>
              <Form.Select value={currentPosting.company_id} onChange={(e) => setCurrentPosting({ ...currentPosting, company_id: e.target.value })} required>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>タイトル</Form.Label>
              <Form.Control type="text" value={currentPosting.title} onChange={(e) => setCurrentPosting({ ...currentPosting, title: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>内容</Form.Label>
              <Form.Control as="textarea" rows={4} value={currentPosting.description} onChange={(e) => setCurrentPosting({ ...currentPosting, description: e.target.value })} required />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>ポジション</Form.Label>
                  <Form.Control type="text" placeholder="例: エンジニア" value={currentPosting.position_type} onChange={(e) => setCurrentPosting({ ...currentPosting, position_type: e.target.value })} />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>勤務地</Form.Label>
                  <Form.Control type="text" placeholder="例: 東京" value={currentPosting.location} onChange={(e) => setCurrentPosting({ ...currentPosting, location: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={handleCloseModal} className="me-2">キャンセル</Button>
              <Button variant="primary" type="submit">保存</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}