"use client";

import { useEffect, useState } from "react";

type Weather = {
  city: string;
  tempF: number;
  description: string;
  icon: string;
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      const timeoutId = setTimeout(
        () => setError("Geolocation is not supported by this browser."),
        0
      );
      return () => clearTimeout(timeoutId);
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `/api/weather?lat=${latitude}&lon=${longitude}`
          );
          if (!res.ok) {
            setError("Could not load weather.");
            return;
          }
          setWeather(await res.json());
        } catch {
          setError("Could not load weather.");
        }
      },
      () => {
        setError("Location permission denied.");
      }
    );
  }, []);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Weather</h2>
      {error && <p className="text-sm text-gray-400">{error}</p>}
      {!error && !weather && (
        <p className="text-sm text-gray-500">Loading weather...</p>
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
