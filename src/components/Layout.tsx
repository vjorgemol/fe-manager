import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Users, Building2, Briefcase, Mail, LayoutDashboard, Settings as SettingsIcon, Menu, X, LogOut, MapPin } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { schoolName, setSchoolName, academicYear, setAcademicYear } = useData();
  const { logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Alumnos' },
    { to: '/companies', icon: Building2, label: 'Empresas' },
    { to: '/placements', icon: Briefcase, label: 'Formación' },
    { to: '/communications', icon: Mail, label: 'Comunicaciones' },
    { to: '/visits', icon: MapPin, label: 'Rutas y Visitas' },
    { to: '/settings', icon: SettingsIcon, label: 'Ajustes' },
  ];

  return (
    <div className="flex h-screen print:h-auto print:min-h-screen bg-zinc-50 overflow-hidden print:overflow-visible print:bg-white">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200">
          <div className="flex items-center">
            <Briefcase className="text-primary-600 mr-2" size={24} />
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">FE Connect</h1>
          </div>
          <button 
            className="lg:hidden p-2 text-zinc-400 hover:text-zinc-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`
              }
            >
              <item.icon className="mr-3" size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-6 border-t border-zinc-100">
          <button 
            onClick={logout}
            className="flex items-center text-sm font-medium text-zinc-500 hover:text-red-600 transition-colors mb-6 w-full text-left"
          >
            <LogOut size={16} className="mr-2" />
            Cerrar Sesión
          </button>
          <a 
            href="mailto:vicdejor@posteo.net"
            className="group block"
          >
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 group-hover:text-primary-500 transition-colors">Desarrollado por</p>
            <p className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">Víctor Jorge Molina</p>
          </a>
          <a 
            href="https://antigravityai.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-3 block text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Hecho con <span className="font-semibold">Antigravity</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:block">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200 flex items-center px-4 lg:px-8 z-10 print:hidden">
          <button 
            className="lg:hidden p-2 mr-2 text-zinc-500 hover:text-zinc-900 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="lg:hidden font-bold text-zinc-900 truncate">FE Connect</h2>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="text-sm font-bold text-primary-700 bg-primary-50 border-none focus:ring-0 outline-none hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <option value="25/26">Curso 25/26</option>
              <option value="26/27">Curso 26/27</option>
              <option value="27/28">Curso 27/28</option>
              <option value="28/29">Curso 28/29</option>
              <option value="29/30">Curso 29/30</option>
            </select>
            <div className="h-6 w-px bg-zinc-200"></div>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Nombre del centro educativo"
              className="text-sm font-medium text-zinc-600 bg-transparent border-none focus:ring-0 text-right outline-none hover:bg-zinc-100 px-3 py-1.5 rounded-lg transition-colors"
              title="Haz clic para editar el nombre de tu centro"
            />
          </div>
        </header>

        <div id="main-scroll-container" className="flex-1 overflow-auto p-4 lg:p-8 print:p-0 print:overflow-visible print:block">
          <div className="max-w-6xl mx-auto print:max-w-none print:mx-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
