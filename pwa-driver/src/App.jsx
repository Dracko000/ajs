import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, Power, Star, Wallet, Calendar, CheckCircle2, 
  Clock, ChevronRight, Send, X, Camera, ShieldCheck, 
  FileText, Building, LayoutDashboard, CreditCard, UserCheck,
  CheckCircle, UserMinus
} from 'lucide-react';
import L from 'leaflet';
import axios from 'axios';

// Fix Leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const App = () => {
  const [loading, setLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState('active'); // Simulation: Assume active for this test
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(false);
  const [manifest, setManifest] = useState([]);
  
  // Registration Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ nik: '', vehicle_number: '', vehicle_model: '', bank_name: 'BCA', bank_account_number: '', license_number: '' });

  useEffect(() => {
    fetchStatus();
    fetchManifest();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/driver/onboarding/status');
      if (res.data.registered) setOnboardingStatus(res.data.status);
      setLoading(false);
    } catch (e) { setLoading(false); }
  };

  const fetchManifest = async () => {
    try {
        const res = await axios.get('http://localhost:8000/api/driver/manifest');
        setManifest(res.data);
    } catch (e) { console.log("Manifest error"); }
  };

  const updateTripStatus = async (id, status) => {
    try {
        await axios.post(`http://localhost:8000/api/driver/manifest/${id}/status`, { status });
        alert(`Siswa berhasil ditandai: ${status.replace('_', ' ').toUpperCase()}`);
        fetchManifest(); // Refresh list
    } catch (e) { alert("Gagal update status"); }
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white text-ajs font-sans">
       <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // --- VIEW: ONBOARDING / REGISTRATION (Keep current logic) ---
  if (!onboardingStatus) { /* ... same as before ... */ }

  // --- VIEW: ACTIVE DRIVER (DASHBOARD) ---
  return (
    <div className="h-screen w-screen relative overflow-hidden bg-gray-50 flex flex-col font-sans">
      <div className="flex-1 relative overflow-y-auto">
        {activeTab === 'home' && (
          <div className="h-full w-full relative">
            <MapContainer center={[-6.2, 106.81]} zoom={15} zoomControl={false} className="h-full w-full z-0">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </MapContainer>
            <div className="absolute top-6 left-4 right-4 z-10">
              <div className="bg-white rounded-3xl shadow-2xl p-5 flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <p className={`text-lg font-black ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>{isOnline ? 'SIAP JEMPUT' : 'OFFLINE'}</p>
                </div>
                <button onClick={() => setIsOnline(!isOnline)} className={`p-4 rounded-2xl ${isOnline ? 'bg-red-50 text-red-500' : 'bg-ajs text-white shadow-lg'}`}><Power size={24} /></button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'manifest' && (
          <div className="p-6 pb-24">
            <h2 className="text-2xl font-black text-gray-900 mb-6 italic tracking-tighter uppercase">Jadwal Jemputan Hari Ini</h2>
            
            {manifest.length === 0 && (
                <div className="text-center py-20 opacity-30">
                    <Calendar size={64} className="mx-auto mb-4" />
                    <p className="font-bold">Belum ada jadwal jemputan.</p>
                </div>
            )}

            <div className="space-y-6">
               {manifest.map((item) => (
                 <div key={item.id} className={`p-6 rounded-[32px] border-2 bg-white transition-all ${item.status === 'scheduled' ? 'border-ajs/20 shadow-md' : 'border-gray-100 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center">
                          <div className="w-10 h-10 bg-ajs/10 rounded-xl flex items-center justify-center text-ajs mr-3 font-black text-xs italic">
                             {item.scheduled_at.substring(0, 5)}
                          </div>
                          <div>
                             <p className="font-black text-lg leading-none">{item.student.name}</p>
                             <p className="text-[10px] font-bold text-gray-400 uppercase mt-1 tracking-widest">
                                {item.type === 'pickup' ? 'Jemput dari Rumah' : 'Jemput dari Sekolah'}
                             </p>
                          </div>
                       </div>
                       <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${item.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {item.status}
                       </div>
                    </div>

                    <div className="flex items-center text-xs text-gray-500 mb-6 bg-gray-50 p-3 rounded-2xl">
                       <MapPin size={14} className="mr-2 text-ajs" />
                       <span className="font-medium line-clamp-1">{item.student.pickup_address || 'Lokasi Terdaftar'}</span>
                    </div>

                    {item.status === 'scheduled' && (
                       <div className="grid grid-cols-2 gap-3">
                          <button 
                            onClick={() => updateTripStatus(item.id, 'picked_up')}
                            className="bg-ajs text-white py-4 rounded-2xl font-black text-[10px] shadow-lg shadow-ajs/20 italic tracking-tighter flex items-center justify-center"
                          >
                             <CheckCircle size={16} className="mr-2" /> SUDAH DIJEMPUT
                          </button>
                          <button 
                            onClick={() => updateTripStatus(item.id, 'absent')}
                            className="bg-gray-100 text-gray-400 py-4 rounded-2xl font-black text-[10px] italic tracking-tighter flex items-center justify-center"
                          >
                             <UserMinus size={16} className="mr-2" /> SISWA ABSEN
                          </button>
                       </div>
                    )}

                    {item.status === 'picked_up' && (
                       <button 
                        onClick={() => updateTripStatus(item.id, 'arrived')}
                        className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-[10px] shadow-lg italic tracking-tighter flex items-center justify-center"
                       >
                         <ShieldCheck size={16} className="mr-2" /> SUDAH SAMPAI TUJUAN
                       </button>
                    )}
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="p-6">
            <h2 className="text-2xl font-black text-gray-900 mb-6 italic uppercase tracking-tighter leading-none">Dompet Driver</h2>
            <div className="bg-ajs p-8 rounded-[40px] text-white shadow-xl">
               <p className="text-white/60 text-[10px] font-bold uppercase mb-1">Saldo Tersedia</p>
               <p className="text-4xl font-black italic tracking-tighter">Rp 0</p>
            </div>
          </div>
        )}
      </div>

      <nav className="bg-white border-t border-gray-100 h-20 flex justify-around items-center px-4 pb-2 z-50 shrink-0">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center space-y-1 ${activeTab === 'home' ? 'text-ajs' : 'text-gray-400'}`}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Monitor</span>
        </button>
        <button onClick={() => setActiveTab('manifest')} className={`flex flex-col items-center space-y-1 ${activeTab === 'manifest' ? 'text-ajs' : 'text-gray-400'}`}>
          <Calendar size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Jadwal</span>
        </button>
        <button onClick={() => setActiveTab('wallet')} className={`flex flex-col items-center space-y-1 ${activeTab === 'wallet' ? 'text-ajs' : 'text-gray-400'}`}>
          <Wallet size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Dompet</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
