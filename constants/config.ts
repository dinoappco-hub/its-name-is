export const config = {
  appName: 'its name is.',
  version: '1.0.0',
  premium: {
    price: '$4.99',
    period: 'month',
    freeSubmissionsPerDay: 5,
    features: [
      'Unlimited daily submissions',
      'Feature your objects at the top',
      'Gold premium badge',
      'Early access to new features',
      'Ad-free experience',
    ],
  },
  stripe: {
    premiumPriceId: 'price_1TIeO1D9H7oC4sguaaDG6luC',
    premiumProductId: 'prod_UHCnxFF6rAodT9',
  },

} as const;
