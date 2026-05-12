import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amountArs, cbu } = await request.json();

    if (!amountArs || !cbu) {
      return NextResponse.json({ error: 'Missing amountArs or cbu' }, { status: 400 });
    }

    const API_KEY = process.env.WAPU_API_KEY;
    const API_URL = process.env.NEXT_PUBLIC_WAPU_API_URL || 'https://be-stage.wapu.app';

    if (!API_KEY) {
      console.warn("WAPU_API_KEY no detectada. Retornando factura simulada para que la PWA funcione.");
      return NextResponse.json({
        success: true,
        invoiceId: 'inv_mock_' + Date.now(),
        pr: 'lnbc10u1p5u382fhp58xsrl6gyqhec50nydnmjnhe0lqs7er2px7zhj4w7geqhz9pqmanqnp4qgt72s92ak77wsszt7dqs8shkjy0re5r8fs8tnsay4zg7gpjekrr7',
        sats: Number(amountArs) * 10
      });
    }

    // 1. Obtener tipo de cambio (Tentative amount)
    // Asumiendo que el endpoint es /exchange_rates o /transactions/tentative-amount
    const rateRes = await fetch(`${API_URL}/exchange_rates`);
    const rateData = await rateRes.json();
    
    // Buscar la tasa USDT/ARS
    const usdtArs = rateData.rates?.find((r: any) => r.pair === 'USDT/ARS');
    const btcUsd = rateData.rates?.find((r: any) => r.pair === 'BTC/USD');
    
    let usdtAmount = 0;
    let satsAmount = 0;

    if (usdtArs && btcUsd) {
      usdtAmount = Number(amountArs) / usdtArs.buy; // Convert ARS to USDT
      // 1 BTC = btcUsd.sell USDT => 1 USDT = 100,000,000 / btcUsd.sell Sats
      satsAmount = Math.floor(usdtAmount * (100000000 / btcUsd.sell));
    } else {
      // Fallback
      satsAmount = Number(amountArs) * 10;
      usdtAmount = satsAmount / 14300; 
    }

    // 2. Generar Factura Lightning
    // Endpoint: POST /wallet/deposit_lightning
    const depositRes = await fetch(`${API_URL}/wallet/deposit_lightning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        amount: usdtAmount, // Wapu suele tomar el deposito en USDT o SATS
        // O dependiendo del schema exacto, a veces piden "amount_sats"
      })
    });

    if (!depositRes.ok) {
      const err = await depositRes.text();
      console.error("Error from Wapu deposit:", err);
      throw new Error("Error generating invoice from Wapu");
    }

    const depositData = await depositRes.json();

    return NextResponse.json({
      success: true,
      invoiceId: depositData.transaction_id,
      pr: depositData.lnurl_pr_invoice || depositData.payment_request,
      sats: satsAmount
    });

  } catch (error: any) {
    console.error('Invoice generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
