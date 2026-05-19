import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
  Search, Map as MapIcon, CreditCard, Baby, LogOut, ShieldCheck, 
  School, MapPin, X, CheckCircle, Bike, ArrowRight, Loader2
} from 'lucide-react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import toast, { Toaster } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

window.Pusher = Pusher;

// --- CONFIG & STABLE ICONS ---
const API_BASE = "http://localhost:8000/api";
const BlueIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const RedIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const OjekIcon = L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/71/71422.png', iconSize: [40, 40], iconAnchor: [20, 20] });

L.Marker.prototype.options.icon = BlueIcon;

function MapController({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, zoom); }, [center, zoom]);
  return null;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState([-6.2, 106.81]);
  
  const [authScreen, setAuthScreen] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [globalPois, setGlobalPois] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [walletData, setWalletData] = useState({ balance: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [targetPos, setTargetPos] = useState(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchGlobalPois();
    const token = localStorage.getItem('token');
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        checkAuth(token);
    } else {
        setLoading(false);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setPosition([p.coords.latitude, p.coords.longitude]),
        () => {}, { timeout: 10000 }
      );
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      const res = await axios.get(`${API_BASE}/user`);
      setUser(res.data);
      setIsLoggedIn(true);
      setupEcho(token, res.data.id);
      fetchWallet();
    } catch (e) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalPois = async () => {
    try {
      const res = await axios.get(`${API_BASE}/pois/search?q=`);
      setGlobalPois(Array.isArray(res.data) ? res.data : []);
    } catch (e) { }
  };

  const fetchWallet = async () => {
    try {
      const res = await axios.get(`${API_BASE}/wallet`);
      setWalletData(res.data);
    } catch (e) { }
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

    echo.private(`App.Models.User.${userId}`)
      .listen('.order.updated', (data) => {
          if (data.order.status === 'accepted') {
              setActiveTrip({ driverId: data.order.driver_id, driverName: data.order.driver.user.name, status: 'accepted' });
              toast.success(`Driver Ditemukan: ${data.order.driver.user.name}`, { duration: 10000 });
          }
      })
      .listen('.trip.updated', (data) => {
        if (data.status === 'picked_up') {
          setActiveTrip(prev => ({ ...prev, status: 'picked_up', studentName: data.studentName }));
          toast.success("Anak Anda telah dijemput!");
        } else if (data.status === 'arrived') {
          setActiveTrip(null);
          toast.success("Anak Anda sudah sampai tujuan!", { duration: 10000 });
        }
      });

    echo.private(`tracking.${userId}`).listen('.location.updated', (data) => {
        setActiveTrip(prev => {
          if (!prev) return null;
          return { ...prev, lat: data.latitude, lon: data.longitude };
        });
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const l = toast.loading('Masuk...');
    try {
      const res = await axios.post(`${API_BASE}/login`, { email, password });
      localStorage.setItem('token', res.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
      setUser(res.data.user);
      setIsLoggedIn(true);
      setupEcho(res.data.access_token, res.data.user.id);
      fetchWallet();
      toast.success(`Halo, ${res.data.user.name}!`, { id: l });
    } catch (e) { toast.error("Email/Password salah", { id: l }); }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length < 3) { setSearchResults([]); setIsSearching(false); return; }
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setIsSearching(true);

    searchTimeout.current = setTimeout(async () => {
      try {
        const iRes = await axios.get(`${API_BASE}/pois/search?q=${encodeURIComponent(query)}`);
        // Focus near Cikampek/Karawang for better suggestions
        const oRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&viewbox=107.39,-6.47,107.51,-6.33&limit=5`);
        const oData = await oRes.json();
        setSearchResults([...(iRes.data || []), ...oData]);
      } catch (e) { } finally { setIsSearching(false); }
    }, 600);
  };

  const handleBooking = async () => {
    if (!targetPos) return;
    const l = toast.loading('Memesan AJS...');
    try {
        const res = await axios.post(`${API_BASE}/orders`, {
            pickup_lat: position[0], pickup_lng: position[1],
            dropoff_lat: targetPos[0], dropoff_lng: targetPos[1],
            pickup_address: "Lokasi Penjemputan", dropoff_address: searchQuery
        });
        setActiveTrip({ id: res.data.order.id, status: 'searching' });
        toast.success("Mencari Driver Terdekat...", { id: l });
    } catch (e) { toast.error("Gagal", { id: l }); }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-black text-ajs uppercase animate-pulse">AJS LOADING...</div>;

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8 font-sans">
      <Toaster position="top-center" />
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl">
        <h1 className="text-5xl font-black text-ajs italic tracking-tighter text-center mb-10">AJS</h1>
        {authScreen === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" placeholder="Email" required className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold focus:border-ajs" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold focus:border-ajs" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full bg-ajs text-white py-5 rounded-2xl font-black shadow-lg shadow-ajs/30 uppercase italic tracking-tighter">Login Sekarang</button>
          </form>
        ) : (
          <div className="text-center py-10 opacity-30 italic font-bold">Registrasi dinonaktifkan sementara.</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gray-50 flex flex-col font-sans text-gray-900">
      <Toaster position="top-center" />
      <div className="flex-1 relative overflow-y-auto">
        {activeTab === 'home' && (
          <div className="h-full w-full relative">
            <MapContainer center={activeTrip?.lat ? [activeTrip.lat, activeTrip.lon] : position} zoom={15} zoomControl={false} className="h-full w-full z-0 transition-all">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapController center={activeTrip?.lat ? [activeTrip.lat, activeTrip.lon] : position} zoom={activeTrip?.lat ? 17 : 15} />
              <Marker position={position} icon={BlueIcon} />
              {globalPois.map(p => (
                <Marker 
                    key={p.id} position={[p.lat, p.lon]} icon={RedIcon}
                    eventHandlers={{ click: () => { setTargetPos([parseFloat(p.lat), parseFloat(p.lon)]); setSearchQuery(p.name); toast(`Tujuan: ${p.name}`, { icon: '🏫' }); } }}
                ><Popup>{p.name}</Popup></Marker>
              ))}
              {activeTrip?.lat && <Marker position={[activeTrip.lat, activeTrip.lon]} icon={OjekIcon} />}
              {targetPos && !activeTrip && <Marker position={targetPos} icon={RedIcon} />}
            </MapContainer>

            {activeTrip?.status === 'searching' && (
                <div className="absolute inset-0 z-[1500] bg-black/70 flex flex-col items-center justify-center backdrop-blur-md">
                    <Bike className="text-ajs animate-bounce mb-4" size={64} />
                    <h2 className="text-2xl font-black text-white italic uppercase mb-2">Mencari Driver...</h2>
                    <p className="text-gray-400 font-bold text-[10px] uppercase">Radius 3KM Cikampek</p>
                    <button onClick={() => setActiveTrip(null)} className="mt-12 text-white/30 font-black text-[10px] uppercase border border-white/20 px-6 py-2 rounded-full">Batalkan</button>
                </div>
            )}

            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
               <div className="bg-ajs text-white px-6 py-2 rounded-full shadow-xl font-black italic tracking-tighter leading-none">AJS</div>
               <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-white p-2 rounded-full shadow-md text-gray-400"><LogOut size={20}/></button>
            </div>

            {!activeTrip && (
              <div className={`absolute bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-8 transition-all duration-300 h-auto`} onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
                <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-[28px] p-5 mb-4 focus-within:border-ajs focus-within:bg-white transition-all relative">
                  <Search className="w-6 h-6 text-ajs mr-3" />
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => handleSearch(e.target.value)} 
                    placeholder="Cari sekolah atau lokasi..." 
                    className="bg-transparent border-none outline-none w-full font-black text-lg placeholder:text-gray-300" 
                  />
                  {isSearching && <Loader2 className="w-5 h-5 text-ajs animate-spin ml-2" />}
                </div>

                {/* SUGGESTION LIST DROPDOWN STYLE */}
                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 mb-3">Hasil Sugesti</p>
                    {searchResults.map((r, i) => (
                      <div key={i} onClick={() => { setTargetPos([parseFloat(r.lat), parseFloat(r.lon)]); setSearchResults([]); setSearchQuery(r.name || r.display_name.split(',')[0]); }} className="p-5 bg-gray-50 rounded-[24px] flex items-center cursor-pointer hover:bg-ajs/5 hover:border-ajs/20 border-2 border-transparent transition-all active:scale-[0.98]">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${r.is_custom ? 'bg-ajs/10 text-ajs' : 'bg-gray-100 text-gray-400'}`}>
                            {r.is_custom ? <School size={20} /> : <MapPin size={20} />}
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-sm uppercase leading-none text-gray-800">{r.name || r.display_name.split(',')[0]}</p>
                            <p className="text-[10px] text-gray-400 line-clamp-1 font-bold mt-1 uppercase tracking-tight">{r.display_name}</p>
                        </div>
                        {r.is_custom && <CheckCircle className="text-ajs ml-2" size={16} strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                )}
                
                {targetPos && searchResults.length === 0 && (
                    <div className="animate-in slide-in-from-bottom-4">
                        <div className="bg-gray-900 rounded-3xl p-6 text-white flex justify-between items-center mb-4 shadow-xl">
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Estimasi Biaya</p>
                                <p className="text-2xl font-black italic">Rp 15.000</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-ajs">Safe Ride</p>
                                <p className="text-xs font-bold">Driver Tetap</p>
                            </div>
                        </div>
                        <button onClick={handleBooking} className="w-full bg-ajs text-white py-5 rounded-[28px] font-black shadow-lg shadow-ajs/30 italic tracking-tighter uppercase text-lg active:scale-95 transition-all">Pesan AJS Sekarang</button>
                    </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'wallet' && (
            <div className="p-8 text-center mt-20">
                <h2 className="text-3xl font-black italic text-ajs mb-4 underline decoration-4 uppercase tracking-tighter">Dompet Saya</h2>
                <div className="bg-white p-12 rounded-[48px] text-center border-2 border-gray-100 shadow-sm inline-block w-full">
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">Saldo Aktif</p>
                    <p className="text-5xl font-black italic tracking-tighter text-gray-900 leading-none">Rp {walletData.balance.toLocaleString('id-ID')}</p>
                    <button className="mt-10 bg-ajs text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-ajs/30 uppercase italic tracking-tighter text-sm">Top Up Sekarang</button>
                </div>
            </div>
        )}
      </div>

      <nav className="bg-white border-t h-24 flex justify-around items-center px-4 pb-4 shrink-0 z-[1002]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-ajs' : 'text-gray-300'}`}><MapIcon size={24} /><span className="text-[9px] font-black uppercase">Peta</span></button>
        <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center space-y-1 ${activeTab === 'wallet' ? 'text-ajs' : 'text-gray-300'}`}><CreditCard size={24} /><span className="text-[9px] font-black uppercase">Dompet</span></button>
      </nav>
    </div>
  );
}
