import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Notifications from './Notifications';

export default function Header() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <Navbar bg="white" expand="lg" className="border-bottom shadow-sm sticky-top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          Matching Board
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">募集一覧</Nav.Link>
            {session && <Nav.Link as={Link} to="/messages">メッセージ</Nav.Link>}
          </Nav>
          <Nav>
            {session ? (
              <>
                <Notifications session={session} />
                <Nav.Link as={Link} to="/dashboard" className="ms-2 me-2">
                  <Button variant="outline-primary" size="sm">ダッシュボード</Button>
                </Nav.Link>
                <Button variant="danger" size="sm" onClick={handleSignOut}>ログアウト</Button>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">
                <Button variant="primary" size="sm">ログイン / 新規登録</Button>
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
