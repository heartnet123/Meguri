import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type Item = {
  _id: string;
  name: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
};

export function ArchiveItemDialog({ isOpen, onClose, item }: Props) {
  const archive = useMutation(api.inventory.archive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (!isOpen || !item) return null;

  const handleArchive = async () => {
    setLoading(true);
    setError(null);
    try {
      await archive({ id: item._id as Id<'inventoryItems'>, note: note || undefined });
      setNote('');
      onClose();
    } catch (err: any) {
      // Surface the domain error message (ConvexError.message)
      const msg: string = err?.data ?? err?.message ?? 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-xl border border-border w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-warning-subtle flex items-center justify-center mx-auto mb-4">
            <iconify-icon icon="solar:archive-bold" width="24" height="24" className="text-warning" />
          </div>
          <h2 className="text-lg font-semibold text-foreground text-center mb-2">
            เก็บสินค้านี้เข้าแฟ้ม
          </h2>
          <p className="text-sm text-muted text-center leading-relaxed">
            ต้องการเก็บ <strong className="text-foreground">{item.name}</strong> เข้าแฟ้มหรือไม่? สินค้านี้จะถูกซ่อนจากหน้าปฏิบัติการทั้งหมด
            แต่ประวัติการเคลื่อนไหวของสต็อกยังคงอยู่ และสามารถค้นหาได้จากรายการที่เก็บเข้าแฟ้ม
          </p>

          <div className="mt-4 space-y-1.5">
            <label className="text-sm font-medium text-foreground">เหตุผล (ไม่บังคับ)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น เลิกจำหน่ายสินค้า"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-danger-subtle text-danger text-sm rounded-lg border border-danger/20 flex items-start gap-2">
              <iconify-icon icon="solar:danger-triangle-linear" width="16" height="16" className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-subtle">
          <button
            onClick={() => { setNote(''); setError(null); onClose(); }}
            className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-raised transition-colors focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-1"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleArchive}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-warning rounded-lg hover:bg-warning/90 transition-colors disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-2"
          >
            {loading ? 'กำลังเก็บเข้าแฟ้ม…' : 'เก็บสินค้าเข้าแฟ้ม'}
          </button>
        </div>
      </div>
    </div>
  );
}
