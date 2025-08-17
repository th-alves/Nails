#!/usr/bin/env python3
"""
Comprehensive API test for Kamile Nails system
Testing with realistic data as requested in the review
"""

import requests
import json
from datetime import datetime, timedelta

def test_kamile_nails_api():
    base_url = "https://nail-perfection.preview.emergentagent.com"
    
    print("🚀 Testing Kamile Nails API with realistic data")
    print("=" * 60)
    
    # Test 1: Health Check
    print("\n1. 🏥 Testing Health Check...")
    response = requests.get(f"{base_url}/api/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}")
    assert response.status_code == 200
    print("   ✅ Health check passed")
    
    # Test 2: Get available slots for next Monday (2025-08-19)
    print("\n2. 📅 Testing Available Slots for Monday 2025-08-19...")
    response = requests.get(f"{base_url}/api/available-slots", params={"date": "2025-08-19"})
    print(f"   Status: {response.status_code}")
    available_slots = response.json()
    print(f"   Available slots: {available_slots}")
    assert response.status_code == 200
    assert "10:00" in available_slots
    print("   ✅ Available slots retrieved successfully")
    
    # Test 3: Create booking with realistic data
    print("\n3. 📝 Creating booking with realistic data...")
    booking_data = {
        "date": "2025-08-19",
        "time": "10:00",
        "client_name": "Ana Silva",
        "client_phone": "(11) 98765-4321",
        "notes": "Primeira vez, nail art colorida"
    }
    response = requests.post(f"{base_url}/api/bookings", json=booking_data)
    print(f"   Status: {response.status_code}")
    booking_response = response.json()
    print(f"   Created booking: {json.dumps(booking_response, indent=2, default=str)}")
    assert response.status_code == 200
    booking_id = booking_response["id"]
    print(f"   ✅ Booking created successfully with ID: {booking_id}")
    
    # Test 4: List all bookings
    print("\n4. 📋 Testing List All Bookings...")
    response = requests.get(f"{base_url}/api/bookings")
    print(f"   Status: {response.status_code}")
    bookings = response.json()
    print(f"   Found {len(bookings)} bookings")
    assert response.status_code == 200
    assert len(bookings) >= 1
    print("   ✅ Bookings listed successfully")
    
    # Test 5: Get specific booking
    print("\n5. 🔍 Testing Get Specific Booking...")
    response = requests.get(f"{base_url}/api/bookings/{booking_id}")
    print(f"   Status: {response.status_code}")
    specific_booking = response.json()
    print(f"   Booking details: {json.dumps(specific_booking, indent=2, default=str)}")
    assert response.status_code == 200
    assert specific_booking["client_name"] == "Ana Silva"
    print("   ✅ Specific booking retrieved successfully")
    
    # Test 6: Dashboard stats
    print("\n6. 📊 Testing Dashboard Stats...")
    response = requests.get(f"{base_url}/api/dashboard/stats")
    print(f"   Status: {response.status_code}")
    stats = response.json()
    print(f"   Dashboard stats: {json.dumps(stats, indent=2, default=str)}")
    assert response.status_code == 200
    assert "total_bookings" in stats
    print("   ✅ Dashboard stats retrieved successfully")
    
    # Test 7: Error scenarios
    print("\n7. ❌ Testing Error Scenarios...")
    
    # Try to book on weekend
    print("   7a. Testing weekend booking (should fail)...")
    weekend_data = {
        "date": "2025-08-16",  # Saturday
        "time": "10:00",
        "client_name": "João Santos",
        "client_phone": "(11) 99999-8888",
        "notes": "Teste fim de semana"
    }
    response = requests.post(f"{base_url}/api/bookings", json=weekend_data)
    print(f"      Status: {response.status_code} (expected 400)")
    print(f"      Error: {response.json()}")
    assert response.status_code == 400
    print("      ✅ Weekend booking correctly rejected")
    
    # Try to book same time slot
    print("   7b. Testing duplicate time slot (should fail)...")
    duplicate_data = {
        "date": "2025-08-19",
        "time": "10:00",  # Same time as Ana Silva
        "client_name": "Carlos Oliveira",
        "client_phone": "(11) 88888-7777",
        "notes": "Tentativa de horário duplicado"
    }
    response = requests.post(f"{base_url}/api/bookings", json=duplicate_data)
    print(f"      Status: {response.status_code} (expected 409)")
    print(f"      Error: {response.json()}")
    assert response.status_code == 409
    print("      ✅ Duplicate booking correctly rejected")
    
    # Try invalid data
    print("   7c. Testing invalid form data (should fail)...")
    invalid_data = {
        "date": "2025-08-19",
        "time": "10:00",
        "client_name": "A",  # Too short
        "client_phone": "123",  # Too short
        "notes": "Dados inválidos"
    }
    response = requests.post(f"{base_url}/api/bookings", json=invalid_data)
    print(f"      Status: {response.status_code} (expected 422)")
    print(f"      Error: {response.json()}")
    assert response.status_code == 422
    print("      ✅ Invalid data correctly rejected")
    
    # Test 8: Cancel booking
    print("\n8. ❌ Testing Cancel Booking...")
    response = requests.put(f"{base_url}/api/bookings/{booking_id}/cancel")
    print(f"   Status: {response.status_code}")
    cancelled_booking = response.json()
    print(f"   Cancelled booking: {json.dumps(cancelled_booking, indent=2, default=str)}")
    assert response.status_code == 200
    assert cancelled_booking["status"] == "cancelled"
    print("   ✅ Booking cancelled successfully")
    
    print("\n" + "=" * 60)
    print("🎉 ALL TESTS PASSED! Kamile Nails API is working perfectly!")
    print("=" * 60)

if __name__ == "__main__":
    test_kamile_nails_api()