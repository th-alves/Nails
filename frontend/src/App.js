import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Phone, MapPin, Instagram, Star, Heart, Sparkles, Award, Users, CheckCircle, Quote, ArrowRight, Palette, X } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Calendar as CalendarComponent } from './components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Textarea } from './components/ui/textarea';
import { toast } from 'sonner';
import kamile from "./images/kamile.png";
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Dados dos testimoniais
const testimonials = [
  {
    id: 1,
    name: "Maria Silva",
    text: "Kamile é incrível! Sempre saio de lá com as unhas perfeitas. Atendimento excepcional e um trabalho impecável.",
    rating: 5,
    service: "Manicure Clássica"
  },
  {
    id: 2,
    name: "Ana Costa",
    text: "Profissional super dedicada e talentosa. As nail arts que ela faz são verdadeiras obras de arte!",
    rating: 5,
    service: "Nail Art"
  },
  {
    id: 3,
    name: "Julia Santos",
    text: "Encontrei na Kamile não apenas uma profissional competente, mas uma pessoa que realmente se importa com o cliente.",
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
    title: "Arte Geométrica",
    image: "https://images.unsplash.com/photo-1571290274554-6a2eaa771e5f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxuYWlsJTIwYXJ0fGVufDB8fHx8MTc1NTQ2NjU5OXww&ixlib=rb-4.1.0&q=85",
    description: "Padrões geométricos coloridos"
  },
  {
    id: 3,
    title: "Esmaltes Premium",
    image: "https://images.unsplash.com/photo-1619607146034-5a05296c8f9a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwzfHxuYWlsJTIwYXJ0fGVufDB8fHx8MTc1NTQ2NjU5OXww&ixlib=rb-4.1.0&q=85",
    description: "Variedade de cores de alta qualidade"
  },
  {
    id: 4,
    title: "Design Exclusivo",
    image: "https://images.pexels.com/photos/887352/pexels-photo-887352.jpeg",
    description: "Nail art personalizada única"
  }
];

