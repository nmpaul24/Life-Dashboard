import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json(
      { error: "lat and lon query params are required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENWEATHER_API_KEY environment variable is not set" },
      { status: 500 }
    );
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lon)}&units=imperial&appid=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch weather" },
      { status: 502 }
    );
  }

  const data = await res.json();

  return NextResponse.json({
    city: data.name,
    tempF: Math.round(data.main.temp),
    description: data.weather?.[0]?.description ?? "",
    icon: data.weather?.[0]?.icon ?? "",
  });
}
