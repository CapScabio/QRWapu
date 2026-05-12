import { describe, it, expect } from 'vitest';
import { PaymentStateMachine } from './payment-machine';

describe('PaymentStateMachine', () => {
  it('should initialize with IDLE state', () => {
    const machine = new PaymentStateMachine();
    expect(machine.getState()).toBe('IDLE');
  });

  it('should transition through a successful payment flow', () => {
    const machine = new PaymentStateMachine();
    
    // 1. User inputs amount
    machine.transition('START_PAYMENT', { amount: 15000, cbu: 'alias.comercio' });
    expect(machine.getState()).toBe('CALCULATING_RATES');
    expect(machine.getContext().fiatAmount).toBe(15000);

    // 2. WapuPay API returns sats equivalent
    machine.transition('RATES_FETCHED', { sats: 143000 });
    expect(machine.getState()).toBe('GENERATING_INVOICE');
    expect(machine.getContext().satsAmount).toBe(143000);

    // 3. WapuPay API creates the Lightning invoice
    machine.transition('INVOICE_CREATED', { invoiceId: 'inv_12345' });
    expect(machine.getState()).toBe('PENDING_PAYMENT');

    // 4. Customer pays the invoice
    machine.transition('PAYMENT_RECEIVED');
    expect(machine.getState()).toBe('SETTLEMENT_PROCESSING');

    // 5. Fiat transferred to CBU successfully
    machine.transition('SETTLEMENT_SUCCESS');
    expect(machine.getState()).toBe('COMPLETED');
  });

  it('should handle timeout edge case during pending payment', () => {
    const machine = new PaymentStateMachine();
    
    machine.transition('START_PAYMENT', { amount: 500, cbu: 'alias.comercio' });
    machine.transition('RATES_FETCHED', { sats: 4800 });
    machine.transition('INVOICE_CREATED', { invoiceId: 'inv_999' });
    
    expect(machine.getState()).toBe('PENDING_PAYMENT');
    
    // Simulate 5 minute timeout
    machine.transition('TIMEOUT');
    expect(machine.getState()).toBe('EXPIRED');
  });

  it('should handle settlement failure edge case', () => {
    const machine = new PaymentStateMachine();
    
    machine.transition('START_PAYMENT', { amount: 1000, cbu: 'invalid.cbu' });
    machine.transition('RATES_FETCHED', { sats: 9600 });
    machine.transition('INVOICE_CREATED', { invoiceId: 'inv_444' });
    machine.transition('PAYMENT_RECEIVED');
    
    expect(machine.getState()).toBe('SETTLEMENT_PROCESSING');
    
    // Simulate WapuPay returning an error due to invalid CBU
    machine.transition('SETTLEMENT_FAIL', { error: 'CBU_REJECTED' });
    expect(machine.getState()).toBe('ERROR');
    expect(machine.getContext().errorMsg).toBe('CBU_REJECTED');
  });
});
