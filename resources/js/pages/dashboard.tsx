import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface WorkOrder {
    id: number;
    id_wo: string;
    job_name: string;
    job_description: string;
    departemen: string;
    sub_departemen: string;
    departemen_request: string;
    requestor: string;
    date_request: string;
    date_request_formatted: string;
    work_location: string;
    priority: number;
    priority_text: string;
    pic_name?: string;
    status: number;
    status_text: string;
    asset: string;
    umur_wo: number;
    duration_text: string;
    work_started_formatted?: string | null;
    work_completed_formatted?: string | null;
}

export default function Dashboard({
    workorders,
    totalWO,
    totalPending,
    totalProgress,
    totalDone,
    completionRate,
    averageDuration,
    selectedDate,
    selectedStatus
}: {
    workorders: WorkOrder[],
    totalWO: number,
    totalPending: number,
    totalProgress: number,
    totalDone: number,
    completionRate: number,
    averageDuration: string,
    selectedDate: string,
    selectedStatus: string
}) {

    const [date, setDate] = useState(selectedDate || '');
    const [status, setStatus] = useState(selectedStatus || '');

    const [prevTotal, setPrevTotal] = useState(totalWO);
    const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('wo_sound') === 'true';
});
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    
useEffect(() => {
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];

    if (navEntries.length > 0 && navEntries[0].type === "reload") {
        window.location.href = '/dashboard';
    }
}, []);


    // ✅ AUTO REFRESH 30 DETIK
    useEffect(() => {
        const interval = setInterval(() => {
            router.get('/dashboard', {
                date_request: date,
                status: status
            }, {
                preserveState: true,
                replace: true,
                onSuccess: () => setLastRefresh(new Date())
            });
        }, 30000);

        return () => clearInterval(interval);
    }, [date, status]);

    // ✅ NOTIFIKASI SUARA
    useEffect(() => {
    if (!soundEnabled) return;

    if (totalWO > prevTotal) {
        const audio = new Audio('/sounds/notification.wav');
        audio.play();
    }

    setPrevTotal(totalWO);
}, [totalWO]);

useEffect(() => {
    localStorage.setItem('wo_sound', String(soundEnabled));
}, [soundEnabled]);

 // ✅ EMPTY MESSAGE LOGIC
    let emptyMessage = "Tidak ada data Work Order tersedia.";

    if (date && status) {
        emptyMessage = "Tidak ada Work Order dengan status tersebut pada tanggal yang dipilih.";
    } else if (date) {
        emptyMessage = "Tidak ada Work Order pada tanggal yang dipilih.";
    } else if (status) {
        emptyMessage = "Tidak ada Work Order dengan status tersebut.";
    }


    return (
<>
    <Head title="Dashboard" />

    <div className="flex h-screen overflow-hidden bg-gray-100">

        {/* ================= LEFT SIDE ================= */}
        <div className="w-1/3 h-screen p-4 
    bg-gradient-to-b from-emerald-700 to-emerald-900
    shadow-2xl border-r border-green-800">
            <div className="flex flex-col h-full">

                {/* ====== STATISTIK ====== */}
                <div className="space-y-1 text-sm">

                    <div className="mb-3 text-center">
                    <h1 className="text-2xl font-black tracking-wider text-white uppercase">
                     WORK ORDER
                    </h1>
            <div className="h-1 w-16 mx-auto mt-1 bg-green-300 rounded-full"></div>
            </div>

                    <div className="p-2 rounded-lg bg-white/95 shadow border border-gray-100">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-sm font-semibold">{totalWO}</p>
            </div>

                    <div className="p-2 rounded-lg bg-yellow-100 shadow border border-yellow-200">
                    <p className="text-xs text-yellow-800">Pending</p>
                    <p className="text-sm font-semibold text-yellow-900">{totalPending}</p>
            </div>

                   <div className="p-2 rounded-lg bg-blue-100 shadow border border-blue-200">
                   <p className="text-xs text-blue-800">Progress</p>
                   <p className="text-sm font-semibold text-blue-900">{totalProgress}</p>
            </div>

                   <div className="p-2 rounded-lg bg-green-100 shadow border border-green-200">
                   <p className="text-xs text-green-800">Completed</p>
                   <p className="text-sm font-semibold text-green-900">{totalDone}</p>
            </div>

                   <div className="p-2 rounded-lg bg-white/95 shadow border border-gray-100">
                   <p className="text-xs text-gray-500">Completion Rate</p>
                   <p className="text-sm font-semibold">{completionRate}%</p>
                   <p className="text-xs text-gray-500">
                   Avg: <span className="font-semibold">{averageDuration}</span>
                   </p>
            </div>

                    <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`text-xs font-bold px-2 py-1 rounded w-full transition ${
                    soundEnabled
                   ? 'bg-green-400 text-green-900 hover:bg-green-300'
                   : 'bg-green-800 text-green-200 hover:bg-green-700'
                  }`}
