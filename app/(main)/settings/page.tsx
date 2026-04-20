import Link from 'next/link';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  href?: string;
}

export default function SettingsPage() {
  const sections: SettingsSection[] = [
    { id: 'profile', title: 'โปรไฟล์', description: 'อัปเดตชื่อ อีเมล และรหัสผ่านของคุณ', icon: 'solar:user-bold-duotone' },
    { id: 'workspace', title: 'เวิร์กสเปซ', description: 'แก้ไขชื่อเวิร์กสเปซ สาขา และการตั้งค่าภูมิภาค', icon: 'solar:buildings-bold-duotone' },
    { id: 'notifications', title: 'การแจ้งเตือน', description: 'เลือกประเภทการแจ้งเตือนสต็อกที่คุณต้องการรับ', icon: 'solar:bell-bold-duotone' },
    { id: 'team', title: 'ทีมงาน', description: 'เชิญเพื่อนร่วมทีมและจัดการระดับสิทธิ์การเข้าถึง', icon: 'solar:shield-user-bold-duotone', href: '/settings/team' },
    { id: 'integrations', title: 'การเชื่อมต่อระบบ', description: 'เชื่อมต่อระบบ POS, ERP และเครื่องมือด้านโลจิสติกส์', icon: 'solar:database-bold-duotone' },
    { id: 'billing', title: 'การเรียกเก็บเงิน', description: 'ตรวจสอบแพ็กเกจ ใบแจ้งหนี้ และประวัติการชำระเงิน', icon: 'solar:card-bold-duotone' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">การตั้งค่า</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">การตั้งค่าเวิร์กสเปซ</h1>
        <p className="max-w-2xl text-sm text-muted">
          จัดการรายละเอียดบัญชี การตั้งค่าเวิร์กสเปซ การแจ้งเตือน สิทธิ์ของทีม และการเรียกเก็บเงินได้จากที่เดียว
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="divide-y divide-border-subtle">
          {sections.map((section) => {
            const content = (
              <>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-muted transition-colors group-hover:bg-accent-subtle group-hover:text-accent">
                  <iconify-icon icon={section.icon} width="22" height="22" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
                    {section.href && (
                      <span className="rounded-full bg-accent-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-accent">
                        จัดการ
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">{section.description}</p>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle text-muted transition-colors group-hover:bg-accent-subtle group-hover:text-accent">
                  <iconify-icon icon="solar:alt-arrow-right-linear" width="18" height="18" aria-hidden="true" />
                </div>
              </>
            );

            if (section.href) {
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-subtle focus:outline-none focus-visible:bg-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset sm:px-6"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={section.id}
                type="button"
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-subtle focus:outline-none focus-visible:bg-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset sm:px-6"
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-muted shadow-sm sm:flex sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium text-foreground">สถานะระบบ</p>
          <p>ระบบควบคุมสิทธิ์เข้าถึงเวิร์กสเปซและบันทึกการตรวจสอบกำลังทำงานอยู่</p>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-success-subtle px-3 py-1 text-xs font-medium text-success sm:mt-0">
          <iconify-icon icon="solar:shield-check-bold-duotone" width="14" height="14" aria-hidden="true" />
          ปลอดภัย
        </div>
      </div>
    </div>
  );
}
