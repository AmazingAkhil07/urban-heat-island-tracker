"""
Open-Meteo Geocoding API
https://geocoding-api.open-meteo.com/v1/search

No API key needed. Free and open-source.
"""
import requests
from concurrent.futures import ThreadPoolExecutor

GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
REVERSE_GEO_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

def geocode_city(city_name: str) -> dict | None:
    """
    Geocode a city name to lat/lng + metadata.
    Returns dict or None if not found.
    """
    try:
        resp = requests.get(GEOCODING_URL, params={
            'name': city_name,
            'count': 1,
            'language': 'en',
            'format': 'json',
        }, timeout=8)
        resp.raise_for_status()
        data = resp.json()
        results = data.get('results', [])
        if not results:
            return None
        r = results[0]
        return {
            'name':      r.get('name', city_name),
            'country':   r.get('country', ''),
            'region':    r.get('admin1', ''),
            'lat':       r['latitude'],
            'lng':       r['longitude'],
            'timezone':  r.get('timezone', 'UTC'),
            'population': r.get('population', 0),
        }
    except Exception as e:
        print(f'[geocoding] Error for "{city_name}": {e}')
        return None

def reverse_geocode_point(lat: float, lng: float, fallback: str) -> str:
    """Reverse geocode a single lat/lng using BigDataCloud, returning the locality or fallback."""
    try:
        resp = requests.get(REVERSE_GEO_URL, params={
            'latitude': lat,
            'longitude': lng,
            'localityLanguage': 'en'
        }, timeout=3)
        if resp.ok:
            data = resp.json()
            locality = data.get('locality')
            if locality:
                return locality
            
            # fallback to principal_subdivision (like district) if locality is empty
            subdiv = data.get('principalSubdivision')
            if subdiv:
                return subdiv
    except Exception:
        pass
    return fallback

def reverse_geocode_points_concurrently(points: list[dict]):
    """Adds a 'name' field inplace to each point dict concurrently."""
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for p in points:
            # We use string formatting of lat/lng as fallback 
            fallback = f"{p['dy']:+.2f}°, {p['dx']:+.2f}°"
            # Pass (point_dict, future)
            f = executor.submit(reverse_geocode_point, p['lat'], p['lng'], fallback)
            futures.append((p, f))
        
        for p, future in futures:
            try:
                p['name'] = future.result()
            except Exception:
                p['name'] = f"{p['dy']:+.2f}°, {p['dx']:+.2f}°"