>
                 {soundEnabled ? '🔔 Notifikasi ON' : '🔕 Notifikasi OFF'}
                 </button>

                    <p className="text-xs font-semibold text-white text-center">
                        Last update: {lastRefresh ? lastRefresh.toLocaleTimeString() : '-'}
                    </p>

                </div>

                <div className="flex-grow" />

                {/* ====== FILTER ====== */}
                <div className="space-y-2 pt-2 border-t">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 border border-green-800 bg-white text-black"
                    />

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 border border-green-800 bg-white text-black"
                    >
                        <option value="">Semua Status</option>
                        <option value="0">Pending</option>
                        <option value="1">In Progress</option>
                        <option value="2,3,4">Completed</option>
                    </select>

                    <button
                        onClick={() =>
                            router.get('/dashboard', {
                                date_request: date,
                                status: status
                            })
                        }
                        className="bg-white text-green-900 font-bold py-2 rounded-lg w-full text-sm hover:bg-green-200 transition"
                    >
                        Tampilkan
                    </button>
                </div>

            </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className="w-2/3 h-screen overflow-y-auto p-4">

            {workorders.length === 0 ? (
    <div className="border p-4 rounded bg-white shadow text-sm text-gray-600">
        {emptyMessage}
    </div>
) : (
                <div
                    className="grid grid-cols-2 gap-4"
                    style={{ gridAutoRows: "48vh" }}
                >
                    {workorders.map((wo) => (
                        <div
                            key={wo.id}
                            className="bg-white border rounded-lg shadow-md p-3 text-xs leading-tight overflow-hidden"
                        >
                            <div className="h-full overflow-y-auto pr-1">

                                <p><strong>ID WO:</strong> {wo.id_wo}</p>
                                <p><strong>Job:</strong> {wo.job_name}</p>
                                <p><strong>Deskripsi:</strong> {wo.job_description}</p>
                                <p><strong>Departemen:</strong> {wo.departemen}</p>
                                <p><strong>Sub Departemen:</strong> {wo.sub_departemen}</p>

                                {wo.departemen_request && (
                                    <p><strong>Departemen Request:</strong> {wo.departemen_request}</p>
                                )}

                                <p><strong>Requestor:</strong> {wo.requestor}</p>
                                <p><strong>Tanggal Request:</strong> {wo.date_request_formatted}</p>
                                <p><strong>Lokasi:</strong> {wo.work_location}</p>
                                <p><strong>Priority:</strong> {wo.priority_text}</p>
                                <p><strong>PIC / Teknisi:</strong> {wo.pic_name ?? '-'}</p>
                                <p><strong>Status:</strong> {wo.status_text}</p>

                                {wo.asset && (
                                    <p><strong>Asset:</strong> {wo.asset}</p>
                                )}

                                <p><strong>Umur WO:</strong> {wo.umur_wo} hari</p>

                                {wo.duration_text && (
                                    <p><strong>Durasi Pengerjaan:</strong> {wo.duration_text}</p>
                                )}

                                <p><strong>Work Started:</strong> {wo.work_started_formatted ?? '-'}</p>
                                <p><strong>Work Completed:</strong> {wo.work_completed_formatted ?? '-'}</p>

                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>

    </div>
</>
);
}