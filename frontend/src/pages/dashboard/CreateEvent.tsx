import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import EventForm, { type EventFormData } from "../../components/EventForm";
import { eventService } from "../../services/event.service";
import { getAxiosError } from "../../utils/helpers";

const CreateEvent = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    setServerError("");
    try {
      await eventService.createEvent(data);
      navigate("/dashboard/events");
    } catch (err) {
      setServerError(getAxiosError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[var(--text-muted)] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-3xl text-white tracking-wider">BUAT EVENT</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Isi detail event musik kamu</p>
        </div>
      </div>

      <EventForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        serverError={serverError}
        submitLabel="Buat Event"
        showTicketTypes
      />
    </div>
  );
};

export default CreateEvent;
