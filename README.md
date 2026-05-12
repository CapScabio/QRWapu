# QRWapu: Terminal POS Lightning de Alta Eficiencia 🛒⚡

**Plataforma B2B para la adopción circular de Bitcoin en comercios físicos.**

QRWapu es una Progressive Web App (PWA) de arquitectura orientada a eventos que permite a artesanos, cafeterías y pequeños comercios procesar pagos a través de Lightning Network y liquidarlos automáticamente a moneda local en tiempo real, operando sobre la infraestructura de la API de **WapuPay**.

---

## 🚀 Arquitectura del Proyecto

QRWapu actúa como middleware entre el cliente final, el protocolo Lightning y el sistema bancario local mediante WapuPay.
Su diseño "Cero Fricción" elimina el proceso de onboarding criptográfico (KYC, custodias) para el comerciante. 

### Flujo Operativo y Estados de Pago (State Machine)

El ciclo de vida de un pago presencial está diseñado para manejar pérdida de conexión y latencia:

1. **`IDLE`**: El POS está inactivo esperando que el usuario (cliente) inicie un flujo.
2. **`CALCULATING_RATES`**: El usuario ingresa el monto en ARS. QRWapu consulta asincrónicamente el endpoint `/transactions/tentative-amount` de WapuPay para fijar la tasa de cambio USDT/ARS (Sats).
3. **`GENERATING_INVOICE`**: Se ejecuta `/wallet/deposit_lightning` generando un QR estandarizado `lightning:lnbc...`.
4. **`PENDING_PAYMENT`**: Sistema en polling (con backoff exponencial) contra `/transactions/{id}` esperando confirmación de on-chain / mempool de Lightning.
   - *Edge Case (Timeout)*: Si pasan > 5 minutos, la factura caduca. Estado pasa a `EXPIRED`.
   - *Edge Case (Network Loss)*: Si el dispositivo pierde red, el Service Worker de la PWA guarda la sesión. Al recuperar red, se retoma el polling.
5. **`SETTLEMENT_PROCESSING`**: El pago en Sats es confirmado. Automáticamente se dispara el evento `/transactions/create` (tipo `fast_fiat_transfer`) indicando el CBU/Alias del comerciante.
6. **`COMPLETED`**: Fondos depositados en el CBU del comerciante. Pantalla verde mostrada al cliente.

---

## ✨ Características Técnicas

- 📱 **QR Estático Dinámico:** Enrutamiento web hacia PWA, delegando el input de monto al cliente para evitar fricciones de cálculo en Satoshis.
- 🔗 **WapuPay API Integration:** Autenticación Server-to-Server utilizando API Keys para prevenir fuga de credenciales.
- 🧪 **Tests Automatizados:** Pruebas unitarias para la máquina de estados de pagos y conversión de divisas, usando Vitest.
- 🎨 **UI / UX Resiliente:** Diseño desarrollado en CSS puro (Vanilla CSS Module) garantizando máxima compatibilidad entre dispositivos de baja gama en comercios de calle.

---

## 🛠️ Despliegue Local y Entorno Operativo

### Prerrequisitos
- Node.js (v18+)
- Una cuenta en WapuPay y una API Key activa (habilitada en dashboard).

### Configuración
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/CapScabio/QRWapu.git
   cd QRWapu
   ```

2. Instalar dependencias del sistema:
   ```bash
   npm install
   ```

3. Variables de entorno (`.env.local`):
   ```env
   NEXT_PUBLIC_WAPU_API_URL=https://be-stage.wapu.app
   WAPU_API_KEY=tu_api_key_segura
   ```

4. Ejecutar Suite de Tests:
   ```bash
   npm run test
   ```

5. Levantar Entorno de Desarrollo:
   ```bash
   npm run dev
   ```

### Producción
Para desplegar la aplicación en un entorno optimizado (ej: Vercel, AWS):
```bash
npm run build
npm run start
```

---

## 📖 Documentación de Edge Cases

- **Depreciación del tipo de cambio:** El `tentative-amount` de WapuPay garantiza una ventana de tiempo. Si la factura se paga fuera del tiempo de cotización esperada, la API retorna advertencias de volatilidad que QRWapu intercepta para notificar al comerciante en el dashboard si hay un desfase.
- **Fallas de Liquidación Bancaria (CBU Rechazado):** Si el paso 5 (`SETTLEMENT_PROCESSING`) falla debido a que el CBU ingresado por el comercio está bloqueado, el saldo queda seguro como USDT/Sats en la cuenta liquidadora principal de WapuPay de la plataforma, disparando una alerta a operaciones para reintento manual.

---

Creado por el **Capitan del Escabio** 🏴‍☠️🍻
