import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

/**
 * Ouvre la caméra et détecte un code-barres.
 * Props :
 *   onDetected(code: string) — appelé dès qu'un code est lu
 *   onClose()               — demande de fermeture
 */
export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startScan() {
      // Préférence : caméra arrière sur mobile
      const constraints = { video: { facingMode: { ideal: 'environment' } } };

      try {
        // Tente BarcodeDetector natif en premier (plus rapide)
        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);

          const scan = async () => {
            if (cancelled || !videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                stream.getTracks().forEach(t => t.stop());
                onDetected(codes[0].rawValue);
                return;
              }
            } catch (_) {}
            requestAnimationFrame(scan);
          };
          requestAnimationFrame(scan);

          controlsRef.current = { stop: () => stream.getTracks().forEach(t => t.stop()) };
          return;
        }

        // Fallback : @zxing/browser (fonctionne sur Firefox / Safari)
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const backCam = devices.find(d => /back|rear|environment/i.test(d.label)) || devices[0];
        const deviceId = backCam ? backCam.deviceId : undefined;

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err, ctrl) => {
            if (cancelled) { ctrl.stop(); return; }
            if (result) {
              ctrl.stop();
              onDetected(result.getText());
            }
          }
        );
        controlsRef.current = controls;
        setReady(true);
      } catch (e) {
        if (!cancelled) {
          if (e.name === 'NotAllowedError') setError('Accès caméra refusé. Autorisez la caméra dans les paramètres de votre navigateur.');
          else if (e.name === 'NotFoundError') setError('Aucune caméra détectée sur cet appareil.');
          else setError('Impossible d\'ouvrir la caméra : ' + e.message);
        }
      }
    }

    startScan();

    return () => {
      cancelled = true;
      controlsRef.current?.stop?.();
    };
  }, []);

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Scanner un code-barres</span>
          <button style={closeBtn} onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {error ? (
          <div style={errorBox}>
            <p style={{ margin: 0, fontSize: 14, color: '#E24B4A' }}>{error}</p>
            <button style={cancelBtn} onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <>
            <div style={viewfinder}>
              <video ref={videoRef} style={video} muted playsInline />
              {!ready && <div style={loadingOverlay}>Ouverture de la caméra…</div>}
              <div style={crosshair} />
            </div>
            <p style={hint}>Pointez le code-barres dans le cadre — la détection est automatique.</p>
            <button style={cancelBtn} onClick={onClose}>Annuler</button>
          </>
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 16,
};
const modal = {
  background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420,
  overflow: 'hidden', display: 'flex', flexDirection: 'column',
};
const header = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 16px', borderBottom: '1px solid #E8EBE8',
};
const closeBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 18, color: '#666', lineHeight: 1, padding: 4,
};
const viewfinder = {
  position: 'relative', background: '#000',
  aspectRatio: '4/3', overflow: 'hidden',
};
const video = {
  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
};
const loadingOverlay = {
  position: 'absolute', inset: 0, display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  color: '#fff', fontSize: 14, background: 'rgba(0,0,0,0.5)',
};
const crosshair = {
  position: 'absolute',
  top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '60%', height: '28%',
  border: '2px solid rgba(255,255,255,0.8)',
  borderRadius: 6,
  boxShadow: '0 0 0 2000px rgba(0,0,0,0.3)',
  pointerEvents: 'none',
};
const hint = {
  margin: 0, padding: '10px 16px', fontSize: 13,
  color: '#666', textAlign: 'center',
};
const cancelBtn = {
  margin: '0 16px 16px', padding: '10px 0', borderRadius: 10,
  background: '#F4F6F4', border: 'none', cursor: 'pointer',
  fontSize: 14, fontWeight: 500, color: '#333',
};
const errorBox = {
  padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
};
