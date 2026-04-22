import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, UploadCloud, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { transactionService } from "../services/transaction.service";
import { uploadImage } from "../services/upload.service";
import type { Transaction } from "../types";
import {
  formatDateTime, formatCurrency, getStatusLabel, getStatusColor, getAxiosError,
} from "../utils/helpers";

const TransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for uploading proof
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setIsLoading(true);
    transactionService.getMyTransactions()
      .then((r) => setTransactions(r.data))
      .catch((err) => setError(getAxiosError(err)))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingId) return;

    setUploadLoading(true);
    setError("");

    try {
      // 1. Upload to cloudinary via our endpoint (events folder works for receipts too)
      const proofUrl = await uploadImage(file, "events");
      
      // 2. Call payTransaction API with the URL
      await transactionService.payTransaction(uploadingId, proofUrl);
      
      setUploadingId(null);
      load(); // Refresh data
    } catch (err) {
      setError("Gagal mengupload bukti transfer. Silakan coba lagi.");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* Hidden File Input for Proof Upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleUploadProof} 
        />

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

                  {/* Payment Instruction (Only for PENDING) */}
                  {tx.status === "PENDING" && tx.finalAmount > 0 && tx.event.organizer.bankName && (
                    <div className="mt-4 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                      <h4 className="text-xs font-semibold text-white mb-2 uppercase tracking-wider">Instruksi Pembayaran</h4>
                      <p className="text-sm text-[var(--text-secondary)] mb-3 border-b border-[var(--border)] pb-3">
                        Silakan transfer tepat sejumlah <strong className="text-white bg-[var(--accent-red)] px-2 py-0.5 rounded ml-1">{formatCurrency(tx.finalAmount)}</strong>
                      </p>
                      
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <p className="text-[var(--text-muted)]">Bank Tujuan</p>
                        <p className="font-medium text-white">{tx.event.organizer.bankName}</p>
                        
                        <p className="text-[var(--text-muted)]">Atas Nama</p>
                        <p className="font-medium text-white">{tx.event.organizer.bankAccountName}</p>
                        
                        <p className="text-[var(--text-muted)]">Nomor Rekening</p>
                        <p className="font-mono text-white text-lg tracking-wider">{tx.event.organizer.bankAccountNumber}</p>
                      </div>
                    </div>
                  )}

                  {/* Price breakdown and Action */}
                  <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-[var(--text-muted)]">
                        {tx.discountAmount > 0 && (
                          <span className="line-through mr-2">{formatCurrency(tx.baseAmount)}</span>
                        )}
                        <span className="font-bold text-white text-base">{formatCurrency(tx.finalAmount)}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {tx.status === "PENDING" && tx.finalAmount > 0 && (
                          <button
                            onClick={() => {
                              setUploadingId(tx.id);
                              fileInputRef.current?.click();
                            }}
                            disabled={uploadLoading && uploadingId === tx.id}
                            className="flex items-center gap-1.5 btn-primary text-xs px-4 py-2 disabled:opacity-70"
                          >
                            {uploadLoading && uploadingId === tx.id ? (
                              <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                            ) : (
                              <><UploadCloud size={14} /> Upload Bukti Transfer</>
                            )}
                          </button>
                        )}
                        
                        {tx.status === "WAITING_PAYMENT" && (
                          <div className="text-xs text-[var(--text-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
                            Bukti Diterima ⏳
                          </div>
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
      <Footer />
    </div>
  );
};

export default TransactionHistoryPage;
