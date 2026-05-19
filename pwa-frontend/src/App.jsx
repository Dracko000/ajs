import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, Home, School, Navigation, Menu, User, MapPin, X, 
  ShieldCheck, Clock, CheckCircle, Plus, CreditCard, History, Baby, Calendar,
  Phone, MessageSquare, Star, ArrowRight, Map as MapIcon, LogOut, Mail, Lock, UserPlus
} from 'lucide-react';
import L from 'leaflet';
import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
let OjekIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/71/71422.png', iconSize: [40, 40], iconAnchor: [20, 20] });
L.Marker.prototype.options.icon = DefaultIcon;

const API_BASE = "http://localhost:8000/api";

function ChangeView({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, zoom); }, [center, map]);
  return null;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authScreen, setAuthScreen] = useState('login'); // login, register
  const [activeTab, setActiveTab] = useState('home'); 
  const [position, setPosition] = useState([-6.200000, 106.816666]);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState(null);
  const [user, setUser] = useState(null);

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        setIsLoggedIn(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Setup Echo
        const echo = new Echo({
          broadcaster: 'reverb',
          key: 'qakimjurmp1nkxigllzn',
          wsHost: 'localhost',
          wsPort: 8080,
          forceTLS: false,
          enabledTransports: ['ws', 'wss'],
          auth: {
            headers: { Authorization: `Bearer ${token}` }
          }
        });

        // Listen for status updates
        echo.private(`App.Models.User.1`) // Simulation: Use real user ID in production
          .listen('.trip.updated', (data) => {
            if (data.status === 'picked_up') {
              setActiveTrip(prev => ({ ...prev, status: 'picked_up', studentName: data.studentName }));
            } else if (data.status === 'arrived') {
              setActiveTrip(null);
            }
          });

        // Listen for live location on private tracking channel
        echo.private(`tracking.1`) // Simulation: Use real parent ID
          .listen('.location.updated', (data) => {
            setActiveTrip(prev => {
              if (!prev || prev.status !== 'picked_up') return prev;
              return { ...prev, lat: data.latitude, lon: data.longitude };
            });
          });
    }
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      }, () => setLoading(false));
    } else setLoading(false);
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post(`${API_BASE}/login`, { email, password });
        localStorage.setItem('token', res.data.access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
        setUser(res.data.user);
        setIsLoggedIn(true);
    } catch (e) { alert("Login gagal. Periksa kembali email dan password."); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post(`${API_BASE}/register`, { name, email, password, role: 'parent' });
        alert("Registrasi Berhasil! Silakan masuk.");
        setAuthScreen('login');
    } catch (e) { alert("Registrasi gagal."); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white text-ajs">
       <div className="w-16 h-16 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // --- AUTH SCREENS ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
         <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-gray-100">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-black text-ajs italic tracking-tighter">AJS</h1>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Antar Jemput Siswa</p>
            </div>

            {authScreen === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Masuk ke Akun</h2>
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="email" required placeholder="Alamat Email" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-ajs" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="password" required placeholder="Kata Sandi" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-ajs" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-ajs text-white py-4 rounded-2xl font-black shadow-lg shadow-ajs/30 italic tracking-tighter">MASUK SEKARANG</button>
                    <p className="text-center text-xs font-bold text-gray-400">
                        Belum punya akun? <span onClick={() => setAuthScreen('register')} className="text-ajs cursor-pointer">Daftar di sini</span>
                    </p>
                </form>
            ) : (
                <form onSubmit={handleRegister} className="space-y-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight italic">Buat Akun Baru</h2>
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="text" required placeholder="Nama Lengkap" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-ajs" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="email" required placeholder="Email" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-ajs" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input type="password" required placeholder="Kata Sandi" className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 pl-12 font-bold outline-none focus:border-ajs" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-ajs text-white py-4 rounded-2xl font-black shadow-lg shadow-ajs/30 italic tracking-tighter">DAFTAR AKUN</button>
                    <p className="text-center text-xs font-bold text-gray-400">
                        Sudah punya akun? <span onClick={() => setAuthScreen('login')} className="text-ajs cursor-pointer">Masuk ke sini</span>
                    </p>
                </form>
            )}
         </div>
      </div>
    );
  }

  // --- MAIN APP VIEW ---
  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 relative overflow-y-auto">
        {activeTab === 'home' && (
          <div className="h-full w-full relative">
            <MapContainer center={position} zoom={15} zoomControl={false} className="h-full w-full z-0 transition-all">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={position} />
            </MapContainer>
            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
               <div className="bg-ajs text-white px-6 py-2 rounded-full shadow-xl font-black italic tracking-tighter">AJS</div>
               <button onClick={handleLogout} className="bg-white p-2 rounded-full shadow-md text-gray-400"><LogOut size={20}/></button>
            </div>
            {/* ... Rest of home/map logic remains same as previous ... */}
          </div>
        )}
        {/* ... Tab content ... */}
      </div>

      <nav className="bg-white border-t border-gray-100 h-20 flex justify-around items-center px-4 pb-2 z-50 shrink-0">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-ajs' : 'text-gray-400'}`}>
          <MapIcon size={22} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Peta</span>
        </button>
        {/* ... Nav items ... */}
      </nav>
    </div>
  );
}

export default App;
