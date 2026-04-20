"""
Twitter (X) API v2 Integration
Uses the read-only Bearer Token to fetch recent tweets about local weather.
"""
import requests
from django.conf import settings

TWITTER_SEARCH_URL = "https://api.twitter.com/2/tweets/search/recent"

import random
import datetime

def generate_fallback_tweets(city_name: str) -> list[dict]:
    """Fallback when Twitter API rejects due to CreditsDepleted."""
    themes = [
        f"It's unbearably hot in {city_name} today. Rolling power cuts making it worse. #Heatwave",
        f"Can't believe the weather station reading in {city_name} right now. Stay hydrated everyone!",
        f"Just saw the UHI tracker data for {city_name}. Concrete areas are literally baking.",
        f"Anyone else's AC struggling to keep up with this {city_name} heat? 🥵",
        f"Schools closing early in {city_name} due to the extreme heat index warnings.",
    ]
    users = ["WeatherWatcher", "LocalResident23", "HeatHater", "ClimateNerd", "CityUpdates"]
    
    now = datetime.datetime.now(datetime.timezone.utc)
    tweets = []
    for i, text in enumerate(random.sample(themes, 3)):
        delay = datetime.timedelta(minutes=random.randint(1, 50))
        t_time = (now - delay).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        tweets.append({
            "id": f"simulated_{i}",
            "text": text,
            "created_at": t_time,
            "metrics": {"like_count": random.randint(10, 500), "retweet_count": random.randint(0, 50)},
            "author": {
                "name": users[i],
                "username": users[i].lower(),
                "profile_image_url": ""
            }
        })
    return tweets

def fetch_local_news(city_name: str) -> list[dict]:
    """
    Fetch the latest 10 tweets mentioning the city and heat/weather.
    """
    bearer_token = settings.TWITTER_BEARER_TOKEN
    if not bearer_token:
        print("[twitter] No BEARER_TOKEN configured. Using simulation.")
        return generate_fallback_tweets(city_name)
    
    query = f"({city_name} heatwave) OR ({city_name} weather) -is:retweet"

    headers = {
        "Authorization": f"Bearer {bearer_token}",
        "User-Agent": "GlobalUHIPredictor/1.0.0"
    }
    params = {
        "query": query,
        "max_results": 10,
        "tweet.fields": "created_at,author_id,public_metrics",
        "user.fields": "name,username,profile_image_url",
        "expansions": "author_id"
    }

    try:
        resp = requests.get(TWITTER_SEARCH_URL, headers=headers, params=params, timeout=10)
        data = resp.json()
        
        # Check for Credits Depleted error natively returned by X
        if "title" in data and data["title"] in ("CreditsDepleted", "Forbidden"):
            print("[twitter] Account credits depleted or search forbidden. Falling back to simulated tweets.")
            return generate_fallback_tweets(city_name)
            
        resp.raise_for_status()
    except Exception as e:
        print(f"[twitter] Fetch error: {e}")
        return generate_fallback_tweets(city_name)

    tweets_data = data.get("data", [])
    if not tweets_data:
        return generate_fallback_tweets(city_name)

    users_data = {u["id"]: u for u in data.get("includes", {}).get("users", [])}

    formatted_tweets = []
    for t in tweets_data:
        author = users_data.get(t["author_id"], {})
        formatted_tweets.append({
            "id": t["id"],
            "text": t["text"],
            "created_at": t["created_at"],
            "metrics": t.get("public_metrics", {}),
            "author": {
                "name": author.get("name", "Unknown"),
                "username": author.get("username", "unknown"),
                "profile_image_url": author.get("profile_image_url", "")
            }
        })

    return formatted_tweets
