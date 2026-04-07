"use client";

import React from 'react';
import { FolderPlus, FileText, Users, MessageSquare, LogOut, FileSpreadsheet, X } from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isOpen?: boolean; // Lo hacemos opcional para evitar crasheos
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ currentUser, onLogout, activeTab, setActiveTab, isOpen = false, setIsOpen }: SidebarProps) {
  
  const handleNav = (tab: string) => {
    setActiveTab(tab);
    // Verificamos que la función exista antes de llamarla (solución al error)
    if (setIsOpen) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Fondo oscuro para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen && setIsOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl transition-transform duration-300 ease-out
        md:relative md:translate-x-0 border-r border-slate-800
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <FileSpreadsheet className="text-white w-6 h-6" />
            </div>
            <span className="text-white font-black text-2xl tracking-tight">ReportSys</span>
          </div>
          <button onClick={() => setIsOpen && setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {currentUser.role === 'admin' ? (
            <>
              <NavItem icon={<FileText />} label="Buzón de Reportes" active={activeTab === 'buzon'} onClick={() => handleNav('buzon')} />
              <NavItem icon={<FileSpreadsheet />} label="Hacer Reporte" active={activeTab === 'hacer_reporte' || activeTab === 'form'} onClick={() => handleNav('hacer_reporte')} />
              <NavItem icon={<FolderPlus />} label="Gestión Secciones" active={activeTab === 'secciones'} onClick={() => handleNav('secciones')} />
              <NavItem icon={<Users />} label="Usuarios y Accesos" active={activeTab === 'usuarios'} onClick={() => handleNav('usuarios')} />
              <NavItem icon={<MessageSquare />} label="Chat con Jobs" active={activeTab === 'chat'} onClick={() => handleNav('chat')} />
            </>
          ) : (
            <>
              <NavItem icon={<FileSpreadsheet />} label="Hacer Formatos" active={activeTab === 'menu' || activeTab === 'form'} onClick={() => handleNav('menu')} />
              <NavItem icon={<MessageSquare />} label="Soporte (Chat)" active={activeTab === 'chat'} onClick={() => handleNav('chat')} />
            </>
          )}
        </nav>

        <div className="p-4 m-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4 px-2">
             <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-black text-lg border border-indigo-500/30">
               {(currentUser.name || 'U').charAt(0).toUpperCase()}
             </div>
             <div className="overflow-hidden flex-1">
               <p className="text-sm font-bold text-white truncate">{currentUser.name || 'Usuario'}</p>
               <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{currentUser.role}</p>
             </div>
          </div>
          <button onClick={onLogout} className="flex items-center justify-center gap-3 w-full p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 text-sm font-bold transition-all border border-transparent hover:border-red-500/20">
            <LogOut className="w-4 h-4" /><span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactElement, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 text-sm text-left group ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold' : 'hover:bg-slate-800/50 hover:text-white text-slate-400 font-semibold'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { 
  className: `w-5 h-5 transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}` 
})}
      <span>{label}</span>
    </button>
  );
}