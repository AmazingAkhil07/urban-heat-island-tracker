"""
Open-Meteo Forecast API
https://api.open-meteo.com/v1/forecast

No API key needed. Free and open-source.
Supports multiple lat/lng in a single request.
Now extended to 16-day forecast horizon.

Variables fetched per monitoring point:
  - temperature_2m          : Air temp at 2m height (°C)
  - relativehumidity_2m     : Relative humidity (%)
  - apparent_temperature    : Feels-like / heat index equivalent (°C)
  - surface_temperature     : Land surface temp — key UHI indicator (°C)
  - windspeed_10m           : Wind speed at 10m (km/h)
  - precipitation           : Rain (mm)
"""
import requests
from .heat_utils import classify_risk
from .geocoding import reverse_geocode_points_concurrently

FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'

# 5×5 monitoring grid: offsets in degrees (~5.5 km each step)
GRID_OFFSETS = [-0.10, -0.05, 0.00, +0.05, +0.10]


def build_grid(center_lat: float, center_lng: float) -> list[dict]:
    """Generate 25 monitoring points in a 5×5 grid around the city center."""
    points = []
    for dy in GRID_OFFSETS:
        for dx in GRID_OFFSETS:
            points.append({
                'lat': round(center_lat + dy, 6),
                'lng': round(center_lng + dx, 6),
                'dy': dy,
                'dx': dx,
            })
    return points


def fetch_weather_grid(center_lat: float, center_lng: float, timezone: str = 'auto') -> list[dict]:
    """
    Fetch real current weather for a 5×5 grid around the city.
    Returns list of zone dicts with real temperature + risk data.
    """
    points = build_grid(center_lat, center_lng)
    
    # Reverse geocode all 25 points to get real neighborhood names (happens in < 1 second)
    reverse_geocode_points_concurrently(points)
    
    lats = [p['lat'] for p in points]
    lngs = [p['lng'] for p in points]

    try:
        resp = requests.get(FORECAST_URL, params={
            'latitude':              ','.join(str(x) for x in lats),
            'longitude':             ','.join(str(x) for x in lngs),
            'current':               'temperature_2m,relativehumidity_2m,apparent_temperature,surface_temperature,windspeed_10m,precipitation',
            'timezone':              timezone,
            'forecast_days':         1,
        }, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f'[open_meteo] Forecast fetch error: {e}')
        return []

    # Open-Meteo returns a list when multiple coords are passed
    if isinstance(data, dict):
        data = [data]  # single location fallback

    zones = []
    for i, (pt, loc_data) in enumerate(zip(points, data)):
        current = loc_data.get('current', {})
        temp    = current.get('temperature_2m')
        hi      = current.get('apparent_temperature')
        rh      = current.get('relativehumidity_2m')
        surface = current.get('surface_temperature')
        wind    = current.get('windspeed_10m')
        precip  = current.get('precipitation', 0)

        if temp is None:
            continue

        risk = classify_risk(hi if hi is not None else temp)

        zones.append({
            'id':          i,
            'name':        pt.get('name', f"Zone {i+1}"),
            'lat':         pt['lat'],
            'lng':         pt['lng'],
            'temperature': temp,
            'heat_index':  hi,
            'surface_temp': surface,
            'humidity':    rh,
            'wind_speed':  wind,
            'precipitation': precip,
            **risk,
        })

    return zones


def fetch_forecast_16day(center_lat: float, center_lng: float, timezone: str = 'auto') -> list[dict]:
    """
    Fetch 16-day (384-hour) hourly forecast for the city center point.
    Uses Open-Meteo's extended forecast capability.
    Returns list of hourly snapshots for up to 360 hours (15 days).
    """
    try:
        resp = requests.get(FORECAST_URL, params={
            'latitude':      center_lat,
            'longitude':     center_lng,
            'hourly':        'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation',
            'timezone':      timezone,
            'forecast_days': 16,
        }, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f'[open_meteo] 16-day forecast error: {e}')
        return []

    hourly = data.get('hourly', {})
    times  = hourly.get('time', [])
    temps  = hourly.get('temperature_2m', [])
    his    = hourly.get('apparent_temperature', [])
    rhs    = hourly.get('relative_humidity_2m', [])
    winds  = hourly.get('wind_speed_10m', [])
    precip = hourly.get('precipitation', [])

    snapshots = []
    max_hours = min(360, len(times))  # Cap at 15 days
    for i in range(max_hours):
        hi   = his[i] if i < len(his) and his[i] is not None else (temps[i] if i < len(temps) else None)
        risk = classify_risk(hi)
        snapshots.append({
            'hour':          i,
            'time':          times[i] if i < len(times) else None,
            'temperature':   temps[i] if i < len(temps) else None,
            'heat_index':    hi,
            'humidity':      rhs[i] if i < len(rhs) else None,
            'wind_speed':    winds[i] if i < len(winds) else None,
            'precipitation': precip[i] if i < len(precip) else None,
            **risk,
        })

    return snapshots


# Keep backward compat alias
def fetch_forecast_48h(center_lat: float, center_lng: float, timezone: str = 'auto') -> list[dict]:
    """Legacy 48h alias — now returns full 16-day forecast."""
    return fetch_forecast_16day(center_lat, center_lng, timezone)
