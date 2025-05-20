import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import JobForm from './pages/JobForm';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';
import PostLogin from './pages/PostLogin';
import Dashboard from './pages/Dashboard';
import Contact from './pages/Contact';


function App() {
  return (
    <Router>
      <Navbar></Navbar>
      <Routes>
       
        <Route path="/" element={<Navigate to="/apply" replace />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/apply" element={<JobForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/post-login" element={<PostLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  );
}

export default App;
