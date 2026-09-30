import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import GuardInterface from './pages/GuardInterface';

function App() {
    return (
        <Router>
            <AuthProvider>
                <div className="min-h-screen bg-primary text-gray-100 font-sans">
                    <Navbar />
                    <div className=""> {/* Removed container mx-auto from here to allow full width for Home */}
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Protected Routes */}
                            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                                <Route path="/admin" element={<AdminDashboard />} />
                            </Route>

                            <Route element={<ProtectedRoute allowedRoles={['student', 'admin']} />}>
                                <Route path="/student" element={<StudentDashboard />} />
                            </Route>

                            <Route element={<ProtectedRoute allowedRoles={['guard', 'admin']} />}>
                                <Route path="/guard" element={<GuardInterface />} />
                            </Route>
                        </Routes>
                    </div>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
