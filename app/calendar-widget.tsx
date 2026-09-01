import { hasGoogleTokens, listGoogleEvents } from "@/lib/google-calendar";
import { Card } from "./card";
import CalendarBoard from "./calendar-board";
import AddEventButton from "./add-event-button";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function CalendarWidget({ today }: { today: string }) {
  const connected = await hasGoogleTokens();

  if (!connected) {
    return (
      <Card
        title="Calendar"
        accentColor="bg-fuchsia-400"
        glowRgb="232,121,249"
        className="h-full"
      >
        <a
          href="/api/auth/google"
          className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors w-fit"
        >
          Connect Google Calendar
        </a>
      </Card>
    );
  }

  const now = new Date(today);
  // Padded window comfortably covers the displayed Sun-Sat week regardless
  // of which day "today" falls on.
  const windowStart = new Date(now.getTime() - 7 * DAY_MS).toISOString();
  const windowEnd = new Date(now.getTime() + 7 * DAY_MS).toISOString();
  const events = (await listGoogleEvents(windowStart, windowEnd)) ?? [];

  return (
    <Card
      title="Calendar"
      accentColor="bg-fuchsia-400"
      glowRgb="232,121,249"
      className="h-full"
      action={<AddEventButton />}
    >
      <CalendarBoard initialEvents={events} today={today} />
    </Card>
  );
}
