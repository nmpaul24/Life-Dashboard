import { sql } from "@/lib/db";
import { getWeather, getForecast } from "@/lib/weather";
import GoalsBoard, { type Goal } from "./goals-board";
import CalendarWidget, { type Event } from "./calendar-widget";
import WeatherWidget from "./weather-widget";
import WhoopWidget from "./whoop-widget";
import PlaidWidget from "./plaid-widget";
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="sm:w-72 shrink-0">
          <WeatherWidget
            weather={weather}
            hourly={forecast?.hourly ?? null}
            daily={forecast?.daily ?? null}
          />
        </div>
        <div className="flex-1">
          <PlaidWidget />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GoalsBoard initialGoals={goals} />
        <CalendarWidget initialEvents={events} today={nowIso} />
      </div>
    </main>
  );
}
