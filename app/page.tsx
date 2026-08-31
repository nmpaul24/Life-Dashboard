import { sql } from "@/lib/db";
import { getWeather, getForecast } from "@/lib/weather";
import GoalsBoard, { type Goal } from "./goals-board";
import CalendarWidget, { type Event } from "./calendar-widget";
import WeatherWidget from "./weather-widget";
import WhoopWidget from "./whoop-widget";
import PlaidWidget from "./plaid-widget";
import AssignmentsWidget from "./assignments-widget";
import ClockHeader from "./clock-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [goals, events, weather, forecast] = await Promise.all([
    sql`SELECT * FROM goals ORDER BY created_at DESC` as unknown as Promise<
      Goal[]
    >,
    sql`SELECT * FROM events ORDER BY starts_at ASC` as unknown as Promise<
      Event[]
    >,
    getWeather(),
    getForecast(),
  ]);

  const nowIso = new Date().toISOString();

  return (
    <main className="w-full px-3 py-4 flex flex-col gap-4">
      <ClockHeader initialTime={nowIso} middle={<WhoopWidget />} />

      <div className="grid gap-4 sm:grid-cols-3">
        <CalendarWidget initialEvents={events} today={nowIso} />
        <WeatherWidget
          weather={weather}
          hourly={forecast?.hourly ?? null}
          daily={forecast?.daily ?? null}
        />
        <GoalsBoard initialGoals={goals} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <PlaidWidget />
        </div>
        <div className="sm:col-span-2">
          <AssignmentsWidget />
        </div>
      </div>
    </main>
  );
}
