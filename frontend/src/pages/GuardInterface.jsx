import { useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertTriangle,
    BadgeCheck,
    Camera,
    CheckCircle2,
    Clock,
    FileImage,
    RefreshCw,
    RotateCcw,
    ShieldAlert,
    ShieldCheck,
    Upload,
    UserX,
    Video,
} from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/ai/verify-face';

const statusConfig = {
    verified: {
        label: 'Access allowed',
        tone: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
        badge: 'bg-emerald-400 text-emerald-950',
        icon: ShieldCheck,
    },
    suspicious: {
        label: 'Manual check',
        tone: 'border-amber-400/50 bg-amber-500/10 text-amber-100',
        badge: 'bg-amber-300 text-amber-950',
        icon: ShieldAlert,
    },
    unknown: {
        label: 'Access denied',
        tone: 'border-rose-400/50 bg-rose-500/10 text-rose-100',
        badge: 'bg-rose-400 text-rose-950',
        icon: UserX,
    },
};

const GuardInterface = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [result, setResult] = useState(null);
    const [snapshot, setSnapshot] = useState('');
    const [scanHistory, setScanHistory] = useState([]);
    const [location, setLocation] = useState('Main Gate');

    useEffect(() => {
        startCamera();

        return () => {
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const currentStatus = result?.status || 'unknown';
    const config = statusConfig[currentStatus] || statusConfig.unknown;
    const StatusIcon = result ? config.icon : Video;

    const scanStats = useMemo(() => {
        return scanHistory.reduce(
            (acc, item) => {
                acc.total += 1;
                acc[item.status] = (acc[item.status] || 0) + 1;
                return acc;
            },
            { total: 0, verified: 0, suspicious: 0, unknown: 0 }
        );
    }, [scanHistory]);

    const startCamera = async () => {
        setCameraError('');
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError('Camera permission is blocked. Use image upload or allow camera access.');
        }
    };

    const verifyImage = async (imageBase64, source = 'camera') => {
        setScanning(true);
        setResult(null);
        setSnapshot(imageBase64);

        try {
            const res = await axios.post(
                API_URL,
                { image: imageBase64, location },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const verifiedResult = {
                ...res.data,
                source,
                checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            setResult(verifiedResult);
            setScanHistory((prev) => [verifiedResult, ...prev].slice(0, 8));
        } catch (err) {
            console.error('Verification failed', err);
            const failedResult = {
                status: 'unknown',
                match: false,
                source,
                reason: 'Server could not verify this scan.',
                checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setResult(failedResult);
            setScanHistory((prev) => [failedResult, ...prev].slice(0, 8));
        } finally {
            setScanning(false);
        }
    };

    const captureAndVerify = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || !cameraReady) {
            setCameraError('Camera is still warming up. Try again in a moment.');
            return;
        }

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        verifyImage(canvas.toDataURL('image/jpeg', 0.92), 'camera');
    };

    const handleUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => verifyImage(reader.result, 'uploaded image');
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const clearResult = () => {
        setResult(null);
        setSnapshot('');
    };

    return (
        <main className="min-h-[calc(100vh-73px)] bg-[#07111f] text-slate-100">
            <div className="border-b border-white/10 bg-slate-950/70">
                <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
                            Security checkpoint
                        </div>
                        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Guard verification console</h1>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                            <p className="text-xs text-slate-400">Today scans</p>
                            <p className="mt-1 text-2xl font-bold">{scanStats.total}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3">
                            <p className="text-xs text-emerald-200/80">Allowed</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-200">{scanStats.verified}</p>
                        </div>
                        <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
                            <p className="text-xs text-amber-200/80">Review</p>
                            <p className="mt-1 text-2xl font-bold text-amber-200">{scanStats.suspicious}</p>
                        </div>
                        <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 p-3">
                            <p className="text-xs text-rose-200/80">Denied</p>
                            <p className="mt-1 text-2xl font-bold text-rose-200">{scanStats.unknown}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
                <section className="overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${cameraReady ? 'bg-emerald-400 text-emerald-950' : 'bg-amber-300 text-amber-950'}`}>
                                {cameraReady ? 'Live camera' : 'Initializing'}
                            </span>
                            <span className="text-sm text-slate-400">{location}</span>
                        </div>

                        <select
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-300"
                        >
                            <option>Main Gate</option>
                            <option>Hostel Block A</option>
                            <option>Hostel Block B</option>
                            <option>Service Entry</option>
                        </select>
                    </div>

                    <div className="relative aspect-video bg-black">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            onCanPlay={() => setCameraReady(true)}
                            className="h-full w-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />

                        <div className="pointer-events-none absolute inset-0 border-[18px] border-black/20" />
                        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-[45%] border-2 border-cyan-300/70 shadow-[0_0_40px_rgba(103,232,249,0.25)]" />
                        <div className="pointer-events-none absolute inset-x-10 top-1/2 h-px bg-cyan-300/50" />

                        {cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 p-6 text-center">
                                <div>
                                    <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-amber-300" />
                                    <p className="max-w-md text-lg font-semibold text-white">{cameraError}</p>
                                </div>
                            </div>
                        )}

                        {scanning && (
                            <div className="absolute inset-0 flex items-center justify-center bg-cyan-400/10 backdrop-blur-sm">
                                <div className="rounded-lg border border-cyan-300/40 bg-slate-950/80 px-6 py-5 text-center shadow-2xl">
                                    <RefreshCw className="mx-auto mb-3 h-10 w-10 animate-spin text-cyan-200" />
                                    <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-100">Analyzing face</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-3 border-t border-white/10 bg-slate-950/70 p-4 sm:grid-cols-[1fr_auto_auto]">
                        <button
                            onClick={captureAndVerify}
                            disabled={scanning}
                            className="flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {scanning ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                            Scan face
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={scanning}
                            className="flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-5 py-3 font-semibold text-slate-100 transition hover:bg-white/[0.08] disabled:opacity-60"
                        >
                            <Upload className="h-5 w-5" />
                            Upload
                        </button>
                        <button
                            onClick={clearResult}
                            className="flex items-center justify-center gap-2 rounded-md border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/[0.06]"
                        >
                            <RotateCcw className="h-5 w-5" />
                            Reset
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    </div>
                </section>

                <aside className="space-y-5">
                    <section className={`rounded-lg border p-5 shadow-2xl ${result ? config.tone : 'border-white/10 bg-slate-900'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Decision</p>
                                <h2 className="mt-2 text-3xl font-bold text-white">{result ? config.label : 'Ready to scan'}</h2>
                            </div>
                            <div className="rounded-lg bg-white/10 p-3">
                                <StatusIcon className="h-8 w-8" />
                            </div>
                        </div>

                        {snapshot ? (
                            <img src={snapshot} alt="Latest captured face" className="mt-5 aspect-video w-full rounded-md border border-white/10 object-cover" />
                        ) : (
                            <div className="mt-5 flex aspect-video items-center justify-center rounded-md border border-dashed border-white/15 bg-slate-950/70 text-slate-500">
                                <FileImage className="h-12 w-12" />
                            </div>
                        )}

                        <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between rounded-md bg-black/20 px-4 py-3">
                                <span className="text-sm text-slate-300">Person</span>
                                <span className="font-semibold text-white">{result?.name || result?.identity || 'Unknown visitor'}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-black/20 px-4 py-3">
                                <span className="text-sm text-slate-300">Role</span>
                                <span className="font-semibold text-white">{result?.role || '-'}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-md bg-black/20 px-4 py-3">
                                <span className="text-sm text-slate-300">Confidence</span>
                                <span className="font-semibold text-white">{result?.confidence != null ? `${result.confidence}%` : 'Pending'}</span>
                            </div>
                        </div>

                        {(result?.reason || result?.details) && (
                            <div className="mt-4 rounded-md border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">
                                {result.reason || result.details}
                            </div>
                        )}
                    </section>

                    <section className="rounded-lg border border-white/10 bg-slate-900 p-5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-bold text-white">Recent checks</h3>
                            <Clock className="h-5 w-5 text-slate-400" />
                        </div>

                        <div className="space-y-3">
                            {scanHistory.length === 0 ? (
                                <p className="rounded-md border border-dashed border-white/10 p-4 text-sm text-slate-500">No scans in this session yet.</p>
                            ) : (
                                scanHistory.map((item, index) => {
                                    const ItemIcon = item.status === 'verified' ? CheckCircle2 : item.status === 'suspicious' ? BadgeCheck : UserX;
                                    const itemConfig = statusConfig[item.status] || statusConfig.unknown;

                                    return (
                                        <div key={`${item.checkedAt}-${index}`} className="flex items-center gap-3 rounded-md bg-slate-950/60 p-3">
                                            <span className={`rounded-full p-2 ${itemConfig.badge}`}>
                                                <ItemIcon className="h-4 w-4" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-white">{item.name || item.identity || 'Unknown visitor'}</p>
                                                <p className="text-xs text-slate-400">{item.checkedAt} via {item.source}</p>
                                            </div>
                                            <span className="text-xs font-bold uppercase text-slate-300">{item.status}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    );
};

export default GuardInterface;
