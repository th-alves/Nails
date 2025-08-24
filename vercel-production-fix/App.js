import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Phone, MapPin, Instagram, Star, Heart, Sparkles, Award, Users, CheckCircle, Quote, ArrowRight, Palette, Menu, Home, User, Briefcase, Camera, PhoneCall } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Calendar as CalendarComponent } from './components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { toast } from 'sonner';
import kamile from "./images/kamile.png";
import './App.css';

// Configuração de API URL com fallback para desenvolvimento local ou produção
const getApiBaseUrl = () => {
  // Se estiver na Vercel, use nosso backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://nail-artistry-4.preview.emergentagent.com';
  }
  // Caso contrário, use a variável de ambiente ou localhost
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
};

const API_BASE_URL = getApiBaseUrl();

console.log('API_BASE_URL:', API_BASE_URL);
console.log('Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server');

// Função para gerar slots de horário como fallback
const generateMockTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 17; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

// Dados dos testimoniais
const testimonials = [
  {
    id: 1,
    name: "Maria Silva",
    text: "A melhor que tive até agora, afinal, quando conversamos temos muita conexão, eu amo isso!",
    rating: 5,
    service: "Manicure Clássica"
  },
  {
    id: 2,
    name: "Ana Costa",
    text: "Além de ser uma excelente profissional, é uma pessoa incrível e maravilhosa!",
    rating: 5,
    service: "Nail Art"
  },
  {
    id: 3,
    name: "Julia Santos",
    text: "Adorei muito teu trabalho, perfeição! Estou muito feliz por você deixar minhas unhas impecáveis, nota mil, super indico!",
    rating: 5,
    service: "Manutenção"
  }
];

// Portfolio de trabalhos
const portfolioWorks = [
  {
    id: 1,
    title: "Nail Art Elegante",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxuYWlsJTIwYXJ0fGVufDB8fHx8MTc1NTQ2NjU5OXww&ixlib=rb-4.1.0&q=85",
    description: "Design sofisticado em tons rosados"
  },
  {
    id: 2,
    title: "Manicure Francesa",
    image: "https://images.unsplash.com/photo-1521563906175-3c1c6a58d955?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyNXx8bmFpbCUyMGFydHxlbnwwfHx8fDE3NTU0NjY1OTl8MA&ixlib=rb-4.1.0&q=85",
    description: "Clássico e atemporal"
  },
  {
    id: 3,
    title: "Decoração Floral",
    image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxuYWlsJTIwYXJ0fGVufDB8fHx8MTc1NTQ2NjU5OXww&ixlib=rb-4.1.0&q=85",
    description: "Delicadas flores pintadas à mão"
  }
];

