import { useEffect, useMemo, useState } from 'react';
import { socket } from '../services/socket';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    BellRing,
    CheckCircle2,
    Clock,
    ClipboardList,
    FileImage,
    MapPin,
    Phone,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Upload,
    UserPlus,
    Users,
    XCircle,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const statusStyles = {
    verified: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/20',
    suspicious: 'bg-amber-400/10 text-amber-200 border-amber-400/20',
    unknown: 'bg-rose-400/10 text-rose-200 border-rose-400/20',
};

const chartColors = {
    verified: '#34d399',
    suspicious: '#fbbf24',
    unknown: '#fb7185',
};

const AdminDashboard = () => {
    const [logs, setLogs] = useState([]);
    const [unknownAlerts, setUnknownAlerts] = useState([]);
    const [alertSound] = useState(() => new Audio('/beep.mp3'));
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [name, setName] = useState('');
    const [role, setRole] = useState('Maintenance');
    const [phone, setPhone] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [organization, setOrganization] = useState('');
    const [accessZone, setAccessZone] = useState('Main Gate');
    const [shift, setShift] = useState('Day');
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState(null);

    useEffect(() => {
        const fetchLogs = () => {
            fetch('http://localhost:5000/api/entry-logs')
                .then((res) => res.json())
                .then((data) => setLogs(Array.isArray(data) ? data : []))
                .catch((err) => console.error(err));
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        socket.connect();

        const unlockAudio = () => {
            enableAlertSound();
            document.removeEventListener('click', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);

        socket.on('unknown_alert', (data) => {
            setUnknownAlerts((prev) => [data, ...prev].slice(0, 6));
            playAlertSound();
        });

        socket.on('sos_admin', (data) => {
            setUnknownAlerts((prev) => [{
                message: `SOS from ${data.name} at ${data.location}`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }, ...prev].slice(0, 6));
            playAlertSound();
        });

        return () => {
            document.removeEventListener('click', unlockAudio);
            socket.off('unknown_alert');
            socket.off('sos_admin');
        };
    }, [alertSound, soundEnabled]);

    const playAlertSound = () => {
        alertSound.currentTime = 0;
        alertSound.play().catch(() => {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, context.currentTime);
            gain.gain.setValueAtTime(0.001, context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.35, context.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);

            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.38);
        });
    };

    const enableAlertSound = () => {
        alertSound.play().then(() => {
            alertSound.pause();
            alertSound.currentTime = 0;
            setSoundEnabled(true);
        }).catch(() => {
            setSoundEnabled(true);
        });
    };

    const stats = useMemo(() => {
        const totals = logs.reduce(
            (acc, log) => {
                acc.total += 1;
                acc[log.status] = (acc[log.status] || 0) + 1;
                return acc;
            },
            { total: 0, verified: 0, suspicious: 0, unknown: 0 }
        );

        return {
            ...totals,
            activeStaff: new Set(logs.filter((log) => log.name !== 'Unknown').map((log) => log.name)).size,
        };
    }, [logs]);

    const chartData = useMemo(() => {
        const buckets = logs.slice(0, 30).reduce((acc, log) => {
            const key = log.time || 'N/A';
            if (!acc[key]) {
                acc[key] = { time: key, verified: 0, suspicious: 0, unknown: 0 };
            }
            acc[key][log.status] = (acc[key][log.status] || 0) + 1;
            return acc;
        }, {});

        return Object.values(buckets).slice(0, 8).reverse();
    }, [logs]);

    const pieData = [
        { name: 'Verified', value: stats.verified, key: 'verified' },
        { name: 'Suspicious', value: stats.suspicious, key: 'suspicious' },
        { name: 'Unknown', value: stats.unknown, key: 'unknown' },
    ].filter((item) => item.value > 0);

    const handleFileChange = (event) => {
        const selected = event.target.files?.[0];
        setFile(selected || null);
        setFilePreview(selected ? URL.createObjectURL(selected) : '');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormMessage(null);

        if (!file) {
            setFormMessage({ type: 'error', text: 'Add a clear face photo before registering staff.' });
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('role', role);
        formData.append('phone', phone);
        formData.append('employee_id', employeeId);
        formData.append('organization', organization);
        formData.append('access_zone', accessZone);
        formData.append('shift', shift);
        formData.append('notes', notes);
        formData.append('file', file);

        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:5000/ai/upload-face', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.msg || 'Could not register this face.');

            setFormMessage({ type: 'success', text: data.msg });
            setName('');
            setRole('Maintenance');
            setPhone('');
            setEmployeeId('');
            setOrganization('');
            setAccessZone('Main Gate');
            setShift('Day');
            setNotes('');
            setFile(null);
            setFilePreview('');
        } catch (err) {
            setFormMessage({ type: 'error', text: err.message || 'Error adding worker.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-[calc(100vh-73px)] bg-[#07111f] text-slate-100">
            <section className="border-b border-white/10 bg-slate-950/70">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
                                Command center
                            </div>
                            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Warden dashboard</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-400">
                                Live hostel access, unknown-person alerts, and staff enrollment in one place.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className={`rounded-lg border px-4 py-3 text-sm font-semibold ${soundEnabled ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100' : 'border-amber-300/25 bg-amber-300/10 text-amber-100'}`}>
                                {soundEnabled ? 'Alert sound armed' : 'Click anywhere to arm alert sound'}
                            </div>

                            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                                <Clock className="h-5 w-5 text-cyan-200" />
                                <div>
                                    <p className="text-xs text-slate-400">Last sync</p>
                                    <p className="text-sm font-semibold text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard icon={Activity} label="Total checks" value={stats.total} tone="cyan" />
                        <StatCard icon={ShieldCheck} label="Verified" value={stats.verified} tone="emerald" />
                        <StatCard icon={ShieldAlert} label="Needs review" value={stats.suspicious} tone="amber" />
                        <StatCard icon={AlertTriangle} label="Unknown" value={stats.unknown} tone="rose" />
                    </div>
                </div>
            </section>

            <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
                <section className="space-y-5">
                    {unknownAlerts.length > 0 && (
                        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-4">
                            <div className="mb-3 flex items-center gap-2 text-rose-100">
                                <BellRing className="h-5 w-5" />
                                <h2 className="font-bold">Priority alerts</h2>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                                {unknownAlerts.map((alert, index) => (
                                    <div key={`${alert.time}-${index}`} className="rounded-md border border-rose-300/20 bg-slate-950/60 p-3">
                                        <p className="text-sm font-semibold text-white">{alert.message}</p>
                                        <p className="mt-1 text-xs text-rose-200/70">{alert.time}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
                        <Panel title="Entry flow" icon={BarChart3}>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                        <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }} />
                                        <Bar dataKey="verified" stackId="a" fill={chartColors.verified} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="suspicious" stackId="a" fill={chartColors.suspicious} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="unknown" stackId="a" fill={chartColors.unknown} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Panel>

                        <Panel title="Status mix" icon={Activity}>
                            <div className="h-72">
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={4}>
                                                {pieData.map((entry) => (
                                                    <Cell key={entry.key} fill={chartColors[entry.key]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState icon={Activity} text="No scans yet." />
                                )}
                            </div>
                        </Panel>
                    </div>

                    <Panel title="Recent entry logs" icon={Clock}>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[680px] text-left">
                                <thead>
                                    <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-slate-500">
                                        <th className="px-3 py-3">Time</th>
                                        <th className="px-3 py-3">Name</th>
                                        <th className="px-3 py-3">Role</th>
                                        <th className="px-3 py-3">Risk</th>
                                        <th className="px-3 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-3 py-10">
                                                <EmptyState icon={Activity} text="No entry logs yet." />
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.slice(0, 12).map((log, index) => (
                                            <tr key={`${log.time}-${log.name}-${index}`} className="border-b border-white/5 hover:bg-white/[0.03]">
                                                <td className="px-3 py-4 text-sm text-slate-300">{log.time}</td>
                                                <td className="px-3 py-4 font-semibold text-white">{log.name}</td>
                                                <td className="px-3 py-4 text-sm text-slate-400">{log.role}</td>
                                                <td className="px-3 py-4 text-sm text-slate-300">{log.risk_score ?? 0}</td>
                                                <td className="px-3 py-4">
                                                    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusStyles[log.status] || statusStyles.unknown}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </section>

                <aside className="space-y-5">
                    <Panel title="Register worker" icon={UserPlus}>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Field label="Full name" icon={Users}>
                                <input
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 pl-10 text-white outline-none transition focus:border-cyan-300"
                                    placeholder="Ramesh Kumar"
                                    required
                                />
                            </Field>

                            <Field label="Role" icon={ClipboardList}>
                                <select
                                    value={role}
                                    onChange={(event) => setRole(event.target.value)}
                                    className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 pl-10 text-white outline-none transition focus:border-cyan-300"
                                >
                                    <option>Maintenance</option>
                                    <option>Housekeeping</option>
                                    <option>Delivery</option>
                                    <option>Security</option>
                                    <option>Visitor</option>
                                </select>
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Phone" icon={Phone}>
                                    <input
                                        value={phone}
                                        onChange={(event) => setPhone(event.target.value)}
                                        className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 pl-10 text-white outline-none transition focus:border-cyan-300"
                                        placeholder="+91 90000 00000"
                                    />
                                </Field>

                                <Field label="Worker ID" icon={ClipboardList}>
                                    <input
                                        value={employeeId}
                                        onChange={(event) => setEmployeeId(event.target.value)}
                                        className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 pl-10 text-white outline-none transition focus:border-cyan-300"
                                        placeholder="WK-1024"
                                    />
                                </Field>
                            </div>

                            <Field label="Company / agency" icon={Users}>
                                <input
                                    value={organization}
                                    onChange={(event) => setOrganization(event.target.value)}
                                    className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 pl-10 text-white outline-none transition focus:border-cyan-300"
                                    placeholder="ABC Facility Services"
                                />
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Access zone" icon={MapPin}>
                                    <select
                                        value={accessZone}
                                        onChange={(event) => setAccessZone(event.target.value)}
                                        className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 pl-10 text-white outline-none transition focus:border-cyan-300"
                                    >
                                        <option>Main Gate</option>
                                        <option>Hostel Block A</option>
                                        <option>Hostel Block B</option>
                                        <option>Service Entry</option>
                                        <option>All Hostel Areas</option>
                                    </select>
                                </Field>

                                <Field label="Shift" icon={Clock}>
                                    <select
                                        value={shift}
                                        onChange={(event) => setShift(event.target.value)}
                                        className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 pl-10 text-white outline-none transition focus:border-cyan-300"
                                    >
                                        <option>Day</option>
                                        <option>Evening</option>
                                        <option>Night</option>
                                        <option>One-time visit</option>
                                    </select>
                                </Field>
                            </div>

                            <label className="block">
                                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Notes</span>
                                <textarea
                                    value={notes}
                                    onChange={(event) => setNotes(event.target.value)}
                                    className="min-h-24 w-full resize-none rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-white outline-none transition focus:border-cyan-300"
                                    placeholder="Purpose, approved room/floor, or special instructions"
                                />
                            </label>

                            <div className="rounded-lg border border-dashed border-white/15 bg-slate-950/70 p-4">
                                {filePreview ? (
                                    <img src={filePreview} alt="Selected staff face" className="mb-3 aspect-video w-full rounded-md object-cover" />
                                ) : (
                                    <div className="mb-3 flex aspect-video items-center justify-center rounded-md bg-white/[0.03] text-slate-500">
                                        <FileImage className="h-12 w-12" />
                                    </div>
                                )}
                                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.08]">
                                    <Upload className="h-4 w-4" />
                                    Choose face photo
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>

                            {formMessage && (
                                <div className={`rounded-md border p-3 text-sm ${formMessage.type === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100' : 'border-rose-400/25 bg-rose-400/10 text-rose-100'}`}>
                                    {formMessage.text}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                                Register worker
                            </button>
                        </form>
                    </Panel>

                    <Panel title="Operations" icon={Users}>
                        <div className="space-y-3">
                            <ChecklistItem icon={CheckCircle2} text="Guard checkpoint online" active />
                            <ChecklistItem icon={CheckCircle2} text={`${stats.activeStaff || 0} known people seen today`} active />
                            <ChecklistItem icon={unknownAlerts.length ? XCircle : CheckCircle2} text={unknownAlerts.length ? 'Unresolved alerts present' : 'No active unknown alerts'} active={!unknownAlerts.length} />
                            <ChecklistItem icon={AlertTriangle} text="Face photos should be front-facing and well-lit" />
                        </div>
                    </Panel>
                </aside>
            </div>
        </main>
    );
};

const StatCard = ({ icon: Icon, label, value, tone }) => {
    const tones = {
        cyan: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-200',
        emerald: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
        amber: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
        rose: 'border-rose-300/20 bg-rose-300/10 text-rose-200',
    };

    return (
        <div className={`rounded-lg border p-4 ${tones[tone]}`}>
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">{label}</p>
                <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{value}</p>
        </div>
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

const Field = ({ label, icon: Icon, children }) => (
    <label className="block">
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
        <div className="relative">
            <Icon className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-500" />
            {children}
        </div>
    </label>
);

const EmptyState = ({ icon: Icon, text }) => (
    <div className="flex h-full min-h-32 flex-col items-center justify-center rounded-md border border-dashed border-white/10 p-6 text-center text-slate-500">
        <Icon className="mb-3 h-8 w-8" />
        <p className="text-sm">{text}</p>
    </div>
);

const ChecklistItem = ({ icon: Icon, text, active }) => (
    <div className="flex items-center gap-3 rounded-md bg-slate-950/70 p-3">
        <span className={`rounded-full p-2 ${active ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/[0.04] text-slate-400'}`}>
            <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm text-slate-300">{text}</p>
    </div>
);

export default AdminDashboard;
