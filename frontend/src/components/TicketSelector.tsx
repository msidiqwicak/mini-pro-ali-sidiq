import { useState } from "react";
import { Minus, Plus, Tag, Coins } from "lucide-react";
import type { TicketType } from "../types";
import { formatCurrency } from "../utils/helpers";

interface TicketSelectorProps {
  ticketTypes: TicketType[];
  promotionCode: string;
  onPromotionChange: (code: string) => void;
  pointsAvailable: number;
  pointsToUse: number;
  onPointsChange: (pts: number) => void;
  selected: { ticketTypeId: string; quantity: number } | null;
  onSelect: (ticketTypeId: string, quantity: number) => void;
  isLoading?: boolean;
  onSubmit: () => void;
  isAuthenticated: boolean;
}

const TicketSelector = ({
  ticketTypes,
  promotionCode,
  onPromotionChange,
  pointsAvailable,
  pointsToUse,
  onPointsChange,
  selected,
  onSelect,
  isLoading,
  onSubmit,
  isAuthenticated,
}: TicketSelectorProps) => {
  const [expandPromo, setExpandPromo] = useState(false);
  const [expandPoints, setExpandPoints] = useState(false);

  const selectedTicket = ticketTypes.find((t) => t.id === selected?.ticketTypeId);
  const qty = selected?.quantity ?? 1;
  const baseAmount = selectedTicket ? selectedTicket.price * qty : 0;
  const finalAmount = Math.max(0, baseAmount - pointsToUse);

  return (
    <div className="space-y-4">
      {/* Ticket types */}
      <div className="space-y-3">
        {ticketTypes.map((tt) => {
          const isSelected = selected?.ticketTypeId === tt.id;
          const remaining = tt.quota - tt.sold;
          const isSoldOut = remaining <= 0;

          return (
            <div
              key={tt.id}
              onClick={() => !isSoldOut && onSelect(tt.id, 1)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSoldOut
                  ? "opacity-40 cursor-not-allowed border-[var(--border)] bg-[var(--bg-elevated)]"
                  : isSelected
                  ? "border-[var(--accent-red)] bg-[rgba(229,21,43,0.08)]"
                  : "border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-hover)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-white">{tt.name}</span>
                    {isSoldOut && (
                      <span className="badge badge-red text-[10px]">HABIS</span>
                    )}
                    {remaining <= 10 && !isSoldOut && (
                      <span className="badge badge-gold text-[10px]">
                        SISA {remaining}
                      </span>
                    )}
                  </div>
                  {tt.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">{tt.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-[var(--accent-red)] text-sm">
                    {tt.price === 0 ? "GRATIS" : formatCurrency(tt.price)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {remaining.toLocaleString("id-ID")} tersisa
                  </p>
                </div>
              </div>

              {/* Quantity selector */}
              {isSelected && !isSoldOut && (
                <div
                  className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--border)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-[var(--text-secondary)]">Jumlah:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => qty > 1 && onSelect(tt.id, qty - 1)}
                      disabled={qty <= 1}
                      className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-white hover:border-[var(--accent-red)] disabled:opacity-30 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-semibold text-white text-sm">
                      {qty}
                    </span>
                    <button
                      onClick={() => qty < Math.min(10, remaining) && onSelect(tt.id, qty + 1)}
                      disabled={qty >= Math.min(10, remaining)}
                      className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-white hover:border-[var(--accent-red)] disabled:opacity-30 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selected && isAuthenticated && (
        <>
          {/* Promo code */}
          <div>
            <button
              onClick={() => setExpandPromo(!expandPromo)}
              className="flex items-center gap-2 text-sm text-[var(--accent-red)] hover:text-[var(--accent-red-hover)]"
            >
              <Tag size={13} />
              {expandPromo ? "Sembunyikan kode promo" : "Punya kode promo?"}
            </button>
            {expandPromo && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={promotionCode}
                  onChange={(e) => onPromotionChange(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode promo"
                  className="input-field text-sm flex-1"
                />
              </div>
            )}
          </div>

          {/* Points */}
          {pointsAvailable > 0 && (
            <div>
              <button
                onClick={() => setExpandPoints(!expandPoints)}
                className="flex items-center gap-2 text-sm text-[var(--accent-gold)] hover:opacity-80"
              >
                <Coins size={13} />
                {expandPoints ? "Sembunyikan" : `Gunakan poin (${pointsAvailable.toLocaleString("id-ID")} poin tersedia)`}
              </button>
              {expandPoints && (
                <div className="mt-2">
                  <input
                    type="range"
                    min={0}
                    max={Math.min(pointsAvailable, baseAmount)}
                    step={1000}
                    value={pointsToUse}
                    onChange={(e) => onPointsChange(Number(e.target.value))}
                    className="w-full accent-[var(--accent-gold)]"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                    <span>0</span>
                    <span className="text-[var(--accent-gold)] font-medium">
                      {pointsToUse.toLocaleString("id-ID")} poin digunakan
                    </span>
                    <span>{Math.min(pointsAvailable, baseAmount).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Price summary */}
          <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">
                {selectedTicket?.name} × {qty}
              </span>
              <span className="text-white">{formatCurrency(baseAmount)}</span>
            </div>
            {pointsToUse > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--accent-gold)]">Poin digunakan</span>
                <span className="text-[var(--accent-gold)]">-{formatCurrency(pointsToUse)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-[var(--border)] pt-2 mt-2">
              <span className="text-white">Total</span>
              <span className="text-[var(--accent-red)]">{formatCurrency(finalAmount)}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={onSubmit}
            disabled={isLoading || !selected}
            className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </span>
            ) : (
              `Beli Tiket — ${formatCurrency(finalAmount)}`
            )}
          </button>
        </>
      )}

      {!isAuthenticated && selected && (
        <p className="text-center text-sm text-[var(--text-muted)]">
          <a href="/login" className="text-[var(--accent-red)] hover:underline">
            Login
          </a>{" "}
          untuk membeli tiket
        </p>
      )}
    </div>
  );
};

export default TicketSelector;
