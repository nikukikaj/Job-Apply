import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import JobForm from './pages/JobForm';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <Router>
      <Routes>
       
        <Route path="/" element={<Navigate to="/apply" replace />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/apply" element={<JobForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
