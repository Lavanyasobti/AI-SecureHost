import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft,
    Building,
    CheckCircle2,
    CreditCard,
    Lock,
    Mail,
    Shield,
    User,
    UserPlus,
} from 'lucide-react';

const roleOptions = [
    { value: 'student', label: 'Student', text: 'Safety dashboard and SOS access' },
    { value: 'guard', label: 'Security Guard', text: 'Gate scanner access' },
    { value: 'admin', label: 'Warden', text: 'Command center access' },
];

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        student_id: '',
        floor: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (event) => {
        setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
        setError('');
    };

    const handleRoleChange = (role) => {
        setFormData((prev) => ({ ...prev, role }));
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                ...formData,
                username: formData.username.trim(),
                email: formData.email.trim(),
                full_name: formData.full_name.trim(),
            };

            const res = await axios.post('/auth/register', payload, {
                headers: { 'Content-Type': 'application/json' },
            });

            setSuccess(res.data?.msg || 'Account created successfully.');
            setTimeout(() => navigate('/login'), 900);
        } catch (err) {
            if (err.response) {
                setError(err.response.data?.msg || err.response.statusText || 'Registration failed.');
            } else if (err.request) {
                setError('Server not responding. Start the backend and try again.');
            } else {
                setError(err.message || 'Registration failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-[calc(100vh-73px)] bg-[#07111f] px-4 py-8 text-slate-100 sm:px-6">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                <section className="rounded-lg border border-white/10 bg-slate-900 p-6 shadow-2xl">
                    <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                        Back home
                    </Link>

                    <span className="inline-flex rounded-lg bg-cyan-300 p-3 text-slate-950">
                        <Shield className="h-8 w-8" />
                    </span>
                    <h1 className="mt-5 text-3xl font-bold text-white">Create an account</h1>
                    <p className="mt-2 text-sm text-slate-400">Choose the correct role so the app opens the right dashboard after login.</p>

                    <div className="mt-6 space-y-3">
                        {roleOptions.map((role) => {
                            const active = formData.role === role.value;
                            return (
                                <button
                                    key={role.value}
                                    type="button"
                                    onClick={() => handleRoleChange(role.value)}
                                    className={`w-full rounded-md border p-4 text-left transition ${active ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-slate-950/70 hover:bg-white/[0.04]'}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-bold text-white">{role.label}</p>
                                            <p className="mt-1 text-sm text-slate-400">{role.text}</p>
                                        </div>
                                        {active && <CheckCircle2 className="h-5 w-5 text-cyan-200" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-lg border border-white/10 bg-slate-900 p-6 shadow-2xl">
                    {error && (
                        <div className="mb-5 rounded-md border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-100">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-5 rounded-md border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                        <Field icon={User} label="Full name" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Diksha Sharma" required />
                        <Field icon={User} label="Username" name="username" value={formData.username} onChange={handleChange} placeholder="diksha" required />
                        <Field icon={Mail} label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="diksha@example.com" required />
                        <Field icon={Lock} label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="At least 6 characters" required />

                        {formData.role === 'student' && (
                            <>
                                <Field icon={CreditCard} label="Student ID" name="student_id" value={formData.student_id} onChange={handleChange} placeholder="ST-2026-001" />
                                <Field icon={Building} label="Floor / Block" name="floor" value={formData.floor} onChange={handleChange} placeholder="Block A · Floor 2" />
                            </>
                        )}

                        <div className="sm:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <UserPlus className="h-5 w-5" />
                                {loading ? 'Creating account...' : 'Create account'}
                            </button>
                        </div>
                    </form>

                    <p className="mt-5 text-center text-sm text-slate-400">
                        Already registered? <Link to="/login" className="font-semibold text-cyan-200 hover:text-cyan-100">Sign in</Link>
                    </p>
                </section>
            </div>
        </main>
    );
};

const Field = ({ icon: Icon, label, name, value, onChange, placeholder, type = 'text', required }) => (
    <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
        <div className="relative">
            <Icon className="absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
            <input
                name={name}
                value={value}
                onChange={onChange}
                type={type}
                required={required}
                className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 pl-11 text-white outline-none transition focus:border-cyan-300"
                placeholder={placeholder}
            />
        </div>
    </label>
);

export default Register;
