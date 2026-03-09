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

const getSummaryStatus = (status:number) => {

if(status === 0 || status === 1){
return "Pending"
}

if(status === 2 || status === 3){
return "Progress"
}

if(status === 4 || status === 5){
return "Completed"
}

return "-"

}

useEffect(() => {

const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];

if (navEntries.length > 0 && navEntries[0].type === "reload") {
window.location.href = '/dashboard';
}

}, []);

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

{/* LEFT PANEL */}

<div className="w-1/3 h-screen p-4 bg-gradient-to-b from-emerald-700 to-emerald-900 shadow-2xl border-r border-green-800">

<div className="flex flex-col h-full">

<div className="space-y-2 text-sm">

<div className="mb-3 text-center">

<h1 className="text-2xl font-black text-white tracking-wider">
WORK ORDER
</h1>

<div className="h-1 w-16 mx-auto mt-1 bg-green-300 rounded-full"></div>

</div>

<div className="p-2 bg-white rounded shadow">
<p className="text-xs text-gray-500">Total</p>
<p className="font-semibold">{totalWO}</p>
</div>

<div className="p-2 bg-yellow-100 rounded shadow">
<p className="text-xs text-yellow-700">Pending</p>
<p className="font-semibold">{totalPending}</p>
</div>

<div className="p-2 bg-blue-100 rounded shadow">
<p className="text-xs text-blue-700">Progress</p>
<p className="font-semibold">{totalProgress}</p>
</div>

<div className="p-2 bg-green-100 rounded shadow">
<p className="text-xs text-green-700">Completed</p>
<p className="font-semibold">{totalDone}</p>
</div>

<div className="p-2 bg-white rounded shadow">
<p className="text-xs text-gray-500">Completion Rate</p>
<p className="font-semibold">{completionRate}%</p>
<p className="text-xs text-gray-500">
Avg: {averageDuration}
</p>
</div>

<button
onClick={() => setSoundEnabled(!soundEnabled)}
className={`text-xs font-bold px-2 py-1 rounded w-full ${
soundEnabled
? 'bg-green-400 text-green-900'
: 'bg-green-800 text-green-200'
}`}
>
{soundEnabled ? '🔔 Notifikasi ON' : '🔕 Notifikasi OFF'}
</button>

<p className="text-xs text-white text-center">
Last update: {lastRefresh ? lastRefresh.toLocaleTimeString() : '-'}
</p>

</div>

<div className="flex-grow"/>

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
<option value="0">Draft</option>
<option value="1">Departemen Request</option>
<option value="2">Departemen Recipient</option>
<option value="3">Execute Departemen Recipient</option>
<option value="4">Checked Departemen Recipient</option>
<option value="5">Checked Departemen Request</option>

</select>

<button
onClick={()=>router.get('/dashboard',{
date_request:date,
status:status
})}
className="bg-white text-green-900 font-bold py-1 rounded w-full text-sm hover:bg-green-400 hover:text-green-900 transition"
>
Tampilkan
</button>

</div>

</div>

</div>

{/* RIGHT PANEL */}

<div className="w-2/3 h-screen overflow-y-auto px-4 pt-2 pb-4">

{workorders.length === 0 ? (

<div className="bg-white border p-4 rounded shadow text-sm">
{emptyMessage}
</div>

) : (

<div className="grid grid-cols-2 gap-4" style={{gridAutoRows:"minmax(48vh, auto)"}}>

{workorders.map((wo, index)=>{

const isNewest = index === 0;
const summaryStatus = getSummaryStatus(wo.status);

return (

<div
key={wo.id}
className={`relative bg-white border rounded-lg shadow-md p-3 text-[11px] flex flex-col justify-between transition duration-200 ease-out hover:shadow-xl hover:-translate-y-1
${isNewest ? "border-l-4 border-l-emerald-500 pl-2 bg-emerald-50" : ""}
`}
>

{/* HEADER */}

<div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">

<div className="flex items-center gap-2">

<span className="font-semibold text-[14px] text-gray-900 tracking-wide">
{wo.id_wo}
</span>

{isNewest && (
<span className="text-[10px] font-semibold px-2 py-[2px] bg-emerald-500 text-white rounded-full">
NEW
</span>
)}

</div>

<span
  className={`text-[11px] font-bold px-2.5 py-[3px] rounded-full tracking-wide shadow-sm
  ${
    summaryStatus === "Pending"
      ? "bg-yellow-100 text-yellow-800"
      : summaryStatus === "Progress"
      ? "bg-blue-100 text-blue-800"
      : summaryStatus === "Completed"
      ? "bg-green-100 text-green-800"
      : "bg-gray-300 text-gray-800"
  }`}
>
  {summaryStatus}
</span>

</div>

{/* CONTENT */}

<div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-1 flex-grow">

<div>

<p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide mb-1">
WORK ORDER INFO
</p>

<p>
  Priority:
  <span
    className={`ml-1 text-[10px] font-semibold
    ${
      wo.priority === 1
        ? "text-red-600"
        : wo.priority === 2
        ? "text-blue-600"
        : "text-gray-600"
    }`}
  >
    {wo.priority_text}
  </span>
</p>

<p>Status: {wo.status_text}</p>

<p>Umur: {wo.umur_wo} hari</p>
<p>Durasi: {wo.duration_text ?? '-'}</p>

</div>

<div>

<p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide mb-1">
JOB INFORMATION
</p>

<p className="break-words">Job: {wo.job_name}</p>
<p className="break-words">Deskripsi: {wo.job_description}</p>
<p>Asset: {wo.asset ?? '-'}</p>

</div>

<div>

<p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide mb-1">
DEPARTMENT
</p>

<p className="break-words">Requestor: {wo.requestor}</p>
<p className="break-words">Departemen Request: {wo.departemen_request ?? '-'}</p>

</div>

<div>

<p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide mb-1">
LOKASI & PIC
</p>

<p className="break-words">Lokasi: {wo.work_location}</p>
<p>PIC: {wo.pic_name ?? '-'}</p>

</div>

</div>

{/* TIMELINE */}

<div className="border-t border-gray-200 pt-2">

<p className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide mb-1">
TIMELINE
</p>

<div className="grid grid-cols-3 text-center">

<div>
<p className="text-slate-800 font-semibold">Req</p>
<p>{wo.date_request_formatted}</p>
</div>

<div>
<p className="text-slate-800 font-semibold">Start</p>
<p>{wo.work_started_formatted ?? '-'}</p>
</div>

<div>
<p className="text-slate-800 font-semibold">Done</p>
<p>{wo.work_completed_formatted ?? '-'}</p>
</div>

</div>

</div>

</div>

)

})}

</div>

)}

</div>

</div>

</>
);
}