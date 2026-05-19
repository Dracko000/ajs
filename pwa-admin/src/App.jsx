import React, { useState, useEffect } from 'react';
import axios from 'axios';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LayoutDashboard, MapPin, X, Plus } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- CONFIG & ICONS ---
const API_BASE = "http://localhost:8000/api";
const BlueIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });
const RedIcon = L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] });

// Component to handle auto-center (Safe way)
function MapController({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.panTo(center); }, [center]);
  return null;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPos, setAdminPos] = useState([-6.23, 106.82]); // Default Jakarta
  const [pois, setPois] = useState([]);
  
  // POI Form
  const [isAdding, setIsAdding] = useState(false);
  const [tempPoi, setTempPoi] = useState(null);
  const [schoolName, setSchoolName] = useState('');

  // 1. Initial Load
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsLoggedIn(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Detect Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => { setAdminPos([p.coords.latitude, p.coords.longitude]); setLoading(false); },
        () => { setLoading(false); }
      );
    } else { setLoading(false); }
  }, []);

  // 2. Fetch Data if Logged In
  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem('admin_token');
      axios.get(`${API_BASE}/pois/search?q=`).then(res => setPois(res.data)).catch(e => {});

      // Setup Echo
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

      echo.channel('drivers').listen('.location.updated', (data) => {
        // Logic for live tracking
      });

      return () => echo.disconnect();
    }
  }, [isLoggedIn]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/login`, { email, password });
      if (res.data.user.role !== 'admin') return alert("Bukan Admin!");
      localStorage.setItem('admin_token', res.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
      setIsLoggedIn(true);
    } catch (e) { alert("Login Gagal"); }
  };

  const savePoi = async () => {
    if (!schoolName) return alert("Isi Nama Sekolah");
    const token = localStorage.getItem('admin_token');
    try {
      await axios.post(`${API_BASE}/pois`, {
        name: schoolName, address: 'Wilayah Cikampek', latitude: tempPoi.lat, longitude: tempPoi.lng, type: 'school'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Sekolah Berhasil Disimpan!");
      setTempPoi(null);
      setIsAdding(false);
      setSchoolName('');
      const res = await axios.get(`${API_BASE}/pois/search?q=`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPois(res.data);
    } catch (e) { 
        console.error(e);
        alert("Gagal Simpan: " + (e.response?.data?.message || "Terjadi kesalahan server atau koneksi.")); 
    }
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center font-bold text-ajs animate-pulse text-2xl italic tracking-tighter">AJS LOADING...</div>;

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white p-12 rounded-[40px] shadow-2xl">
        <h1 className="text-5xl font-black text-ajs mb-2 text-center italic tracking-tighter">AJS</h1>
        <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10">Admin Center</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="email" placeholder="Email Admin" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-ajs font-bold" value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required className="w-full p-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:border-ajs font-bold" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-ajs text-white py-5 rounded-2xl font-black shadow-lg shadow-ajs/30 uppercase italic">MASUK</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 p-8 flex flex-col shrink-0">
        <h1 className="text-3xl font-black text-ajs italic mb-12 text-center tracking-tighter">AJS</h1>
        <nav className="flex-1 space-y-3">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left p-4 rounded-2xl font-black uppercase text-xs tracking-widest ${activeTab === 'dashboard' ? 'bg-ajs text-white shadow-lg shadow-ajs/20' : 'text-gray-400'}`}>Beranda</button>
          <button onClick={() => setActiveTab('poi')} className={`w-full text-left p-4 rounded-2xl font-black uppercase text-xs tracking-widest ${activeTab === 'poi' ? 'bg-ajs text-white shadow-lg shadow-ajs/20' : 'text-gray-400'}`}>Titik Sekolah</button>
        </nav>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-4 text-red-500 font-black text-xs uppercase tracking-widest">Logout</button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-ajs decoration-4">Live Monitor</h2>
            <div className="h-[500px] w-full bg-white rounded-[40px] overflow-hidden shadow-2xl border-8 border-white relative">
              <MapContainer center={adminPos} zoom={13} className="h-full w-full" zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapController center={adminPos} />
                <Marker position={adminPos} icon={BlueIcon}><Popup>Anda</Popup></Marker>
                {pois.map(p => <Marker key={p.id} position={[p.lat, p.lon]} icon={RedIcon}><Popup>{p.name}</Popup></Marker>)}
              </MapContainer>
            </div>
          </div>
        )}

        {activeTab === 'poi' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col h-[600px]">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black italic text-sm tracking-widest uppercase">Daftar Titik</h3>
                <button onClick={() => {setIsAdding(!isAdding); setTempPoi(null);}} className={`p-2 rounded-xl ${isAdding ? 'bg-red-50 text-red-500' : 'bg-ajs text-white shadow-lg'}`}>
                  {isAdding ? <X size={20}/> : <Plus size={20}/>}
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto pr-2">
                {pois.map(p => (
                  <div key={p.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="font-black text-gray-900 text-sm">{p.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">Verified Point</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 relative">
              {isAdding && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-ajs text-white px-6 py-2 rounded-full font-black text-[10px] shadow-2xl animate-pulse tracking-widest">SILAKAN KLIK PADA PETA</div>}
              <div className="h-[600px] w-full bg-white rounded-[40px] shadow-2xl border-8 border-white overflow-hidden relative">
                <MapContainer center={adminPos} zoom={13} className="h-full w-full" zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapController center={adminPos} />
                  {isAdding && <MapClickHelper onMapClick={(latlng) => setTempPoi(latlng)} />}
                  <Marker position={adminPos} icon={BlueIcon} />
                  {pois.map(p => <Marker key={p.id} position={[p.lat, p.lon]} icon={RedIcon} />)}
                  {tempPoi && <Marker position={[tempPoi.lat, tempPoi.lng]} />}
                </MapContainer>
              </div>

              {tempPoi && (
                <div className="absolute top-20 right-8 z-[1001] bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100 w-80 animate-in fade-in zoom-in duration-300">
                  <h4 className="font-black text-gray-900 mb-6 italic uppercase tracking-tighter underline decoration-ajs decoration-2">Simpan Sekolah</h4>
                  <input type="text" placeholder="Contoh: SDN Dawuan 01" className="w-full p-4 bg-gray-50 rounded-2xl outline-none mb-6 font-bold" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                  <button onClick={savePoi} className="w-full bg-ajs text-white py-4 rounded-2xl font-black shadow-lg shadow-ajs/30 uppercase italic tracking-tighter">Konfirmasi Data</button>
                  <button onClick={() => setTempPoi(null)} className="w-full text-gray-400 font-black text-[10px] mt-4 uppercase">Batal</button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Map Click Helper
function MapClickHelper({ onMapClick }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e) => onMapClick(e.latlng);
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, onMapClick]);
  return null;
}
