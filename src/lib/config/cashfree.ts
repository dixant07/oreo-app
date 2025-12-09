let Cashfree: any;

export const initCashfree = async () => {
    if (Cashfree) return Cashfree;

    const { Cashfree: CashfreeClass, CFEnvironment } = await import("cashfree-pg");

    // Cashfree SDK uses static properties
    (CashfreeClass as any).XClientId = process.env.CASHFREE_CLIENT_ID;
    (CashfreeClass as any).XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
    (CashfreeClass as any).XEnvironment = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
        ? CFEnvironment.PRODUCTION
        : CFEnvironment.SANDBOX;
    (CashfreeClass as any).XApiVersion = "2023-08-01";

    Cashfree = CashfreeClass;

    console.log('[Cashfree] Initialized in', process.env.CASHFREE_ENVIRONMENT || 'SANDBOX', 'mode');
    return Cashfree;
};
