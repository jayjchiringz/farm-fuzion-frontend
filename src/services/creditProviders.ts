import axios from "axios";

// Provider-specific adapters
export const creditProviderAdapters = {
  // Example: Government agricultural loan program
  government: async (application: any, provider: any) => {
    const response = await axios.post(
      provider.api_endpoint,
      {
        national_id: application.farmer.national_id,
        amount: application.amount,
        purpose: application.purpose,
        farm_location: application.farmer.location
      },
      {
        headers: { 'Authorization': `Bearer ${process.env.GOV_LOAN_API_KEY}` }
      }
    );
    return response.data;
  },

  // Example: Commercial bank
  bank: async (application: any, provider: any) => {
    const response = await axios.post(
      provider.api_endpoint,
      {
        customer_id: application.farmer.bank_customer_id,
        loan_amount: application.amount,
        term_months: application.repayment_period,
        product_code: application.product.external_product_id
      },
      {
        headers: { 'X-API-Key': process.env.BANK_API_KEY }
      }
    );
    return response.data;
  },

  // Example: World Bank / Development fund
  development: async (application: any, provider: any) => {
    // Special handling for development funds
    return {
      application_id: `WB-${Date.now()}`,
      status: "received",
      estimated_decision: "5-7 business days"
    };
  }
};