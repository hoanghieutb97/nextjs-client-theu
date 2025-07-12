import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator = ({ password, size = 200 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (password && canvasRef.current) {
            // Tạo QR code từ mật khẩu
            QRCode.toCanvas(canvasRef.current, password, {
                width: size,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }).catch(err => {
                console.error('Error generating QR code:', err);
            });
        }
    }, [password, size]);

    if (!password) {
        return <div>Không có mật khẩu để tạo QR code</div>;
    }

    return (
        <div style={{ textAlign: 'center', margin: '10px 0' }}>
            <canvas ref={canvasRef} />
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                Mật khẩu: {password}
            </div>
        </div>
    );
};

export default QRCodeGenerator; 