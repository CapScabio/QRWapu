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

    // 1. Obtener costo en USDT (Tentative amount)
    const tentativeRes = await fetch(`${API_URL}/transactions/tentative-amount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        amount: Number(amountArs),
        currency_payment: 'ARS',
        currency_taken: 'USDT',
        type: 'fast_fiat_transfer'
      })
    });

    if (!tentativeRes.ok) {
      const err = await tentativeRes.text();
      console.error("Error from Wapu tentative-amount:", err);
      throw new Error("Error calculating tentative amount from Wapu");
    }

    const tentativeData = await tentativeRes.json();
    const usdtAmount = tentativeData.total_amount; // Costo total en USDT incluyendo comisiones

    // 2. Obtener exchange rates para convertir USDT a SATs
    const rateRes = await fetch(`${API_URL}/exchange_rates`);
    if (!rateRes.ok) {
      throw new Error("No se pudieron obtener las tasas de cambio de Wapu");
    }
    const rateData = await rateRes.json();
    
    // Buscar la tasa BTC/USD (o BTC/USDT)
    const btcUsd = rateData.rates?.find((r: any) => r.pair === 'BTC/USD');
    if (!btcUsd) {
      throw new Error("No se pudo encontrar el par BTC/USD en las cotizaciones");
    }
    
    // 1 BTC = btcUsd.sell USDT => 1 USDT = 100,000,000 / btcUsd.sell Sats
    const satsAmount = Math.ceil(usdtAmount * (100000000 / btcUsd.sell));

    // 3. Generar Factura Lightning
    // Wapu deposit_lightning espera "amount" en SATs
    const depositRes = await fetch(`${API_URL}/wallet/deposit_lightning`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        amount: satsAmount
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
      invoiceId: depositData.transaction_id || depositData.id,
      pr: depositData.lnurl_pr_invoice || depositData.payment_request || depositData.address_destination,
      sats: satsAmount
    });

  } catch (error: any) {
    console.error('Invoice generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
