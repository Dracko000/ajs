import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Bike, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  Plus,
  School,
  Save,
  Trash2,
  X,
  Navigation,
  UserCheck,
  CreditCard,
  TrendingUp,
  Link,
  FileText,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Calendar
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

window.Pusher = Pusher;

// Fix Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
let DriverIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/71/71422.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});
let SchoolIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/167/167707.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});
let AdminMarkerIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 13); }, [center, map]);
  return null;
}

function MapEvents({ onClick }) {
  useMapEvents({ click(e) { onClick(e.latlng); } });
  return null;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminPosition, setAdminPosition] = useState(null);
  const [liveDrivers, setLiveDrivers] = useState({});
  const [pois, setPois] = useState([]);
  const [newPoi, setNewPoi] = useState(null);
  const [isAddingPoi, setIsAddingPoi] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Verification States
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Assignment States
  const [studentAssignments, setStudentAssignments] = useState([]);
  const [activeDriversList, setActiveDriversList] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ student_id: '', driver_id: '', type: 'pickup', scheduled_at: '06:30', day_of_week: 1 });

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setAdminPosition([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      }, () => {
        setAdminPosition([-6.200000, 106.816666]);
        setLoading(false);
      });
    }

    const echo = new Echo({
      broadcaster: 'reverb',
      key: 'qakimjurmp1nkxigllzn',
      wsHost: 'localhost',
      wsPort: 8080,
      forceTLS: false,
      enabledTransports: ['ws', 'wss'],
    });

    echo.channel('drivers').listen('.location.updated', (data) => {
      setLiveDrivers(prev => ({
        ...prev,
        [data.driverId]: { lat: data.latitude, lon: data.longitude, updatedAt: new Date() }
      }));
    });

    fetchPois();
    fetchPendingDrivers();
    fetchAssignments();
    fetchActiveDrivers();
    return () => echo.disconnect();
  }, []);

  const fetchPois = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/pois/search?q=');
      setPois(res.data);
    } catch (e) { console.log("POI error"); }
  };

  const fetchPendingDrivers = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/drivers/pending');
      setPendingDrivers(res.data);
    } catch (e) { console.log("Pending drivers error"); }
  };

  const fetchAssignments = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/admin/assignments');
      setStudentAssignments(res.data);
    } catch (e) { console.log("Assignments error"); }
  };

  const fetchActiveDrivers = async () => {
    // For simplicity, fetching all and filtering on backend or here
    try {
      const res = await axios.get('http://localhost:8000/api/admin/drivers/pending'); // Need another endpoint for active? 
      // Assuming for now we use a general list or just mock active
    } catch (e) { }
  };

  const handleApproveDriver = async (id) => {
    if (!window.confirm("Ingin mengaktifkan driver ini?")) return;
    try {
      await axios.post(`http://localhost:8000/api/admin/drivers/${id}/status`, { status: 'active' });
      alert("Driver Aktif!");
      setSelectedDriver(null);
      fetchPendingDrivers();
    } catch (e) { alert("Gagal verifikasi"); }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/admin/assignments', assignForm);
      alert("Penugasan Berhasil!");
      setShowAssignModal(false);
      fetchAssignments();
    } catch (e) {
      alert("Gagal menugaskan driver.");
    }
  };

  const handleSavePoi = async () => {
    if (!newPoi.name || !newPoi.address) return alert("Lengkapi data!");
    try {
      await axios.post('http://localhost:8000/api/pois', {
        name: newPoi.name, address: newPoi.address,
        latitude: newPoi.lat, longitude: newPoi.lng, type: 'school'
      });
      setNewPoi(null);
      setIsAddingPoi(false);
      fetchPois();
    } catch (e) { alert("Error simpan POI"); }
  };

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
       <div className="w-12 h-12 border-4 border-ajs border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const SidebarItem = ({ id, label, icon: Icon, badge }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
        activeTab === id ? 'bg-ajs text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon size={20} />
        <span className="font-semibold text-sm">{label}</span>
      </div>
      {badge > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${activeTab === id ? 'bg-white text-ajs' : 'bg-ajs text-white'}`}>{badge}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-6 flex items-center justify-center italic">
          <h1 className="text-3xl font-black text-ajs tracking-tighter">AJS</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <SidebarItem id="dashboard" label="Beranda" icon={LayoutDashboard} />
          <SidebarItem id="verification" label="Verifikasi Akun" icon={UserCheck} badge={pendingDrivers.length} />
          <SidebarItem id="assignment" label="Penugasan Driver" icon={Link} />
          <SidebarItem id="poi" label="Titik Sekolah" icon={MapPin} />
          <SidebarItem id="finance" label="Laporan Keuangan" icon={CreditCard} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="bg-white border-b border-gray-100 h-16 flex items-center justify-between px-8 sticky top-0 z-50">
          <h2 className="font-bold text-gray-800 uppercase tracking-widest text-xs text-ajs italic">Admin Center</h2>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                   <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none mb-2">Driver Online</p>
                   <p className="text-3xl font-black text-gray-900">{Object.keys(liveDrivers).length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                   <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-none mb-2">Pendaftar Baru</p>
                   <p className="text-3xl font-black text-ajs">{pendingDrivers.length}</p>
                </div>
              </div>
              <div className="h-[400px] bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                  <MapContainer center={adminPosition} zoom={13} className="h-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {Object.entries(liveDrivers).map(([id, d]) => (<Marker key={id} position={[d.lat, d.lon]} icon={DriverIcon} />))}
                  </MapContainer>
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h3 className="text-xl font-black text-gray-900 mb-6">Menunggu Verifikasi</h3>
                  {pendingDrivers.map((d) => (
                    <div key={d.id} onClick={() => setSelectedDriver(d)} className={`p-5 rounded-[24px] bg-white border-2 cursor-pointer transition-all ${selectedDriver?.id === d.id ? 'border-ajs shadow-lg' : 'border-white shadow-sm'}`}>
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="font-black text-lg leading-none">{d.user.name}</p>
                             <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">NIK: {d.nik}</p>
                          </div>
                          <span className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">Pending</span>
                       </div>
                    </div>
                  ))}
               </div>
               {selectedDriver && (
                 <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-xl">
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-xl font-black italic tracking-tighter">Review Dokumen</h3>
                       <button onClick={() => setSelectedDriver(null)}><X /></button>
                    </div>
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 p-4 rounded-2xl">
                             <p className="text-[8px] font-black text-gray-400 uppercase">Kendaraan</p>
                             <p className="text-xs font-bold">{selectedDriver.vehicle_model} ({selectedDriver.vehicle_number})</p>
                          </div>
                       </div>
                       <button onClick={() => handleApproveDriver(selectedDriver.id)} className="w-full bg-ajs text-white py-4 rounded-2xl font-black shadow-lg">ACC DRIVER SEKARANG</button>
                    </div>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'assignment' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-gray-900 italic tracking-tighter uppercase">Penugasan Driver Tetap</h2>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                  {studentAssignments.map((student) => (
                    <div key={student.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div className="flex items-center">
                          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-ajs mr-4 border border-gray-100">
                             <Users size={28} />
                          </div>
                          <div>
                             <p className="font-black text-lg leading-none">{student.name}</p>
                             <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{student.school?.name || 'Sekolah Belum Diatur'}</p>
                          </div>
                       </div>

                       <div className="flex flex-wrap gap-3">
                          {['pickup', 'dropoff'].map(type => {
                             const assignment = student.manifests?.find(m => m.type === type);
                             return (
                               <div key={type} className={`px-5 py-3 rounded-2xl border-2 flex items-center space-x-3 ${assignment ? 'border-green-100 bg-green-50/30' : 'border-dashed border-gray-100 bg-gray-50/30'}`}>
                                  <div>
                                     <p className="text-[8px] font-black text-gray-400 uppercase">{type === 'pickup' ? 'Berangkat' : 'Pulang'}</p>
                                     <p className="text-xs font-bold text-gray-800">
                                        {assignment ? assignment.driver.user.name : 'Belum Ada Driver'}
                                     </p>
                                  </div>
                                  <button 
                                    onClick={() => {
                                        setAssignForm({...assignForm, student_id: student.id, type: type});
                                        setShowAssignModal(true);
                                    }}
                                    className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 text-ajs hover:scale-110 transition-transform"
                                  >
                                     <Plus size={16} strokeWidth={3} />
                                  </button>
                               </div>
                             );
                          })}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Assignment Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
               <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in duration-300">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-black italic tracking-tighter uppercase">Tugaskan Driver</h3>
                     <button onClick={() => setShowAssignModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-400"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleAssignSubmit} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Pilih Driver Aktif</label>
                        <select 
                            required
                            className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-ajs"
                            value={assignForm.driver_id}
                            onChange={e => setAssignForm({...assignForm, driver_id: e.target.value})}
                        >
                            <option value="">Pilih Nama Driver</option>
                            <option value="1">Budi Santoso (Active)</option>
                            <option value="2">Andi Wijaya (Active)</option>
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Jam Jadwal</label>
                            <input type="time" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold outline-none" value={assignForm.scheduled_at} onChange={e => setAssignForm({...assignForm, scheduled_at: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Hari (1-5)</label>
                            <input type="number" min="1" max="7" required className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-4 font-bold outline-none" value={assignForm.day_of_week} onChange={e => setAssignForm({...assignForm, day_of_week: e.target.value})} />
                        </div>
                     </div>
                     <button type="submit" className="w-full bg-ajs text-white py-4 rounded-2xl font-black shadow-lg shadow-ajs/30 flex items-center justify-center italic tracking-tighter">
                        KONFIRMASI PENUGASAN
                     </button>
                  </form>
               </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-8">
               <h2 className="text-2xl font-black text-gray-900 leading-none italic uppercase tracking-tighter">Financial Report</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                     <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 leading-none">Profit SaaS Mingguan</p>
                     <p className="text-4xl font-black text-green-600 italic">Rp 500.000</p>
                  </div>
                  <div className="bg-ajs p-8 rounded-[40px] shadow-xl text-white">
                     <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2 leading-none">Total Dana Escrow</p>
                     <p className="text-4xl font-black italic">Rp 11.950.000</p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'poi' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 p-6 flex flex-col h-[600px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-gray-900 leading-none">Daftar POI</h3>
                  <button onClick={() => setIsAddingPoi(!isAddingPoi)} className={`p-2 rounded-xl ${isAddingPoi ? 'bg-red-50 text-red-500' : 'bg-ajs text-white shadow-md'}`}>
                    {isAddingPoi ? <X size={20} /> : <Plus size={20} />}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 px-1">
                  {pois.map((poi) => (
                    <div key={poi.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <p className="font-bold text-gray-900 text-sm">{poi.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-none">{poi.type}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 relative">
                <div className="h-[500px] rounded-2xl overflow-hidden border">
                  <MapContainer center={adminPosition} zoom={13} className="h-full" zoomControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <ChangeView center={adminPosition} />
                    <MapEvents onClick={(latlng) => isAddingPoi && setNewPoi({ ...latlng, name: '', address: '', type: 'school' })} />
                    <Marker position={adminPosition} icon={AdminMarkerIcon} />
                    {pois.map((poi) => (<Marker key={poi.id} position={[poi.lat, poi.lon]} icon={SchoolIcon} />))}
                    {newPoi && (<Marker position={[newPoi.lat, newPoi.lng]} />)}
                  </MapContainer>
                </div>
                {newPoi && (
                  <div className="absolute top-20 right-10 z-[1001] bg-white p-6 rounded-[32px] shadow-2xl border border-gray-100 w-80">
                    <h4 className="font-black text-gray-900 mb-4 italic uppercase tracking-tighter">Save New Point</h4>
                    <div className="space-y-4">
                      <input type="text" placeholder="Nama Titik" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold outline-none" value={newPoi.name} onChange={e => setNewPoi({...newPoi, name: e.target.value})} />
                      <button onClick={handleSavePoi} className="w-full bg-ajs text-white py-3 rounded-xl font-black shadow-lg italic tracking-tighter">SIMPAN TITIK</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
