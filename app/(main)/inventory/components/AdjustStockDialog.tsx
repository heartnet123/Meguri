import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type Item = {
  _id: string;
  name: string;
  currentStock: number;
  unit: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
};

export function AdjustStockDialog({ isOpen, onClose, item }: Props) {
  const adjustStock = useMutation(api.inventory.adjustStock);

  const [type, setType] = useState<'adjustment' | 'wastage'>('adjustment');
  const [quantity, setQuantity] = useState<string>('');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  /** Quantity as a signed delta: wastage is always negative, adjustment uses sign as-entered. */
  const parsedQty = parseFloat(quantity) || 0;
  const signedQty = type === 'wastage' ? -Math.abs(parsedQty) : parsedQty;
  const projectedStock = item.currentStock + signedQty;
  const wouldGoNegative = projectedStock < 0;

  const handleClose = () => {
    setQuantity('');
    setNote('');
    setType('adjustment');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (parsedQty === 0) {
      setError('จำนวนต้องไม่เป็นศูนย์');
      return;
    }
    if (wouldGoNegative) {
      setError(
        `การปรับครั้งนี้จะทำให้คงเหลือ ${projectedStock.toFixed(2)} ${item.unit} ซึ่งต่ำกว่าศูนย์ ` +
        'ไม่สามารถให้สต็อกติดลบได้',
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await adjustStock({
        id: item._id as Id<'inventoryItems'>,
        type,
        quantity: signedQty,
        note: note || undefined,
      });
      handleClose();
    } catch (err: any) {
      const msg: string = err?.data ?? err?.message ?? 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-xl shadow-xl border border-border w-full max-w-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface">
          <h2 className="text-lg font-semibold text-foreground">ปรับสต็อก</h2>
          <button
            onClick={handleClose}
            className="text-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface-raised"
            aria-label="ปิดหน้าต่าง"
          >
            <iconify-icon icon="solar:close-circle-linear" width="24" height="24" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted mb-4">
            สต็อกปัจจุบันของ <strong className="text-foreground">{item.name}</strong>:{' '}
            <span className="text-foreground font-medium">{item.currentStock} {item.unit}</span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-danger-subtle text-danger text-sm rounded-lg border border-danger/20 flex items-start gap-2">
              <iconify-icon icon="solar:danger-triangle-linear" width="16" height="16" className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="adjust-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">ประเภทการปรับ</label>
              <select
                value={type}
                onChange={(e) => { setType(e.target.value as any); setError(null); }}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
              >
                <option value="adjustment">ปรับด้วยตนเอง (+/−)</option>
                <option value="wastage">บันทึกของเสีย (−)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                จำนวน{type === 'wastage' ? 'ที่สูญเสีย' : 'ที่ปรับ'} ({item.unit})
              </label>
              <input
                type="number"
                required
                step="any"
                min={type === 'wastage' ? '0.01' : undefined}
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setError(null); }}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                placeholder={type === 'wastage' ? 'เช่น 5' : 'เช่น −5 หรือ 10'}
              />
              {type === 'adjustment' && (
                <p className="text-xs text-muted">ใช้ค่าติดลบเพื่อลดสต็อก และค่าบวกเพื่อเพิ่มสต็อก</p>
              )}
            </div>

            {parsedQty !== 0 && (
              <div className={`p-3 rounded-lg border text-sm ${
                wouldGoNegative
                  ? 'bg-danger-subtle border-danger/30 text-danger'
                  : 'bg-surface-raised border-border text-muted'
              }`}>
                หลังปรับแล้ว:{' '}
                <span className={`font-semibold ${wouldGoNegative ? 'text-danger' : 'text-foreground'}`}>
                  {projectedStock.toFixed(2)} {item.unit}
                </span>
                {wouldGoNegative && ' — ไม่สามารถต่ำกว่าศูนย์ได้'}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">เหตุผล / หมายเหตุ</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-foreground transition-all"
                placeholder="เช่น หก พบของเพิ่ม ฯลฯ"
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 bg-subtle">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-raised transition-colors focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-1"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            form="adjust-form"
            disabled={loading || wouldGoNegative}
            className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            {loading ? 'กำลังบันทึก…' : 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  );
}
