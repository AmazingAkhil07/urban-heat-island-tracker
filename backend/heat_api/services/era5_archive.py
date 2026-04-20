"""
ERA5 Historical Climate Data via Open-Meteo Archive API
https://archive-api.open-meteo.com/v1/archive

Open-Meteo's Archive API provides ERA5 reanalysis data for free.
ERA5 is ECMWF's 5th generation climate reanalysis — the gold standard
for historical weather data, going back to 1940.

We use it to:
  1. Build climatological baselines (what's "normal" for this location/date)
  2. Find historical heat wave analogs (similar past patterns)
  3. Compute trend coefficients for the prediction engine
"""
import requests
import numpy as np
from datetime import datetime, timedelta
from functools import lru_cache

ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive'

# Variables to fetch
HOURLY_VARS = [
    'temperature_2m',
    'relative_humidity_2m',
    'apparent_temperature',
    'surface_temperature',
    'wind_speed_10m',
]


@lru_cache(maxsize=32)
def fetch_era5_history(lat: float, lng: float, years: int = 2) -> dict:
    """
    Fetch ERA5 reanalysis data for the past N years at a given location.
    Returns dict with 'times' and variable arrays.
    Cached to avoid repeated API calls for the same location.
    """
    end_date = datetime.now() - timedelta(days=6)  # Archive has ~5-day lag
    start_date = end_date - timedelta(days=365 * years)

    try:
        resp = requests.get(ARCHIVE_URL, params={
            'latitude':   lat,
            'longitude':  lng,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date':   end_date.strftime('%Y-%m-%d'),
            'hourly':     ','.join(HOURLY_VARS),
            'timezone':   'auto',
        }, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f'[era5_archive] Fetch error: {e}')
        return {}

    hourly = data.get('hourly', {})
    return {
        'times':               hourly.get('time', []),
        'temperature':         hourly.get('temperature_2m', []),
        'humidity':            hourly.get('relative_humidity_2m', []),
        'apparent_temperature': hourly.get('apparent_temperature', []),
        'surface_temperature': hourly.get('surface_temperature', []),
        'wind_speed':          hourly.get('wind_speed_10m', []),
    }


def compute_climatology(lat: float, lng: float, target_doy: int, window: int = 15) -> dict:
    """
    Compute climatological normals for a given day-of-year.
    Returns mean, std, p90, p95, p99 of apparent temperature
    over all years in the archive, within a ±window day range.
    """
    history = fetch_era5_history(round(lat, 2), round(lng, 2))
    if not history or not history.get('times'):
        return {'mean': 35.0, 'std': 5.0, 'p90': 42.0, 'p95': 45.0, 'p99': 48.0}

    times = history['times']
    temps = history['apparent_temperature']

    # Filter to matching day-of-year range
    values = []
    for i, t_str in enumerate(times):
        try:
            dt = datetime.fromisoformat(t_str)
            doy = dt.timetuple().tm_yday
            # Check if within window (handling year boundary)
            diff = abs(doy - target_doy)
            if diff > 182:
                diff = 365 - diff
            if diff <= window and i < len(temps) and temps[i] is not None:
                values.append(temps[i])
        except (ValueError, IndexError):
            continue

    if len(values) < 10:
        return {'mean': 35.0, 'std': 5.0, 'p90': 42.0, 'p95': 45.0, 'p99': 48.0}

    arr = np.array(values)
    return {
        'mean': float(np.mean(arr)),
        'std':  float(np.std(arr)),
        'p90':  float(np.percentile(arr, 90)),
        'p95':  float(np.percentile(arr, 95)),
        'p99':  float(np.percentile(arr, 99)),
    }


def find_heat_analogs(lat: float, lng: float, current_temps: list[float], top_n: int = 5) -> list[dict]:
    """
    Find historical periods with similar temperature patterns.
    Uses Euclidean distance to match the most recent 72-hour pattern
    against all historical 72-hour windows.
    Returns the top N analog periods with their subsequent trajectories.
    """
    history = fetch_era5_history(round(lat, 2), round(lng, 2))
    if not history or not history.get('apparent_temperature'):
        return []

    hist_temps = [t for t in history['apparent_temperature'] if t is not None]
    if len(hist_temps) < 500:
        return []

    pattern_len = min(len(current_temps), 72)
    current = np.array(current_temps[-pattern_len:])

    # Slide a window across historical data
    analogs = []
    hist_arr = np.array(hist_temps)
    forecast_horizon = 360  # 15 days in hours

    for i in range(len(hist_arr) - pattern_len - forecast_horizon):
        window = hist_arr[i:i + pattern_len]
        distance = float(np.sqrt(np.mean((current - window) ** 2)))  # RMSE
        trajectory = hist_arr[i + pattern_len:i + pattern_len + forecast_horizon].tolist()

        if len(trajectory) == forecast_horizon:
            analogs.append({
                'start_index': i,
                'distance':    distance,
                'trajectory':  trajectory,
            })

    # Sort by distance and return top N
    analogs.sort(key=lambda a: a['distance'])
    return analogs[:top_n]


def get_recent_history(lat: float, lng: float, days: int = 30) -> list[dict]:
    """
    Get the most recent N days of ERA5 data for trend charts.
    Returns list of hourly dicts with temperature data.
    """
    end_date = datetime.now() - timedelta(days=6)
    start_date = end_date - timedelta(days=days)

    try:
        resp = requests.get(ARCHIVE_URL, params={
            'latitude':   lat,
            'longitude':  lng,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date':   end_date.strftime('%Y-%m-%d'),
            'hourly':     'temperature_2m,apparent_temperature,relative_humidity_2m',
            'timezone':   'auto',
        }, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f'[era5_archive] Recent history error: {e}')
        return []

    hourly = data.get('hourly', {})
    times = hourly.get('time', [])
    temps = hourly.get('temperature_2m', [])
    his = hourly.get('apparent_temperature', [])

    results = []
    for i in range(len(times)):
        results.append({
            'time':        times[i],
            'temperature': temps[i] if i < len(temps) else None,
            'heat_index':  his[i] if i < len(his) else None,
        })

    return results
