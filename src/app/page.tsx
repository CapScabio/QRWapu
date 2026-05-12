'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Wallet, Zap, ArrowRight, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [storeName, setStoreName] = useState('');
  const [cbu, setCbu] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !cbu) return;
    
    // In a real app, we would save this to a DB and get an ID.
    // For the hackathon, we'll encode it in the URL or use a simple slug
    const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Normally we'd save the CBU securely, but for the demo we'll just pass it
    // WARNING: Don't do this in production!
    localStorage.setItem(`store_${slug}`, JSON.stringify({ name: storeName, cbu }));
    
    router.push(`/pos/${slug}`);
  };

  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 2rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '4rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(255, 51, 51, 0.1)', padding: '1rem', borderRadius: '50%' }}>
            <Zap size={48} color="var(--accent)" />
          </div>
        </div>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }}>
          Cobra en Lightning,<br/>
          <span className="gradient-text">Recibe en Pesos.</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--scalar-color-2)', maxWidth: '600px', margin: '0 auto' }}>
          El primer Punto de Venta (POS) Cero Fricción. Sin apps, sin KYC, sin entender de cripto. Solo tu CBU.
        </p>
      </motion.div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <motion.div 
          className="glass-panel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ padding: '3rem', flex: '1', minWidth: '300px', maxWidth: '500px' }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store color="var(--dark-accent)" />
            Crea tu QR Estático
          </h2>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="label">Nombre de tu comercio</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ej: Panadería Don Carlos"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="label">Alias / CBU Bancario (donde recibes los pesos)</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="ej: don.carlos.mp"
                value={cbu}
                onChange={(e) => setCbu(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
              <QrCode size={20} />
              Generar mi POS Web
            </button>
          </form>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ flex: '1', minWidth: '300px', maxWidth: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2rem' }}
        >
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(153, 0, 0, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <QrCode size={24} color="var(--dark-accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>1. Imprimes el QR</h3>
              <p style={{ color: 'var(--scalar-color-2)', lineHeight: 1.5 }}>Te damos un link web que conviertes en QR. Lo pegas en tu mostrador.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(255, 51, 51, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Zap size={24} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>2. El cliente paga en ARS</h3>
              <p style={{ color: 'var(--scalar-color-2)', lineHeight: 1.5 }}>Escanea con su cámara normal, ingresa el monto en pesos y paga con Lightning.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Wallet size={24} color="var(--success)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>3. Recibes en tu Banco</h3>
              <p style={{ color: 'var(--scalar-color-2)', lineHeight: 1.5 }}>WapuPay transfiere los pesos exactos a tu CBU automáticamente. Fin.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
