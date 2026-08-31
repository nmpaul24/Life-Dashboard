import { sql } from "@/lib/db";
import { getWeather } from "@/lib/weather";
import GoalsBoard, { type Goal } from "./goals-board";
import WeatherWidget from "./weather-widget";
import WhoopWidget from "./whoop-widget";
import PlaidWidget from "./plaid-widget";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [goals, weather] = await Promise.all([
    sql`SELECT * FROM goals ORDER BY created_at DESC` as unknown as Promise<
      Goal[]
    >,
    getWeather(),
  ]);

  return (
    <main className="mx-auto max-w-2xl w-full p-6 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Life Dashboard</h1>
      <WeatherWidget weather={weather} />
      <WhoopWidget />
      <PlaidWidget />
      <GoalsBoard initialGoals={goals} />
    </main>
  );
}
