import os
import sys

# Add the backend directory to sys.path so Django can find its modules
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, backend_dir)

from config.wsgi import application

# Vercel's python builder expects the application to be exposed as 'app'
app = application
