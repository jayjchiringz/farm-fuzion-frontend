// src/services/groupWalletApi.ts
import { api } from "./api";

export interface GroupWalletInfo {
  id: string;
  name: string;
  groupStatus: string;
  walletStatus: 'inactive' | 'active' | 'suspended';
  unipesaUserId: string | null;
  unipesaWalletId: string | null;
  approvalThreshold: number;
  adminCount: number;
  farmerCount: number;
}

export interface GroupTransactionRequest {
  id: string;
  group_id: string;
  transaction_type: 'bulk_sale_receipt' | 'distribution_to_farmer' | 
                    'bulk_distribution' | 'fee_collection' | 
                    'external_payment' | 'withdrawal';
  amount: number;
  currency: string;
  metadata: any;
  description: string | null;
  status: 'pending' | 'partially_approved' | 'approved' | 'rejected' | 
          'executed' | 'failed' | 'cancelled';
  required_approvals: number;
  current_approvals: number;
  initiated_by: string;
  initiated_by_email?: string;
  initiated_at: string;
  unipesa_transaction_id: string | null;
  executed_at: string | null;
  approval_count?: number;
  rejection_count?: number;
}

export interface GroupSignatory {
  id: string;
  user_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  mobile: string;
  status: string;
  email: string;
  role_name?: string;
}

export interface CustodyRecord {
  id: string;
  group_id: string;
  farmer_id: number;
  farmer_name?: string;
  first_name?: string;
  last_name?: string;
  mobile?: string;
  product_name: string;
  quantity: number;
  unit: string;
  expected_price_per_unit: number | null;
  expected_total_value: number | null;
  actual_sale_value: number | null;
  farmer_share: number | null;
  status: 'in_custody' | 'sold' | 'distributed' | 'returned' | 'damaged';
  received_at: string;
  distributed_at: string | null;
  group_name?: string;
}

export const groupWalletApi = {
  // ==================== WALLET INFO ====================
  
  registerWallet: async (groupId: string) => {
    const response = await api.post(`/wallet/group/${groupId}/register`);
    return response.data;
  },
  
  getWalletInfo: async (groupId: string): Promise<{ group: GroupWalletInfo }> => {
    const response = await api.get(`/wallet/group/${groupId}/info`);
    return response.data;
  },
  
  getBalance: async (groupId: string) => {
    const response = await api.get(`/wallet/group/${groupId}/balance`);
    return response.data;
  },
  
  getUnipesaTransactions: async (groupId: string, params?: {
    limit?: number;
    offset?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const response = await api.get(
      `/wallet/group/${groupId}/unipesa-transactions?${query.toString()}`
    );
    return response.data;
  },
  
  // ==================== SIGNATORIES ====================
  
  getSignatories: async (groupId: string): Promise<{
    signatories: GroupSignatory[];
    count: number;
  }> => {
    const response = await api.get(`/wallet/group/${groupId}/signatories`);
    return response.data;
  },
  
  // ==================== TRANSACTIONS ====================
  
  initiateTransaction: async (groupId: string, data: {
    transaction_type: string;
    amount: number;
    initiated_by: string;
    metadata?: any;
    description?: string;
  }) => {
    const response = await api.post(
      `/wallet/group/${groupId}/transactions/initiate`,
      data
    );
    return response.data;
  },
  
  submitApproval: async (requestId: string, data: {
    user_id: string;
    decision: 'approved' | 'rejected';
    comments?: string;
  }) => {
    const response = await api.post(
      `/wallet/group/transactions/${requestId}/approve`,
      data
    );
    return response.data;
  },
  
  getPendingApprovals: async (groupId: string, userId: string): Promise<{
    requests: GroupTransactionRequest[];
    count: number;
  }> => {
    const response = await api.get(
      `/wallet/group/${groupId}/pending-approvals?user_id=${userId}`
    );
    return response.data;
  },
  
  getGroupTransactions: async (groupId: string, params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    transactions: GroupTransactionRequest[];
    count: number;
  }> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const response = await api.get(
      `/wallet/group/${groupId}/transactions?${query.toString()}`
    );
    return response.data;
  },
  
  getTransactionDetails: async (requestId: string) => {
    const response = await api.get(
      `/wallet/group/transactions/${requestId}`
    );
    return response.data;
  },
  
  // ==================== CONTRACTS ====================
  
  getContracts: async (groupId: string) => {
    const response = await api.get(`/wallet/group/${groupId}/contracts`);
    return response.data;
  },
  
  createContract: async (groupId: string, data: {
    farmer_id: number;
    distribution_percentage?: number;
    fixed_fee_per_transaction?: number;
    terms?: any;
    created_by?: string;
  }) => {
    const response = await api.post(
      `/wallet/group/${groupId}/contracts`,
      data
    );
    return response.data;
  },
  
  // ==================== CUSTODY ====================
  
  getGroupCustody: async (groupId: string, status?: string) => {
    const query = status ? `?status=${status}` : '';
    const response = await api.get(
      `/wallet/group/${groupId}/custody${query}`
    );
    return response.data;
  },
  
  getFarmerCustody: async (farmerId: string | number) => {
    const response = await api.get(
      `/wallet/group/farmer/${farmerId}/custody`
    );
    return response.data;
  },
  
  createCustodyRecord: async (farmerId: string | number, data: {
    group_id: string;
    farm_product_id?: string;
    product_name: string;
    quantity: number;
    unit: string;
    expected_price_per_unit?: number;
    notes?: string;
  }) => {
    const response = await api.post(
      `/wallet/group/farmer/${farmerId}/custody`,
      data
    );
    return response.data;
  },
};
