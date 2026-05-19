import React, { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  LayoutDashboard, Calendar, Wallet, Power, LogOut, Mail, Lock, Clock, MapPin, 
  ChevronRight, CheckCircle2, ShieldCheck, UserMinus, X
} from 'lucide-react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import toast, { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

window.Pusher = Pusher;

// --- CONFIG & ICONS ---
const API_BASE = "http://localhost:8000/api";
const BlueIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const RedIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

function MapController({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.panTo(center); }, [center]);
  return null;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [driverPos, setDriverPos] = useState([-6.23, 106.82]);
  const [isOnline, setIsOnline] = useState(false);
  const [globalPois, setGlobalPois] = useState([]);
  const [manifest, setManifest] = useState([]);
  const [incomingOrder, setIncomingOrder] = useState(null);

  useEffect(() => {
    fetchGlobalPois();
    const token = localStorage.getItem('driver_token');
    const savedUserId = localStorage.getItem('driver_user_id');

    if (token) {
      setIsLoggedIn(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchData();
      if (savedUserId) setupEcho(token, savedUserId);
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => { 
            const newPos = [p.coords.latitude, p.coords.longitude];
            setDriverPos(newPos); 
            setLoading(false); 
        },
        () => { setLoading(false); }
      );
    } else { setLoading(false); }
  }, []);

  // Continuous Location Update when Online
  useEffect(() => {
    let interval;
    if (isOnline && isLoggedIn) {
        interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition((p) => {
                const lat = p.coords.latitude;
                const lng = p.coords.longitude;
                setDriverPos([lat, lng]);
                axios.post(`${API_BASE}/driver/location`, { latitude: lat, longitude: lng }).catch(e => {});
            });
        }, 5000); 
    }
    return () => clearInterval(interval);
  }, [isOnline, isLoggedIn]);

  const toggleOnline = async () => {
    const nextStatus = !isOnline;
    const l = toast.loading(nextStatus ? 'Mengaktifkan Driver...' : 'Menonaktifkan...');
    try {
        await axios.post(`${API_BASE}/driver/status`, { is_online: nextStatus });
        setIsOnline(nextStatus);
        toast.success(nextStatus ? 'Status: ONLINE' : 'Status: OFFLINE', { id: l });
    } catch (e) { toast.error("Gagal ubah status", { id: l }); }
  };

  const setupEcho = (token, userId) => {
    const echo = new Echo({
      broadcaster: 'reverb', 
      key: 'qakimjurmp1nkxigllzn', 
      wsHost: '127.0.0.1', 
      wsPort: 8080, 
      forceTLS: false, 
      enabledTransports: ['ws'],
      encrypted: false,
      authEndpoint: 'http://localhost:8000/broadcasting/auth',
      auth: { headers: { Authorization: `Bearer ${token}` } }
    });

    // 1. Radar (Public)
    echo.channel('drivers').listen('.order.new', (data) => {
        console.log("RADAR: Order detected:", data);
        setIncomingOrder(data.order);
        toast("Tugas baru terdeteksi!", { icon: '🔔' });
    });

    // 2. Private Targeted (Specific to this Driver)
    // Remove the dot '.' before order.new if using broadcastAs exactly
    echo.private(`App.Models.User.${userId}`).listen('.order.new', (data) => {
        console.log("PRIVATE: Targeted order received:", data);
        setIncomingOrder(data.order);
        toast("Tugas Jemput (3KM) Masuk!", { icon: '🎯', duration: 10000 });
    });
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/driver/manifest`);
      setManifest(res.data);
    } catch (e) { }
  };

  const fetchGlobalPois = async () => {
    try {
        const res = await axios.get(`${API_BASE}/pois/search?q=`);
        setGlobalPois(res.data);
    } catch (e) { }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const l = toast.loading('Masuk...');
    try {
      const res = await axios.post(`${API_BASE}/login`, { email, password });
      const userData = res.data.user;
      localStorage.setItem('driver_token', res.data.access_token);
      localStorage.setItem('driver_user_id', userData.id);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
      setIsLoggedIn(true);
      setupEcho(res.data.access_token, userData.id);
      fetchData();
      toast.success("Berhasil Masuk", { id: l });
    } catch (e) { toast.error("Gagal", { id: l }); }
  };

  const handleAcceptOrder = async (orderId) => {
    const l = toast.loading('Menerima...');
    try {
        await axios.post(`${API_BASE}/orders/${orderId}/accept`);
        toast.success("Diterima!", { id: l });
        setIncomingOrder(null);
        setActiveTab('manifest');
        fetchData();
    } catch (e) { toast.error("Gagal", { id: l }); }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-black text-ajs animate-pulse text-xl">AJS DRIVER LOADING...</div>;

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 font-sans">
      <Toaster position="top-center" />
      <div className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-2xl">
        <h1 className="text-5xl font-black text-ajs italic tracking-tighter text-center mb-10 leading-none">AJS</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="email" placeholder="Email" required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-ajs text-white py-5 rounded-2xl font-black shadow-lg uppercase italic tracking-tighter">Masuk Tugas</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      <Toaster position="top-center" />
      <div className="flex-1 overflow-y-auto relative">
        {activeTab === 'home' && (
          <div className="h-full w-full relative">
            <MapContainer center={driverPos} zoom={15} zoomControl={false} className="h-full w-full z-0 transition-all">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController center={driverPos} />
                <Marker position={driverPos} icon={BlueIcon} />
                {globalPois.map(p => (<Marker key={p.id} position={[p.lat, p.lon]} icon={RedIcon}><Popup>{p.name}</Popup></Marker>))}
            </MapContainer>
            <div className="absolute top-6 left-4 right-4 z-10 flex justify-between items-center bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white">
                <div className="flex items-center space-x-3">
                   <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                   <span className="font-black italic text-sm uppercase tracking-tighter leading-none">{isOnline ? 'Siap Jemput' : 'Offline'}</span>
                </div>
                <button onClick={toggleOnline} className={`p-3 rounded-2xl transition-all ${isOnline ? 'bg-red-50 text-red-500' : 'bg-ajs text-white shadow-lg'}`}><Power size={20}/></button>
            </div>
          </div>
        )}

        {activeTab === 'manifest' && (
          <div className="p-8 pb-28">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-8 underline decoration-ajs decoration-4 leading-none">Jadwal Tugas</h2>
            <div className="space-y-6">
                {manifest.map(m => (
                    <div key={m.id} className={`bg-white p-6 rounded-[32px] border-2 border-gray-100`}>
                        <div className="flex justify-between items-center mb-4 leading-none">
                            <p className="font-black text-ajs italic text-xs uppercase">{m.scheduled_at.substring(0,5)}</p>
                            <span className="text-[8px] font-black uppercase px-3 py-1 rounded-full bg-gray-100">{m.status}</span>
                        </div>
                        <p className="font-black text-xl leading-tight">{m.student.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest leading-none">{m.type}</p>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <nav className="bg-white border-t border-gray-100 h-24 flex justify-around items-center px-6 pb-4 shrink-0">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-ajs' : 'text-gray-300'}`}><LayoutDashboard size={24}/><span className="text-[9px] font-black uppercase">Peta</span></button>
        <button onClick={() => setActiveTab('manifest')} className={`flex flex-col items-center space-y-1 ${activeTab === 'manifest' ? 'text-ajs' : 'text-gray-300'}`}><Calendar size={24}/><span className="text-[9px] font-black uppercase">Jadwal</span></button>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex flex-col items-center space-y-1 text-red-400"><LogOut size={24}/><span className="text-[9px] font-black uppercase tracking-tighter">Logout</span></button>
      </nav>

      {incomingOrder && isOnline && (
        <div className="absolute inset-0 z-[2000] bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm">
            <div className="bg-white w-full rounded-[40px] p-10 text-center shadow-2xl scale-in animate-in zoom-in">
                <Clock className="mx-auto text-ajs mb-6 animate-bounce" size={48} />
                <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-6 leading-none">Tugas Jemput Baru!</h3>
                <div className="bg-gray-50 p-6 rounded-3xl text-left border border-gray-100 mb-8">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Lokasi Jemput</p>
                    <p className="font-bold text-sm mt-1 leading-none">{incomingOrder.pickup_address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setIncomingOrder(null)} className="py-4 font-black text-gray-400 uppercase text-[10px] tracking-widest leading-none">Abaikan</button>
                    <button onClick={() => handleAcceptOrder(incomingOrder.id)} className="bg-ajs text-white py-4 rounded-2xl font-black shadow-lg italic uppercase text-[10px] tracking-widest leading-none active:scale-95 transition-all">Terima Order</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
