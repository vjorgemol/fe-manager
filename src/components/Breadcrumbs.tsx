import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const Breadcrumbs: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const [editingName, setEditingName] = useState<string | null>(null);

  useEffect(() => {
    const handleEditing = (e: Event) => {
      const customEvent = e as CustomEvent;
      setEditingName(customEvent.detail?.name || null);
    };
    window.addEventListener('editing-element', handleEditing);
    return () => window.removeEventListener('editing-element', handleEditing);
  }, []);

  // Reset editingName when location pathname changes (navigating between pages)
  useEffect(() => {
    setEditingName(null);
  }, [location.pathname]);

  const handleBreadcrumbClick = (path: string) => {
    window.dispatchEvent(new CustomEvent('breadcrumb-click', { detail: { path } }));
  };

  const getRouteLabel = (val: string) => {
    if (val === 'students') return t('nav.students');
    if (val === 'companies') return t('nav.companies');
    if (val === 'placements') return t('nav.placements');
    if (val === 'communications') return t('nav.communications');
    if (val === 'tools') return t('nav.tools');
    if (val === 'settings') return t('nav.settings');
    return val.charAt(0).toUpperCase() + val.slice(1);
  };

  return (
    <nav 
      className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-zinc-500 mb-4 sm:mb-6 print:hidden" 
      aria-label="Breadcrumbs"
    >
      <Link
        to="/"
        onClick={() => handleBreadcrumbClick('/')}
        className="flex items-center gap-1 text-zinc-400 hover:text-primary-600 transition-colors duration-200"
      >
        <Home size={16} className="shrink-0" />
        <span className="font-medium hidden sm:inline">{t('nav.home')}</span>
      </Link>
      
      {(pathnames.length > 0 || editingName) && (
        <ChevronRight size={14} className="text-zinc-300 shrink-0 sm:hidden" />
      )}
      {(pathnames.length > 0 || editingName) && (
        <span className="font-medium text-zinc-400 sm:hidden">...</span>
      )}
      
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1 && !editingName;
        const label = getRouteLabel(value);

        return (
          <React.Fragment key={to}>
            <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-2">
              <ChevronRight size={14} className="text-zinc-300 shrink-0" />
              {isLast ? (
                <Link
                  to={to}
                  onClick={() => handleBreadcrumbClick(to)}
                  className="font-semibold text-zinc-800 hover:text-primary-600 transition-colors duration-200 truncate max-w-[150px] sm:max-w-none"
                >
                  {label}
                </Link>
              ) : (
                <Link
                  to={to}
                  onClick={() => handleBreadcrumbClick(to)}
                  className="hover:text-primary-600 transition-colors duration-200 font-medium truncate max-w-[150px] sm:max-w-none"
                >
                  {label}
                </Link>
              )}
            </div>

            {isLast && (
              <div className="flex sm:hidden items-center space-x-1.5">
                <ChevronRight size={14} className="text-zinc-300 shrink-0" />
                <Link
                  to={to}
                  onClick={() => handleBreadcrumbClick(to)}
                  className="font-semibold text-zinc-800 hover:text-primary-600 transition-colors duration-200 truncate max-w-[180px]"
                >
                  {label}
                </Link>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {editingName && (
        <>
          <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-2">
            <ChevronRight size={14} className="text-zinc-300 shrink-0" />
            <span className="font-semibold text-zinc-800 select-none truncate max-w-[200px] sm:max-w-none">
              {editingName}
            </span>
          </div>

          <div className="flex sm:hidden items-center space-x-1.5">
            <ChevronRight size={14} className="text-zinc-300 shrink-0" />
            <span className="font-semibold text-zinc-800 select-none truncate max-w-[180px]">
              {editingName}
            </span>
          </div>
        </>
      )}
    </nav>
  );
};
