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
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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
    if (soundEnabled && totalWO > prevTotal) {
        const audio = new Audio('/sounds/notification.wav');
        audio.play();
    }

    setPrevTotal(totalWO);
}, [totalWO, soundEnabled]);

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex h-screen overflow-hidden bg-gray-100">

                {/* ================= LEFT SIDE ================= */}
                <div className="w-1/3 h-screen p-4 bg-green-600">
    <div className="flex flex-col h-full">

        {/* ====== STATISTIK ====== */}
        <div className="space-y-2 text-sm">

    <h1 className="text-lg font-black tracking-wide text-center text-white mb-3">
    WORK ORDER
</h1>

    {/* TOTAL */}
    <div className="p-2 rounded bg-white shadow-sm">
        <p className="text-xs text-gray-500">Total</p>
        <p className="text-base font-bold">{totalWO}</p>
    </div>

    {/* PENDING */}
    <div className="p-2 rounded bg-yellow-100 shadow-sm">
        <p className="text-xs text-yellow-800">Pending</p>
        <p className="text-base font-bold text-yellow-900">{totalPending}</p>
    </div>

    {/* PROGRESS */}
    <div className="p-2 rounded bg-blue-100 shadow-sm">
        <p className="text-xs text-blue-800">Progress</p>
        <p className="text-base font-bold text-blue-900">{totalProgress}</p>
    </div>

    {/* COMPLETED */}
    <div className="p-2 rounded bg-green-100 shadow-sm">
        <p className="text-xs text-green-800">Completed</p>
        <p className="text-base font-bold text-green-900">{totalDone}</p>
    </div>

    {/* COMPLETION RATE */}
    <div className="p-2 rounded bg-white shadow-sm">
        <p className="text-xs text-gray-500">Completion Rate</p>
        <p className="text-sm font-bold">{completionRate}%</p>

        <p className="text-xs text-gray-500">
            Avg: <span className="font-semibold">{averageDuration}</span>
        </p>
    </div>

    {/* TOGGLE */}
    <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="text-xs bg-green-900 font-bold text-white px-2 py-1 rounded w-full hover:bg-black transition"
    >
        {soundEnabled ? '🔕 Notifikasi OFF' : '🔔 Notifikasi ON'}
    </button>

    {/* LAST UPDATE */}
    <p className="text-xs font-semibold text-white text-center">
        Last update: {lastRefresh ? lastRefresh.toLocaleTimeString() : '-'}
    </p>

</div>

        {/* ====== SPACER OTOMATIS ====== */}
        <div className="flex-grow" />

        {/* ====== FILTER (NEMPEL BAWAH) ====== */}
        <div className="space-y-2 pt-2 border-t">
               <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border border-green-800 bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-500"
             />

           <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 border border-green-800 bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="bg-green-900 font-bold text-white py-2 rounded w-full text-sm hover:bg-black"
            >
                Tampilkan
            </button>

        </div>

    </div>
</div>

                {/* ================= RIGHT SIDE ================= */}
                <div className="w-2/3 h-full overflow-y-auto p-6">

                    {workorders.length === 0 ? (
                        <div className="border p-4 rounded bg-white shadow">
                            Tidak ada Work Order pada filter ini.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-6">
                            {workorders.map((wo) => (
                                <div
                                    key={wo.id}
                                    className="bg-white border rounded-lg shadow-sm hover:shadow-md transition p-4"
                                >
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
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}