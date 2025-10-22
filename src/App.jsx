import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import PublicPostings from './pages/PublicPostings';
import PostingDetails from './pages/PostingDetails';
import MessagesPage from './pages/MessagesPage';
import './App.css';

// Layout component to wrap pages with Header and Footer
function AppLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes with Header and Footer */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<PublicPostings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/postings/:id" element={<PostingDetails />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
        </Route>

        {/* Route without Header and Footer (e.g., login page) */}
        <Route path="/login" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;
