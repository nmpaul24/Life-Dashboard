import { sql } from "@/lib/db";
import { getWeather, getForecast } from "@/lib/weather";
import GoalsBoard, { type Goal } from "./goals-board";
import WeatherWidget from "./weather-widget";
import WhoopWidget from "./whoop-widget";
import PlaidWidget from "./plaid-widget";
import ClockHeader from "./clock-header";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [goals, weather, forecast] = await Promise.all([
    sql`SELECT * FROM goals ORDER BY created_at DESC` as unknown as Promise<
      Goal[]
    >,
    getWeather(),
    getForecast(),
  ]);

  return (
    <main className="mx-auto max-w-5xl w-full p-6 flex flex-col gap-6">
      <ClockHeader initialTime={new Date().toISOString()} />

      <WeatherWidget
        weather={weather}
        hourly={forecast?.hourly ?? null}
        daily={forecast?.daily ?? null}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <WhoopWidget />
        <PlaidWidget />
      </div>

      <GoalsBoard initialGoals={goals} />
    </main>
  );
}
