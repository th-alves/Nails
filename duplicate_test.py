#!/usr/bin/env python3
"""
Teste específico para verificar o erro 409 em agendamentos duplicados
"""

import requests
import json

def test_duplicate_booking():
    base_url = "https://dropdown-match.preview.emergentagent.com"
    
    duplicate_booking_data = {
        "date": "2025-08-25",
        "time": "09:00",  # Horário já ocupado pela Maria Silva
        "client_name": "João Santos",
        "client_phone": "(11) 99887-7654",
        "notes": "Tentativa de agendamento duplicado"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/bookings",
            json=duplicate_booking_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 409:
            print("✅ TESTE PASSOU - Erro 409 retornado corretamente")
            return True
        else:
            print(f"❌ TESTE FALHOU - Esperado 409, recebido {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ ERRO NA REQUISIÇÃO: {str(e)}")
        return False

if __name__ == "__main__":
    test_duplicate_booking()