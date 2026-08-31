import type { Weather } from "@/lib/weather";
import { Card } from "./card";

export default function WeatherWidget({
  weather,
}: {
  weather: Weather | null;
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
    </Card>
  );
}
