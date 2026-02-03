const Purchases = {
  configure: jest.fn(),
  setLogLevel: jest.fn(),
  logIn: jest.fn().mockResolvedValue({}),
  logOut: jest.fn().mockResolvedValue({}),
  getOfferings: jest.fn().mockResolvedValue({ current: null }),
  getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
  addCustomerInfoUpdateListener: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(),
  purchasePackage: jest.fn().mockResolvedValue({
    customerInfo: { entitlements: { active: {} } },
  }),
  restorePurchases: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
};

export const LOG_LEVEL = { VERBOSE: 'VERBOSE' };

export default Purchases;
