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
      <div className="flex flex-col gap-3">
        {!weather && (
          <p className="text-sm text-white/40">Could not load weather.</p>
        )}
        {weather && (
          <div className="flex items-center gap-3">
            {weather.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                width={40}
                height={40}
              />
            )}
            <div>
              <p className="text-xl font-semibold text-white">
                {weather.tempF}°F
              </p>
              <p className="text-xs text-white/50 capitalize">
                {weather.description} — {weather.city}
              </p>
            </div>
          </div>
        )}

        {hourly && hourly.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] text-white/40 uppercase tracking-wide">
              Next hours
            </p>
            <div className="flex gap-3 overflow-x-auto">
              {hourly.map((hour, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-0.5 shrink-0"
                >
                  <p className="text-[11px] text-white/50">{hour.time}</p>
                  {hour.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                      alt=""
                      width={22}
                      height={22}
                    />
                  )}
                  <p className="text-xs font-medium text-white">
                    {hour.tempF}°
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {daily && daily.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[10px] text-white/40 uppercase tracking-wide">
              Next 5 days
            </p>
            <div className="flex gap-3 overflow-x-auto">
              {daily.map((day, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-0.5 shrink-0"
                >
                  <p className="text-[11px] text-white/50">{day.day}</p>
                  {day.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                      alt={day.description}
                      width={22}
                      height={22}
                    />
                  )}
                  <p className="text-xs font-medium text-white">
                    {day.tempHighF}°{" "}
                    <span className="text-white/40">{day.tempLowF}°</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
