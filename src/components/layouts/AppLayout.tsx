// Layout principal de Cloud UCV con navegación inferior
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FC } from 'react';
import type { TabNavegacion } from '@/types/types';
import Header from '@/components/ucv/Header';
import BottomNav from '@/components/ucv/BottomNav';
import InicioPagina from '@/pages/InicioPagina';
import ExplorarPagina from '@/pages/ExplorarPagina';
import CalendarioPagina from '@/pages/CalendarioPagina';
import PerfilPagina from '@/pages/PerfilPagina';
import DetalleEventoPagina from '@/pages/DetalleEventoPagina';

const AppLayout: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tabActivo, setTabActivo] = useState<TabNavegacion>('inicio');
  
  // Revisamos si hay un evento en la URL al iniciar
  const [detalleEventoId, setDetalleEventoId] = useState<string | null>(
    searchParams.get('evento')
  );

  useEffect(() => {
    const id = searchParams.get('evento');
    if (id) {
      setDetalleEventoId(id);
    }
  }, [searchParams]);

  const handleVerDetalle = (id: string) => {
    setSearchParams({ evento: id });
    setDetalleEventoId(id);
  };
  
  const handleVolverDetalle = () => {
    setSearchParams({});
    setDetalleEventoId(null);
  };

  const renderPagina = () => {
    // Detalle de evento tiene prioridad sobre cualquier tab
    if (detalleEventoId) {
      return (
        <DetalleEventoPagina
          eventoId={detalleEventoId}
          onVolver={handleVolverDetalle}
        />
      );
    }
    switch (tabActivo) {
      case 'inicio':
        return <InicioPagina onVerDetalle={handleVerDetalle} />;
      case 'explorar':
        return <ExplorarPagina onVerDetalle={handleVerDetalle} />;
      case 'calendario':
        return <CalendarioPagina />;
      case 'perfil':
        return <PerfilPagina />;
      default:
        return <InicioPagina onVerDetalle={handleVerDetalle} />;
    }
  };

  const handleTabChange = (tab: TabNavegacion) => {
    // Salir del detalle al cambiar de tab
    setSearchParams({});
    setDetalleEventoId(null);
    setTabActivo(tab);
  };

  return (
    // Centrado en escritorio, móvil ocupando todo el ancho
    <div className="min-h-screen w-full flex items-start justify-center ucv-bg">
      <div
        className="relative flex flex-col w-full md:max-w-[390px] md:min-h-screen"
        style={{ backgroundColor: 'hsl(258 62% 25%)' }}
      >
        {/* Header fijo */}
        <Header />

        {/* Contenido principal scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ paddingBottom: '72px' }}>
          <div className="flex-1 overflow-y-auto min-w-0 hide-scrollbar">
            {renderPagina()}
          </div>
        </div>

        {/* Navegación inferior fija */}
        <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-auto md:w-[390px] z-50">
          <BottomNav tabActivo={tabActivo} onTabChange={handleTabChange} />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
