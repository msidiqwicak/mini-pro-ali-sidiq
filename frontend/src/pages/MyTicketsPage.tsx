import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { QrCode, Calendar, MapPin, CheckCircle, Clock } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { transactionService } from "../services/transaction.service";
import type { Transaction } from "../types";
import { formatDateTime, formatDate } from "../utils/helpers";

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

  const now = new Date();

  return (
    <div className="min-h-screen bg-(--bg-primary)">
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
            <h3 className="text-lg font-semibold text-(--text-secondary) mb-2">
              Belum ada tiket
            </h3>
            <p className="text-sm text-(--text-muted) mb-6">
              Beli tiket event musik favoritmu sekarang
            </p>
            <Link to="/" className="btn-primary">
              Jelajahi Event
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {allTickets.map((ticket) => {
              const eventEnded = new Date(ticket.transaction.event.endDate) < now;
              return (
                <div
                  key={ticket.id}
                  className={`rounded-xl border overflow-hidden transition-all ${
                    eventEnded
                      ? "bg-(--bg-card) border-(--border) opacity-80"
                      : "bg-(--bg-card) border-(--border)"
                  }`}
                >
                  {/* Event image header */}
                  {ticket.transaction.event.imageUrl && (
                    <div className="h-24 overflow-hidden relative">
                      <img
                        src={ticket.transaction.event.imageUrl}
                        alt={ticket.transaction.event.name}
                        className="w-full h-full object-cover opacity-60"
                      />
                      {eventEnded && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
                            Event Selesai
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-sm line-clamp-1">
                          {ticket.transaction.event.name}
                        </h3>
                        <p className="text-xs text-(--accent-red) font-medium mt-0.5">
                          {ticket.ticketType.name}
                        </p>
                      </div>

                      {/* Badge status */}
                      {eventEnded ? (
                        <span className="badge badge-gray text-[10px] shrink-0">
                          Event Selesai
                        </span>
                      ) : ticket.isUsed ? (
                        <span className="badge badge-gray text-[10px] shrink-0">
                          <CheckCircle size={9} className="mr-1" /> Dipakai
                        </span>
                      ) : (
                        <span className="badge badge-green text-[10px] shrink-0">
                          VALID
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 mb-4">
                      {/* Purchase date */}
                      <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                        <Clock size={11} className="text-(--text-muted)" />
                        Dibeli: {formatDateTime(ticket.transaction.createdAt)}
                      </div>
                      {/* Event date */}
                      <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                        <Calendar size={11} className="text-(--accent-red)" />
                        Event: {formatDate(ticket.transaction.event.startDate)}
                        {ticket.transaction.event.endDate !== ticket.transaction.event.startDate && (
                          <span> — {formatDate(ticket.transaction.event.endDate)}</span>
                        )}
                      </div>
                      {/* Location */}
                      <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                        <MapPin size={11} className="text-(--accent-red)" />
                        {ticket.transaction.event.location}, {ticket.transaction.event.city}
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-(--bg-elevated) border border-(--border)">
                      <QrCode size={32} className="text-(--text-secondary) shrink-0" />
                      <div>
                        <p className="text-[10px] text-(--text-muted) uppercase tracking-wider">QR Code</p>
                        <p className="font-mono text-xs text-white break-all">{ticket.qrCode}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyTicketsPage;
