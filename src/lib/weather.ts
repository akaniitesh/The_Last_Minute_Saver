export interface WeatherData {
  temperature: number;
  humidity: number;
  rain: number;
  windSpeed: number;
  uvIndex: number;
  aqi: number;
  conditionCode: number;
}

export const fetchWeather = async (params: { 
  city?: string; 
  country?: string; 
  lat?: string; 
  lon?: string; 
}): Promise<WeatherData> => {
  let query = "";
  if (params.lat && params.lon) {
    query = `lat=${params.lat}&lon=${params.lon}`;
  } else if (params.city) {
    query = `city=${encodeURIComponent(params.city)}${params.country ? `&country=${encodeURIComponent(params.country)}` : ""}`;
  } else {
    throw new Error("Location parameters missing");
  }

  const res = await fetch(`/api/weather?${query}`);
  if (!res.ok) {
    throw new Error("Failed to fetch weather");
  }
  return res.json();
};
