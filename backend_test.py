import requests
import sys
from datetime import datetime, timedelta
import json

class KamileNailsAPITester:
    def __init__(self, base_url="https://nail-perfection.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.booking_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, default=str)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_available_slots_valid_weekday(self):
        """Test getting available slots for a valid weekday"""
        # Get next Monday
        today = datetime.now().date()
        days_ahead = 0 - today.weekday()  # Monday is 0
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        next_monday = today + timedelta(days_ahead)
        
        return self.run_test(
            "Available Slots - Valid Weekday",
            "GET",
            "api/available-slots",
            200,
            params={"date": next_monday.strftime('%Y-%m-%d')}
        )

    def test_available_slots_weekend(self):
        """Test getting available slots for weekend (should fail)"""
        # Get next Saturday
        today = datetime.now().date()
        days_ahead = 5 - today.weekday()  # Saturday is 5
        if days_ahead <= 0:
            days_ahead += 7
        next_saturday = today + timedelta(days_ahead)
        
        return self.run_test(
            "Available Slots - Weekend (Should Fail)",
            "GET",
            "api/available-slots",
            400,
            params={"date": next_saturday.strftime('%Y-%m-%d')}
        )

    def test_available_slots_past_date(self):
        """Test getting available slots for past date (should fail)"""
        yesterday = datetime.now().date() - timedelta(days=1)
        
        return self.run_test(
            "Available Slots - Past Date (Should Fail)",
            "GET",
            "api/available-slots",
            400,
            params={"date": yesterday.strftime('%Y-%m-%d')}
        )

    def test_available_slots_invalid_format(self):
        """Test getting available slots with invalid date format"""
        return self.run_test(
            "Available Slots - Invalid Format (Should Fail)",
            "GET",
            "api/available-slots",
            400,
            params={"date": "invalid-date"}
        )

    def test_create_booking_valid(self):
        """Test creating a valid booking"""
        # Get next Tuesday
        today = datetime.now().date()
        days_ahead = 1 - today.weekday()  # Tuesday is 1
        if days_ahead <= 0:
            days_ahead += 7
        next_tuesday = today + timedelta(days_ahead)
        
        booking_data = {
            "date": next_tuesday.strftime('%Y-%m-%d'),
            "time": "10:00",
            "client_name": "Maria Silva",
            "client_phone": "(11) 99999-9999",
            "notes": "Primeira vez no salão"
        }
        
        success, response = self.run_test(
            "Create Booking - Valid",
            "POST",
            "api/bookings",
            200,
            data=booking_data
        )
        
        if success and 'id' in response:
            self.booking_id = response['id']
            print(f"   Booking ID saved: {self.booking_id}")
        
        return success, response

    def test_create_booking_weekend(self):
        """Test creating booking on weekend (should fail)"""
        # Get next Sunday
        today = datetime.now().date()
        days_ahead = 6 - today.weekday()  # Sunday is 6
        if days_ahead <= 0:
            days_ahead += 7
        next_sunday = today + timedelta(days_ahead)
        
        booking_data = {
            "date": next_sunday.strftime('%Y-%m-%d'),
            "time": "10:00",
            "client_name": "Maria Silva",
            "client_phone": "(11) 99999-9999",
            "notes": "Teste fim de semana"
        }
        
        return self.run_test(
            "Create Booking - Weekend (Should Fail)",
            "POST",
            "api/bookings",
            400,
            data=booking_data
        )

    def test_create_booking_past_date(self):
        """Test creating booking for past date (should fail)"""
        yesterday = datetime.now().date() - timedelta(days=1)
        
        booking_data = {
            "date": yesterday.strftime('%Y-%m-%d'),
            "time": "10:00",
            "client_name": "Maria Silva",
            "client_phone": "(11) 99999-9999",
            "notes": "Teste data passada"
        }
        
        return self.run_test(
            "Create Booking - Past Date (Should Fail)",
            "POST",
            "api/bookings",
            400,
            data=booking_data
        )

    def test_create_booking_invalid_data(self):
        """Test creating booking with invalid data"""
        booking_data = {
            "date": "2024-12-25",
            "time": "10:00",
            "client_name": "A",  # Too short
            "client_phone": "123",  # Too short
            "notes": "Teste dados inválidos"
        }
        
        return self.run_test(
            "Create Booking - Invalid Data (Should Fail)",
            "POST",
            "api/bookings",
            422,  # Validation error
            data=booking_data
        )

    def test_create_duplicate_booking(self):
        """Test creating duplicate booking (should fail)"""
        if not self.booking_id:
            print("⚠️  Skipping duplicate booking test - no valid booking created")
            return True, {}
            
        # Try to book the same time slot again
        today = datetime.now().date()
        days_ahead = 1 - today.weekday()  # Tuesday is 1
        if days_ahead <= 0:
            days_ahead += 7
        next_tuesday = today + timedelta(days_ahead)
        
        booking_data = {
            "date": next_tuesday.strftime('%Y-%m-%d'),
            "time": "10:00",  # Same time as previous booking
            "client_name": "João Santos",
            "client_phone": "(11) 88888-8888",
            "notes": "Tentativa de agendamento duplicado"
        }
        
        return self.run_test(
            "Create Booking - Duplicate Time (Should Fail)",
            "POST",
            "api/bookings",
            409,  # Conflict
            data=booking_data
        )

    def test_get_all_bookings(self):
        """Test getting all bookings"""
        return self.run_test("Get All Bookings", "GET", "api/bookings", 200)

    def test_get_bookings_by_date(self):
        """Test getting bookings filtered by date"""
        today = datetime.now().date()
        days_ahead = 1 - today.weekday()  # Tuesday is 1
        if days_ahead <= 0:
            days_ahead += 7
        next_tuesday = today + timedelta(days_ahead)
        
        return self.run_test(
            "Get Bookings by Date",
            "GET",
            "api/bookings",
            200,
            params={"date": next_tuesday.strftime('%Y-%m-%d')}
        )

    def test_get_specific_booking(self):
        """Test getting a specific booking by ID"""
        if not self.booking_id:
            print("⚠️  Skipping specific booking test - no valid booking created")
            return True, {}
            
        return self.run_test(
            "Get Specific Booking",
            "GET",
            f"api/bookings/{self.booking_id}",
            200
        )

    def test_cancel_booking(self):
        """Test cancelling a booking"""
        if not self.booking_id:
            print("⚠️  Skipping cancel booking test - no valid booking created")
            return True, {}
            
        return self.run_test(
            "Cancel Booking",
            "PUT",
            f"api/bookings/{self.booking_id}/cancel",
            200
        )

    def test_dashboard_stats(self):
        """Test getting dashboard statistics"""
        return self.run_test("Dashboard Stats", "GET", "api/dashboard/stats", 200)

def main():
    print("🚀 Starting Kamile Nails API Tests")
    print("=" * 50)
    
    tester = KamileNailsAPITester()
    
    # Run all tests
    test_methods = [
        tester.test_health_check,
        tester.test_available_slots_valid_weekday,
        tester.test_available_slots_weekend,
        tester.test_available_slots_past_date,
        tester.test_available_slots_invalid_format,
        tester.test_create_booking_valid,
        tester.test_create_booking_weekend,
        tester.test_create_booking_past_date,
        tester.test_create_booking_invalid_data,
        tester.test_create_duplicate_booking,
        tester.test_get_all_bookings,
        tester.test_get_bookings_by_date,
        tester.test_get_specific_booking,
        tester.test_cancel_booking,
        tester.test_dashboard_stats
    ]
    
    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())