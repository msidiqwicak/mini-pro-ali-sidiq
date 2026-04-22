import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar, MapPin, Users, Tag, ArrowLeft, Share2, Star,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ReviewList from "../components/ReviewList";
import TicketSelector from "../components/TicketSelector";
import { ModalConfirm } from "../components/UIComponents";
import { eventService } from "../services/event.service";
import { reviewService } from "../services/review.service";
import { transactionService } from "../services/transaction.service";
import type { Event, Review } from "../types";
import {
  formatDate, formatTime, formatCurrency, getAvailableSeats,
  getSeatPercentage, getAxiosError,
} from "../utils/helpers";
import { useAuth } from "../context/AuthContext";

const EventDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isCustomer } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Purchase state
  const [selected, setSelected] = useState<{ ticketTypeId: string; quantity: number } | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [pointsAvailable, setPointsAvailable] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [evRes, rvRes] = await Promise.all([
          eventService.getEventBySlug(slug),
          eventService.getEventBySlug(slug).then(r =>
            reviewService.getEventReviews(r.data.id)
          ),
        ]);
        setEvent(evRes.data);
        setReviews(rvRes.data.reviews);
        setAvgRating(rvRes.data.averageRating);
        setTotalReviews(rvRes.data.total);
      } catch {
        setError("Event tidak ditemukan");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated && isCustomer) {
      transactionService.getMyPoints().then(r => {
        setPointsAvailable(r.data.total);
      }).catch(() => {});
    }
  }, [isAuthenticated, isCustomer]);

  const handleBuy = async () => {
    if (!selected || !event) return;
    setBuyLoading(true);
    setBuyError("");
    try {
      await transactionService.createTransaction({
        eventId: event.id,
        ticketTypeId: selected.ticketTypeId,
        quantity: selected.quantity,
        promotionCode: promoCode || undefined,
        pointsToUse,
      });
      setShowConfirm(false);
      navigate("/transactions");
    } catch (err) {
      setBuyError(getAxiosError(err));
      setShowConfirm(false);
    } finally {
      setBuyLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!event) return;
    setReviewLoading(true);
    setReviewError("");
    try {
      await reviewService.createReview({
        eventId: event.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      // Reload reviews
      const rvRes = await reviewService.getEventReviews(event.id);
      setReviews(rvRes.data.reviews);
      setAvgRating(rvRes.data.averageRating);
      setTotalReviews(rvRes.data.total);
      setShowReviewForm(false);
      setReviewComment("");
    } catch (err) {
      setReviewError(getAxiosError(err));
    } finally {
      setReviewLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-(--bg-primary)">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 pt-28 pb-20">
          <div className="skeleton h-96 w-full rounded-2xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="skeleton h-10 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-5/6 rounded" />
            </div>
            <div className="skeleton h-80 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-(--bg-primary) flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <p className="text-6xl mb-4">🎵</p>
          <h2 className="text-xl font-semibold text-white mb-2">Event Tidak Ditemukan</h2>
          <p className="text-(--text-muted) mb-6">{error}</p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const available = getAvailableSeats(event.totalSeats, event.soldSeats);
  const soldPct = getSeatPercentage(event.totalSeats, event.soldSeats);

  return (
    <div className="min-h-screen bg-(--bg-primary)">
      <Navbar />

      {/* Hero Image */}
      <div className="relative h-80 sm:h-[420px] overflow-hidden mt-16">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-(--bg-elevated) flex items-center justify-center">
            <span className="font-display text-8xl text-(--text-muted) opacity-20">♪</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-(--bg-primary) via-transparent to-black/20" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 glass px-3 py-2 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={14} /> Kembali
        </button>

        {/* Share */}
        <button
          onClick={() => navigator.clipboard.writeText(window.location.href)}
          className="absolute top-6 right-6 glass p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left — event info */}
          <div className="lg:col-span-2">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="badge badge-red">{event.category.name}</span>
              {event.isFree && <span className="badge badge-green">GRATIS</span>}
              {soldPct >= 90 && <span className="badge badge-gold">HAMPIR HABIS</span>}
            </div>

            <h1 className="font-display text-3xl sm:text-5xl text-white mb-6 leading-tight">
              {event.name}
            </h1>

            {/* Meta info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                {
                  icon: <Calendar size={16} className="text-(--accent-red)" />,
                  label: "Tanggal & Waktu",
                  value: `${formatDate(event.startDate)}, ${formatTime(event.startDate)} – ${formatTime(event.endDate)}`,
                },
                {
                  icon: <MapPin size={16} className="text-(--accent-red)" />,
                  label: "Lokasi",
                  value: `${event.location}, ${event.city}`,
                },
                {
                  icon: <Users size={16} className="text-(--accent-red)" />,
                  label: "Kapasitas",
                  value: `${available.toLocaleString("id-ID")} dari ${event.totalSeats.toLocaleString("id-ID")} tersisa`,
                },
                {
                  icon: <Tag size={16} className="text-(--accent-red)" />,
                  label: "Oleh",
                  value: (
                    <a href={`/organizer/${event.organizer.id}`} className="hover:text-(--accent-red) transition-colors">
                      {event.organizer.name}
                    </a>
                  ),
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl bg-(--bg-card) border border-(--border)">
                  <div className="mt-0.5">{item.icon}</div>
                  <div>
                    <p className="text-[10px] text-(--text-muted) uppercase tracking-wider mb-0.5">{item.label}</p>
                    <p className="text-sm text-white font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Seat progress */}
            <div className="p-4 rounded-xl bg-(--bg-card) border border-(--border) mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-(--text-secondary)">Ketersediaan Tiket</span>
                <span className="text-sm font-medium text-white">{soldPct}% terjual</span>
              </div>
              <div className="h-2 bg-(--bg-elevated) rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${soldPct}%`,
                    background: soldPct >= 80 ? "var(--accent-red)" : soldPct >= 50 ? "var(--accent-gold)" : "#34d399",
                  }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="section-line" />
                <h2 className="font-semibold text-white text-lg">Tentang Event</h2>
              </div>
              <p className="text-(--text-secondary) leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Active Promotions */}
            {event.promotions && event.promotions.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="section-line" />
                  <h2 className="font-semibold text-white text-lg">Promo Aktif</h2>
                </div>
                <div className="space-y-3">
                  {event.promotions.map((promo) => (
                    <div key={promo.id} className="flex items-center justify-between p-4 rounded-xl bg-(--accent-gold)/10 border border-(--accent-gold)/20">
                      <div>
                        <p className="font-mono font-bold text-(--accent-gold) text-sm">{promo.code}</p>
                        <p className="text-xs text-(--text-secondary)">
                          {promo.discountPercent ? `Diskon ${promo.discountPercent}%` : `Diskon ${formatCurrency(promo.discountAmount ?? 0)}`}
                          {" · "}Sisa {promo.maxUsage - promo.usedCount}x penggunaan
                        </p>
                      </div>
                      <Tag size={16} className="text-(--accent-gold)" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="section-line" />
                  <h2 className="font-semibold text-white text-lg">
                    Review ({totalReviews})
                  </h2>
                  {avgRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-(--accent-gold) fill-(--accent-gold)" />
                      <span className="text-sm text-(--accent-gold) font-medium">{avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {isAuthenticated && isCustomer && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="btn-outline text-sm py-1.5 px-3"
                  >
                    {showReviewForm ? "Batal" : "+ Tulis Review"}
                  </button>
                )}
              </div>

              {/* Review form */}
              {showReviewForm && (
                <div className="p-5 rounded-xl bg-(--bg-card) border border-(--border) mb-6">
                  <p className="text-sm font-medium text-white mb-3">Rating:</p>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setReviewRating(r)}
                        className={`w-9 h-9 rounded-lg border text-sm font-bold transition-colors ${
                          r <= reviewRating
                            ? "bg-(--accent-gold) border-(--accent-gold) text-white"
                            : "border-(--border) text-(--text-muted) hover:border-(--accent-gold)"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Ceritakan pengalamanmu..."
                    rows={4}
                    className="input-field resize-none mb-3"
                  />
                  {reviewError && <p className="text-red-400 text-sm mb-3">{reviewError}</p>}
                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewLoading || !reviewComment.trim()}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {reviewLoading ? "Mengirim..." : "Kirim Review"}
                  </button>
                </div>
              )}

              <ReviewList reviews={reviews} averageRating={avgRating} total={totalReviews} />
            </div>
          </div>

          {/* Right — buy tickets */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl bg-(--bg-card) border border-(--border) p-6">
              <h3 className="font-semibold text-white text-lg mb-2">Pilih Tiket</h3>
              <p className="text-xs text-(--text-muted) mb-5">
                Mulai dari{" "}
                <span className="text-(--accent-red) font-bold">
                  {event.isFree
                    ? "GRATIS"
                    : formatCurrency(Math.min(...event.ticketTypes.map((t) => t.price)))}
                </span>
              </p>

              {buyError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {buyError}
                </div>
              )}

              <TicketSelector
                ticketTypes={event.ticketTypes}
                promotionCode={promoCode}
                onPromotionChange={setPromoCode}
                pointsAvailable={pointsAvailable}
                pointsToUse={pointsToUse}
                onPointsChange={setPointsToUse}
                selected={selected}
                onSelect={(id, qty) => setSelected({ ticketTypeId: id, quantity: qty })}
                isLoading={buyLoading}
                onSubmit={() => setShowConfirm(true)}
                isAuthenticated={isAuthenticated && isCustomer}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Confirm modal */}
      <ModalConfirm
        isOpen={showConfirm}
        title="Konfirmasi Pembelian"
        message={`Kamu akan membeli ${selected?.quantity} tiket untuk event "${event.name}". Lanjutkan?`}
        onConfirm={handleBuy}
        onCancel={() => setShowConfirm(false)}
        loading={buyLoading}
        confirmLabel="Ya, Beli Sekarang"
      />

      <Footer />
    </div>
  );
};

export default EventDetailPage;
