import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Calendar, MapPin, Users, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import { formatDate, formatCurrency } from "../utils/helpers";

interface OrganizerEvent {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  location: string;
  city: string;
  startDate: string;
  endDate: string;
  isFree: boolean;
  totalSeats: number;
  soldSeats: number;
  category: { name: string };
  ticketTypes: { price: number }[];
  reviews: { rating: number }[];
}

interface OrganizerProfile {
  id: string;
  name: string;
  avatarUrl?: string | null;
  organizedEvents: OrganizerEvent[];
}

const StarRating = ({ rating, total }: { rating: number; total: number }) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-600"}
        />
      ))}
    </div>
    <span className="text-sm font-semibold text-amber-400">{rating > 0 ? rating.toFixed(1) : "–"}</span>
    <span className="text-xs text-(--text-muted)">({total} ulasan)</span>
  </div>
);

const OrganizerProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [organizer, setOrganizer] = useState<OrganizerProfile | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api
      .get<{ success: boolean; data: { organizer: OrganizerProfile; avgRating: number; totalReviews: number } }>(
        `/events/organizer/${id}`
      )
      .then((res) => {
        setOrganizer(res.data.data.organizer);
        setAvgRating(res.data.data.avgRating);
        setTotalReviews(res.data.data.totalReviews);
      })
      .catch(() => setError("Profil organizer tidak ditemukan."))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-(--bg-primary)">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 pt-28 pb-20 space-y-6">
          <div className="skeleton h-32 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <div className="min-h-screen bg-(--bg-primary) flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <p className="text-5xl mb-4">🎵</p>
          <h2 className="text-xl font-semibold text-white mb-2">Organizer Tidak Ditemukan</h2>
          <p className="text-(--text-muted) mb-6">{error}</p>
          <Link to="/" className="btn-primary">Kembali ke Beranda</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const events = organizer.organizedEvents;

  return (
    <div className="min-h-screen bg-(--bg-primary)">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">

        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-(--text-muted) hover:text-white mb-6 transition-colors">
          <ArrowLeft size={14} /> Kembali ke Beranda
        </Link>

        {/* Organizer Header Card */}
        <div className="rounded-2xl bg-(--bg-card) border border-(--border) p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {organizer.avatarUrl ? (
            <img src={organizer.avatarUrl} alt={organizer.name} className="w-20 h-20 rounded-full object-cover shrink-0 border-2 border-(--border)" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-(--bg-elevated) border-2 border-(--border) flex items-center justify-center shrink-0">
              <span className="text-3xl">🎤</span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-1">{organizer.name}</h1>
            <p className="text-sm text-(--text-muted) mb-3">Event Organizer</p>
            <StarRating rating={avgRating} total={totalReviews} />
          </div>
          <div className="flex gap-6 text-center shrink-0">
            <div>
              <p className="text-2xl font-bold text-white">{events.length}</p>
              <p className="text-xs text-(--text-muted)">Event</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{avgRating > 0 ? avgRating.toFixed(1) : "–"}</p>
              <p className="text-xs text-(--text-muted)">Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalReviews}</p>
              <p className="text-xs text-(--text-muted)">Ulasan</p>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="flex items-center gap-3 mb-5">
          <div className="section-line" />
          <h2 className="font-semibold text-white text-lg">Event dari {organizer.name}</h2>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16 text-(--text-muted)">
            <p className="text-4xl mb-3 opacity-20">📅</p>
            <p>Belum ada event yang dipublikasikan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => {
              const minPrice = event.ticketTypes.length > 0 ? Math.min(...event.ticketTypes.map((t) => t.price)) : 0;
              const eventAvgRating =
                event.reviews.length > 0
                  ? Math.round((event.reviews.reduce((a, r) => a + r.rating, 0) / event.reviews.length) * 10) / 10
                  : 0;

              return (
                <Link
                  key={event.id}
                  to={`/events/${event.slug}`}
                  className="group rounded-xl bg-(--bg-card) border border-(--border) overflow-hidden hover:border-(--accent-red)/50 transition-all"
                >
                  <div className="relative h-40 overflow-hidden bg-(--bg-elevated)">
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl opacity-20">🎵</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="badge badge-red text-[10px]">{event.category.name}</span>
                      {event.isFree && <span className="badge badge-green text-[10px]">GRATIS</span>}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 group-hover:text-(--accent-red) transition-colors">{event.name}</h3>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                        <Calendar size={10} className="text-(--accent-red)" />
                        {formatDate(event.startDate)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                        <MapPin size={10} className="text-(--accent-red)" />
                        {event.city}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
                        <Users size={10} className="text-(--accent-red)" />
                        {event.totalSeats - event.soldSeats} kursi tersisa
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-(--accent-red)">
                        {event.isFree ? "GRATIS" : formatCurrency(minPrice)}
                      </p>
                      {eventAvgRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star size={11} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs text-amber-400">{eventAvgRating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrganizerProfilePage;
