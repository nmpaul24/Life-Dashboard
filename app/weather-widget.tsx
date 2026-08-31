import type { Weather } from "@/lib/weather";

export default function WeatherWidget({ weather }: { weather: Weather | null }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Weather</h2>
      {!weather && (
        <p className="text-sm text-gray-400">Could not load weather.</p>
      )}
      {weather && (
        <div className="flex items-center gap-3 border rounded px-3 py-2 w-fit">
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
            <p className="font-medium">
              {weather.tempF}°F — {weather.city}
            </p>
            <p className="text-sm text-gray-500 capitalize">
              {weather.description}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
