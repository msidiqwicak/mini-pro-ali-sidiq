import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import EventForm, { type EventFormData } from "../../components/EventForm";
import { eventService } from "../../services/event.service";
import { getAxiosError } from "../../utils/helpers";
import type { Event } from "../../types";

const toLocalDatetime = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!id) return;
    // We fetch by organizer events list then find
    eventService.getOrganizerEvents().then((r) => {
      const ev = (r.data as Event[]).find((e) => e.id === id);
      if (ev) setEvent(ev);
    }).catch(() => {}).finally(() => setFetchLoading(false));
  }, [id]);

  const handleSubmit = async (data: EventFormData) => {
    if (!id) return;
    setIsLoading(true);
    setServerError("");
    try {
      await eventService.updateEvent(id, {
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        location: data.location,
        city: data.city,
        imageUrl: data.imageUrl,
        startDate: data.startDate,
        endDate: data.endDate,
        isFree: data.isFree,
        totalSeats: data.totalSeats,
        status: data.status,
      });
      navigate("/dashboard/events");
    } catch (err) {
      setServerError(getAxiosError(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-muted)]">Event tidak ditemukan</p>
        <button onClick={() => navigate("/dashboard/events")} className="btn-primary mt-4">
          Kembali
        </button>
      </div>
    );
  }

  const defaultValues: Partial<EventFormData> = {
    name: event.name,
    categoryId: event.categoryId,
    description: event.description,
    location: event.location,
    city: event.city,
    imageUrl: event.imageUrl ?? "",
    startDate: toLocalDatetime(event.startDate),
    endDate: toLocalDatetime(event.endDate),
    isFree: event.isFree,
    totalSeats: event.totalSeats,
    status: event.status as "DRAFT" | "PUBLISHED",
    ticketTypes: event.ticketTypes?.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      price: t.price,
      quota: t.quota,
    })) ?? [{ name: "REGULER", price: 0, quota: 100 }],
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[var(--text-muted)] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">EDIT EVENT</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{event.name}</p>
        </div>
      </div>

      <EventForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        serverError={serverError}
        submitLabel="Simpan Perubahan"
        showTicketTypes={false}
      />
    </div>
  );
};

export default EditEvent;
