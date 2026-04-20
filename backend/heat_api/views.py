from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from .services.geocoding import geocode_city
from .services.open_meteo import fetch_weather_grid, fetch_forecast_16day
from .services.nasa_firms import fetch_hotspots
from .services.twitter import fetch_local_news
from .services.prediction_engine import generate_ai_prediction, generate_zone_predictions
from .services.era5_archive import get_recent_history, compute_climatology
from datetime import datetime


class SearchView(APIView):
    """
    GET /api/search/?city=...
    Geocodes a city name to coordinates.
    """
    @method_decorator(cache_page(60 * 60 * 24))  # Cache for 24h
    def get(self, request):
        city = request.query_params.get('city')
        if not city:
            return Response({"error": "city parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        result = geocode_city(city)
        if not result:
            return Response({"error": "City not found"}, status=status.HTTP_404_NOT_FOUND)
            
        return Response(result)


class ZonesView(APIView):
    """
    GET /api/zones/?lat=...&lng=...&tz=...
    Fetches the 5x5 monitoring grid around the given center point.
    Now returns 16-day forecast instead of 48h.
    """
    @method_decorator(cache_page(60 * 5))  # Cache for 5 mins
    def get(self, request):
        try:
            lat = float(request.query_params.get('lat'))
            lng = float(request.query_params.get('lng'))
            tz = request.query_params.get('tz', 'auto')
        except (TypeError, ValueError):
            return Response({"error": "Invalid lat/lng"}, status=status.HTTP_400_BAD_REQUEST)
            
        zones = fetch_weather_grid(lat, lng, tz)
        forecast = fetch_forecast_16day(lat, lng, tz)
        
        return Response({
            "center": {"lat": lat, "lng": lng},
            "zones": zones,
            "forecast": forecast,
            "forecast_hours": len(forecast),
        })


class HotspotsView(APIView):
    """
    GET /api/hotspots/?lat=...&lng=...
    Fetches NASA FIRMS thermal hotspots near the given center point.
    """
    @method_decorator(cache_page(60 * 5))  # Cache for 5 mins
    def get(self, request):
        try:
            lat = float(request.query_params.get('lat'))
            lng = float(request.query_params.get('lng'))
        except (TypeError, ValueError):
            return Response({"error": "Invalid lat/lng"}, status=status.HTTP_400_BAD_REQUEST)
            
        hotspots = fetch_hotspots(lat, lng)
        return Response({"hotspots": hotspots})


class NewsFeedView(APIView):
    """
    GET /api/news/?city=...
    Fetches live tweets about heat/weather in the given city.
    """
    @method_decorator(cache_page(60 * 5))  # Cache for 5 mins to avoid X rate limits
    def get(self, request):
        city = request.query_params.get('city')
        if not city:
            return Response({"error": "city parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        tweets = fetch_local_news(city)
        return Response({"tweets": tweets})


class PredictView(APIView):
    """
    GET /api/predict/?lat=...&lng=...
    Runs the statistical prediction engine for 15-day zone-level forecasts.
    Uses Holt-Winters + ERA5 Historical Analog Ensemble.
    """
    def get(self, request):
        try:
            lat = float(request.query_params.get('lat'))
            lng = float(request.query_params.get('lng'))
        except (TypeError, ValueError):
            return Response({"error": "Invalid lat/lng"}, status=status.HTTP_400_BAD_REQUEST)

        tz = request.query_params.get('tz', 'auto')
        
        # Get current zones and forecast to feed the prediction engine
        zones = fetch_weather_grid(lat, lng, tz)
        forecast = fetch_forecast_16day(lat, lng, tz)

        # Generate full 15-day predictions
        predictions = generate_zone_predictions(lat, lng, zones, forecast)

        # Also generate map overlay scatter points
        scatter_points = generate_ai_prediction(lat, lng)

        return Response({
            "predictions": predictions,
            "scatter_points": scatter_points,
        })


class HistoricalView(APIView):
    """
    GET /api/historical/?lat=...&lng=...&days=30
    Returns ERA5 historical temperature data for trend charts.
    """
    @method_decorator(cache_page(60 * 60))  # Cache for 1 hour
    def get(self, request):
        try:
            lat = float(request.query_params.get('lat'))
            lng = float(request.query_params.get('lng'))
            days = int(request.query_params.get('days', 30))
        except (TypeError, ValueError):
            return Response({"error": "Invalid parameters"}, status=status.HTTP_400_BAD_REQUEST)

        days = min(days, 90)  # Cap at 90 days
        history = get_recent_history(lat, lng, days)
        
        # Get climatology for context
        target_doy = datetime.now().timetuple().tm_yday
        clim = compute_climatology(lat, lng, target_doy)

        return Response({
            "history": history,
            "climatology": clim,
            "days": days,
        })
