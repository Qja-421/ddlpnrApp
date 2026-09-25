import React, { useState } from 'react';

export interface RepublicSealProps {
  className?: string;
  size?: number;
  variant?: 'armoirie' | 'logo-ddl' | 'both';
  showLabel?: boolean;
}

/**
 * Armoiries officielles de la République du Congo
 * (Éléphants noirs, lion rouge tenant le flambeau, couronne crénelée, devise Unité Travail Progrès)
 */
export const ArmoiriesCongo: React.FC<{ size?: number; className?: string }> = ({
  size = 48,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    // Fallback SVG if image is blocked
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative shrink-0 rounded-lg overflow-hidden bg-gradient-to-b from-[#fef08a] to-[#ca8a04] p-1 flex items-center justify-center shadow-sm ${className}`}
        title="Armoiries de la République du Congo"
      >
        <span className="material-symbols-outlined text-[24px] text-[#854d0e]">shield</span>
      </div>
    );
  }

  return (
    <img
      src="/armoirie_congo.jpg"
      alt="Armoiries de la République du Congo"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      style={{ width: size, height: size }}
      className={`shrink-0 object-contain drop-shadow-sm ${className}`}
      title="Armoiries Officielles de la République du Congo"
    />
  );
};

/**
 * Logo Officiel de la Direction Départementale des Loisirs de Pointe-Noire (DDLPNR)
 * (Djembé central, silhouettes dansantes festives, toit traditionnel, mention Direction Départementale des Loisirs de Pointe-Noire)
 */
export const LogoDDLPN: React.FC<{ size?: number; className?: string }> = ({
  size = 48,
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative shrink-0 rounded-lg overflow-hidden bg-[#004528] p-1 flex items-center justify-center shadow-sm ${className}`}
        title="Logo Officiel DDL-PN"
      >
        <span className="material-symbols-outlined text-[24px] text-[#ffe082]">celebration</span>
      </div>
    );
  }

  return (
    <img
      src="/logo_ddl_pnr.jpg"
      alt="Logo Officiel Direction Départementale des Loisirs de Pointe-Noire"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      style={{ width: size, height: size }}
      className={`shrink-0 object-contain rounded-lg drop-shadow-sm ${className}`}
      title="Logo Officiel de la Direction Départementale des Loisirs de Pointe-Noire (DDLPNR)"
    />
  );
};

/**
 * Sceau / Logo Régalien officiel unifié
 * Remplace tout ancien faux logo par l'Armoirie officielle et/ou le Logo de la DDLPNR
 */
export const RepublicSeal: React.FC<RepublicSealProps> = ({
  className = '',
  size = 48,
  variant = 'armoirie',
}) => {
  if (variant === 'logo-ddl') {
    return <LogoDDLPN size={size} className={className} />;
  }

  if (variant === 'both') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <ArmoiriesCongo size={size} />
        <LogoDDLPN size={size} />
      </div>
    );
  }

  // Default: Official Armoiries of the Republic of the Congo
  return <ArmoiriesCongo size={size} className={className} />;
};
