import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, ScanFace, Shield, User, UserCog } from 'lucide-react';

const navByRole = {
    admin: [
        { to: '/admin', label: 'Command', icon: UserCog },
    ],
    guard: [
        { to: '/guard', label: 'Scanner', icon: ScanFace },
    ],
    student: [
        { to: '/student', label: 'Safety', icon: User },
    ],
};

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!user) {
        if (isHome) return null;

        return (
            <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 px-4 py-3 text-slate-100 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 font-bold text-white">
                        <span className="rounded-lg bg-cyan-300 p-2 text-slate-950">
                            <Shield className="h-5 w-5" />
                        </span>
                        SecureHost
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link to="/login" className="rounded-md px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white">
                            Login
                        </Link>
                        <Link to="/register" className="rounded-md bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
                            Register
                        </Link>
                    </div>
                </div>
            </nav>
        );
    }

    const navItems = navByRole[user.role] || [];

    return (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 px-4 py-3 text-slate-100 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
                <Link to="/" className="flex items-center gap-3 font-bold text-white">
                    <span className="rounded-lg bg-cyan-300 p-2 text-slate-950">
                        <Shield className="h-5 w-5" />
                    </span>
                    <span>SecureHost</span>
                </Link>

                <div className="flex flex-1 items-center justify-end gap-2">
                    <div className="hidden items-center rounded-md border border-white/10 bg-white/[0.04] p-1 sm:flex">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = location.pathname === item.to;

                            return (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-semibold transition ${active ? 'bg-cyan-300 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="hidden border-l border-white/10 pl-3 text-right md:block">
                        <p className="text-sm font-semibold text-white">{user.full_name || user.username}</p>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{user.role}</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 rounded-md border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500 hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
