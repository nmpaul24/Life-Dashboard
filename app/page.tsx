import { sql } from "@/lib/db";
import { getWeather, getForecast } from "@/lib/weather";
import {
  getChecklistItems,
  getCompletedIdsForDay,
  getWeekPercent,
  todayKey,
  weekStartKey,
} from "@/lib/checklist";
import GoalsBoard, { type Goal } from "./goals-board";
import CalendarWidget from "./calendar-widget";
import WeatherWidget from "./weather-widget";
import WhoopWidget from "./whoop-widget";
import PlaidWidget from "./plaid-widget";
import AssignmentsWidget from "./assignments-widget";
import ClockHeader from "./clock-header";
import ChecklistWidget from "./checklist-widget";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [goals, weather, forecast, checklistItems] = await Promise.all([
    sql`SELECT * FROM goals ORDER BY created_at DESC` as unknown as Promise<
      Goal[]
    >,
    getWeather(),
    getForecast(),
    getChecklistItems(),
  ]);

  const today = todayKey();
  const [completedIds, weekPercent] = await Promise.all([
    getCompletedIdsForDay(today),
    getWeekPercent(checklistItems.length, weekStartKey(today), today),
  ]);

  const nowIso = new Date().toISOString();

  return (
    <main className="w-full px-3 py-4 flex flex-col gap-4">
      <ClockHeader initialTime={nowIso} middle={<WhoopWidget />} />

      <div className="flex flex-col sm:flex-row gap-4 sm:h-[380px]">
        <div className="flex-1 min-w-0">
          <CalendarWidget today={nowIso} />
        </div>
        <div className="sm:w-72 shrink-0">
          <WeatherWidget
            weather={weather}
            hourly={forecast?.hourly ?? null}
            daily={forecast?.daily ?? null}
          />
        </div>
        <div className="sm:w-80 shrink-0 flex flex-col gap-3">
          <ChecklistWidget
            items={checklistItems}
            completedIds={completedIds}
            weekPercent={weekPercent}
          />
          <div className="flex-1 min-h-0">
            <GoalsBoard initialGoals={goals} />
          </div>
        </div>
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
