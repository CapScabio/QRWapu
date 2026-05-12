'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Zap, CheckCircle2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PosPage({ params }: { params: { storeId: string } }) {
  const router = useRouter();
  const [storeInfo, setStoreInfo] = useState<{ name: string; cbu: string } | null>(null);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // This simulates the backend call to generate the invoice
  const [invoice, setInvoice] = useState<{ pr: string, sats: number } | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    // Fetch from our local storage hack
    const data = localStorage.getItem(`store_${params.storeId}`);
    if (data) {
      setStoreInfo(JSON.parse(data));
    } else {
      // Fallback if not found
      setStoreInfo({ name: 'Comercio ' + params.storeId, cbu: 'alias.fake' });
    }
  }, [params.storeId]);

  const handleAmountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountArs: Number(amount), cbu: storeInfo?.cbu })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInvoice({
        pr: data.pr,
        sats: data.sats
      });
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };


  const handleSimulatePayment = async () => {
    // In a real flow, we would poll /api/status until the invoice is paid.
    // Here we simulate the user confirming they paid.
    setIsPaid(true);
    
    try {
      await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountArs: Number(amount), cbu: storeInfo?.cbu })
      });
    } catch (err) {
      console.error(err);
    }
  };


  if (!storeInfo) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      
      <AnimatePresence mode="wait">
        {!invoice && !isPaid && (
          <motion.div 
            key="input"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel"
            style={{ padding: '3rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}
          >
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
              <Store size={40} color="var(--foreground)" />
            </div>
            
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Estás pagando en
            </h1>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }} className="gradient-text">
              {storeInfo.name}
            </h2>

            <form onSubmit={handleAmountSubmit}>
              <div className="amount-input-wrapper" style={{ marginBottom: '2rem' }}>
                <span className="amount-input-prefix">$</span>
                <input
                  type="number"
                  className="amount-input"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%' }}
                disabled={isProcessing || !amount}
              >
                {isProcessing ? (
                  'Generando QR...'
                ) : (
                  <>
                    Continuar al Pago <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}

        {invoice && !isPaid && (
          <motion.div 
            key="invoice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel"
            style={{ padding: '3rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Total a pagar</h2>
            <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              ${amount} ARS
            </div>
            <div style={{ color: 'var(--scalar-color-2)', marginBottom: '2rem' }}>
              ≈ {invoice.sats.toLocaleString()} Sats
            </div>

            {/* Fake QR Code */}
            <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '2rem' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=lightning:${invoice.pr}`} 
                alt="Lightning Invoice QR" 
                width={250} 
                height={250}
                style={{ borderRadius: '8px' }}
              />
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginBottom: '1rem' }}
              onClick={handleSimulatePayment}
            >
              <Zap size={20} /> Pagar con mi Wallet
            </button>
            <button 
              className="btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => setInvoice(null)}
            >
              Cancelar
            </button>
          </motion.div>
        )}

        {isPaid && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel"
            style={{ padding: '4rem 3rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              style={{ display: 'inline-flex', marginBottom: '2rem' }}
            >
              <CheckCircle2 size={80} color="var(--success)" />
            </motion.div>
            
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
              ¡Pago Exitoso!
            </h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--scalar-color-2)', marginBottom: '2rem' }}>
              Se enviaron <strong>${amount} ARS</strong> a {storeInfo.name} vía WapuPay.
            </p>

            <button 
              className="btn-secondary" 
              style={{ width: '100%' }}
              onClick={() => {
                setInvoice(null);
                setAmount('');
                setIsPaid(false);
              }}
            >
              Hacer otro pago
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
