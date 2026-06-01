'use client';

interface Report {
  id: string;
  title: string;
  description: string;
  type: string;
  frequency: string;
  lastGenerated: string;
  icon: string;
  iconColor: string;
  bgColor: string;
}

export default function ReportsPage() {
  const reports: Report[] = [
    {
      id: 'REP-001',
      title: 'รายงานสรุปรายได้รวม',
      description: 'ภาพรวมผลการขาย สินค้าหมุนเร็ว และกำไรต่อหน่วยในมุมมองเดียว',
      type: 'การเงิน',
      frequency: 'รายเดือน',
      lastGenerated: '2026-03-01',
      icon: 'solar:chart-square-bold-duotone',
      iconColor: 'text-accent',
      bgColor: 'bg-accent-subtle/40',
    },
    {
      id: 'REP-002',
      title: 'ประเมินมูลค่าสินทรัพย์คงคลัง',
      description: 'ประเมินมูลค่าสินค้าคงคลังทั้งหมดแบบเรียลไทม์ พร้อมจัดกลุ่มตามความเสี่ยงเชิงปฏิบัติการ',
      type: 'สินค้าคงคลัง',
      frequency: 'รายสัปดาห์',
      lastGenerated: '2026-03-15',
      icon: 'solar:pie-chart-2-bold-duotone',
      iconColor: 'text-success',
      bgColor: 'bg-success-subtle/40',
    },
    {
      id: 'REP-003',
      title: 'ตรวจสอบความคลาดเคลื่อนเชิงคาดการณ์',
      description: 'เปรียบเทียบความต้องการที่ AI คาดการณ์กับยอดขายจริงอย่างละเอียด',
      type: 'การวิเคราะห์',
      frequency: 'รายเดือน',
      lastGenerated: '2026-03-01',
      icon: 'solar:graph-up-bold-duotone',
      iconColor: 'text-accent',
      bgColor: 'bg-accent-subtle/40',
    },
    {
      id: 'REP-004',
      title: 'ดัชนีความน่าเชื่อถือของซัพพลายเออร์',
      description: 'ให้คะแนนซัพพลายเออร์ตามระยะเวลาจัดส่ง ความครบถ้วนของการส่งมอบ และอัตราของเสีย',
      type: 'จัดซื้อ',
      frequency: 'รายไตรมาส',
      lastGenerated: '2026-01-01',
      icon: 'solar:document-text-bold-duotone',
      iconColor: 'text-warning',
      bgColor: 'bg-warning-subtle/40',
    },
    {
      id: 'REP-005',
      title: 'วิเคราะห์เหตุการณ์สินค้าขาดสต็อก',
      description: 'ตรวจสอบประวัติสินค้าขาดสต็อก ระยะเวลาฟื้นตัว และต้นทุนของโอกาสที่สูญเสีย',
      type: 'ปฏิบัติการ',
      frequency: 'รายสัปดาห์',
      lastGenerated: '2026-03-15',
      icon: 'solar:document-bold-duotone',
      iconColor: 'text-danger',
      bgColor: 'bg-danger-subtle/40',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">ชุดรายงานวิเคราะห์</h1>
          <p className="text-sm text-muted mt-2 leading-relaxed max-w-xl">สร้างรายงานเชิงลึก ตั้งเวลาส่งออกข้อมูลอัตโนมัติ และตรวจสอบข้อมูลย้อนหลังได้จากที่เดียว</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-white bg-accent rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 hover:scale-105 active:scale-95">
            <iconify-icon icon="solar:add-circle-bold-duotone" width="18" height="18" aria-hidden="true"></iconify-icon>
            ตั้งค่าชุดรายงานแบบกำหนดเอง
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {reports.map((report) => (
          <div key={report.id} className="group bg-surface border border-border rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-accent/5 hover:border-accent/20 transition-all duration-500 flex flex-col h-full overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted/20">{report.id}</span>
            </div>
            
            <div className="p-7 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl ${report.bgColor} flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-500 shadow-sm shadow-accent/5`}>
                  <iconify-icon icon={report.icon} width="28" height="28" className={report.iconColor} aria-hidden="true"></iconify-icon>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-surface-raised text-foreground/70 border border-border/50 shadow-sm">
                    {report.type}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted/40 px-3 truncate">
                    {report.frequency}
                  </span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-accent transition-colors leading-tight">{report.title}</h3>
              <p className="text-sm text-muted/80 leading-relaxed mb-8 flex-1 line-clamp-3 font-medium">{report.description}</p>
              
              <div className="pt-6 border-t border-border/50 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted/40">
                  <iconify-icon icon="solar:history-bold-duotone" width="14" height="14" aria-hidden="true" className="text-muted/20"></iconify-icon>
                  อัปเดตล่าสุด: <span className="text-muted/60">{report.lastGenerated}</span>
                </div>
                <button
                  className="w-10 h-10 flex items-center justify-center text-muted hover:text-accent hover:bg-accent-subtle/40 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent/10 active:scale-90 border border-transparent hover:border-accent/10"
                  aria-label={`ส่งออกรายงาน ${report.title}`}
                >
                  <iconify-icon icon="solar:file-download-bold-duotone" width="22" height="22" aria-hidden="true"></iconify-icon>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
