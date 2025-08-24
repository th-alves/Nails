#!/usr/bin/env python3
"""
Debug script to see what the serverless API is actually returning
"""

import requests

def debug_endpoint(url, endpoint):
    print(f"\n🔍 Debugging {endpoint}")
    print(f"URL: {url}{endpoint}")
    
    try:
        response = requests.get(f"{url}{endpoint}", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Content-Type: {response.headers.get('content-type', 'Not set')}")
        print(f"Raw Response (first 500 chars): {response.text[:500]}")
        
        try:
            json_data = response.json()
            print(f"JSON Data: {json_data}")
        except Exception as e:
            print(f"JSON Parse Error: {e}")
            
    except Exception as e:
        print(f"Request Error: {e}")

def main():
    base_url = "https://kamile-nails-kn.vercel.app"
    
    endpoints = [
        "/api/health",
        "/api/available-slots?date=2025-08-25",
        "/api/bookings",
        "/api/dashboard/stats"
    ]
    
    print("🚀 DEBUGGING SERVERLESS API RESPONSES")
    print("=" * 60)
    
    for endpoint in endpoints:
        debug_endpoint(base_url, endpoint)
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()