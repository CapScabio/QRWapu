export type PaymentState = 
  | 'IDLE' 
  | 'CALCULATING_RATES' 
  | 'GENERATING_INVOICE' 
  | 'PENDING_PAYMENT' 
  | 'SETTLEMENT_PROCESSING' 
  | 'COMPLETED' 
  | 'EXPIRED' 
  | 'ERROR';

export interface PaymentContext {
  fiatAmount: number;
  satsAmount: number | null;
  invoiceId: string | null;
  cbu: string | null;
  errorMsg: string | null;
}

export class PaymentStateMachine {
  private state: PaymentState = 'IDLE';
  private context: PaymentContext;

  constructor(initialContext: Partial<PaymentContext> = {}) {
    this.context = {
      fiatAmount: 0,
      satsAmount: null,
      invoiceId: null,
      cbu: null,
      errorMsg: null,
      ...initialContext
    };
  }

  public getState() {
    return this.state;
  }

  public getContext() {
    return this.context;
  }

  public transition(action: string, payload?: any): PaymentState {
    switch (this.state) {
      case 'IDLE':
        if (action === 'START_PAYMENT') {
          this.context.fiatAmount = payload.amount;
          this.context.cbu = payload.cbu;
          this.state = 'CALCULATING_RATES';
        }
        break;
      
      case 'CALCULATING_RATES':
        if (action === 'RATES_FETCHED') {
          this.context.satsAmount = payload.sats;
          this.state = 'GENERATING_INVOICE';
        } else if (action === 'FAIL') {
          this.context.errorMsg = payload.error;
          this.state = 'ERROR';
        }
        break;

      case 'GENERATING_INVOICE':
        if (action === 'INVOICE_CREATED') {
          this.context.invoiceId = payload.invoiceId;
          this.state = 'PENDING_PAYMENT';
        }
        break;

      case 'PENDING_PAYMENT':
        if (action === 'PAYMENT_RECEIVED') {
          this.state = 'SETTLEMENT_PROCESSING';
        } else if (action === 'TIMEOUT') {
          this.state = 'EXPIRED';
        }
        break;

      case 'SETTLEMENT_PROCESSING':
        if (action === 'SETTLEMENT_SUCCESS') {
          this.state = 'COMPLETED';
        } else if (action === 'SETTLEMENT_FAIL') {
          this.context.errorMsg = payload.error;
          this.state = 'ERROR';
        }
        break;
        
      default:
        break;
    }
    
    return this.state;
  }
}
