export type Weather = {
  city: string;
  tempF: number;
  description: string;
  icon: string;
};

// Minneapolis, MN
const LAT = 44.9778;
const LON = -93.265;

export async function getWeather(): Promise<Weather | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error("getWeather: OPENWEATHER_API_KEY is not set");
    return null;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=imperial&appid=${apiKey}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`getWeather: OpenWeatherMap returned ${res.status}: ${body}`);
    return null;
  }

  const data = await res.json();

  return {
    city: data.name,
    tempF: Math.round(data.main.temp),
    description: data.weather?.[0]?.description ?? "",
    icon: data.weather?.[0]?.icon ?? "",
  };
}

export type HourlyForecast = {
  time: string;
  tempF: number;
  icon: string;
};

export type DailyForecast = {
  day: string;
  tempHighF: number;
  tempLowF: number;
  icon: string;
  description: string;
};

type RawForecastEntry = {
  dt: number;
  main: { temp: number };
  weather?: { description: string; icon: string }[];
};

async function fetchForecastList(): Promise<RawForecastEntry[] | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error("fetchForecastList: OPENWEATHER_API_KEY is not set");
    return null;
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=imperial&appid=${apiKey}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(
      `fetchForecastList: OpenWeatherMap returned ${res.status}: ${body}`
    );
    return null;
  }

  const data = await res.json();
  return data.list ?? null;
}

export async function getForecast(): Promise<{
  hourly: HourlyForecast[];
  daily: DailyForecast[];
} | null> {
  const list = await fetchForecastList();
  if (!list) return null;

  const nowMs = Date.now();
  const tenHoursMs = 10 * 60 * 60 * 1000;

  const hourly: HourlyForecast[] = list
    .filter((entry) => entry.dt * 1000 - nowMs <= tenHoursMs)
    .map((entry) => ({
      time: new Date(entry.dt * 1000).toLocaleTimeString("en-US", {
        timeZone: "America/Chicago",
        hour: "numeric",
      }),
      tempF: Math.round(entry.main.temp),
      icon: entry.weather?.[0]?.icon ?? "",
    }));

  const byDate = new Map<string, RawForecastEntry[]>();
  for (const entry of list) {
    const dateKey = new Date(entry.dt * 1000).toLocaleDateString("en-US", {
      timeZone: "America/Chicago",
    });
    const entries = byDate.get(dateKey) ?? [];
    entries.push(entry);
    byDate.set(dateKey, entries);
  }

  const daily: DailyForecast[] = Array.from(byDate.values())
    .slice(0, 5)
    .map((entries) => {
      const temps = entries.map((e) => e.main.temp);
      const midday =
        entries.find((e) =>
          new Date(e.dt * 1000)
            .toLocaleTimeString("en-US", {
              timeZone: "America/Chicago",
              hour: "numeric",
              hour12: false,
            })
            .startsWith("12")
        ) ?? entries[Math.floor(entries.length / 2)];

      return {
        day: new Date(entries[0].dt * 1000).toLocaleDateString("en-US", {
          timeZone: "America/Chicago",
          weekday: "short",
        }),
        tempHighF: Math.round(Math.max(...temps)),
        tempLowF: Math.round(Math.min(...temps)),
        icon: midday.weather?.[0]?.icon ?? "",
        description: midday.weather?.[0]?.description ?? "",
      };
    });

  return { hourly, daily };
}
