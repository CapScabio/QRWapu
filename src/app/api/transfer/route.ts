import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amountArs, cbu, invoiceId } = await request.json();

    if (!amountArs || !cbu) {
      return NextResponse.json({ error: 'Missing amountArs or cbu' }, { status: 400 });
    }

    const API_KEY = process.env.WAPU_API_KEY;
    const API_URL = process.env.NEXT_PUBLIC_WAPU_API_URL || 'https://be-stage.wapu.app';

    if (!API_KEY) {
      console.warn("WAPU_API_KEY no detectada. Retornando éxito simulado.");
      return NextResponse.json({ success: true, transferId: 'mock_tx_' + Date.now() });
    }

    // Llamar a /transactions/create con type 'fast_fiat_transfer'
    const transferRes = await fetch(`${API_URL}/transactions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        type: 'fast_fiat_transfer',
        amount: Number(amountArs),
        cbu_alias: cbu,
        currency: 'ARS'
      })
    });

    if (!transferRes.ok) {
      const err = await transferRes.text();
      console.error("Error from Wapu fiat transfer:", err);
      throw new Error("El sistema bancario rechazó la transacción (WapuPay Error)");
    }

    const transferData = await transferRes.json();

    return NextResponse.json({
      success: true,
      transferId: transferData.transaction_id || transferData.id
    });

  } catch (error: any) {
    console.error('Fiat transfer failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
