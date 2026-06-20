// Icônes SVG (style ligne, héritent de la couleur via currentColor).
const S = ({ children, size = 22, stroke = 'currentColor', fill = 'none', sw = 2, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);

export const Pill = (p) => <S {...p}><path d="M10.5 20.5 4 14a4.95 4.95 0 0 1 7-7l6.5 6.5a4.95 4.95 0 0 1-7 7Z" /><path d="m8.5 8.5 7 7" /></S>;
export const Scan = (p) => <S {...p}><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></S>;
export const Search = (p) => <S {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></S>;
export const Camera = (p) => <S {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" /><circle cx="12" cy="13" r="3" /></S>;
export const Box = (p) => <S {...p}><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M12 11v6M9 14h6" /></S>;
export const Pin = (p) => <S {...p}><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><path d="M9 9h6M12 6v6" /></S>;
export const Phone = (p) => <S {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></S>;
export const Chevron = (p) => <S {...p}><path d="m9 18 6-6-6-6" /></S>;
export const ChevronLeft = (p) => <S {...p}><path d="m15 18-6-6 6-6" /></S>;
export const FileText = (p) => <S {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></S>;
export const Plus = (p) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const Trash = (p) => <S {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></S>;
export const Shield = (p) => <S {...p}><path d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5Z" /><path d="m9 12 2 2 4-4" /></S>;
export const Alert = (p) => <S {...p}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></S>;
export const Star = (p) => <S {...p}><path d="m12 2 2.9 6.3 6.6.7-4.9 4.4 1.4 6.5L12 17l-5.9 2.9 1.4-6.5L2.6 9l6.6-.7L12 2z" /></S>;
export const Help = (p) => <S {...p}><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></S>;
export const Check = (p) => <S {...p}><circle cx="12" cy="12" r="10" /><path d="m8.5 12 2.5 2.5 4.5-5" /></S>;
