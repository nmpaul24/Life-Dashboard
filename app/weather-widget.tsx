import type { Weather, HourlyForecast, DailyForecast } from "@/lib/weather";
import { Card } from "./card";

export default function WeatherWidget({
  weather,
  hourly,
  daily,
}: {
  weather: Weather | null;
  hourly: HourlyForecast[] | null;
  daily: DailyForecast[] | null;
}) {
  return (
    <Card title="Weather" accentColor="bg-sky-400">
      {!weather && (
        <p className="text-sm text-white/40">Could not load weather.</p>
      )}
      {weather && (
        <div className="flex items-center gap-4">
          {weather.icon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt={weather.description}
              width={56}
              height={56}
              className="drop-shadow-[0_0_14px_rgba(56,189,248,0.35)]"
            />
          )}
          <div>
            <p className="text-2xl font-semibold text-white">
              {weather.tempF}°F
            </p>
            <p className="text-sm text-white/50 capitalize">
              {weather.description} — {weather.city}
            </p>
          </div>
        </div>
      )}

      {hourly && hourly.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/40 uppercase tracking-wide">
            Next hours
          </p>
          <div className="flex gap-4 overflow-x-auto">
            {hourly.map((hour, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <p className="text-xs text-white/50">{hour.time}</p>
                {hour.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                    alt=""
                    width={32}
                    height={32}
                  />
                )}
                <p className="text-sm font-medium text-white">
                  {hour.tempF}°
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {daily && daily.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-white/40 uppercase tracking-wide">
            Next 5 days
          </p>
          <div className="flex gap-4 overflow-x-auto">
            {daily.map((day, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <p className="text-xs text-white/50">{day.day}</p>
                {day.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                    alt={day.description}
                    width={32}
                    height={32}
                  />
                )}
                <p className="text-sm font-medium text-white">
                  {day.tempHighF}° <span className="text-white/40">{day.tempLowF}°</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
