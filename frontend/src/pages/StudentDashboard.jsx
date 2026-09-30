import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { socket } from '../services/socket';
import {
    Activity,
    AlertTriangle,
    Bell,
    CheckCircle2,
    Clock,
    Home,
    MapPin,
    Phone,
    Radio,
    Shield,
    Siren,
    User,
    Users,
    XCircle,
} from 'lucide-react';

const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'emergency', label: 'SOS', icon: Siren },
    { id: 'profile', label: 'Profile', icon: User },
];

const StudentDashboard = () => {
    const { user } = useAuth();
    const [panicModalOpen, setPanicModalOpen] = useState(false);
    const [panicSending, setPanicSending] = useState(false);
    const [panicSuccess, setPanicSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [recentEntries, setRecentEntries] = useState([]);
    const [liveEntry, setLiveEntry] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [connectionState, setConnectionState] = useState('connecting');

    useEffect(() => {
        if (!user) return;

        socket.connect();
        socket.emit('join', { user_id: user.id });

        socket.on('connect', () => setConnectionState('online'));
        socket.on('disconnect', () => setConnectionState('offline'));

        socket.on('worker_entry', (data) => {
            const newEntry = {
                id: Date.now(),
                name: data.name,
                role: data.role,
                type: 'Entry',
                time: data.time,
                verified: true,
                description: `${data.name} (${data.role}) entered hostel`,
            };

            setLiveEntry(newEntry);
            setRecentEntries((prev) => [newEntry, ...prev].slice(0, 12));
        });

        socket.on('sos_contact', (data) => {
            setAlerts((prev) => [{
                id: Date.now(),
                message: `SOS from ${data.name} at ${data.location}`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }, ...prev].slice(0, 5));
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('worker_entry');
            socket.off('sos_contact');
            socket.disconnect();
        };
    }, [user]);

    const safetyStatus = useMemo(() => {
        const recentUnknowns = alerts.length;
        const staffCount = new Set(recentEntries.map((entry) => entry.name)).size;

        if (recentUnknowns > 0) {
            return {
                label: 'Attention needed',
                description: 'There is an active alert in your circle.',
                tone: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
                iconTone: 'bg-amber-300 text-amber-950',
                score: 62,
            };
        }

        return {
            label: 'You are safe',
            description: staffCount ? `${staffCount} verified staff member${staffCount > 1 ? 's' : ''} seen recently.` : 'No unusual activity reported.',
            tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
            iconTone: 'bg-emerald-300 text-emerald-950',
            score: 92,
        };
    }, [alerts, recentEntries]);

    const handlePanic = async () => {
        if (!user) return;

        setPanicSending(true);
        try {
            const res = await fetch('http://localhost:5000/api/sos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    student_id: user.id,
                    location: user.floor || 'Unknown Location',
                }),
            });

            if (!res.ok) throw new Error('SOS request failed');

            setPanicSuccess(true);
            setTimeout(() => {
                setPanicSuccess(false);
                setPanicModalOpen(false);
            }, 2200);
        } catch (err) {
            console.error(err);
            setAlerts((prev) => [{
                id: Date.now(),
                message: 'SOS could not be sent. Call hostel security directly.',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }, ...prev].slice(0, 5));
        } finally {
            setPanicSending(false);
        }
    };

    if (!user) {
        return <div className="flex h-screen items-center justify-center bg-[#07111f] text-white">Loading...</div>;
    }

    return (
        <main className="min-h-[calc(100vh-73px)] bg-[#07111f] pb-24 text-slate-100">
            <section className="border-b border-white/10 bg-slate-950/70">
                <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm text-slate-400">Welcome back</p>
                            <h1 className="mt-1 text-3xl font-bold text-white">{user.full_name || user.username || 'Student'}</h1>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                                <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-300" /> {user.floor || 'Hostel block'}</span>
                                <span className="flex items-center gap-2"><Radio className="h-4 w-4 text-emerald-300" /> {connectionState}</span>
                            </div>
                        </div>

                        <div className="relative rounded-lg border border-white/10 bg-white/[0.04] p-3">
                            <Bell className="h-6 w-6 text-slate-200" />
                            {alerts.length > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                                    {alerts.length}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <section className="space-y-5">
                    {activeTab === 'home' && (
                        <>
                            <div className={`rounded-lg border p-5 shadow-xl ${safetyStatus.tone}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Safety status</p>
                                        <h2 className="mt-2 text-3xl font-bold text-white">{safetyStatus.label}</h2>
                                        <p className="mt-2 text-sm text-slate-300">{safetyStatus.description}</p>
                                    </div>
                                    <span className={`rounded-lg p-3 ${safetyStatus.iconTone}`}>
                                        <Shield className="h-8 w-8" />
                                    </span>
                                </div>

                                <div className="mt-6">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="text-slate-300">Safety score</span>
                                        <span className="font-bold text-white">{safetyStatus.score}%</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-slate-950/60">
                                        <div className="h-3 rounded-full bg-cyan-300" style={{ width: `${safetyStatus.score}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <Metric icon={Users} label="Known entries" value={recentEntries.length} />
                                <Metric icon={AlertTriangle} label="Alerts" value={alerts.length} tone="rose" />
                                <Metric icon={MapPin} label="Location" value={user.floor || 'Block A'} />
                            </div>

                            <LiveEntryCard entry={liveEntry} />
                        </>
                    )}

                    {activeTab === 'activity' && (
                        <Panel title="Entry activity" icon={Activity}>
                            <ActivityList entries={recentEntries} />
                        </Panel>
                    )}

                    {activeTab === 'emergency' && (
                        <Panel title="Emergency actions" icon={Siren}>
                            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                                <button
                                    onClick={() => setPanicModalOpen(true)}
                                    className="flex aspect-square min-h-56 flex-col items-center justify-center rounded-full border-8 border-rose-400/20 bg-rose-600 text-white shadow-2xl shadow-rose-950/50 transition hover:bg-rose-500 active:scale-95"
                                >
                                    <Siren className="mb-3 h-14 w-14" />
                                    <span className="text-3xl font-black">SOS</span>
                                    <span className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-rose-100">Send help</span>
                                </button>

                                <div className="space-y-3">
                                    <EmergencyContact name="Hostel security" detail="+91 90000 00001" />
                                    <EmergencyContact name="Warden office" detail="+91 90000 00002" />
                                    <EmergencyContact name="Campus medical" detail="+91 90000 00003" />
                                    <div className="rounded-md border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                                        Your SOS shares your name and hostel location with the warden dashboard.
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    )}

                    {activeTab === 'profile' && (
                        <Panel title="Student profile" icon={User}>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <ProfileField label="Name" value={user.full_name || user.username} />
                                <ProfileField label="Username" value={user.username} />
                                <ProfileField label="Role" value={user.role} />
                                <ProfileField label="Floor" value={user.floor || 'Not set'} />
                            </div>
                        </Panel>
                    )}
                </section>

                <aside className="space-y-5">
                    <Panel title="Alerts" icon={Bell}>
                        {alerts.length === 0 ? (
                            <EmptyState icon={CheckCircle2} text="No active alerts." />
                        ) : (
                            <div className="space-y-3">
                                {alerts.map((alert) => (
                                    <div key={alert.id} className="rounded-md border border-rose-400/25 bg-rose-400/10 p-4">
                                        <p className="font-semibold text-white">{alert.message}</p>
                                        <p className="mt-1 text-xs text-rose-100/70">{alert.time}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="Safety checklist" icon={Shield}>
                        <div className="space-y-3">
                            <ChecklistItem text="Stay near verified access points" done />
                            <ChecklistItem text="Keep emergency contacts reachable" done />
                            <ChecklistItem text="Report unknown visitor movement" done={alerts.length === 0} />
                            <ChecklistItem text="Use SOS only during real emergencies" />
                        </div>
                    </Panel>
                </aside>
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur">
                <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold transition ${active ? 'bg-cyan-300 text-slate-950' : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'}`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {panicModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-lg border border-white/10 bg-slate-900 p-6 text-center shadow-2xl">
                        <button onClick={() => setPanicModalOpen(false)} className="ml-auto block text-slate-500 transition hover:text-slate-200">
                            <XCircle className="h-6 w-6" />
                        </button>

                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/15 text-rose-200">
                            <AlertTriangle className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Send emergency alert?</h2>
                        <p className="mt-2 text-sm text-slate-400">The warden dashboard will receive your SOS with your current hostel location.</p>

                        {!panicSuccess ? (
                            <button
                                onClick={handlePanic}
                                disabled={panicSending}
                                className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-4 font-bold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {panicSending ? 'Sending alert...' : 'Send SOS now'}
                            </button>
                        ) : (
                            <div className="mt-6 rounded-md border border-emerald-400/25 bg-emerald-400/10 p-4 font-bold text-emerald-100">
                                Alert sent successfully
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
};

const Panel = ({ title, icon: Icon, children }) => (
    <section className="rounded-lg border border-white/10 bg-slate-900 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">{title}</h2>
            <Icon className="h-5 w-5 text-slate-400" />
        </div>
        {children}
    </section>
);

const Metric = ({ icon: Icon, label, value, tone = 'cyan' }) => {
    const tones = {
        cyan: 'bg-cyan-300/10 text-cyan-200 border-cyan-300/20',
        rose: 'bg-rose-300/10 text-rose-200 border-rose-300/20',
    };

    return (
        <div className={`rounded-lg border p-4 ${tones[tone]}`}>
            <Icon className="mb-3 h-5 w-5" />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
        </div>
    );
};

const LiveEntryCard = ({ entry }) => (
    <Panel title="Live entry" icon={Radio}>
        {entry ? (
            <div className="flex items-center gap-4 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300 text-emerald-950">
                    <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{entry.description}</p>
                    <p className="mt-1 text-xs text-emerald-100/70">{entry.time}</p>
                </div>
            </div>
        ) : (
            <EmptyState icon={Radio} text="No live entry yet." />
        )}
    </Panel>
);

const ActivityList = ({ entries }) => {
    if (entries.length === 0) {
        return <EmptyState icon={Clock} text="No recent activity yet." />;
    }

    return (
        <div className="space-y-3">
            {entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-md bg-slate-950/70 p-3">
                    <span className="rounded-full bg-emerald-400/10 p-2 text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">{entry.description}</p>
                        <p className="text-xs text-slate-500">{entry.time} · {entry.type}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const EmptyState = ({ icon: Icon, text }) => (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-md border border-dashed border-white/10 p-6 text-center text-slate-500">
        <Icon className="mb-3 h-8 w-8" />
        <p className="text-sm">{text}</p>
    </div>
);

const ChecklistItem = ({ text, done }) => (
    <div className="flex items-center gap-3 rounded-md bg-slate-950/70 p-3">
        <span className={`rounded-full p-2 ${done ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/[0.04] text-slate-400'}`}>
            {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </span>
        <p className="text-sm text-slate-300">{text}</p>
    </div>
);

const EmergencyContact = ({ name, detail }) => (
    <div className="flex items-center gap-3 rounded-md border border-white/10 bg-slate-950/70 p-4">
        <span className="rounded-full bg-cyan-300/10 p-2 text-cyan-200">
            <Phone className="h-4 w-4" />
        </span>
        <div>
            <p className="font-semibold text-white">{name}</p>
            <p className="text-sm text-slate-400">{detail}</p>
        </div>
    </div>
);

const ProfileField = ({ label, value }) => (
    <div className="rounded-md border border-white/10 bg-slate-950/70 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="mt-2 font-semibold text-white">{value || '-'}</p>
    </div>
);

export default StudentDashboard;
