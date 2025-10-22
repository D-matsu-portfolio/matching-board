import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Briefcase, Search, PeopleFill } from 'react-bootstrap-icons';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <Container fluid className="text-white text-center py-5" style={{ backgroundColor: '#2c5282' }}>
        <Container>
          <h1 className="display-4 fw-bold">JobLink</h1>
          <p className="lead my-3">あなたの次のキャリアを見つけよう</p>
          <p>
            <Button as={Link} to="/postings" variant="light" size="lg" className="me-2">募集を探す</Button>
            <Button as={Link} to="/login" variant="outline-light" size="lg">企業として登録</Button>
          </p>
        </Container>
      </Container>

      {/* Features Section */}
      <Container className="py-5">
        <h2 className="text-center mb-4">JobLinkでできること</h2>
        <Row>
          <Col md={4} className="mb-3">
            <Card className="text-center h-100">
              <Card.Body>
                <Search size={40} className="text-primary mb-3" />
                <Card.Title>多様な募集を検索</Card.Title>
                <Card.Text>
                  キーワードや勤務地で、あなたにぴったりの仕事やプロジェクトを簡単に見つけられます。
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="text-center h-100">
              <Card.Body>
                <Briefcase size={40} className="text-primary mb-3" />
                <Card.Title>簡単応募・メッセージ</Card.Title>
                <Card.Text>
                  興味のある募集にはワンクリックで応募。企業と直接メッセージをやり取りして、スムーズに選考に進めます。
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-3">
            <Card className="text-center h-100">
              <Card.Body>
                <PeopleFill size={40} className="text-primary mb-3" />
                <Card.Title>企業と直接つながる</Card.Title>
                <Card.Text>
                  企業は自社の魅力や募集情報を自由に発信。応募者と直接コミュニケーションをとり、最適な人材を見つけられます。
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
