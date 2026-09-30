import { Link } from 'react-router-dom';
import {
    Activity,
    ArrowRight,
    BadgeCheck,
    BellRing,
    Camera,
    CheckCircle2,
    Lock,
    MapPin,
    Shield,
    UserPlus,
    Users,
} from 'lucide-react';

const features = [
    { icon: Camera, title: 'Gate verification', text: 'Guards verify registered staff and visitors from a live camera workflow.' },
    { icon: BellRing, title: 'Instant escalation', text: 'Unknown visitors and student SOS events appear on the warden dashboard with sound alerts.' },
    { icon: BadgeCheck, title: 'Audit-ready logs', text: 'Every scan is recorded with status, time, role, risk, and identity details.' },
];

const workflow = [
    'Register staff with a clear face photo and access details.',
    'Guard scans a visitor at the checkpoint.',
    'Warden sees verified, suspicious, and unknown entries in real time.',
];

const HomePage = () => {
    return (
        <main className="min-h-screen bg-[#07111f] text-slate-100">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
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
            </nav>

            <section className="relative border-y border-white/10 bg-[linear-gradient(rgba(7,17,31,0.70),rgba(7,17,31,0.92)),url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center">
                <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-slate-950/60 px-3 py-1 text-sm font-semibold text-cyan-100 backdrop-blur">
                            <span className="h-2 w-2 rounded-full bg-emerald-300" />
                            AI SecureHost for hostel safety
                        </div>

                        <h1 className="mt-6 text-5xl font-black tracking-tight text-white sm:text-7xl">
                            Safer hostel entry, from gate to warden desk.
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                            A complete safety workflow for wardens, guards, and students: face-based access checks, live entry monitoring, and emergency alerts when seconds matter.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-200">
                                Open dashboard
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-slate-950/55 px-5 py-3 font-bold text-white backdrop-blur transition hover:bg-slate-950/75">
                                <UserPlus className="h-5 w-5" />
                                Create account
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-4">
                <Stat icon={Users} label="Roles covered" value="3" />
                <Stat icon={Activity} label="Live monitoring" value="On" />
                <Stat icon={Lock} label="Access mode" value="Face" />
                <Stat icon={MapPin} label="Checkpoints" value="4" />
            </section>

            <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">What it does</p>
                    <h2 className="mt-3 text-3xl font-bold text-white">Built for the actual hostel workflow</h2>
                    <p className="mt-4 text-slate-400">
                        SecureHost keeps the guard experience fast, the warden dashboard actionable, and the student safety flow simple enough to use under pressure.
                    </p>

                    <div className="mt-6 space-y-3">
                        {workflow.map((item, index) => (
                            <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-300 text-sm font-black text-slate-950">
                                    {index + 1}
                                </span>
                                <p className="text-sm font-semibold text-slate-200">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border border-white/10 bg-slate-900 p-4 shadow-2xl">
                    <div className="grid gap-4 sm:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.title} className="rounded-md border border-white/10 bg-slate-950/70 p-5">
                                <feature.icon className="h-6 w-6 text-cyan-200" />
                                <p className="mt-4 font-bold text-white">{feature.title}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-5">
                        <div className="flex items-center gap-3">
                            <span className="rounded-full bg-emerald-300 p-2 text-emerald-950">
                                <CheckCircle2 className="h-5 w-5" />
                            </span>
                            <div>
                                <p className="font-bold text-white">Demo ready</p>
                                <p className="text-sm text-emerald-100/80">Use the Login page demo buttons for Admin, Guard, and Student flows.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

const Stat = ({ icon: Icon, label, value }) => (
    <div className="rounded-lg border border-white/10 bg-slate-900 p-5">
        <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <Icon className="h-5 w-5 text-cyan-200" />
        </div>
        <p className="mt-4 text-3xl font-bold text-white">{value}</p>
    </div>
);

export default HomePage;
