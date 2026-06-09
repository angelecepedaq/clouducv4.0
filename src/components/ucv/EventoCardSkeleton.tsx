// Skeleton de carga para EventoCard
import type { FC } from 'react';

const EventoCardSkeleton: FC = () => {
  return (
    <div className="rounded-2xl overflow-hidden ucv-card-bg mb-4 animate-pulse">
      {/* Imagen skeleton */}
      <div className="w-full h-44 bg-muted" />

      {/* Contenido skeleton */}
      <div className="px-4 py-3">
        {/* Título */}
        <div className="h-4 bg-muted rounded-full w-3/4 mb-3" />

        {/* Fecha */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-muted rounded-full shrink-0" />
          <div className="h-3 bg-muted rounded-full w-40" />
        </div>

        {/* Asistentes + bookmark */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-muted border-2" style={{ borderColor: 'hsl(258 50% 28%)' }} />
              <div className="w-6 h-6 rounded-full bg-muted border-2" style={{ borderColor: 'hsl(258 50% 28%)' }} />
              <div className="w-6 h-6 rounded-full bg-muted border-2" style={{ borderColor: 'hsl(258 50% 28%)' }} />
            </div>
            <div className="h-3 bg-muted rounded-full w-8" />
          </div>
          <div className="w-8 h-8 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
};

export default EventoCardSkeleton;
