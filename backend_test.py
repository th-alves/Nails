import requests
import sys
from datetime import datetime, timedelta
import json

class KamileNailsAPITester:
    def __init__(self, base_url="https://schedule-confirm-bug.preview.emergentagent.com"):
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

    def test_bug_notes_whatsapp_integration(self):
        """BUG 1 - Test if notes are properly saved and returned in API responses"""
        print("\n🐛 TESTING BUG 1 - Observações no WhatsApp")
        
        # Use specific date from review request
        test_date = "2025-08-25"
        detailed_notes = "Gostaria de nail art floral nas cores rosa e roxo"
        
        booking_data = {
            "date": test_date,
            "time": "14:00",
            "client_name": "Fernanda Costa",
            "client_phone": "(11) 97654-3210",
            "notes": detailed_notes
        }
        
        print(f"   Creating booking with detailed notes: '{detailed_notes}'")
        success, response = self.run_test(
            "Create Booking with Detailed Notes",
            "POST",
            "api/bookings",
            200,
            data=booking_data
        )
        
        if success and 'id' in response:
            booking_id = response['id']
            
            # Verify notes are in the creation response
            if 'notes' in response and response['notes'] == detailed_notes:
                print(f"✅ Notes correctly returned in creation response")
                self.tests_passed += 1
            else:
                print(f"❌ Notes missing or incorrect in creation response")
                print(f"   Expected: '{detailed_notes}'")
                print(f"   Got: '{response.get('notes', 'MISSING')}'")
            self.tests_run += 1
            
            # Get the specific booking to verify notes persistence
            print(f"   Retrieving booking {booking_id} to verify notes persistence...")
            success2, response2 = self.run_test(
                "Get Booking to Verify Notes",
                "GET",
                f"api/bookings/{booking_id}",
                200
            )
            
            if success2 and 'notes' in response2 and response2['notes'] == detailed_notes:
                print(f"✅ Notes correctly persisted and retrieved")
                self.tests_passed += 1
            else:
                print(f"❌ Notes not properly persisted")
                print(f"   Expected: '{detailed_notes}'")
                print(f"   Got: '{response2.get('notes', 'MISSING')}'")
            self.tests_run += 1
            
            return booking_id
        else:
            print(f"❌ Failed to create booking with notes")
            self.tests_run += 2  # Count both tests as failed
            return None

    def test_bug_booking_confirmation_flow(self):
        """BUG 2 - Test booking confirmation flow and slot availability"""
        print("\n🐛 TESTING BUG 2 - Confirmação de agendamento")
        
        test_date = "2025-08-25"
        test_time = "09:00"
        
        # Step 1: Check initial available slots
        print(f"   Step 1: Checking available slots for {test_date}")
        success1, initial_slots = self.run_test(
            "Check Initial Available Slots",
            "GET",
            "api/available-slots",
            200,
            params={"date": test_date}
        )
        
        if success1 and isinstance(initial_slots, list):
            initial_count = len(initial_slots)
            print(f"   Initial available slots: {initial_count} slots")
            if test_time in initial_slots:
                print(f"✅ Target time {test_time} is initially available")
                self.tests_passed += 1
            else:
                print(f"❌ Target time {test_time} is not available initially")
            self.tests_run += 1
        else:
            print(f"❌ Failed to get initial slots")
            self.tests_run += 1
            return None
        
        # Step 2: Create booking with detailed notes
        booking_data = {
            "date": test_date,
            "time": test_time,
            "client_name": "Camila Rodrigues",
            "client_phone": "(11) 96543-2109",
            "notes": "Primeira vez no salão, gostaria de unhas decoradas com flores pequenas"
        }
        
        print(f"   Step 2: Creating booking for {test_time}")
        success2, booking_response = self.run_test(
            "Create Booking for Slot Test",
            "POST",
            "api/bookings",
            200,
            data=booking_data
        )
        
        booking_id = None
        if success2 and 'id' in booking_response:
            booking_id = booking_response['id']
            print(f"   Booking created with ID: {booking_id}")
            
            # Verify booking status is 'confirmed'
            if booking_response.get('status') == 'confirmed':
                print(f"✅ Booking status is 'confirmed' immediately after creation")
                self.tests_passed += 1
            else:
                print(f"❌ Booking status is not 'confirmed': {booking_response.get('status')}")
            self.tests_run += 1
        else:
            print(f"❌ Failed to create booking")
            self.tests_run += 1
            return None
        
        # Step 3: Verify slot is no longer available
        print(f"   Step 3: Checking if {test_time} slot is now occupied")
        success3, updated_slots = self.run_test(
            "Check Slots After Booking",
            "GET",
            "api/available-slots",
            200,
            params={"date": test_date}
        )
        
        if success3 and isinstance(updated_slots, list):
            if test_time not in updated_slots:
                print(f"✅ Time slot {test_time} is correctly removed from available slots")
                self.tests_passed += 1
            else:
                print(f"❌ Time slot {test_time} is still available after booking")
            self.tests_run += 1
            
            # Verify other slots are still available
            remaining_count = len(updated_slots)
            if remaining_count == initial_count - 1:
                print(f"✅ Exactly one slot removed ({initial_count} -> {remaining_count})")
                self.tests_passed += 1
            else:
                print(f"❌ Unexpected slot count change ({initial_count} -> {remaining_count})")
            self.tests_run += 1
        else:
            print(f"❌ Failed to get updated slots")
            self.tests_run += 2
        
        # Step 4: Test cancellation and slot availability restoration
        if booking_id:
            print(f"   Step 4: Testing cancellation and slot restoration")
            success4, cancel_response = self.run_test(
                "Cancel Booking",
                "PUT",
                f"api/bookings/{booking_id}/cancel",
                200
            )
            
            if success4:
                # Verify booking status changed to cancelled
                if cancel_response.get('status') == 'cancelled':
                    print(f"✅ Booking status changed to 'cancelled'")
                    self.tests_passed += 1
                else:
                    print(f"❌ Booking status not 'cancelled': {cancel_response.get('status')}")
                self.tests_run += 1
                
                # Check if slot becomes available again
                print(f"   Step 5: Checking if {test_time} slot is available after cancellation")
                success5, final_slots = self.run_test(
                    "Check Slots After Cancellation",
                    "GET",
                    "api/available-slots",
                    200,
                    params={"date": test_date}
                )
                
                if success5 and isinstance(final_slots, list):
                    if test_time in final_slots:
                        print(f"✅ Time slot {test_time} is available again after cancellation")
                        self.tests_passed += 1
                    else:
                        print(f"❌ Time slot {test_time} is still not available after cancellation")
                    self.tests_run += 1
                    
                    # Verify we're back to original slot count
                    final_count = len(final_slots)
                    if final_count == initial_count:
                        print(f"✅ Slot count restored to original ({final_count})")
                        self.tests_passed += 1
                    else:
                        print(f"❌ Slot count not restored ({initial_count} -> {final_count})")
                    self.tests_run += 1
                else:
                    print(f"❌ Failed to get final slots")
                    self.tests_run += 2
            else:
                print(f"❌ Failed to cancel booking")
                self.tests_run += 3
        
        return booking_id

def main():
    print("🚀 Starting Kamile Nails API Tests - FOCUSED ON BUG FIXES")
    print("=" * 60)
    
    tester = KamileNailsAPITester()
    
    # Run focused bug tests first
    print("\n🎯 FOCUSED BUG TESTING")
    print("=" * 40)
    
    # Test the specific bugs mentioned in review request
    booking_id_1 = tester.test_bug_notes_whatsapp_integration()
    booking_id_2 = tester.test_bug_booking_confirmation_flow()
    
    print("\n🔄 COMPREHENSIVE API TESTING")
    print("=" * 40)
    
    # Run comprehensive tests
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