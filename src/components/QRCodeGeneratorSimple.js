import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCodeGeneratorSimple({ value, size = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, { width: size, margin: 1 }, (error) => {
        if (error) console.error(error);
      });
    }
  }, [value, size]);

  return <canvas ref={canvasRef} style={{ width: size, height: size, display: 'block' }} />;
} 