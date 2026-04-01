import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, CreditCard } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ModalConfirm } from "../components/UIComponents";
import { transactionService } from "../services/transaction.service";
import type { Transaction } from "../types";
import {
  formatDateTime, formatCurrency, getStatusLabel, getStatusColor, getAxiosError,
} from "../utils/helpers";

const TransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setIsLoading(true);
    transactionService.getMyTransactions()
      .then((r) => setTransactions(r.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePay = async () => {
    if (!payingId) return;
    setPayLoading(true);
    try {
      await transactionService.payTransaction(payingId);
      setPayingId(null);
      load();
    } catch (err) {
      setError(getAxiosError(err));
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="section-line" />
          <h1 className="font-display text-3xl text-white tracking-wider">RIWAYAT TRANSAKSI</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-40 rounded-xl" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">🧾</div>
            <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">Belum ada transaksi</h3>
            <Link to="/" className="btn-primary mt-4 inline-flex">Jelajahi Event</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-[var(--bg-elevated)] border-b border-[var(--border)]">
                  <p className="font-mono text-xs text-[var(--text-muted)]">#{tx.id.slice(-8).toUpperCase()}</p>
                  <span className={`badge text-[10px] ${getStatusColor(tx.status)}`}>
                    {getStatusLabel(tx.status)}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex gap-4">
                    {tx.event.imageUrl && (
                      <img
                        src={tx.event.imageUrl}
                        alt={tx.event.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/events/${tx.event.slug}`}
                        className="font-semibold text-white text-sm hover:text-[var(--accent-red)] transition-colors line-clamp-1"
                      >
                        {tx.event.name}
                      </Link>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Calendar size={10} className="text-[var(--accent-red)]" />
                          {formatDateTime(tx.event.startDate)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <MapPin size={10} className="text-[var(--accent-red)]" />
                          {tx.event.city}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket list */}
                  {tx.tickets.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {tx.tickets.map((ticket) => (
                        <span key={ticket.id} className="badge badge-gray text-[10px]">
                          🎫 {ticket.ticketType.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Price breakdown */}
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-[var(--text-muted)]">
                        {tx.discountAmount > 0 && (
                          <span className="line-through mr-2">{formatCurrency(tx.baseAmount)}</span>
                        )}
                        <span className="font-bold text-white text-base">{formatCurrency(tx.finalAmount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tx.status === "PENDING" && (
                          <button
                            onClick={() => setPayingId(tx.id)}
                            className="flex items-center gap-1.5 btn-primary text-xs px-3 py-1.5"
                          >
                            <CreditCard size={12} /> Bayar Sekarang
                          </button>
                        )}
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatDateTime(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ModalConfirm
        isOpen={!!payingId}
        title="Konfirmasi Pembayaran"
        message="Simulasi pembayaran akan memproses transaksi kamu. Lanjutkan?"
        onConfirm={handlePay}
        onCancel={() => setPayingId(null)}
        loading={payLoading}
        confirmLabel="Bayar Sekarang"
      />

      <Footer />
    </div>
  );
};

export default TransactionHistoryPage;
