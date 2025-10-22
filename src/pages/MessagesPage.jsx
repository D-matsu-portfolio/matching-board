import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Container, Row, Col, ListGroup, Form, Button, Spinner, Alert, Card } from 'react-bootstrap';

export default function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setSession(session);
      }
    };
    getSession();
  }, [navigate]);

  // Fetch all conversations for the current user
  useEffect(() => {
    if (session) {
      const fetchConversations = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('conversations')
            .select(`
              id,
              application_id,
              user:profiles!conversations_user_id_fkey(id, full_name, avatar_url),
              company_owner:profiles!conversations_company_owner_id_fkey(id, full_name, avatar_url),
              applications(postings(title))
            `)
            .or(`user_id.eq.${session.user.id},company_owner_id.eq.${session.user.id}`);
          
          if (error) throw error;
          setConversations(data);

          if (conversationId && data.length > 0) {
            const activeConv = data.find(c => c.id.toString() === conversationId);
            setCurrentConversation(activeConv);
          }

        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchConversations();
    }
  }, [session, conversationId]);

  // Fetch messages for the selected conversation
  useEffect(() => {
    if (currentConversation) {
      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:profiles(id, full_name)')
          .eq('conversation_id', currentConversation.id)
          .order('created_at', { ascending: true });

        if (error) setError(error.message);
        else setMessages(data);
      };
      fetchMessages();
    }
  }, [currentConversation]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (currentConversation) {
      const subscription = supabase.channel(`messages:${currentConversation.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${currentConversation.id}` },
          (payload) => {
            setMessages(currentMessages => [...currentMessages, payload.new]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [currentConversation]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentConversation) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: currentConversation.id,
        sender_id: session.user.id,
        content: newMessage,
      });

    if (error) setError(error.message);
    else setNewMessage('');
  };
  
  const selectConversation = (conv) => {
    setCurrentConversation(conv);
    navigate(`/messages/${conv.id}`);
  }

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <div className="page-container">
      <Container style={{ maxWidth: '1200px', width: '100%', height: 'calc(100vh - 100px)' }}>
        <Row style={{ height: '100%' }}>
          <Col md={4} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h4>会話一覧</h4>
            <ListGroup className="flex-grow-1" style={{ overflowY: 'auto' }}>
              {conversations.map(conv => {
                const otherUser = conv.user.id === session.user.id ? conv.company_owner : conv.user;
                return (
                  <ListGroup.Item key={conv.id} action active={currentConversation?.id === conv.id} onClick={() => selectConversation(conv)}>
                    <strong>{otherUser.full_name || 'Unknown User'}</strong>
                    <p className="mb-0 text-muted">{conv.applications.postings.title}</p>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>
          </Col>
          <Col md={8} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {currentConversation ? (
              <Card className="flex-grow-1">
                <Card.Header>{/* Conversation Partner Name */}</Card.Header>
                <Card.Body style={{ overflowY: 'auto' }}>
                  {messages.map(msg => (
                    <div key={msg.id} className={`mb-2 ${msg.sender_id === session.user.id ? 'text-end' : ''}`}>
                      <div className={`d-inline-block p-2 rounded ${msg.sender_id === session.user.id ? 'bg-primary text-white' : 'bg-light'}`}>
                        {msg.content}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </Card.Body>
                <Card.Footer>
                  <Form onSubmit={handleSendMessage}>
                    <Row>
                      <Col>
                        <Form.Control type="text" placeholder="メッセージを入力..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                      </Col>
                      <Col xs="auto">
                        <Button type="submit">送信</Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Footer>
              </Card>
            ) : (
              <div className="d-flex justify-content-center align-items-center h-100">
                <p>会話を選択してください</p>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
