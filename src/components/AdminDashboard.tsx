"use client";

import React, { useState } from 'react';
// IMPORTANTE: Aquí importamos Printer y todos los iconos necesarios
import { FolderPlus, Download, Plus, Eye, EyeOff, ChevronDown, ChevronUp, Tag, FileText, Users, MessageSquare, BarChart, FileSpreadsheet, Camera, CheckSquare, Save, Search, Printer } from 'lucide-react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { generarExcel } from '../utils/excelGenerator';
import { generarPDF } from '../utils/pdfGenerator'; // Aseguramos la importación del generador PDF
import ChatSystem from './ChatSystem';
import { User, Section, Report, Message } from '../types';

interface AdminDashboardProps {
  sections: Section[];
  reports: Report[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentUser: User;
  users: User[];
  activeTab?: string;
  setActiveTab?: React.Dispatch<React.SetStateAction<string>>;
}

export default function AdminDashboard({ sections, reports, messages, setMessages, currentUser, users, activeTab, setActiveTab }: AdminDashboardProps) {
  const [localActiveTab, setLocalActiveTab] = useState<string>('buzon');
  const currentTab = activeTab !== undefined ? activeTab : localActiveTab;
  const setCurrentTab = setActiveTab !== undefined ? setActiveTab : setLocalActiveTab;
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredReports = reports?.filter((r: Report) => 
    (r.serial && r.serial.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.client && r.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.jobName && r.jobName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.type && r.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Navegación Responsiva en Pills */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <TabButton active={currentTab === 'buzon'} onClick={() => setCurrentTab('buzon')} icon={<FileText/>} label="Buzón Reportes" />
        <TabButton active={currentTab === 'secciones'} onClick={() => setCurrentTab('secciones')} icon={<FolderPlus/>} label="Gestión Carpetas" />
        <TabButton active={currentTab === 'usuarios'} onClick={() => setCurrentTab('usuarios')} icon={<Users/>} label="Cuentas Personal" />
        <TabButton active={currentTab === 'chat'} onClick={() => setCurrentTab('chat')} icon={<MessageSquare/>} label="Chat Central" />
        <TabButton active={currentTab === 'hacer_reporte' || currentTab === 'form'} onClick={() => setCurrentTab('hacer_reporte')} icon={<FileSpreadsheet/>} label="Hacer Reporte" />
      </div>

      <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-slate-100 p-5 md:p-8 min-h-[600px]">
        {currentTab === 'buzon' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Buzón de Operaciones</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Revisa y descarga los reportes generados.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-auto">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Buscar reporte..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none w-full sm:w-64 transition-all shadow-sm"
                  />
                </div>
                <div className="hidden sm:flex items-center gap-3 bg-indigo-50 px-4 py-2.5 rounded-xl border border-indigo-100">
                  <BarChart className="w-5 h-5 text-indigo-600"/>
                  <span className="font-bold text-indigo-900 text-sm">{(filteredReports?.length || 0)} Reportes Totales</span>
                </div>
              </div>
            </div>
            
            {(sections?.length || 0) === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <FolderPlus className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-bold text-lg">Tu entorno está limpio</p>
                <p className="text-sm text-slate-500 mt-1">Crea tu primera carpeta en la pestaña superior para comenzar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sections.map((section: Section) => {
                  const secReps = filteredReports?.filter((r: Report) => r.sectionId === section.id);
                  if (searchTerm && (secReps?.length || 0) === 0) return null;
                  return <AccordionItem key={section.id} section={section} reports={secReps} />;
                })}
                {searchTerm && (filteredReports?.length || 0) === 0 && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Search className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-bold">No se encontraron reportes</p>
                    <p className="text-sm text-slate-400 mt-1">Intenta con otros términos de búsqueda.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentTab === 'secciones' && <SectionManager sections={sections} />}
        {currentTab === 'usuarios' && <UserManager users={users} />}
        {currentTab === 'chat' && <ChatSystem messages={messages} setMessages={setMessages} currentUser={currentUser} allUsers={users} />}
        
        {/* VISTAS PARA GENERAR REPORTES DESDE ADMIN */}
        {currentTab === 'hacer_reporte' && (
          <div className="text-center py-16 animate-in fade-in">
            <h2 className="text-3xl font-black mb-2 text-gray-900">Formato de Servicio (Admin)</h2>
            <p className="text-gray-500 mb-12">Haz clic abajo para comenzar a llenar el reporte y generar el Excel.</p>
            <div className="max-w-md mx-auto">
              <button onClick={() => setCurrentTab('form')} className="w-full flex flex-col items-center justify-center p-10 border-2 border-green-200 bg-green-50 hover:bg-green-100 rounded-3xl shadow-sm transition-all hover:scale-105 hover:shadow-lg">
                <div className="bg-white p-5 rounded-full mb-4 shadow-sm"><FileSpreadsheet className="w-12 h-12 text-green-600" /></div>
                <span className="text-2xl font-black text-green-800">Reporte Preventivo</span>
                <span className="text-sm font-bold text-green-600 mt-2 bg-white px-3 py-1 rounded-full">Automático a Excel</span>
              </button>
            </div>
          </div>
        )}

        {currentTab === 'form' && (
          <AdminJobWizard type="Preventivo" sections={sections} currentUser={currentUser} onCancel={() => setCurrentTab('hacer_reporte')} />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactElement; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap shrink-0
        ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
    >
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
      {label}
    </button>
  );
}

function AccordionItem({ section, reports }: { section: Section; reports: Report[] }) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center p-5 md:p-6 transition-colors ${isOpen ? 'bg-indigo-50/30' : 'bg-white hover:bg-slate-50'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-colors ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
            <FolderPlus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="block font-black text-slate-800 text-lg">{section.name}</span>
            <span className="text-xs text-slate-500 font-bold mt-0.5 inline-block bg-slate-100 px-2 py-0.5 rounded-md">
              {(reports?.length || 0)} {((reports?.length || 0) === 1 ? 'documento' : 'documentos')}
            </span>
          </div>
        </div>
        <div className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100">
          {(reports?.length || 0) === 0 ? (
            <p className="text-sm text-slate-400 font-medium text-center py-8">Esta carpeta está vacía.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report: Report) => (
                <div key={report.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                  <div className="mb-4 md:mb-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-black text-indigo-950 text-lg">{report.serial}</span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg uppercase font-black tracking-wider ${report.type === 'Preventivo' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {report.type}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm">
                      <p className="text-slate-600"><span className="font-bold text-slate-800">Cliente:</span> {report.client}</p>
                      <p className="text-slate-600"><span className="font-bold text-slate-800">Técnico:</span> {report.jobName}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wide">{report.date}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button onClick={() => generarExcel(report)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 px-5 py-3 rounded-xl hover:bg-green-600 hover:text-white hover:border-green-600 text-sm font-bold transition-all shadow-sm">
                      <Download className="w-5 h-5" /> Descargar Excel
                    </button>
                    {/* BOTÓN DE IMPRIMIR PDF ACTUALIZADO */}
                    <button onClick={() => generarPDF(report)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-700 border border-red-200 px-5 py-3 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 text-sm font-bold transition-all shadow-sm">
                      <Printer className="w-5 h-5" /> Imprimir PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionManager({ sections }: { sections: Section[] }) {
  const [newSection, setNewSection] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newSection.trim()) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'sections'), { name: newSection, createdAt: new Date().toISOString() });
      setNewSection('');
    } catch (_err) { alert("Error al guardar la sección."); }
    setIsSaving(false);
  };

  return (
    <div className="max-w-4xl animate-in fade-in">
      <div className="border-b border-slate-100 pb-5 mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestión de Carpetas</h2>
        <p className="text-slate-500 text-sm mt-1 font-medium">Diseña la estructura de almacenamiento para tus técnicos.</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-10 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
        <input 
          type="text" 
          value={newSection} 
          onChange={(e) => setNewSection(e.target.value)} 
          placeholder="Ej: Mantenimiento Preventivo 2024" 
          className="flex-1 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 shadow-sm" 
        />
        <button 
          type="submit" 
          disabled={isSaving} 
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-70 transition-all shrink-0"
        >
          <Plus className="w-6 h-6" /> {isSaving ? 'Creando...' : 'Crear Carpeta'}
        </button>
      </form>

      <h3 className="font-black text-slate-800 mb-5 text-lg">Carpetas Activas</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s: Section) => (
           <div key={s.id} className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-default">
             <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
               <FolderPlus className="w-6 h-6" />
             </div>
             <span className="font-bold text-slate-700 truncate">{s.name}</span>
           </div>
        ))}
      </div>
    </div>
  );
}

function UserManager({ users }: { users: User[] }) {
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'job' });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'users'), { ...formData, createdAt: new Date().toISOString() });
      setFormData({ name: '', username: '', password: '', role: 'job' });
      alert("Ficha de usuario guardada en la base de datos.");
    } catch(_err) { alert("Error al guardar el usuario."); }
    setIsSaving(false);
  };

  return (
    <div className="max-w-5xl animate-in fade-in">
       <div className="border-b border-slate-100 pb-5 mb-6">
         <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cuentas y Accesos</h2>
         <p className="text-slate-500 text-sm mt-1 font-medium">Registra los datos de tu equipo. (Recuerda darlos de alta en Firebase Authentication).</p>
       </div>

       <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12 bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-inner">
          <div className="md:col-span-3 mb-2">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-600"/> Registrar Nuevo Empleado</h3>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Nombre Completo</label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" placeholder="Ej. Juan Pérez" />
          </div>
          
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Correo Electrónico</label>
            <input type="email" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" placeholder="juan@empresa.com" />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Contraseña Asignada</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm pr-12" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-indigo-600 transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Nivel de Permisos</label>
            <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-slate-200 rounded-2xl p-4 bg-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer font-bold text-slate-700">
              <option value="job">Técnico de Campo (Job) - Solo reportes</option>
              <option value="admin">Administrador - Acceso total</option>
            </select>
          </div>

          <div className="md:col-span-1 flex items-end">
            <button type="submit" disabled={isSaving} className="w-full bg-slate-900 text-white px-8 py-4 font-black rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 disabled:opacity-70 transition-all">
              {isSaving ? 'Guardando...' : 'Crear Usuario'}
            </button>
          </div>
       </form>

       <h3 className="font-black text-slate-800 mb-5 text-lg">Directorio de Personal</h3>
       <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white">
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
             <thead className="bg-slate-50 text-slate-800 border-b border-slate-200">
               <tr>
                 <th className="px-6 py-5 font-black uppercase tracking-wider text-xs">Nombre Completo</th>
                 <th className="px-6 py-5 font-black uppercase tracking-wider text-xs">Correo Electrónico</th>
                 <th className="px-6 py-5 font-black uppercase tracking-wider text-xs">Contraseña</th>
                 <th className="px-6 py-5 font-black uppercase tracking-wider text-xs">Rol</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {users.map((u: User) => (
                 <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                   <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-100 shadow-sm">
                        {(u.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      {u.name}
                   </td>
                   <td className="px-6 py-4 font-medium text-slate-600">{u.username}</td>
                   <td className="px-6 py-4 font-mono text-slate-500 font-bold tracking-widest">{u.password || '••••••••'}</td>
                   <td className="px-6 py-4">
                     <span className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm border ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                       {u.role}
                     </span>
                   </td>
                 </tr>
               ))}
               {(users?.length || 0) === 0 && (
                 <tr>
                   <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-medium italic">No hay usuarios registrados.</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// COMPONENTES REUTILIZADOS PARA EL REPORTE (ADMIN)
// -----------------------------------------------------------------------------

interface AdminJobWizardProps {
  type: string;
  sections: Section[];
  currentUser: User;
  onCancel: () => void;
}

const InputRow = ({ label, value, onChange, span = 1 }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, span?: number }) => (
  <div className={`col-span-${span}`}>
    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{label}</label>
    <input type="text" value={value} onChange={onChange} className="w-full border-gray-300 rounded p-3 bg-gray-50 focus:bg-white border shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-colors" />
  </div>
);

function AdminJobWizard({ type, sections, currentUser, onCancel }: AdminJobWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const [data, setData] = useState({
    sectionId: '', client: '', direccion: '', contrato: '', partida: '',
    equipo: '', marca: '', modelo: '', numSerieEq: '', folioSsm: '', ubicacion: '',
    falla: '', condiciones: '', trabajos: '',
    refacciones: ['', '', '', ''],
    medicion: [{equipo:'', marca:'', modelo:'', serie:''}, {equipo:'', marca:'', modelo:'', serie:''}, {equipo:'', marca:'', modelo:'', serie:''}],
    checklist: Array(28).fill(false),
    firmaEntrega: '', firmaRecibe: '', firmaValida: '',
    fotos: { antes1:'', antes2:'', antes3:'', durante1:'', durante2:'', despues1:'', despues2:'', etiqueta:'' } as Record<string, string>
  });

  const LISTA_CHECKLIST = [
    "Aire de 1 y 2 Toneladas", "Verificación visual", "Pruebas previas", "Alarmas y control", "Conexión a tierra",
    "Limpieza gabinete", "Mant. condensador", "Retirar materiales", "Alineación serpentín", "Lavado con químicos",
    "Tableta charola", "Mant. compresor", "Mant. ventilador", "Mant. evaporador", "Válvula expansión",
    "Carga refrigerante", "Arranque compresor", "Sensor temperatura", "Calibración control", "Amperaje y sobrecarga",
    "Limpieza general", "Reemplazo filtros", "Motores extractores", "Motores inyectores", "Bandas y aspiradores",
    "Puesta en marcha", "Verificar funcionamiento", "Pruebas de esfuerzo"
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, fotoKey: string) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; const MAX_HEIGHT = 600;
        let width = img.width; let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          const base64Content = dataUrl.split(',')[1];
          setData(prev => ({ ...prev, fotos: { ...prev.fotos, [fotoKey]: base64Content } }));
        }
      };
      if (event.target && typeof event.target.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if(!data.sectionId || !data.client) return alert("Llena al menos la Carpeta y el Cliente en la Página 1");
    setIsSaving(true);
    try {
      const snapshot = await getDocs(collection(db, 'reports'));
      const count = snapshot.size + 1;
      const serial = `MHOS-SSM-EL-${String(count).padStart(4, '0')}`;

      const finalReport = {
        serial,
        type: type || 'Preventivo',
        jobId: currentUser.id,
        jobName: currentUser.name || currentUser.username,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        ...data
      };

      await addDoc(collection(db, 'reports'), finalReport);
      await generarExcel(finalReport);

      alert(`¡Reporte Creado Exitosamente!\nFolio: ${serial}\nEl Excel se ha descargado.`);
      onCancel();
    } catch (_err) {
      alert("Error al guardar en la nube. Intenta de nuevo.");
    }
    setIsSaving(false);
  };

  const pageTitles = ["Página 1: Generales y Equipo", "Página 2: Rutina Anexo Técnico (Checklist)", "Página 3: Evidencia Fotográfica"];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-4 gap-4">
        <div>
          <h2 className="text-3xl font-black text-indigo-900">{pageTitles[step - 1]}</h2>
          <p className="text-gray-500 text-sm font-bold mt-1">Paso {step} de 3 del formato Excel (Vista Admin)</p>
        </div>
        <button onClick={onCancel} className="text-red-600 font-bold text-sm bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">Cancelar Formato</button>
      </div>

      <div className="space-y-8 min-h-[500px]">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in">
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200 shadow-sm">
              <label className="block text-sm font-black text-indigo-900 mb-3 flex items-center gap-2"><FolderPlus className="w-5 h-5"/>1. ¿En qué Carpeta del sistema se guardará? (Obligatorio)</label>
              <select value={data.sectionId} onChange={e => setData({...data, sectionId: e.target.value})} className="w-full border p-3 rounded-xl bg-white shadow-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Despliega para elegir la carpeta --</option>
                {sections.map((s: Section) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <h3 className="font-black text-gray-800 border-b-2 border-gray-100 pb-2 mb-4 text-xl">Datos Generales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputRow label="Cliente (Obligatorio)" value={data.client} onChange={e => setData({...data, client: e.target.value})} span={2} />
                <InputRow label="Dirección" value={data.direccion} onChange={e => setData({...data, direccion: e.target.value})} span={2} />
                <InputRow label="N° Contrato" value={data.contrato} onChange={e => setData({...data, contrato: e.target.value})} />
                <InputRow label="Partida" value={data.partida} onChange={e => setData({...data, partida: e.target.value})} />
              </div>
            </div>

            <div>
              <h3 className="font-black text-gray-800 border-b-2 border-gray-100 pb-2 mb-4 text-xl">Datos del Equipo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputRow label="Equipo" value={data.equipo} onChange={e => setData({...data, equipo: e.target.value})} span={2} />
                <InputRow label="Marca" value={data.marca} onChange={e => setData({...data, marca: e.target.value})} />
                <InputRow label="Modelo" value={data.modelo} onChange={e => setData({...data, modelo: e.target.value})} />
                <InputRow label="N° Serie Equipo" value={data.numSerieEq} onChange={e => setData({...data, numSerieEq: e.target.value})} />
                <InputRow label="Folio SSM" value={data.folioSsm} onChange={e => setData({...data, folioSsm: e.target.value})} />
                <InputRow label="Ubicación" value={data.ubicacion} onChange={e => setData({...data, ubicacion: e.target.value})} span={2} />
              </div>
            </div>

            <div>
              <h3 className="font-black text-gray-800 border-b-2 border-gray-100 pb-2 mb-4 text-xl">Reporte de Servicio</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Falla Reportada</label>
                  <textarea rows={2} value={data.falla} onChange={e => setData({...data, falla: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-sm shadow-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Condiciones Iniciales</label>
                  <textarea rows={2} value={data.condiciones} onChange={e => setData({...data, condiciones: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-sm shadow-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Trabajos Realizados / Observaciones</label>
                  <textarea rows={4} value={data.trabajos} onChange={e => setData({...data, trabajos: e.target.value})} className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-sm shadow-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"></textarea>
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Refacciones Utilizadas (Máximo 4)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.refacciones.map((ref, i) => (
                      <input key={i} type="text" value={ref} onChange={e => { const newRef = [...data.refacciones]; newRef[i] = e.target.value; setData({...data, refacciones: newRef}); }} className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-sm shadow-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500" placeholder={`Refacción ${i+1}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-black text-gray-800 border-b-2 border-gray-100 pb-2 mb-4 text-xl">Equipo de Medición Utilizado</h3>
              <div className="space-y-3">
                {data.medicion.map((med, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" placeholder="Equipo" value={med.equipo} onChange={e => { const nM=[...data.medicion]; nM[i].equipo=e.target.value; setData({...data, medicion:nM})}} className="w-1/4 border border-gray-300 p-2 text-xs rounded-lg shadow-sm bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                    <input type="text" placeholder="Marca" value={med.marca} onChange={e => { const nM=[...data.medicion]; nM[i].marca=e.target.value; setData({...data, medicion:nM})}} className="w-1/4 border border-gray-300 p-2 text-xs rounded-lg shadow-sm bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                    <input type="text" placeholder="Modelo" value={med.modelo} onChange={e => { const nM=[...data.medicion]; nM[i].modelo=e.target.value; setData({...data, medicion:nM})}} className="w-1/4 border border-gray-300 p-2 text-xs rounded-lg shadow-sm bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                    <input type="text" placeholder="N° Serie" value={med.serie} onChange={e => { const nM=[...data.medicion]; nM[i].serie=e.target.value; setData({...data, medicion:nM})}} className="w-1/4 border border-gray-300 p-2 text-xs rounded-lg shadow-sm bg-gray-50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200">
               <h3 className="font-black text-slate-800 mb-4 text-lg"><Users className="w-5 h-5 inline mr-2 text-slate-500"/>Nombres y Firmas (Se aplicarán a las 3 hojas del Excel)</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <InputRow label="Nombre y Firma (Entrega)" value={data.firmaEntrega} onChange={e => setData({...data, firmaEntrega: e.target.value})} />
                  <InputRow label="Recibe / Autoriza" value={data.firmaRecibe} onChange={e => setData({...data, firmaRecibe: e.target.value})} />
                  <InputRow label="Valida" value={data.firmaValida} onChange={e => setData({...data, firmaValida: e.target.value})} />
               </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in space-y-6">
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 mb-6">
              <p className="text-indigo-900 font-bold">Marca las casillas de las acciones que realizaste. En el Excel aparecerá automáticamente una &quot;X&quot; en negritas.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
               {LISTA_CHECKLIST.map((item, index) => (
                 <label key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                    <input type="checkbox" checked={data.checklist[index]} onChange={e => {
                       const newChecks = [...data.checklist]; newChecks[index] = e.target.checked;
                       setData({...data, checklist: newChecks});
                    }} className="w-6 h-6 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5" />
                    <span className="text-sm text-gray-800 font-medium leading-tight pt-1">{item}</span>
                 </label>
               ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 shadow-sm">
               <h3 className="text-orange-900 font-black text-lg mb-2">Evidencia Fotográfica</h3>
               <p className="text-orange-800 text-sm font-medium">Sube las fotos desde tu celular. El sistema las comprimirá solas y las acomodará perfectamente en las celdas de la Página 3 del Excel.</p>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { key: 'antes1', label: 'Antes 1' }, { key: 'antes2', label: 'Antes 2' }, { key: 'antes3', label: 'Antes 3' },
                  { key: 'durante1', label: 'Durante 1' }, { key: 'durante2', label: 'Durante 2' }, { key: 'etiqueta', label: 'Foto Etiqueta' },
                  { key: 'despues1', label: 'Después 1' }, { key: 'despues2', label: 'Después 2' }
                ].map((fotoInfo) => (
                   <div key={fotoInfo.key} className="border-2 border-dashed border-gray-300 bg-gray-50 p-6 rounded-2xl text-center hover:bg-white relative transition-colors h-36 flex flex-col justify-center items-center shadow-sm">
                     {data.fotos[fotoInfo.key] ? (
                       <div className="text-green-600 font-bold text-sm flex flex-col items-center">
                         <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3 shadow-sm"><CheckSquare className="w-6 h-6"/></div>
                         ¡Foto Lista!
                       </div>
                     ) : (
                       <div className="text-gray-500 font-bold text-sm flex flex-col items-center">
                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-200"><Camera className="w-6 h-6 text-gray-400"/></div>
                         {fotoInfo.label}
                       </div>
                     )}
                     <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, fotoInfo.key)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   </div>
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-8 border-t mt-8">
        <button onClick={() => setStep(step - 1)} disabled={step === 1} className="px-6 py-3 bg-gray-100 text-gray-600 font-black rounded-xl disabled:opacity-0 hover:bg-gray-200 transition-colors shadow-sm">
          Atrás
        </button>
        
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} className="px-10 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all">
            Siguiente Página
          </button>
        ) : (
          <button onClick={handleSave} disabled={isSaving} className="px-8 py-4 bg-green-600 text-white font-black text-lg rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/30 flex items-center gap-2 transition-all">
            {isSaving ? 'Guardando Reporte...' : <><Save className="w-6 h-6"/> Terminar y Descargar Excel</>}
          </button>
        )}
      </div>
    </div>
  );
}