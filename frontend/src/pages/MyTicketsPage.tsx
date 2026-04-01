import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { QrCode, Calendar, MapPin, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { transactionService } from "../services/transaction.service";
import type { Transaction } from "../types";
import { formatDateTime } from "../utils/helpers";

const MyTicketsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    transactionService.getMyTransactions()
      .then((r) => setTransactions(r.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const paidTx = transactions.filter((t) => t.status === "PAID");
  const allTickets = paidTx.flatMap((tx) =>
    tx.tickets.map((ticket) => ({ ...ticket, transaction: tx }))
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="section-line" />
          <h1 className="font-display text-3xl text-white tracking-wider">TIKET SAYA</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
          </div>
        ) : allTickets.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">🎫</div>
            <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">
              Belum ada tiket
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              Beli tiket event musik favoritmu sekarang
            </p>
            <Link to="/" className="btn-primary">
              Jelajahi Event
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {allTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden"
              >
                {/* Event image header */}
                {ticket.transaction.event.imageUrl && (
                  <div className="h-24 overflow-hidden">
                    <img
                      src={ticket.transaction.event.imageUrl}
                      alt={ticket.transaction.event.name}
                      className="w-full h-full object-cover opacity-60"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-white text-sm line-clamp-1">
                        {ticket.transaction.event.name}
                      </h3>
                      <p className="text-xs text-[var(--accent-red)] font-medium mt-0.5">
                        {ticket.ticketType.name}
                      </p>
                    </div>
                    {ticket.isUsed ? (
                      <span className="badge badge-gray text-[10px] flex-shrink-0">
                        <CheckCircle size={9} className="mr-1" /> Dipakai
                      </span>
                    ) : (
                      <span className="badge badge-green text-[10px] flex-shrink-0">
                        VALID
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Calendar size={11} className="text-[var(--accent-red)]" />
                      {formatDateTime(ticket.transaction.event.startDate)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <MapPin size={11} className="text-[var(--accent-red)]" />
                      {ticket.transaction.event.location}, {ticket.transaction.event.city}
                    </div>
                  </div>

                  {/* QR Code representation */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <QrCode size={32} className="text-[var(--text-secondary)] flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">QR Code</p>
                      <p className="font-mono text-xs text-white break-all">{ticket.qrCode}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyTicketsPage;
