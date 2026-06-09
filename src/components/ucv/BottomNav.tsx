// Componente de navegación inferior Cloud UCV
import type { FC, ReactElement } from 'react';
import type { TabNavegacion } from '@/types/types';

interface BottomNavProps {
  tabActivo: TabNavegacion;
  onTabChange: (tab: TabNavegacion) => void;
}

const tabs: { id: TabNavegacion; label: string; icon: ReactElement }[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'explorar',
    label: 'Explorar',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'calendario',
    label: 'Calendario',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="8" cy="15" r="1" fill="currentColor"/>
        <circle cx="12" cy="15" r="1" fill="currentColor"/>
        <circle cx="16" cy="15" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'perfil',
    label: 'Perfil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M4 20C4 17.24 7.58 15 12 15C16.42 15 20 17.24 20 20"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const BottomNav: FC<BottomNavProps> = ({ tabActivo, onTabChange }) => {
  return (
    <nav className="ucv-nav-bg border-t border-white/10 flex items-center justify-around py-2 px-2 safe-area-pb">
      {tabs.map((tab) => {
        const activo = tabActivo === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center gap-1 min-w-[56px] py-1 px-2 rounded-xl transition-all active:scale-90"
          >
            {/* Ícono con fondo activo */}
            <div
              className="rounded-xl p-1.5 transition-all"
              style={activo ? { background: 'linear-gradient(135deg, #d946ef, #a855f7)' } : {}}
            >
              <span
                style={{ color: activo ? '#ffffff' : 'rgba(255,255,255,0.5)' }}
                className="transition-colors"
              >
                {tab.icon}
              </span>
            </div>
            <span
              className="text-[10px] font-medium transition-colors"
              style={{ color: activo ? '#ffffff' : 'rgba(255,255,255,0.5)' }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
