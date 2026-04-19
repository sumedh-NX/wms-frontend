import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

/**
 * Props:
 *   onScan(text) – called with the raw QR string when scanning succeeds.
 *
 * The component renders a `<div id="qr-scanner">` that the library turns into a camera view.
 * It starts the camera automatically and stops after the first successful scan.
 */
type CameraScannerProps = {
  onScan: (text: string) => void;
};

export default function CameraScanner({ onScan }: CameraScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    };

    // The scanner will create a child element inside the div with id="qr-scanner"
    const scanner = new Html5QrcodeScanner('qr-scanner', config, false);

    // `onSuccess` fires when a QR code is read
    scanner.render(
      (decodedText: string) => {
        // pass the raw string back to the parent component
        onScan(decodedText);
        // Stop the scanner after the first read (to avoid double‑scans)
        scanner.clear().catch(console.error);
      },
      (errorMessage: string) => {
        // Errors are common while the camera searches; we just log them.
        console.debug('QR scan error:', errorMessage);
      }
    );

    // Cleanup if the component unmounts
    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  // The library expects an element with ID "qr-scanner"
  return <div id="qr-scanner" ref={scannerRef} style={{ width: '100%' }} />;
}
