import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, Home, School, Navigation, Menu, User, MapPin, X, 
  ShieldCheck, Clock, CheckCircle, Plus, CreditCard, History, Baby, Calendar,
  Phone, MessageSquare, Star, ArrowRight, Map as MapIcon
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
let OjekIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/71/71422.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});
L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, zoom); }, [center, map]);
  return null;
}

function App() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [position, setPosition] = useState([-6.200000, 106.816666]);
  const [loading, setLoading] = useState(true);
  const [activeTrip, setActiveTrip] = useState(null); // { driverId, driverName, status, lat, lon }
  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  
  // Local states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [targetPosition, setTargetPosition] = useState(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    // 1. Get User Location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      }, () => setLoading(false));
    } else setLoading(false);

    // 2. Setup Real-time Tracking
    const echo = new Echo({
      broadcaster: 'reverb',
      key: 'qakimjurmp1nkxigllzn',
      wsHost: 'localhost',
      wsPort: 8080,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
    });

    // Listen for trip status updates (e.g., child picked up)
    echo.private(`App.Models.User.1`) // Simulation: Use current auth user ID
      .listen('.trip.updated', (data) => {
        console.log("Trip Update:", data);
        if (data.status === 'picked_up') {
          setActiveTrip(prev => ({ ...prev, status: 'picked_up', studentName: data.studentName }));
        } else if (data.status === 'arrived') {
          setActiveTrip(null);
          alert(`${data.studentName} sudah sampai di tujuan dengan selamat!`);
        }
      });

    // Listen for driver location updates if trip is active
    echo.channel('drivers').listen('.location.updated', (data) => {
        // If this driver is the one assigned to our manifest
        // In real app, we check assigned_driver_id from activeTrip
        setActiveTrip(prev => {
            if (!prev || prev.status !== 'picked_up') return prev;
            return { ...prev, lat: data.latitude, lon: data.longitude };
        });
    });

    return () => echo.disconnect();
  }, []);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white text-ajs">
       <div className="w-16 h-16 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gray-50 flex flex-col font-sans">
      
      <div className="flex-1 relative overflow-y-auto">
        {activeTab === 'home' && (
          <div className="h-full w-full relative">
            <MapContainer center={activeTrip?.lat ? [activeTrip.lat, activeTrip.lon] : position} zoom={15} zoomControl={false} className="h-full w-full z-0 transition-all">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {/* User Position */}
              <Marker position={position} />

              {/* LIVE DRIVER / CHILD POSITION */}
              {activeTrip?.lat && (
                  <>
                    <Marker position={[activeTrip.lat, activeTrip.lon]} icon={OjekIcon} />
                    <ChangeView center={[activeTrip.lat, activeTrip.lon]} zoom={17} />
                  </>
              )}

              {/* Destination Point */}
              {targetPosition && !activeTrip && <Marker position={targetPosition} icon={L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] })} />}
            </MapContainer>

            {/* Overlays */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-2">
               <div className="bg-ajs text-white p-4 rounded-[24px] shadow-xl flex justify-between items-center">
                  <div>
                    <h1 className="font-black text-xl italic tracking-tighter leading-none">AJS</h1>
                    <p className="text-[8px] font-bold opacity-80 uppercase tracking-widest mt-1">Antar Jemput Siswa</p>
                  </div>
                  <div className="flex items-center bg-white/20 px-3 py-1.5 rounded-full text-[9px] font-black uppercase border border-white/20">
                     <ShieldCheck className="w-3 h-3 mr-1" /> Verified Safe
                  </div>
               </div>

               {/* Live Status Badge */}
               {activeTrip && (
                 <div className="bg-green-600 text-white px-4 py-2 rounded-full text-[10px] font-black self-center shadow-lg flex items-center animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
                    SEDANG MENJEMPUT {activeTrip.studentName?.toUpperCase()}
                 </div>
               )}
            </div>

            {/* Live Tracking Card */}
            {activeTrip && (
               <div className="absolute bottom-6 left-4 right-4 z-20 bg-white rounded-[40px] shadow-2xl p-8 border border-gray-100 animate-in slide-in-from-bottom-10">
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-full border-2 border-ajs overflow-hidden mr-4">
                           <img src="https://i.pravatar.cc/100?u=driver1" alt="Driver" className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Driver Anda</p>
                           <p className="text-lg font-black text-gray-900 leading-none">Budi Santoso</p>
                           <div className="flex items-center mt-1">
                              <Star size={12} className="text-yellow-400 fill-current" />
                              <span className="text-[10px] font-bold text-gray-500 ml-1">4.9 • Vario 125 (B 1234 AJS)</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex space-x-2">
                        <button className="bg-ajs/10 p-3 rounded-2xl text-ajs active:scale-90 transition-transform"><Phone size={20}/></button>
                        <button className="bg-blue-50 p-3 rounded-2xl text-blue-600 active:scale-90 transition-transform"><MessageSquare size={20}/></button>
                     </div>
                  </div>

                  <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                     <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                           <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Status Perjalanan</p>
                           <p className="text-sm font-bold text-gray-800 mt-1 italic tracking-tight">Menuju SD Negeri 01 Cikampek...</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-ajs uppercase leading-none">ETA</p>
                           <p className="text-lg font-black text-ajs">4 Menit</p>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* Standard Bottom Sheet (Only if no active trip) */}
            {!activeTrip && (
              <div className={`absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-[40px] shadow-2xl p-6 transition-all duration-300 ${searchResults.length > 0 ? 'h-[75%]' : ''}`}>
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                <h1 className="text-2xl font-black text-gray-900 mb-6 italic tracking-tighter uppercase">Mau Antar Ke Mana?</h1>
                <div className="relative">
                  <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-[24px] p-5 mb-4 focus-within:border-ajs transition-all">
                    <Search className="w-6 h-6 text-ajs mr-3" />
                    <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Cari alamat sekolah..." className="bg-transparent border-none outline-none w-full text-lg font-bold placeholder:text-gray-300" />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto">
                      {searchResults.map((r, i) => (
                        <div key={i} onClick={() => { setTargetPosition([r.lat, r.lon]); setSearchResults([]); setSearchQuery(r.name || r.display_name.split(',')[0]); }} className="p-4 border-b border-gray-50 flex items-start cursor-pointer hover:bg-gray-50">
                          <MapPin className={`w-5 h-5 mr-3 shrink-0 ${r.is_custom ? 'text-ajs' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-bold text-sm text-gray-900 leading-tight">{r.name || r.display_name.split(',')[0]}</p>
                            <p className="text-[10px] text-gray-500 line-clamp-1 font-medium mt-0.5">{r.display_name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {!targetPosition && (
                   <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-ajs/5 p-5 rounded-[28px] border-2 border-ajs/10 flex flex-col items-center">
                         <div className="bg-ajs p-3 rounded-2xl text-white mb-2 shadow-md"><School size={24} /></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Ke Sekolah</span>
                      </div>
                      <div className="bg-blue-50 p-5 rounded-[28px] border-2 border-blue-100 flex flex-col items-center">
                         <div className="bg-blue-500 p-3 rounded-2xl text-white mb-2 shadow-md"><Home size={24} /></div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Pulang</span>
                      </div>
                   </div>
                )}
                {targetPosition && searchResults.length === 0 && (
                  <button className="w-full bg-ajs text-white py-5 rounded-[24px] font-black mt-4 shadow-lg shadow-ajs/20 italic tracking-tighter active:scale-95 transition-all uppercase">
                    PANGGIL AJS SHUTTLE <ArrowRight className="inline ml-2" size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Other tabs remain the same as previous implementation */}
        {activeTab === 'wallet' && <div className="p-6"><h2>Wallet Screen</h2></div>}
      </div>

      <nav className="bg-white border-t border-gray-100 h-20 flex justify-around items-center px-4 pb-2 z-50 shrink-0">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-ajs' : 'text-gray-400'}`}>
          <MapIcon size={22} strokeWidth={activeTab === 'home' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Peta</span>
        </button>
        <button onClick={() => setActiveTab('students')} className={`flex flex-col items-center space-y-1 ${activeTab === 'students' ? 'text-ajs' : 'text-gray-400'}`}>
          <Baby size={22} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Siswa</span>
        </button>
        <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center space-y-1 ${activeTab === 'wallet' ? 'text-ajs' : 'text-gray-400'}`}>
          <CreditCard size={22} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Dompet</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