function App() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // Função para encontrar a próxima segunda-feira disponível
  const getNextAvailableWeek = () => {
    const today = new Date();
    const currentDay = today.getDay();
    
    // Se estamos na segunda metade da semana (quinta-domingo), vá para próxima segunda
    // Se estamos na primeira metade (segunda-quarta), fique na semana atual
    let targetDate = new Date(today);
    
    if (currentDay === 0) { // Domingo
      targetDate.setDate(today.getDate() + 1); // Próxima segunda
    } else if (currentDay >= 4) { // Quinta a sábado
      const daysToMonday = 8 - currentDay;
      targetDate.setDate(today.getDate() + daysToMonday);
    } else { // Segunda a quarta
      // Se já passou da metade do dia, vá para próxima semana
      const hour = today.getHours();
      if (hour >= 14) { // Depois das 14h
        const daysToMonday = 8 - currentDay;
        targetDate.setDate(today.getDate() + daysToMonday);
      }
      // Caso contrário, fica na semana atual
    }
    
    return targetDate;
  };

  // Verificar se uma data está disponível (não é fim de semana nem feriado)
  const isDateAvailable = (date) => {
    if (!date) return false;
    
    const day = date.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0); // Reset time to start of day

    // Must be weekday (Monday-Friday: 1-5) and not in the past
    return day >= 1 && day <= 5 && dateToCheck >= today;
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
      const response = await axios.get(`${API_BASE_URL}/api/available-slots`, {
        params: { date: date.toISOString().split('T')[0] }
      });
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Erro ao buscar horários disponíveis:', error);
      
      // Mostrar erro específico ao usuário
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
          } else {
            toast.error('❌ Erro ao carregar horários. Tente novamente.');
            setAvailableSlots([]);
          }
        } else {
          toast.error('❌ Erro ao carregar horários disponíveis.');
          setAvailableSlots([]);
        }
      } else {
        toast.error('❌ Erro de conexão ao carregar horários.');
        setAvailableSlots([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fazer agendamento
  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !formData.name || !formData.phone) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

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
      const message = `Olá! Acabei de agendar um horário para manicure:\n\nData: ${selectedDate.toLocaleDateString('pt-BR')}\nHorário: ${selectedTime}\nNome: ${formData.name}\nTelefone: ${formData.phone}`;
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
        const message = error.response.data?.detail || 'Erro desconhecido';
        
        if (status === 409) {
          toast.error('❌ Este horário já foi agendado por outra cliente. Por favor, escolha outro horário.');
        } else if (status === 400) {
          if (message.includes('weekend') || message.includes('weekends')) {
            toast.error('❌ Não atendemos nos finais de semana. Escolha um dia de segunda à sexta.');
          } else if (message.includes('past') || message.includes('passado')) {
            toast.error('❌ Não é possível agendar em datas passadas. Escolha uma data futura.');
          } else {
            toast.error(`❌ Dados inválidos: ${message}`);
          }
        } else if (status === 422) {
          toast.error('❌ Por favor, verifique se todos os dados estão corretos (nome, telefone, etc.).');
        } else {
          toast.error(`❌ Erro no servidor. Tente novamente em alguns instantes.`);
        }
      } else if (error.request) {
        toast.error('❌ Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        toast.error('❌ Erro inesperado. Recarregue a página e tente novamente.');
      }
    } finally {
      setIsLoading(false);
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
      <header className="glass sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2 animate-slideInLeft">
              <Sparkles className="h-8 w-8 text-rose-500 animate-float" />
              <span className="text-2xl font-bold gradient-text">
                Kamile Nails
              </span>
            </div>
            <nav className="hidden md:flex space-x-8 animate-fadeInUp">
              <a href="#inicio" className="text-gray-700 hover:text-rose-500 transition-colors hover-lift">Início</a>
              <a href="#sobre" className="text-gray-700 hover:text-rose-500 transition-colors hover-lift">Sobre</a>
              <a href="#servicos" className="text-gray-700 hover:text-rose-500 transition-colors hover-lift">Serviços</a>
              <a href="#portfolio" className="text-gray-700 hover:text-rose-500 transition-colors hover-lift">Portfolio</a>
              <a href="#agendamento" className="text-gray-700 hover:text-rose-500 transition-colors hover-lift">Agendamento</a>
              <a href="#contato" className="text-gray-700 hover:text-rose-500 transition-colors hover-lift">Contato</a>
            </nav>
            
            <div className="flex items-center space-x-3">
              {/* Menu mobile - botão hamburger */}
              <div className="md:hidden relative">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-lg w-10 h-10 shadow-lg hover:from-rose-500 hover:to-pink-500 transition-all duration-300 focus:ring-2 focus:ring-rose-300 focus:outline-none flex items-center justify-center"
                  title="Menu de navegação"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
              </div>
              
              {/* WhatsApp button - apenas ícone */}
              <Button 
                onClick={openWhatsApp} 
                className="bg-green-500 hover:bg-green-600 animate-slideInRight hover-scale w-10 h-10 p-0 rounded-lg shadow-lg transition-all duration-300"
                title="Falar no WhatsApp"
              >
                <Phone className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Modal Menu Mobile */}
            {isMobileMenuOpen && (
              <div className="fixed inset-0 z-50 md:hidden">
                {/* Backdrop opaco */}
                <div 
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setIsMobileMenuOpen(false)}
                ></div>
                
                {/* Modal centralizado */}
                <div className="flex items-center justify-center min-h-screen p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all animate-fadeInUp">
                    {/* Header do modal */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900">Menu de Navegação</h3>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    
                    {/* Menu items */}
                    <div className="p-4">
                      {[
                        { id: 'inicio', label: 'Início', icon: '🏠' },
                        { id: 'sobre', label: 'Sobre', icon: '👩‍💼' },
                        { id: 'servicos', label: 'Serviços', icon: '✨' },
                        { id: 'portfolio', label: 'Portfolio', icon: '🎨' },
                        { id: 'agendamento', label: 'Agendamento', icon: '📅' },
                        { id: 'contato', label: 'Contato', icon: '📞' }
                      ].map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center space-x-4 p-4 text-left hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 rounded-xl transition-all duration-200 group"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <span className="text-gray-700 group-hover:text-rose-600 font-medium transition-colors">
                            {item.label}
                          </span>
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-rose-500 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                          </svg>
                        </button>
                      ))}
                    </div>
                    
                    {/* Footer do modal */}
                    <div className="p-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          openWhatsApp();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <Phone className="w-5 h-5" />
                        <span>Falar no WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
          <div className="absolute inset-0 gradient-bg"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <Badge className="mb-4 bg-rose-100 text-rose-700 border-rose-200 animate-fadeInUp hover-scale">
              Especialista em Manicure
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 animate-fadeInUp">
              Suas unhas
              <span className="block gradient-text animate-pulse-gentle">
                perfeitas
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 animate-fadeInUp">
              Transformo suas unhas em verdadeiras obras de arte. Atendimento personalizado
              com produtos de alta qualidade em um ambiente acolhedor e profissional.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fadeInUp">
            <Button
              size="lg"
              onClick={() => document.getElementById('agendamento').scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 text-white px-8 py-3 hover-lift"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Agendar Horário
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={openWhatsApp}
              className="border-rose-300 text-rose-600 hover:bg-rose-50 px-8 py-3 hover-lift"
            >
              <Phone className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Falar no </span>WhatsApp
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center animate-slideInLeft hover-lift">
              <div className="text-3xl font-bold text-rose-500 mb-2 animate-pulse-gentle">2+ Anos</div>
              <div className="text-gray-600">de Experiência</div>
            </div>
            <div className="text-center animate-fadeInUp hover-lift">
              <div className="text-3xl font-bold text-pink-500 mb-2 animate-pulse-gentle">1000+</div>
              <div className="text-gray-600">Clientes Satisfeitas</div>
            </div>
            <div className="text-center animate-slideInRight hover-lift">
              <div className="text-3xl font-bold text-blue-400 mb-2 animate-pulse-gentle">100%</div>
              <div className="text-gray-600">Dedicação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Sobre Mim */}
      <section id="sobre" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slideInLeft">
              <div className="relative">
                <img src={kamile} alt="Kamile trabalhando" className="w-full h-96 object-cover rounded-2xl shadow-2xl hover-scale" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
              </div>
            </div>

            <div className="animate-slideInRight">
              <Badge className="mb-4 bg-rose-100 text-rose-700 border-rose-200">
                <Award className="w-4 h-4 mr-2" />
                Profissional Certificada
              </Badge>

              <h2 className="text-4xl font-bold text-gray-900 mb-6 gradient-text">
                Um pouco sobre mim
              </h2>

              <p className="text-lg text-gray-600 mb-6">
                Sou manicure profissional há mais de 2 anos, especializada em nail art e
                técnicas modernas de cuidado com as unhas. Minha paixão é transformar as
                unhas das minhas clientes em verdadeiras obras de arte.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Formação em Podologia e Manicure</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Especialização em Nail Art</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Mais de 1000 clientes atendidas</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Produtos de alta qualidade</span>
                </div>
              </div>

              <Button
                onClick={() => document.getElementById('agendamento').scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 hover-lift"
              >
                Vem ser minha cliente!
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio */}
      <section id="portfolio" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <Badge className="mb-4 bg-rose-100 text-rose-700 border-rose-200">
              <Palette className="w-4 h-4 mr-2" />
              Trabalhos Realizados
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 gradient-text">
              Portfolio de Nail Art
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Confira alguns dos trabalhos exclusivos que já realizei para minhas clientes
            </p>
          </div>

          <div className="auto-grid">
            {portfolioWorks.map((work, index) => (
              <Card
                key={work.id}
                className={`hover-lift group border-0 shadow-lg overflow-hidden animate-fadeInUp`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={work.image}
                    alt={work.title}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="font-semibold text-lg">{work.title}</h3>
                    <p className="text-sm">{work.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12 animate-fadeInUp">
            <Button
              onClick={openWhatsApp}
              variant="outline"
              className="border-rose-300 text-rose-600 hover:bg-rose-50 hover-lift"
            >
              <span className="hidden sm:inline">Ver Mais Trabalhos no </span>
              <Instagram className="w-4 h-4 sm:ml-2" />
              <span className="sm:hidden">Instagram</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 gradient-text">
              Serviços Especializados
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
              Ofereço serviços completos de manicure com técnicas modernas e produtos de qualidade premium
            </p>

            {/* Gallery Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="relative group animate-slideInLeft">
                <img
                  src="https://images.unsplash.com/photo-1632345031435-8727f6897d53"
                  alt="Serviço profissional de manicure"
                  className="w-full h-64 object-cover rounded-lg shadow-lg hover-lift"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-lg font-semibold">Atendimento Profissional</h3>
                  <p className="text-sm opacity-90">Cuidado dedicado e personalizado</p>
                </div>
              </div>

              <div className="relative group animate-slideInRight">
                <img
                  src="https://images.pexels.com/photos/6724357/pexels-photo-6724357.jpeg"
                  alt="Ambiente profissional"
                  className="w-full h-64 object-cover rounded-lg shadow-lg hover-lift"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-lg font-semibold">Ambiente Acolhedor</h3>
                  <p className="text-sm opacity-90">Espaço confortável e relaxante</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover-lift transition-all duration-300 border-rose-100 animate-fadeInUp">
              <CardHeader>
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4 animate-float">
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

            <Card className="hover-lift transition-all duration-300 border-pink-100 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 animate-float" style={{ animationDelay: '0.5s' }}>
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

            <Card className="hover-lift transition-all duration-300 border-blue-100 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 animate-float" style={{ animationDelay: '1s' }}>
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

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <Badge className="mb-4 bg-rose-100 text-rose-700 border-rose-200">
              <Users className="w-4 h-4 mr-2" />
              Depoimentos
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4 gradient-text">
              O que dizem minhas clientes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Feedbacks reais de quem já experimentou meus serviços
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.id}
                className={`hover-lift border-0 shadow-lg animate-fadeInUp`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardContent className="p-6">
                  <Quote className="w-8 h-8 text-rose-400 mb-4" />
                  <p className="text-gray-700 mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.service}</div>
                    </div>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Agendamento */}
      <section id="agendamento" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 gradient-text">
              Agende seu Horário
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o melhor dia e horário para cuidar das suas unhas
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Calendário */}
            <div className="space-y-6 animate-slideInLeft">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Escolha uma data</h3>
                
                {/* Aviso sobre disponibilidade */}
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-rose-700">
                    <strong>💡 Dica:</strong> Atendemos apenas nos dias úteis (segunda à sexta). 
                    Use as setas do calendário para navegar até encontrar datas disponíveis.
                    Se não vir datas clicáveis, navegue para o próximo mês.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-3 md:p-6 hover-lift relative">
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                      <div className="loading-dots text-rose-500">Carregando</div>
                    </div>
                  )}
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => !isDateAvailable(date)}
                    defaultMonth={getNextAvailableWeek()}
                    className="w-full mx-auto max-w-sm md:max-w-none"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  * Atendemos de <strong>segunda à sexta</strong>, das 8h às 18h<br/>
                  <span className="text-rose-600">Use as setas para navegar para próximas semanas</span>
                </p>
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
            </div>

            {/* Formulário de agendamento */}
            <div className="space-y-6 animate-slideInRight">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Seus dados</h3>
                <div className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4 hover-lift">
                  <div>
                    <Label htmlFor="name">Nome completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Digite seu nome"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">WhatsApp *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        // Formatação básica de telefone
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          if (value.length > 6) {
                            value = value.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
                          } else if (value.length > 2) {
                            value = value.replace(/(\d{2})(\d+)/, '($1) $2');
                          }
                        }
                        setFormData({ ...formData, phone: value });
                      }}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Alguma preferência especial?"
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {selectedDate && selectedTime && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 animate-fadeInUp">
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
                    className="w-full bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500 hover-lift"
                    disabled={!selectedDate || !selectedTime || !formData.name || !formData.phone || isLoading}
                  >
                    {isLoading ? (
                      <span className="loading-dots">Agendando</span>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4 mr-2" />
                        Confirmar Agendamento
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 gradient-text animate-fadeInUp">
            Entre em Contato
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover-lift transition-all duration-300 animate-slideInLeft">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 animate-float">
                  <Phone className="w-6 h-6 text-green-500" />
                </div>
                <CardTitle>WhatsApp</CardTitle>
                <CardDescription>Fale comigo diretamente</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">(11) 96306-5438</p>
                <Button onClick={openWhatsApp} className="bg-green-500 hover:bg-green-600 hover-scale">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Enviar </span>Mensagem
                </Button>
              </CardContent>
            </Card>

            <Card className="hover-lift transition-all duration-300 animate-slideInRight">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 animate-float" style={{ animationDelay: '0.5s' }}>
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
          <div className="flex items-center justify-center space-x-2 mb-6 animate-fadeInUp">
            <Sparkles className="h-8 w-8 text-rose-400 animate-float" />
            <span className="text-2xl font-bold">Kamile Nails</span>
          </div>

          <p className="text-gray-400 mb-6 animate-fadeInUp">
            Transformando suas unhas em verdadeiras obras de arte desde 2019
          </p>

          <div className="flex justify-center space-x-6 mb-6 animate-fadeInUp">
            <Button
              variant="ghost"
              size="sm"
              onClick={openWhatsApp}
              className="text-gray-400 hover:text-white hover-scale"
            >
              <Phone className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          </div>

          <div className="border-t border-gray-800 pt-6 animate-fadeInUp">
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