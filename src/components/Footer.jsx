import { Container } from 'react-bootstrap';

export default function Footer() {
  return (
    <footer className="py-4 mt-auto bg-light">
      <Container className="text-center">
        <small className="text-muted">
          &copy; {new Date().getFullYear()} Matching Board. All Rights Reserved.
        </small>
      </Container>
    </footer>
  );
}
