"""
Django settings for Urban Heat Island Predictor backend.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = 'uhi-predictor-dev-secret-key-change-in-production'
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['.vercel.app', 'localhost', '127.0.0.1', '*']

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'heat_api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [], 'APP_DIRS': True, 'OPTIONS': {'context_processors': []}}]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {}  # Stateless — no DB needed

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_TZ = True

STATIC_URL = '/static/'

# ─── CORS: allow React dev server and Vercel domains ──────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
]
CORS_ALLOW_ALL_ORIGINS = DEBUG  # allow all in dev mode

# ─── DRF ────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
}

# ─── NASA FIRMS ─────────────────────────────────────────────────
NASA_FIRMS_MAP_KEY = os.getenv('NASA_FIRMS_MAP_KEY', '')

# ─── TWITTER ────────────────────────────────────────────────────
TWITTER_BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN', '')
