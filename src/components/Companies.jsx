import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Button, Card, Form, Spinner, Alert, Modal, Row, Col } from 'react-bootstrap';

export default function Companies({ session }) {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCompany, setCurrentCompany] = useState({ id: null, name: '', description: '', website: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, [session]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const { user } = session;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (company = null) => {
    if (company) {
      setIsEditing(true);
      setCurrentCompany(company);
    } else {
      setIsEditing(false);
      setCurrentCompany({ id: null, name: '', description: '', website: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, description, website } = currentCompany;
    const { user } = session;

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('companies')
          .update({ name, description, website, updated_at: new Date() })
          .eq('id', currentCompany.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('companies')
          .insert({ name, description, website, owner_id: user.id });
        if (error) throw error;
      }
      
      fetchCompanies();
      handleCloseModal();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (companyId) => {
    if (window.confirm('本当にこの企業を削除しますか？関連する募集情報もすべて削除されます。')) {
      try {
        const { error } = await supabase.from('companies').delete().eq('id', companyId);
        if (error) throw error;
        fetchCompanies();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>企業管理</h2>
        <Button onClick={() => handleShowModal()} variant="primary">＋ 新しい企業を追加</Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Row>
          {companies.length === 0 ? (
            <Col><p>まだ企業が登録されていません。</p></Col>
          ) : (
            companies.map(company => (
              <Col md={6} lg={4} key={company.id} className="mb-4">
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>{company.name}</Card.Title>
                    <Card.Text>{company.description}</Card.Text>
                    {company.website && <Card.Link href={company.website} target="_blank" rel="noopener noreferrer">ウェブサイト</Card.Link>}
                  </Card.Body>
                  <Card.Footer>
                    <Button variant="outline-secondary" size="sm" onClick={() => handleShowModal(company)}>編集</Button>{' '}
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(company.id)}>削除</Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? '企業情報の編集' : '新しい企業の作成'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="companyName">
              <Form.Label>企業名</Form.Label>
              <Form.Control type="text" value={currentCompany.name} onChange={(e) => setCurrentCompany({ ...currentCompany, name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3" controlId="companyDescription">
              <Form.Label>事業内容</Form.Label>
              <Form.Control as="textarea" rows={3} value={currentCompany.description} onChange={(e) => setCurrentCompany({ ...currentCompany, description: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="companyWebsite">
              <Form.Label>ウェブサイトURL</Form.Label>
              <Form.Control type="url" value={currentCompany.website} onChange={(e) => setCurrentCompany({ ...currentCompany, website: e.target.value })} />
            </Form.Group>
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