import { sql } from "@/lib/db";
import { getWeather } from "@/lib/weather";
import GoalsBoard, { type Goal } from "./goals-board";
import WeatherWidget from "./weather-widget";
import WhoopWidget from "./whoop-widget";
import PlaidWidget from "./plaid-widget";

export const dynamic = "force-dynamic";

const TIME_ZONE = "America/Chicago";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function Home() {
  const [goals, weather] = await Promise.all([
    sql`SELECT * FROM goals ORDER BY created_at DESC` as unknown as Promise<
      Goal[]
    >,
    getWeather(),
  ]);

  const now = new Date();
  const timeLabel = now.toLocaleTimeString("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  });
  const dateLabel = now.toLocaleDateString("en-US", {
    timeZone: TIME_ZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const hour = Number(
    now.toLocaleTimeString("en-US", { timeZone: TIME_ZONE, hour: "numeric", hour12: false })
  );

  return (
    <main className="mx-auto max-w-5xl w-full p-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-semibold text-white tracking-tight">
            {timeLabel}
          </p>
          <p className="text-sm text-white/40 uppercase tracking-wide mt-1">
            {dateLabel}
          </p>
        </div>
        <p className="text-lg text-white/60">{greeting(hour)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WeatherWidget weather={weather} />
        <WhoopWidget />
        <PlaidWidget />
      </div>

      <GoalsBoard initialGoals={goals} />
    </main>
  );
}
