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
