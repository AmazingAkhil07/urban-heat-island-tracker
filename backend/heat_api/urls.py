from django.urls import path
from .views import SearchView, ZonesView, HotspotsView, NewsFeedView, PredictView, HistoricalView

urlpatterns = [
    path('search/', SearchView.as_view(), name='search'),
    path('zones/', ZonesView.as_view(), name='zones'),
    path('hotspots/', HotspotsView.as_view(), name='hotspots'),
    path('news/', NewsFeedView.as_view(), name='news'),
    path('predict/', PredictView.as_view(), name='predict'),
    path('historical/', HistoricalView.as_view(), name='historical'),
]
