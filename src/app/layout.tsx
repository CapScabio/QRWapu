import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wapu POS | Cero Fricción',
  description: 'El Punto de Venta Lightning para comercios. Sin KYC, cobras en ARS directo a tu CBU.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {children}
        <footer className="footer-signature">
          Creado por el <span>Capitan del Escabio</span>
        </footer>
      </body>
    </html>
  );
}
