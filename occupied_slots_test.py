#!/usr/bin/env python3
"""
Teste específico para funcionalidade de horários ocupados - Kamile Nails
Cenário solicitado pelo usuário:
1. Fazer um agendamento para 2025-08-18 às 09:00 com cliente "Maria Silva"
2. Verificar se o horário 09:00 não aparece mais disponível para a mesma data
3. Verificar se outros horários ainda estão disponíveis no mesmo dia
4. Tentar agendar o mesmo horário novamente e confirmar se retorna erro 409 (conflito)
5. Testar com múltiplos agendamentos no mesmo dia para diferentes horários
"""

import requests
import json
from datetime import datetime

class OccupiedSlotsTest:
    def __init__(self):
        # Use the correct backend URL from frontend/.env
        self.base_url = "https://quality-scout-1.preview.emergentagent.com"
        self.test_date = "2025-08-25"  # Monday - valid business day (future date)
        self.test_results = []
        
    def log_test(self, test_name, success, details):
        """Log test results"""
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"\n{status} - {test_name}")
        print(f"   Detalhes: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request to API"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Erro na requisição para {url}: {str(e)}")
            return None
        except Exception as e:
            print(f"Erro inesperado: {str(e)}")
            return None
    
    def test_1_initial_available_slots(self):
        """Teste 1: Verificar horários disponíveis iniciais para 2025-08-18"""
        print(f"\n🔍 TESTE 1: Verificando horários disponíveis iniciais para {self.test_date}")
        
        response = self.make_request('GET', 'available-slots', params={'date': self.test_date})
        
        if response and response.status_code == 200:
            slots = response.json()
            if '09:00' in slots:
                self.log_test(
                    "Horários disponíveis iniciais",
                    True,
                    f"09:00 está disponível. Total de slots: {len(slots)}"
                )
                return slots
            else:
                self.log_test(
                    "Horários disponíveis iniciais",
                    False,
                    "09:00 não está disponível inicialmente (inesperado)"
                )
                return slots
        else:
            self.log_test(
                "Horários disponíveis iniciais",
                False,
                f"Erro na API: {response.status_code if response else 'Sem resposta'}"
            )
            return []
    
    def test_2_create_booking_maria_silva(self):
        """Teste 2: Criar agendamento para Maria Silva às 09:00"""
        print(f"\n🔍 TESTE 2: Criando agendamento para Maria Silva às 09:00 em {self.test_date}")
        
        booking_data = {
            "date": self.test_date,
            "time": "09:00",
            "client_name": "Maria Silva",
            "client_phone": "(11) 98765-4321",
            "notes": "Manicure e pedicure completa"
        }
        
        response = self.make_request('POST', 'bookings', data=booking_data)
        
        if response and response.status_code == 200:
            booking = response.json()
            self.booking_id = booking.get('id')
            self.log_test(
                "Criar agendamento Maria Silva",
                True,
                f"Agendamento criado com ID: {self.booking_id}"
            )
            return booking
        else:
            error_msg = response.json().get('detail', 'Erro desconhecido') if response else 'Sem resposta'
            self.log_test(
                "Criar agendamento Maria Silva",
                False,
                f"Erro: {error_msg} (Status: {response.status_code if response else 'N/A'})"
            )
            return None
    
    def test_3_verify_slot_occupied(self):
        """Teste 3: Verificar se 09:00 não está mais disponível"""
        print(f"\n🔍 TESTE 3: Verificando se 09:00 não está mais disponível em {self.test_date}")
        
        response = self.make_request('GET', 'available-slots', params={'date': self.test_date})
        
        if response and response.status_code == 200:
            slots = response.json()
            if '09:00' not in slots:
                self.log_test(
                    "Horário 09:00 ocupado",
                    True,
                    f"09:00 não está mais disponível. Slots restantes: {len(slots)}"
                )
                return slots
            else:
                self.log_test(
                    "Horário 09:00 ocupado",
                    False,
                    "09:00 ainda aparece como disponível (erro na lógica)"
                )
                return slots
        else:
            self.log_test(
                "Horário 09:00 ocupado",
                False,
                f"Erro na API: {response.status_code if response else 'Sem resposta'}"
            )
            return []
    
    def test_4_other_slots_available(self, available_slots):
        """Teste 4: Verificar se outros horários ainda estão disponíveis"""
        print(f"\n🔍 TESTE 4: Verificando se outros horários ainda estão disponíveis")
        
        expected_other_slots = ['08:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
        available_other_slots = [slot for slot in expected_other_slots if slot in available_slots]
        
        if len(available_other_slots) > 0:
            self.log_test(
                "Outros horários disponíveis",
                True,
                f"Horários ainda disponíveis: {available_other_slots}"
            )
            return True
        else:
            self.log_test(
                "Outros horários disponíveis",
                False,
                "Nenhum outro horário disponível (inesperado)"
            )
            return False
    
    def test_5_duplicate_booking_conflict(self):
        """Teste 5: Tentar agendar o mesmo horário novamente (deve retornar 409)"""
        print(f"\n🔍 TESTE 5: Tentando agendar o mesmo horário novamente (deve falhar com 409)")
        
        duplicate_booking_data = {
            "date": self.test_date,
            "time": "09:00",  # Mesmo horário já ocupado
            "client_name": "João Santos",
            "client_phone": "(11) 99887-7654",
            "notes": "Tentativa de agendamento duplicado"
        }
        
        response = self.make_request('POST', 'bookings', data=duplicate_booking_data)
        
        if response and response.status_code == 409:
            error_detail = response.json().get('detail', '')
            self.log_test(
                "Conflito de horário (409)",
                True,
                f"Erro 409 retornado corretamente: {error_detail}"
            )
            return True
        else:
            status = response.status_code if response else 'N/A'
            self.log_test(
                "Conflito de horário (409)",
                False,
                f"Esperado 409, recebido {status}"
            )
            return False
    
    def test_6_multiple_bookings_same_day(self):
        """Teste 6: Criar múltiplos agendamentos no mesmo dia em horários diferentes"""
        print(f"\n🔍 TESTE 6: Criando múltiplos agendamentos no mesmo dia")
        
        bookings_to_create = [
            {
                "time": "10:00",
                "client_name": "Ana Costa",
                "client_phone": "(11) 95555-1234",
                "notes": "Esmaltação em gel"
            },
            {
                "time": "14:00",
                "client_name": "Carla Mendes",
                "client_phone": "(11) 94444-5678",
                "notes": "Manicure francesa"
            },
            {
                "time": "16:00",
                "client_name": "Beatriz Lima",
                "client_phone": "(11) 93333-9876",
                "notes": "Pedicure relaxante"
            }
        ]
        
        successful_bookings = 0
        created_bookings = []
        
        for booking_info in bookings_to_create:
            booking_data = {
                "date": self.test_date,
                "time": booking_info["time"],
                "client_name": booking_info["client_name"],
                "client_phone": booking_info["client_phone"],
                "notes": booking_info["notes"]
            }
            
            response = self.make_request('POST', 'bookings', data=booking_data)
            
            if response and response.status_code == 200:
                successful_bookings += 1
                booking = response.json()
                created_bookings.append({
                    "id": booking.get('id'),
                    "time": booking_info["time"],
                    "client": booking_info["client_name"]
                })
                print(f"   ✅ Agendamento criado: {booking_info['client_name']} às {booking_info['time']}")
            else:
                error_msg = response.json().get('detail', 'Erro desconhecido') if response else 'Sem resposta'
                print(f"   ❌ Falha: {booking_info['client_name']} às {booking_info['time']} - {error_msg}")
        
        if successful_bookings == len(bookings_to_create):
            self.log_test(
                "Múltiplos agendamentos",
                True,
                f"Todos os {successful_bookings} agendamentos criados com sucesso"
            )
        else:
            self.log_test(
                "Múltiplos agendamentos",
                False,
                f"Apenas {successful_bookings} de {len(bookings_to_create)} agendamentos criados"
            )
        
        return created_bookings
    
    def test_7_final_available_slots_check(self):
        """Teste 7: Verificação final dos horários disponíveis"""
        print(f"\n🔍 TESTE 7: Verificação final dos horários disponíveis")
        
        response = self.make_request('GET', 'available-slots', params={'date': self.test_date})
        
        if response and response.status_code == 200:
            final_slots = response.json()
            occupied_slots = ['09:00', '10:00', '14:00', '16:00']  # Horários que deveriam estar ocupados
            
            all_occupied = all(slot not in final_slots for slot in occupied_slots)
            
            if all_occupied:
                self.log_test(
                    "Verificação final de slots",
                    True,
                    f"Todos os horários ocupados removidos corretamente. Disponíveis: {final_slots}"
                )
            else:
                still_available = [slot for slot in occupied_slots if slot in final_slots]
                self.log_test(
                    "Verificação final de slots",
                    False,
                    f"Horários ocupados ainda aparecem como disponíveis: {still_available}"
                )
            
            return final_slots
        else:
            self.log_test(
                "Verificação final de slots",
                False,
                f"Erro na API: {response.status_code if response else 'Sem resposta'}"
            )
            return []
    
    def test_8_list_all_bookings(self):
        """Teste 8: Listar todos os agendamentos para verificar persistência"""
        print(f"\n🔍 TESTE 8: Listando todos os agendamentos para {self.test_date}")
        
        response = self.make_request('GET', 'bookings', params={'date': self.test_date})
        
        if response and response.status_code == 200:
            bookings = response.json()
            confirmed_bookings = [b for b in bookings if b.get('status') == 'confirmed']
            
            self.log_test(
                "Listar agendamentos",
                True,
                f"Total de agendamentos confirmados para {self.test_date}: {len(confirmed_bookings)}"
            )
            
            print("   📋 Agendamentos encontrados:")
            for booking in confirmed_bookings:
                print(f"      • {booking.get('time')} - {booking.get('client_name')} - {booking.get('client_phone')}")
            
            return bookings
        else:
            self.log_test(
                "Listar agendamentos",
                False,
                f"Erro na API: {response.status_code if response else 'Sem resposta'}"
            )
            return []
    
    def run_all_tests(self):
        """Executar todos os testes na sequência"""
        print("🚀 INICIANDO TESTE COMPLETO DE HORÁRIOS OCUPADOS - KAMILE NAILS")
        print("=" * 80)
        print(f"Data de teste: {self.test_date} (Segunda-feira)")
        print(f"URL da API: {self.base_url}/api")
        
        # Sequência de testes
        initial_slots = self.test_1_initial_available_slots()
        booking = self.test_2_create_booking_maria_silva()
        
        if booking:
            available_slots = self.test_3_verify_slot_occupied()
            self.test_4_other_slots_available(available_slots)
            self.test_5_duplicate_booking_conflict()
            created_bookings = self.test_6_multiple_bookings_same_day()
            final_slots = self.test_7_final_available_slots_check()
            all_bookings = self.test_8_list_all_bookings()
        else:
            print("\n⚠️  Teste principal falhou. Pulando testes dependentes.")
        
        # Resumo final
        self.print_summary()
    
    def print_summary(self):
        """Imprimir resumo dos resultados"""
        print("\n" + "=" * 80)
        print("📊 RESUMO DOS RESULTADOS")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total de testes: {total}")
        print(f"Testes aprovados: {passed}")
        print(f"Testes falharam: {total - passed}")
        print(f"Taxa de sucesso: {(passed/total)*100:.1f}%")
        
        print("\n📋 DETALHES DOS TESTES:")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result['success'] else "❌"
            print(f"{i:2d}. {status} {result['test']}")
            if not result['success']:
                print(f"     Detalhes: {result['details']}")
        
        if passed == total:
            print("\n🎉 TODOS OS TESTES PASSARAM!")
            print("✅ A funcionalidade de horários ocupados está funcionando corretamente.")
        else:
            print(f"\n⚠️  {total - passed} TESTE(S) FALHARAM")
            print("❌ Há problemas na funcionalidade de horários ocupados.")

def main():
    """Função principal"""
    tester = OccupiedSlotsTest()
    tester.run_all_tests()

if __name__ == "__main__":
    main()