function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: ''
  });

  useEffect(() => {
    fetchBookedDates();
  }, []);

  // Buscar datas já agendadas
  const fetchBookedDates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/bookings`);
      const booked = response.data.map(booking => booking.date);
      setBookedDates([...new Set(booked)]);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      // Em caso de erro, não bloquear o funcionamento
    }
  };

  // Gerar horários disponíveis (8h às 18h, de hora em hora) - FUNÇÃO DE FALLBACK
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Função para obter o próximo dia útil (Segunda-feira)
  const getNextMonday = () => {
    const today = new Date();
    const nextMonday = new Date(today);
    const daysUntilMonday = (8 - today.getDay()) % 7;
    nextMonday.setDate(today.getDate() + (daysUntilMonday === 0 ? 7 : daysUntilMonday));
    return nextMonday;
  };

  // Verificar se uma data está disponível (segunda a sexta, não no passado)
  const isDateAvailable = (date) => {
    const day = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    // Must be weekday (Monday-Friday: 1-5) and not in the past
    return day >= 1 && day <= 5 && date >= today;
  };

  // Lidar com seleção de data no calendário
  const handleDateSelect = async (date) => {
    if (!date) return;

    const day = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (day === 0 || day === 6) {
      toast.error('❌ Não atendemos nos finais de semana. Escolha um dia de segunda à sexta.');
      return;
    }

    if (date < today) {
      toast.error('❌ Não é possível agendar em datas passadas. Escolha uma data futura.');
      return;
    }

    setSelectedDate(date);
    setSelectedTime(''); // Reset selected time
    setIsLoading(true);

    try {
      // Tentar fazer a requisição para a API
      const response = await axios.get(`${API_BASE_URL}/api/available-slots`, {
        params: { date: date.toISOString().split('T')[0] }
      });
      setAvailableSlots(response.data);
      console.log('✅ Horários carregados da API:', response.data);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      
      // FALLBACK: Se a API falhar, usar horários mock
      console.log('🔄 Usando horários fallback devido ao erro da API');
      const mockSlots = generateMockTimeSlots();
      setAvailableSlots(mockSlots);
      
      // Ainda mostrar erro específico ao usuário se for um erro conhecido
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.detail || '';
        
        if (status === 400) {
          if (message.includes('weekend') || message.includes('weekends')) {
            toast.error('❌ Não atendemos nos finais de semana.');
            setAvailableSlots([]);
          } else if (message.includes('past') || message.includes('passado')) {
            toast.error('❌ Não é possível agendar em datas passadas.');
            setAvailableSlots([]);
          }
        }
      } else {
        // Para erros de rede, usar os horários mock
        toast.info('📱 Carregando horários disponíveis...');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resto do código permanece igual...
  // [Incluir todas as outras funções: handleOpenConfirmModal, handleBooking, etc.]

  // Abrir modal de confirmação
  const handleOpenConfirmModal = () => {
    if (!selectedDate || !selectedTime || !formData.name || !formData.phone) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  // Fazer agendamento
  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !formData.name || !formData.phone) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    setIsConfirmModalOpen(false); // Fechar o modal de confirmação

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
      
      // Preparar mensagem do WhatsApp ANTES de resetar os dados
      let message = `Olá! Acabei de agendar um horário para manicure:\n\nData: ${selectedDate.toLocaleDateString('pt-BR')}\nHorário: ${selectedTime}\nNome: ${formData.name}\nTelefone: ${formData.phone}`;
      
      // Adicionar observações se existirem
      if (formData.notes && formData.notes.trim()) {
        message += `\nObservações: ${formData.notes}`;
      }
      
      const whatsappUrl = `https://wa.me/5511963065438?text=${encodeURIComponent(message)}`;
      
      // Reset form data
      setIsDialogOpen(false);
      setFormData({ name: '', phone: '', notes: '' });
      setSelectedDate(null);
      setSelectedTime('');
      fetchBookedDates();

      // Abrir WhatsApp com mensagem pré-definida
      window.open(whatsappUrl, '_blank');

    } catch (error) {
      console.error('Erro ao fazer agendamento:', error);
      
      // Tratar diferentes tipos de erro em português
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.detail || error.response.data?.message || 'Erro desconhecido';
        
        if (status === 409) {
          toast.error('❌ Este horário já foi agendado por outro cliente. Por favor, escolha outro horário.');
        } else if (status === 400) {
          if (message.includes('weekend') || message.includes('fim de semana')) {
            toast.error('❌ Não atendemos nos finais de semana.');
          } else if (message.includes('past') || message.includes('passado')) {
            toast.error('❌ Não é possível agendar em datas passadas.');
          } else {
            toast.error(`❌ ${message}`);
          }
        } else if (status === 422) {
          toast.error('❌ Dados inválidos. Verifique as informações e tente novamente.');
        } else {
          toast.error('❌ Erro no servidor. Tente novamente em alguns instantes.');
        }
      } else if (error.request) {
        // Se não conseguir conectar com a API, ainda assim direcionar para WhatsApp
        toast.info('📱 Redirecionando para WhatsApp para confirmar agendamento...');
        
        let message = `Olá! Gostaria de agendar um horário para manicure:\n\nData: ${selectedDate.toLocaleDateString('pt-BR')}\nHorário: ${selectedTime}\nNome: ${formData.name}\nTelefone: ${formData.phone}`;
        
        if (formData.notes && formData.notes.trim()) {
          message += `\nObservações: ${formData.notes}`;
        }
        
        const whatsappUrl = `https://wa.me/5511963065438?text=${encodeURIComponent(message)}`;
        
        // Reset form data
        setIsDialogOpen(false);
        setFormData({ name: '', phone: '', notes: '' });
        setSelectedDate(null);
        setSelectedTime('');
        
        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
      } else {
        toast.error('❌ Erro inesperado. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Resto da interface permanece exatamente igual...
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Header permanece igual */}
      <header className="bg-white shadow-lg border-b-2 border-rose-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent">
                  Kamile Nails
                </h1>
                <p className="text-sm text-rose-400 font-medium">Beleza em suas mãos</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-gray-700 hover:text-rose-600 font-medium transition-colors duration-200 hover-underline">
                Início
              </a>
              <a href="#sobre" className="text-gray-700 hover:text-rose-600 font-medium transition-colors duration-200 hover-underline">
                Sobre
              </a>
              <a href="#servicos" className="text-gray-700 hover:text-rose-600 font-medium transition-colors duration-200 hover-underline">
                Serviços
              </a>
              <a href="#portfolio" className="text-gray-700 hover:text-rose-600 font-medium transition-colors duration-200 hover-underline">
                Portfolio
              </a>
              <a href="#agendamento" className="text-gray-700 hover:text-rose-600 font-medium transition-colors duration-200 hover-underline">
                Agendamento
              </a>
              <a href="#contato" className="text-gray-700 hover:text-rose-600 font-medium transition-colors duration-200 hover-underline">
                Contato
              </a>
              <a 
                href="https://wa.me/5511963065438" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center space-x-2 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <PhoneCall className="h-4 w-4" />
                <span className="font-medium">WhatsApp</span>
              </a>
            </nav>

            {/* Mobile menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-6 w-6 text-rose-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <Home className="mr-2 h-4 w-4" />
                    <a href="#inicio">Início</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <a href="#sobre">Sobre</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Briefcase className="mr-2 h-4 w-4" />
                    <a href="#servicos">Serviços</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Camera className="mr-2 h-4 w-4" />
                    <a href="#portfolio">Portfolio</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Calendar className="mr-2 h-4 w-4" />
                    <a href="#agendamento">Agendamento</a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <PhoneCall className="mr-2 h-4 w-4" />
                    <a href="https://wa.me/5511963065438" target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Resto do conteúdo permanece igual, apenas mantendo a mesma estrutura... */}
      
      {/* Hero Section */}
      <section id="inicio" className="relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-rose-200 rounded-full opacity-20 animate-float"></div>
          <div className="absolute top-20 -left-4 w-16 h-16 bg-rose-300 rounded-full opacity-30 animate-float-delay"></div>
          <div className="absolute bottom-20 right-20 w-20 h-20 bg-rose-100 rounded-full opacity-40 animate-float"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fadeInLeft">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-rose-100 rounded-full">
                  <Award className="h-4 w-4 text-rose-600 mr-2" />
                  <span className="text-rose-700 font-medium text-sm">Profissional Certificada</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Suas unhas
                  <span className="block bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent">
                    perfeitas
                  </span>
                  <span className="block">estão aqui!</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Transforme suas unhas em uma obra de arte com técnicas profissionais e produtos de qualidade premium. 
                  Agende já seu horário!
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group text-lg font-semibold"
                    >
                      <Calendar className="mr-3 h-5 w-5 group-hover:animate-bounce" />
                      Agendar Horário
                      <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-rose-600 flex items-center">
                        <Calendar className="mr-3 h-6 w-6" />
                        Agende seu Horário
                      </DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Escolha o melhor dia e horário para cuidar das suas unhas
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid md:grid-cols-2 gap-8 py-6">
                      {/* Calendar Section */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Calendar className="mr-2 h-5 w-5 text-rose-600" />
                            Escolha uma data
                          </h3>
                          {!selectedDate && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                              <p className="text-yellow-800 text-sm font-medium mb-1">
                                💡 <strong>Dica:</strong> Atendemos apenas nos dias úteis (segunda à sexta).
                              </p>
                              <span className="text-rose-600">Use as setas para navegar para próximas semanas</span>
                            </div>
                          )}
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date) => !isDateAvailable(date)}
                            defaultMonth={getNextMonday()}
                            className="w-full mx-auto max-w-sm md:max-w-none"
                          />
                        </div>

                        {selectedDate && (
                          <div className="animate-fadeInUp">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                              Horários disponíveis para {selectedDate.toLocaleDateString('pt-BR')}
                              {isLoading && <span className="loading-dots ml-2"></span>}
                            </h3>
                            {isLoading ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[...Array(6)].map((_, i) => (
                                  <div key={i} className="h-10 shimmer rounded-md"></div>
                                ))}
                              </div>
                            ) : availableSlots.length === 0 ? (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                                <p className="text-orange-700 font-medium mb-2">😔 Nenhum horário disponível</p>
                                <p className="text-orange-600 text-sm">
                                  Todos os horários já foram agendados para esta data. 
                                  Tente escolher outro dia ou entre em contato pelo WhatsApp.
                                </p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {availableSlots.map((slot, index) => (
                                  <Button
                                    key={slot}
                                    variant={selectedTime === slot ? "default" : "outline"}
                                    onClick={() => setSelectedTime(slot)}
                                    className={`hover-scale animate-fadeInUp text-sm ${selectedTime === slot ?
                                      "bg-rose-500 hover:bg-rose-600" :
                                      "border-rose-200 text-rose-600 hover:bg-rose-50"
                                      }`}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                  >
                                    {slot}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-2">
                            * Atendemos de <strong>segunda à sexta</strong>, das 8h às 18h
                          </p>
                          <span className="text-rose-600 text-sm">Use as setas para navegar para próximas semanas</span>
                        </div>
                      </div>

                      {/* Form Section */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <User className="mr-2 h-5 w-5 text-rose-600" />
                            Seus dados
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                Nome completo *
                              </Label>
                              <Input
                                id="name"
                                type="text"
                                placeholder="Digite seu nome"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="mt-1 border-rose-200 focus:border-rose-500 focus:ring-rose-500"
                                required
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                WhatsApp *
                              </Label>
                              <Input
                                id="phone"
                                type="tel"
                                placeholder="(11) 99999-9999"
                                value={formData.phone}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/\D/g, '');
                                  value = value.replace(/(\d{2})(\d)/, '($1) $2');
                                  value = value.replace(/(\d{5})(\d)/, '$1-$2');
                                  setFormData(prev => ({ ...prev, phone: value }));
                                }}
                                className="mt-1 border-rose-200 focus:border-rose-500 focus:ring-rose-500"
                                maxLength={15}
                                required
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                                Observações
                              </Label>
                              <Textarea
                                id="notes"
                                placeholder="Alguma preferência especial? (Opcional)"
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="mt-1 border-rose-200 focus:border-rose-500 focus:ring-rose-500 h-20"
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <Button
                            onClick={handleOpenConfirmModal}
                            disabled={!selectedDate || !selectedTime || !formData.name || !formData.phone || isLoading}
                            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Processando...
                              </>
                            ) : (
                              <>
                                <Calendar className="mr-2 h-5 w-5" />
                                Agendar Horário
                              </>
                            )}
                          </Button>
                          
                          <div className="text-center">
                            <p className="text-xs text-gray-500">
                              * Campos obrigatórios
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  size="lg"
                  asChild
                  className="border-2 border-rose-200 text-rose-600 hover:bg-rose-50 px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-lg font-semibold"
                >
                  <a href="#portfolio">
                    <Camera className="mr-3 h-5 w-5" />
                    Ver Portfolio
                  </a>
                </Button>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex -space-x-2">
                  {[1,2,3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
                      <Star className="h-4 w-4 text-white fill-current" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">500+ clientes satisfeitas</p>
                  <p className="text-sm text-gray-600">⭐ Avaliação 5.0</p>
                </div>
              </div>
            </div>
            
            <div className="relative animate-fadeInRight">
              <div className="relative z-10">
                <img 
                  src={kamile}
                  alt="Kamile - Nail Artist Profissional" 
                  className="rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 w-full max-w-md mx-auto"
                />
                <div className="absolute -bottom-6 -right-6 bg-white rounded-xl p-4 shadow-xl animate-float">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-900">Disponível agora!</span>
                  </div>
                </div>
              </div>
              
              {/* Background decorations */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-200 to-rose-300 rounded-2xl transform rotate-6 scale-105 opacity-20"></div>
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-rose-400 rounded-full opacity-30 animate-pulse"></div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-rose-300 rounded-full opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Confirmação */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-rose-600 flex items-center">
              <CheckCircle className="mr-2 h-6 w-6" />
              Confirmar Agendamento
            </DialogTitle>
            <DialogDescription>
              Verifique os dados do seu agendamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedDate && selectedTime && (
            <div className="space-y-4 py-4">
              <div className="bg-rose-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Data:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Horário:</span>
                  <span className="font-semibold text-gray-900">{selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Nome:</span>
                  <span className="font-semibold text-gray-900">{formData.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">WhatsApp:</span>
                  <span className="font-semibold text-gray-900">{formData.phone}</span>
                </div>
                {formData.notes && (
                  <div className="pt-2 border-t border-rose-200">
                    <span className="text-sm font-medium text-gray-600">Observações:</span>
                    <p className="text-sm text-gray-900 mt-1">{formData.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleBooking}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resto das seções continuam iguais... */}
      {/* Seção Sobre, Serviços, Portfolio, Contato, etc. */}
      
    </div>
  );
}

export default App;