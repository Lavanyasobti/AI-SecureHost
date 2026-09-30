import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Lock, LogIn, Shield, User } from 'lucide-react';

const demoAccounts = [
    { label: 'Admin', username: 'admin', password: 'admin123', hint: 'Warden command center' },
    { label: 'Guard', username: 'guard', password: 'guard123', hint: 'Gate scanner' },
    { label: 'Student', username: 'student', password: 'student123', hint: 'Student safety app' },
];

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const fillDemo = (account) => {
        setUsername(account.username);
        setPassword(account.password);
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const role = await login(username.trim(), password);
            if (role === 'admin') navigate('/admin');
            else if (role === 'student') navigate('/student');
            else if (role === 'guard') navigate('/guard');
            else navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-[calc(100vh-73px)] bg-[#07111f] px-4 py-8 text-slate-100 sm:px-6">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <section className="rounded-lg border border-white/10 bg-slate-900 p-6 shadow-2xl">
                    <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                        Back home
                    </Link>

                    <div className="mb-8">
                        <span className="inline-flex rounded-lg bg-cyan-300 p-3 text-slate-950">
                            <Shield className="h-8 w-8" />
                        </span>
                        <h1 className="mt-5 text-3xl font-bold text-white">Sign in to SecureHost</h1>
                        <p className="mt-2 text-sm text-slate-400">Use your account or one of the demo accounts for judging.</p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-md border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Username</span>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                                <input
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 pl-11 text-white outline-none transition focus:border-cyan-300"
                                    placeholder="admin"
                                    required
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Password</span>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
                                <input
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    type="password"
                                    className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 pl-11 text-white outline-none transition focus:border-cyan-300"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <LogIn className="h-5 w-5" />
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm text-slate-400">
                        Need an account? <Link to="/register" className="font-semibold text-cyan-200 hover:text-cyan-100">Register</Link>
                    </p>
                </section>

                <section className="rounded-lg border border-white/10 bg-slate-900 p-6 shadow-2xl">
                    <h2 className="text-xl font-bold text-white">Demo accounts</h2>
                    <p className="mt-2 text-sm text-slate-400">Click any role to fill the login form. If an account is missing, create it from Register.</p>

                    <div className="mt-5 grid gap-3">
                        {demoAccounts.map((account) => (
                            <button
                                key={account.label}
                                onClick={() => fillDemo(account)}
                                className="flex items-center justify-between rounded-md border border-white/10 bg-slate-950/70 p-4 text-left transition hover:border-cyan-300/50 hover:bg-white/[0.04]"
                            >
                                <div>
                                    <p className="font-bold text-white">{account.label}</p>
                                    <p className="mt-1 text-sm text-slate-400">{account.hint}</p>
                                </div>
                                <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">
                                    Use
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Login;
