import sys
import json
import time
import random
import pandas as pd
from pytrends.request import TrendReq

def fetch_trends(cityA, cityB, max_retries=5):
    """Fetch Google Trends data for two cities with rate limit handling."""
    pytrends = TrendReq(hl="en-US", tz=330)

    # Keywords for search trends
    keywords = [cityA, cityB]

    # Backoff strategy (start with short delay, increase if needed)
    delay = 1

    for attempt in range(max_retries):
        try:
            # Build the payload
            pytrends.build_payload(keywords, cat=0, timeframe="today 3-m", geo="IN", gprop="")

            # Fetch interest over time
            trends_data = pytrends.interest_over_time()

            if trends_data.empty:
                print(json.dumps({"error": "No trend data found. Try different keywords."}))
                return

            # Extract relevant columns
            trends_data = trends_data[keywords]
            trends_data.reset_index(inplace=True)

            # Convert timestamps to readable date strings
            trends_data["date"] = trends_data["date"].astype(str)

            # Format response as JSON
            result = {
                "dates": trends_data["date"].tolist(),
                "cityA": trends_data[cityA].tolist(),
                "cityB": trends_data[cityB].tolist(),
            }

            print(json.dumps(result), flush=True)
            return  # Success, exit function

        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                print(f"Rate limit hit. Retrying in {delay} seconds...")
                time.sleep(delay)
                delay *= 2  # Exponential backoff
            else:
                print(json.dumps({"error": str(e)}))
                return

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python trends.py <CityA> <CityB>"}))
    else:
        cityA, cityB = sys.argv[1], sys.argv[2]
        fetch_trends(cityA, cityB)