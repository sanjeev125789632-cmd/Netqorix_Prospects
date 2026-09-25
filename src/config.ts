export const APP_CONFIG = {
  // Passcode required to enter the sales workspace
  ACCESS_PASSCODE: 'NETQORIX2025',
  
  // App metadata
  APP_NAME: 'Netqorix Prospects',
  TAGLINE: 'Sales Prospecting & High-Velocity Outreach',
  VERSION: '1.0.0',
  
  // Pagination
  ITEMS_PER_PAGE: 50,
  
  // Validation targets
  EXPECTED_COUNTS: {
    'Chandigarh Tricity': 307,
    Hyderabad: 302,
    'Mira Road-Vasai-Virar': 304,
    Delhi: 309,
    'Bankura & Durgapur': 300,
    'Jammu & Kashmir': 301,
    'North East': 300,
    Kota: 224,
    'International Round 5': 20,
    'Round 6 National': 36,
    'Round 6 International': 27
  } as Record<string, number>,
  EXPECTED_TOTAL: 2430,
};
