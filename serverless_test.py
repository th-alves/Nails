#!/usr/bin/env python3
"""
Teste rápido da nova API serverless criada em /app/api/index.py
Foco nos endpoints principais para confirmar conversão para serverless
"""

import requests
import json
from datetime import datetime

class ServerlessAPITester:
    def __init__(self):
        self.base_url = "https://kamile-nails-kn.vercel.app"
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, success, details):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test": test_name,
            "status": status,
            "details": details
        }
        self.results.append(result)
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")

    def test_health_check(self):
        """1. Teste o health check endpoint /api/health"""
        print("\n🔍 Testing Health Check Endpoint...")
        
        try:
            url = f"{self.base_url}/api/health"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy" and "Kamile Nails API" in data.get("service", ""):
                    self.log_result("Health Check", True, f"Status: {response.status_code}, Response: {data}")
                    return True
                else:
                    self.log_result("Health Check", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_result("Health Check", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_available_slots(self):
        """2. Teste o endpoint /api/available-slots com uma data válida (exemplo: 2025-08-25)"""
        print("\n🔍 Testing Available Slots Endpoint...")
        
        try:
            url = f"{self.base_url}/api/available-slots"
            params = {"date": "2025-08-25"}
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Verify expected time slots (08:00 to 17:00)
                    expected_slots = [f"{hour:02d}:00" for hour in range(8, 18)]
                    if all(slot in expected_slots for slot in data):
                        self.log_result("Available Slots", True, f"Status: {response.status_code}, Slots: {len(data)} slots returned: {data}")
                        return True
                    else:
                        self.log_result("Available Slots", False, f"Invalid slot format: {data}")
                        return False
                else:
                    self.log_result("Available Slots", False, f"Invalid response format or empty: {data}")
                    return False
            else:
                self.log_result("Available Slots", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Available Slots", False, f"Exception: {str(e)}")
            return False

    def test_mongodb_connection(self):
        """3. Verificar se a conexão com MongoDB está funcionando"""
        print("\n🔍 Testing MongoDB Connection...")
        
        try:
            # Test MongoDB connection by trying to get bookings
            url = f"{self.base_url}/api/bookings"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("MongoDB Connection", True, f"Status: {response.status_code}, Bookings retrieved: {len(data)} bookings")
                    return True
                else:
                    self.log_result("MongoDB Connection", False, f"Invalid response format: {data}")
                    return False
            else:
                self.log_result("MongoDB Connection", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("MongoDB Connection", False, f"Exception: {str(e)}")
            return False

    def test_all_endpoints(self):
        """4. Confirmar se todos os endpoints estão respondendo corretamente"""
        print("\n🔍 Testing All Main Endpoints...")
        
        endpoints = [
            ("GET", "/api/health", None, 200),
            ("GET", "/api/available-slots?date=2025-08-25", None, 200),
            ("GET", "/api/bookings", None, 200),
            ("GET", "/api/dashboard/stats", None, 200),
        ]
        
        all_working = True
        endpoint_results = []
        
        for method, endpoint, data, expected_status in endpoints:
            try:
                url = f"{self.base_url}{endpoint}"
                
                if method == "GET":
                    response = requests.get(url, timeout=10)
                elif method == "POST":
                    response = requests.post(url, json=data, timeout=10)
                
                success = response.status_code == expected_status
                endpoint_results.append(f"{method} {endpoint}: {response.status_code}")
                
                if not success:
                    all_working = False
                    
            except Exception as e:
                endpoint_results.append(f"{method} {endpoint}: ERROR - {str(e)}")
                all_working = False
        
        if all_working:
            self.log_result("All Endpoints", True, f"All endpoints responding correctly: {endpoint_results}")
        else:
            self.log_result("All Endpoints", False, f"Some endpoints failed: {endpoint_results}")
        
        return all_working

    def test_cors_headers(self):
        """5. Verificar CORS headers"""
        print("\n🔍 Testing CORS Headers...")
        
        try:
            url = f"{self.base_url}/api/health"
            response = requests.get(url, timeout=10)
            
            cors_headers = {
                'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
                'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
                'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
            }
            
            # Check if CORS is properly configured
            if cors_headers['access-control-allow-origin']:
                self.log_result("CORS Headers", True, f"CORS headers present: {cors_headers}")
                return True
            else:
                self.log_result("CORS Headers", False, f"CORS headers missing or incomplete: {cors_headers}")
                return False
                
        except Exception as e:
            self.log_result("CORS Headers", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all serverless conversion tests"""
        print("🚀 TESTE RÁPIDO DA NOVA API SERVERLESS")
        print("=" * 60)
        print(f"Testing URL: {self.base_url}")
        print(f"Testing serverless API at /app/api/index.py")
        
        # Run all tests
        self.test_health_check()
        self.test_available_slots()
        self.test_mongodb_connection()
        self.test_all_endpoints()
        self.test_cors_headers()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 RESULTADOS DO TESTE SERVERLESS")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 Conversão para serverless funcionando perfeitamente!")
            return True
        else:
            print("⚠️ Alguns problemas encontrados na conversão serverless.")
            return False

def main():
    tester = ServerlessAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())