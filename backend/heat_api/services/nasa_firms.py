"""
NASA FIRMS (Fire Information for Resource Management System) API
https://firms.modaps.eosdis.nasa.gov/api/area/

Uses VIIRS Suomi-NPP Near Real-Time thermal anomaly data.
MAP_KEY is free — registered at firms.modaps.eosdis.nasa.gov/api/

Endpoint format:
  /api/area/csv/{MAP_KEY}/{SOURCE}/{BBOX}/{DAY_RANGE}

  SOURCE: VIIRS_SNPP_NRT (best for heat islands — 375m resolution)
  BBOX:   west,south,east,north  (e.g. 76.5,28.2,77.8,28.9 for Delhi NCR)
  DAY_RANGE: 1 (last 24 hours)
"""
import csv
import io
import requests
from django.conf import settings

FIRMS_BASE = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv'
SOURCE = 'VIIRS_SNPP_NRT'
BBOX_PADDING = 3.0  # degrees (~300 km radius around city center)


def fetch_hotspots(center_lat: float, center_lng: float) -> list[dict]:
    """
    Fetch NASA FIRMS VIIRS thermal hotspots within a bounding box
    around the given city center. Returns last 24 hours of data.
    """
    map_key = settings.NASA_FIRMS_MAP_KEY
    if not map_key:
        print('[nasa_firms] No MAP_KEY configured — skipping hotspot fetch')
        return []

    west  = round(center_lng - BBOX_PADDING, 4)
    south = round(center_lat - BBOX_PADDING, 4)
    east  = round(center_lng + BBOX_PADDING, 4)
    north = round(center_lat + BBOX_PADDING, 4)
    bbox  = f'{west},{south},{east},{north}'

    url = f'{FIRMS_BASE}/{map_key}/{SOURCE}/{bbox}/1'

    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        content = resp.text
    except Exception as e:
        print(f'[nasa_firms] Fetch error: {e}')
        return []

    if not content.strip() or content.startswith('<!'):
        print('[nasa_firms] Empty or invalid response')
        return []

    hotspots = []
    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        try:
            hotspots.append({
                'lat':         float(row['latitude']),
                'lng':         float(row['longitude']),
                'brightness':  float(row.get('bright_ti4', row.get('brightness', 0))),
                'frp':         float(row.get('frp', 0)),          # fire radiative power (MW)
                'confidence':  row.get('confidence', 'n'),
                'acq_time':    row.get('acq_time', ''),
                'acq_date':    row.get('acq_date', ''),
                'satellite':   row.get('satellite', 'Suomi-NPP'),
            })
        except (KeyError, ValueError):
            continue

    print(f'[nasa_firms] Found {len(hotspots)} hotspots near ({center_lat}, {center_lng})')
    return hotspots
