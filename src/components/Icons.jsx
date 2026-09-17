/**
 * DILICARDS — tiny inline SVG icon set (replaces all emoji in the UI).
 * 24×24 stroke icons, inherit currentColor.
 */
function I({ size=20, children, ...rest }){
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" {...rest}
    >
      {children}
    </svg>
  );
}

export const IconGame   = p => <I {...p}><path d="M6 11h4M8 9v4"/><circle cx="15.5" cy="10.5" r=".9" fill="currentColor" stroke="none"/><circle cx="17.5" cy="12.5" r=".9" fill="currentColor" stroke="none"/><path d="M17.3 5H6.7a4.7 4.7 0 0 0-4.6 5.6l.9 4.6a3 3 0 0 0 5.3 1.2L10 14h4l1.7 2.4a3 3 0 0 0 5.3-1.2l.9-4.6A4.7 4.7 0 0 0 17.3 5Z"/></I>;
export const IconLink   = p => <I {...p}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></I>;
export const IconCopy   = p => <I {...p}><rect x="9" y="9" width="12" height="12" rx="3"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></I>;
export const IconShare  = p => <I {...p}><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></I>;
export const IconHome   = p => <I {...p}><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 21v-8h6v8"/></I>;
export const IconSound  = p => <I {...p}><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></I>;
export const IconMute   = p => <I {...p}><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m16 9 6 6"/><path d="m22 9-6 6"/></I>;
export const IconClose  = p => <I {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></I>;
export const IconRefresh= p => <I {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></I>;
export const IconDownload = p => <I {...p}><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></I>;
export const IconTrophy = p => <I {...p}><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v6a5 5 0 0 1-10 0Z"/><path d="M7 6H4a2 2 0 0 0 2 4h1"/><path d="M17 6h3a2 2 0 0 1-2 4h-1"/></I>;
export const IconPencil = p => <I {...p}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></I>;
export const IconUsers  = p => <I {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/></I>;
export const IconClock  = p => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></I>;
export const IconSpark  = p => <I {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></I>;
export const IconEye    = p => <I {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></I>;
export const IconEyeOff = p => <I {...p}><path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.2 3.2M6.6 6.6A18 18 0 0 0 2 12s3.5 7 10 7a9.9 9.9 0 0 0 4.4-1"/><path d="m2 2 20 20"/></I>;
