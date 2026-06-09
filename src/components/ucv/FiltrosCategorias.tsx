// Componente de filtros de categoría con scroll horizontal
import type { FC, ReactElement } from 'react';
import type { Categoria } from '@/types/types';

interface FiltroCategoriasProps {
  categoriaActiva: Categoria;
  onCategoriaChange: (cat: Categoria) => void;
}

const categorias: { id: Categoria; label: string; icon: ReactElement }[] = [
  {
    id: 'Todos',
    label: 'Todos',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'Académicos',
    label: 'Académicos',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'Culturales',
    label: 'Culturales',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
        <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    id: 'Deportivos',
    label: 'Deportivos',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 2C12 2 8 7 8 12C8 17 12 22 12 22" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 2C12 2 16 7 16 12C16 17 12 22 12 22" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'Comerciales',
    label: 'Comerciales',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const FiltrosCategorias: FC<FiltroCategoriasProps> = ({ categoriaActiva, onCategoriaChange }) => {
  const totalCats = categorias.length;
  const idxActivo = categorias.findIndex((c) => c.id === categoriaActiva);
  const progreso = ((idxActivo + 1) / totalCats) * 100;

  return (
    <div className="px-4 pt-2 pb-3">
      {/* Pills scrollables */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {categorias.map((cat) => {
          const activo = categoriaActiva === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoriaChange(cat.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 shrink-0"
              style={
                activo
                  ? { background: 'linear-gradient(135deg, #d946ef, #a855f7)', color: '#fff' }
                  : { backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.15)' }
              }
            >
              <span style={{ color: activo ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                {cat.icon}
              </span>
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Barra de progreso */}
      <div className="flex items-center gap-2 mt-1 px-1">
        <div className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
        <div className="flex-1 h-1 rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progreso}%`, background: 'linear-gradient(90deg, #d946ef, #a855f7)' }}
          />
        </div>
        <div className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
      </div>
    </div>
  );
};

export default FiltrosCategorias;
