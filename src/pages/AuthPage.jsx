import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Container, Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      setMessage('登録確認メールを送信しました。メールボックスを確認してください。');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      if (error) throw error;
      navigate('/dashboard'); // Redirect to dashboard on successful login
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '100%', maxWidth: '450px' }}>
        <Card.Header as="h3" className="text-center">Matching Board</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}
          <Tabs defaultActiveKey="signin" id="auth-tabs" className="mb-3" fill>
            <Tab eventKey="signin" title="ログイン">
              <Form onSubmit={handleSignIn}>
                <Form.Group className="mb-3" controlId="signInEmail">
                  <Form.Label>メールアドレス</Form.Label>
                  <Form.Control type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="signInPassword">
                  <Form.Label>パスワード</Form.Label>
                  <Form.Control type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
                </Form.Group>
                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? '処理中...' : 'ログイン'}
                  </Button>
                </div>
              </Form>
            </Tab>
            <Tab eventKey="signup" title="新規登録">
              <Form onSubmit={handleSignUp}>
                <Form.Group className="mb-3" controlId="signUpEmail">
                  <Form.Label>メールアドレス</Form.Label>
                  <Form.Control type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} required />
                </Form.Group>
                <Form.Group className="mb-3" controlId="signUpPassword">
                  <Form.Label>パスワード</Form.Label>
                  <Form.Control type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
                </Form.Group>
                <div className="d-grid">
                  <Button variant="success" type="submit" disabled={loading}>
                    {loading ? '処理中...' : '登録する'}
                  </Button>
                </div>
              </Form>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}
