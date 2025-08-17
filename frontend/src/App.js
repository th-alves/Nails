import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Phone, MapPin, Instagram, Star, Heart, Sparkles } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Calendar as CalendarComponent } from './components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { toast } from 'sonner';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: ''
  });

  // Buscar datas já agendadas
  useEffect(() => {
    fetchBookedDates();
  }, []);

  const fetchBookedDates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bookings`);
      setBookedDates(response.data.map(booking => new Date(booking.date)));
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }
  };

  // Gerar horários disponíveis (8h às 18h, de hora em hora)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Verificar se uma data está disponível (não é fim de semana nem feriado)
  const isDateAvailable = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6; // 0 = domingo, 6 = sábado
  };

  // Lidar com seleção de data no calendário
  const handleDateSelect = async (date) => {
    if (!isDateAvailable(date)) {
      toast.error('Não atendemos nos finais de semana');
      return;
    }

    setSelectedDate(date);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/available-slots`, {
        params: { date: date.toISOString().split('T')[0] }
      });
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      setAvailableSlots(generateTimeSlots());
    }
  };

  // Fazer agendamento
  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !formData.name || !formData.phone) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const bookingData = {
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        client_name: formData.name,
        client_phone: formData.phone,
        notes: formData.notes
      };

      await axios.post(`${API_BASE_URL}/api/bookings`, bookingData);
      
      toast.success('Agendamento realizado com sucesso!');
      setIsDialogOpen(false);
      setFormData({ name: '', phone: '', notes: '' });
      setSelectedDate(null);
      setSelectedTime('');
      fetchBookedDates();

      // Abrir WhatsApp com mensagem pré-definida
      const message = `Olá! Acabei de agendar um horário para manicure:\n\nData: ${selectedDate.toLocaleDateString('pt-BR')}\nHorário: ${selectedTime}\nNome: ${formData.name}\nTelefone: ${formData.phone}`;
      const whatsappUrl = `https://wa.me/5511963065438?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
    } catch (error) {
      console.error('Erro ao fazer agendamento:', error);
      toast.error('Erro ao fazer agendamento. Tente novamente.');
    }
  };

  // Abrir WhatsApp para contato direto
  const openWhatsApp = () => {
    const message = 'Olá! Gostaria de saber mais sobre os serviços da Kamile Nails 💅';
    const whatsappUrl = `https://wa.me/5511963065438?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-8 w-8 text-rose-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                Kamile Nails
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#inicio" className="text-gray-700 hover:text-rose-500 transition-colors">Início</a>
              <a href="#servicos" className="text-gray-700 hover:text-rose-500 transition-colors">Serviços</a>
              <a href="#agendamento" className="text-gray-700 hover:text-rose-500 transition-colors">Agendamento</a>
              <a href="#contato" className="text-gray-700 hover:text-rose-500 transition-colors">Contato</a>
            </nav>
            <Button onClick={openWhatsApp} className="bg-green-500 hover:bg-green-600">
              <Phone className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1722872112546-936593441be8" 
            alt="Elegant manicure background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/90 via-pink-50/90 to-blue-50/90"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <Badge className="mb-4 bg-rose-100 text-rose-700 border-rose-200">
              💅 Especialista em Manicure
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Suas unhas
              <span className="block bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                perfeitas
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Transformo suas unhas em verdadeiras obras de arte. Atendimento personalizado 
              com produtos de alta qualidade em um ambiente acolhedor e profissional.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={() => document.getElementById('agendamento').scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white px-8 py-3"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendar Horário
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={openWhatsApp}
              className="border-rose-300 text-rose-600 hover:bg-rose-50 px-8 py-3"
            >
              <Phone className="w-5 h-5 mr-2" />
              Falar no WhatsApp
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-rose-500 mb-2">5+ Anos</div>
              <div className="text-gray-600">de Experiência</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-500 mb-2">1000+</div>
              <div className="text-gray-600">Clientes Satisfeitas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">100%</div>
              <div className="text-gray-600">Dedicação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Serviços Especializados
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ofereço serviços completos de manicure com técnicas modernas e produtos de qualidade premium
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow border-rose-100">
              <CardHeader>
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-rose-500" />
                </div>
                <CardTitle className="text-rose-900">Manicure Clássica</CardTitle>
                <CardDescription>
                  Cuidado completo das unhas com esmaltação tradicional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Limpeza e preparação das unhas</li>
                  <li>• Remoção de cutículas</li>
                  <li>• Esmaltação com cores diversas</li>
                  <li>• Hidratação das mãos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-pink-100">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-pink-500" />
                </div>
                <CardTitle className="text-pink-900">Manutenção</CardTitle>
                <CardDescription>
                  Retoque e cuidados para manter suas unhas sempre perfeitas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Retoque do esmalte</li>
                  <li>• Ajuste do formato</li>
                  <li>• Hidratação</li>
                  <li>• Cuidados preventivos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-blue-100">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-blue-900">Nail Art</CardTitle>
                <CardDescription>
                  Decorações personalizadas para ocasiões especiais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Desenhos personalizados</li>
                  <li>• Decorações temáticas</li>
                  <li>• Aplicação de adesivos</li>
                  <li>• Técnicas especiais</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Agendamento */}
      <section id="agendamento" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Agende seu Horário
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o melhor dia e horário para cuidar das suas unhas
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Calendário */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Escolha uma data</h3>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => !isDateAvailable(date) || date < new Date()}
                    className="w-full"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  * Atendemos de segunda à sexta, das 8h às 18h
                </p>
              </div>

              {selectedDate && availableSlots.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Horários disponíveis</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? "default" : "outline"}
                        onClick={() => setSelectedTime(slot)}
                        className={selectedTime === slot ? 
                          "bg-rose-500 hover:bg-rose-600" : 
                          "border-rose-200 text-rose-600 hover:bg-rose-50"
                        }
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Formulário de agendamento */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Seus dados</h3>
                <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
                  <div>
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Digite seu nome"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">WhatsApp *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Alguma preferência especial?"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {selectedDate && selectedTime && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                      <h4 className="font-semibold text-rose-900 mb-2">Resumo do agendamento:</h4>
                      <p className="text-rose-700">
                        <strong>Data:</strong> {selectedDate.toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-rose-700">
                        <strong>Horário:</strong> {selectedTime}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleBooking}
                    className="w-full bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500"
                    disabled={!selectedDate || !selectedTime || !formData.name || !formData.phone}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Confirmar Agendamento
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            Entre em Contato
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-green-500" />
                </div>
                <CardTitle>WhatsApp</CardTitle>
                <CardDescription>Fale comigo diretamente</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">(11) 96306-5438</p>
                <Button onClick={openWhatsApp} className="bg-green-500 hover:bg-green-600">
                  Enviar Mensagem
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle>Horário de Funcionamento</CardTitle>
                <CardDescription>Quando você pode me encontrar</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Segunda à Sexta<br />
                  08:00 - 18:00
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Sparkles className="h-8 w-8 text-rose-400" />
            <span className="text-2xl font-bold">Kamile Nails</span>
          </div>
          
          <p className="text-gray-400 mb-6">
            Transformando suas unhas em verdadeiras obras de arte desde 2019
          </p>
          
          <div className="flex justify-center space-x-6 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={openWhatsApp}
              className="text-gray-400 hover:text-white"
            >
              <Phone className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
          
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-500 text-sm">
              © 2024 Kamile Nails. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;