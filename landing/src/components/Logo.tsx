// Traços engrossam conforme o ícone encolhe (ver design_handoff): abaixo de 27px o
// "parafuso" central some porque deixa de ser legível nesse tamanho.
function escalaDoTraco(tamanho: number) {
  if (tamanho >= 52) return { bolha: 2.6, hastes: 2.8, parafuso: true };
  if (tamanho >= 36) return { bolha: 3.0, hastes: 3.2, parafuso: true };
  if (tamanho >= 24) return { bolha: 3.4, hastes: 3.6, parafuso: false };
  return { bolha: 4.0, hastes: 4.2, parafuso: false };
}

interface LogoProps {
  tamanho?: number;
  corTraco?: string;
  corAcento?: string;
}

export function Logo({ tamanho = 24, corTraco = '#F5F5F3', corAcento = '#0FBFA0' }: LogoProps) {
  const { bolha, hastes, parafuso } = escalaDoTraco(tamanho);

  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 48 48" fill="none">
      <path
        d="M17 10 H31 A9 9 0 0 1 40 19 V26 A9 9 0 0 1 31 35 H21 L12 42 L14 35 A9 9 0 0 1 8 26 V19 A9 9 0 0 1 17 10 Z"
        stroke={corTraco}
        strokeWidth={bolha}
        strokeLinejoin="round"
      />
      <path
        d="M16.5 20.5 L23.5 30.5"
        stroke={corAcento}
        strokeWidth={hastes}
        strokeLinecap="round"
      />
      <path
        d="M32.5 15 L19.5 30.5"
        stroke={corAcento}
        strokeWidth={hastes}
        strokeLinecap="round"
      />
      {parafuso && <circle cx="21.3" cy="27.6" r="1.5" fill="#1B1B1F" />}
    </svg>
  );
}
