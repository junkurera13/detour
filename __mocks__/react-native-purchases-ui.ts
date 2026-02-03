export const PAYWALL_RESULT = {
  PURCHASED: 'PURCHASED',
  RESTORED: 'RESTORED',
  CANCELLED: 'CANCELLED',
  ERROR: 'ERROR',
};

const RevenueCatUI = {
  presentPaywall: jest.fn().mockResolvedValue(PAYWALL_RESULT.CANCELLED),
  presentPaywallIfNeeded: jest.fn().mockResolvedValue(PAYWALL_RESULT.CANCELLED),
  presentCustomerCenter: jest.fn().mockResolvedValue(undefined),
  Paywall: () => null,
};

export default RevenueCatUI;
