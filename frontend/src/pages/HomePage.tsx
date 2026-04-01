import { useState, useEffect, useCallback } from "react";
import { Music2, Zap, Calendar } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EventCard from "../components/EventCard";
import {
  SearchBar,
  FilterDropdown,
  Pagination,
  EventCardSkeleton,
  EmptyState,
} from "../components/UIComponents";
import { useDebounce } from "../hooks/useDebounce";
import { eventService } from "../services/event.service";
import type { Event, Category } from "../types";

const HomePage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const debouncedSearch = useDebounce(search, 500);

  // Load filter options once
  useEffect(() => {
    Promise.all([eventService.getCities(), eventService.getCategories()])
      .then(([c, cat]) => {
        setCities(c.data ?? []);
        setCategories(cat.data ?? []);
      })
      .catch(() => {});
  }, []);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await eventService.getEvents({
        search: debouncedSearch || undefined,
        city: city || undefined,
        categoryId: categoryId || undefined,
        page,
        limit: 9,
      });
      const payload = res.data;
      setEvents(payload.data ?? []);
      setTotal(payload.meta?.total ?? 0);
      setTotalPages(payload.meta?.totalPages ?? 1);
    } catch {
      setError("Gagal memuat event. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, city, categoryId, page]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, city, categoryId]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-[var(--accent-red)] opacity-5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-[var(--accent-gold)] opacity-4 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-display text-white opacity-[0.02] select-none pointer-events-none leading-none">
            MUSIC
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 badge badge-red mb-6">
              <Zap size={12} />
              <span>Platform Event Musik #1 Indonesia</span>
            </div>
            <h1 className="font-display text-5xl sm:text-7xl text-white leading-none mb-6">
              TEMUKAN
              <br />
              <span className="text-gradient-red">MUSIC EVENT</span>
              <br />
              TERBAIKMU
            </h1>
            <p className="text-[var(--text-secondary)] text-lg mb-10 leading-relaxed">
              Dari konser megah hingga festival indie, semua event musik terbaik
              Indonesia ada di sini.
            </p>

            {/* Hero stats */}
            <div className="flex items-center justify-center gap-8 mb-10">
              {[
                { icon: <Calendar size={16} />, label: `${total}+ Event` },
                { icon: <Music2 size={16} />, label: "8 Kategori" },
                { icon: <Zap size={16} />, label: "5+ Kota" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                  <span className="text-[var(--accent-red)]">{s.icon}</span>
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="sticky top-16 z-30 bg-[var(--bg-secondary)]/95 backdrop-blur-md border-b border-[var(--border)] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchBar value={search} onChange={setSearch} />
            </div>
            <div className="sm:w-44">
              <FilterDropdown
                label="Semua Kota"
                value={city}
                options={cities.map((c) => ({ label: c, value: c }))}
                onChange={setCity}
              />
            </div>
            <div className="sm:w-48">
              <FilterDropdown
                label="Semua Kategori"
                value={categoryId}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                onChange={setCategoryId}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Result count */}
        {!isLoading && !error && (
          <div className="flex items-center gap-2 mb-8">
            <div className="section-line" />
            <p className="text-sm text-[var(--text-muted)]">
              {total > 0 ? (
                <>
                  Menampilkan{" "}
                  <span className="text-white font-medium">{events.length}</span> dari{" "}
                  <span className="text-white font-medium">{total}</span> event
                </>
              ) : (
                "Tidak ada event ditemukan"
              )}
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-sm text-red-400 mb-8">
            {error}
            <button onClick={fetchEvents} className="ml-2 underline">Coba lagi</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 9 }, (_, i) => <EventCardSkeleton key={i} />)
          ) : events.length === 0 ? (
            <EmptyState
              title="Tidak ada event ditemukan"
              description={
                debouncedSearch || city || categoryId
                  ? "Coba ubah kata kunci atau filter pencarianmu"
                  : "Belum ada event yang dipublikasikan"
              }
            />
          ) : (
            events.map((event, i) => (
              <EventCard
                key={event.id}
                event={event}
                style={{ animationDelay: `${(i % 9) * 60}ms` }}
              />
            ))
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
