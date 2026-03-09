import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save,
  Users,
  UserCog
} from 'lucide-react';
import { API_BASE } from "../../services/config";


interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  group_id: string | null;
  group_name?: string;
  created_at: string;
}

// Available roles based on your schema constraint
const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Admin', color: 'purple' },
  { value: 'sacco', label: 'SACCO', color: 'blue' },
  { value: 'farmer', label: 'Farmer', color: 'green' }
];

export default function UserRoleManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showError, setShowError] = useState<string | null>(null);
  const [editedRoles, setEditedRoles] = useState<Record<string, string>>({});

  const itemsPerPage = 10;

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [currentPage, selectedRole]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      });
      
      if (selectedRole !== 'all') {
        params.append('role', selectedRole);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`${API_BASE}/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
      } else {
        const error = await response.json();
        setShowError(error.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setShowError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setEditedRoles(prev => ({
      ...prev,
      [userId]: newRole
    }));
  };

  const handleSaveRole = async (userId: string) => {
    const newRole = editedRoles[userId];
    if (!newRole) return;

    setUpdating(userId);
    setShowError(null);
    setShowSuccess(null);

    try {
      const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        const data = await response.json();
        setShowSuccess('Role updated successfully');
        
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, role: newRole }
            : user
        ));
        
        // Clear edited role
        setEditedRoles(prev => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => setShowSuccess(null), 3000);
      } else {
        const error = await response.json();
        setShowError(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setShowError('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleRefresh = () => {
    setEditedRoles({});
    fetchUsers();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'sacco':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'farmer':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return '👑';
      case 'sacco':
        return '🏦';
      case 'farmer':
        return '🌾';
      default:
        return '👤';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-green/10 rounded-lg">
                <Shield size={24} className="text-brand-green" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Role Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Assign and manage user roles (Admin, SACCO, Farmer)
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin text-brand-green' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none min-w-[150px]"
                >
                  <option value="all">All Roles</option>
                  {AVAILABLE_ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              
              <button
                type="submit"
                className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Status Messages */}
        {showSuccess && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2 border border-green-200 dark:border-green-800">
            <CheckCircle size={18} />
            <span>{showSuccess}</span>
          </div>
        )}

        {showError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2 border border-red-200 dark:border-red-800">
            <AlertCircle size={18} />
            <span>{showError}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    New Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Users size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green/20 to-brand-green/30 flex items-center justify-center text-lg">
                            <span>{getRoleIcon(user.role)}</span>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.first_name || 'No name'} {user.last_name || ''}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              ID: {user.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone || 'No phone'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role?.toUpperCase() || 'NO ROLE'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={editedRoles[user.id] || user.role || ''}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">Select Role</option>
                          {AVAILABLE_ROLES.map(role => (
                            <option 
                              key={role.value} 
                              value={role.value}
                              disabled={role.value === user.role}
                            >
                              {role.label} {role.value === user.role ? '(current)' : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSaveRole(user.id)}
                          disabled={updating === user.id || !editedRoles[user.id]}
                          className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            editedRoles[user.id]
                              ? 'bg-brand-green text-white hover:bg-green-700 hover:shadow-md'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
                          }`}
                        >
                          {updating === user.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Updating...</span>
                            </>
                          ) : (
                            <>
                              <Save size={16} />
                              <span>Update Role</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && users.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Role Legend */}
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <UserCog size={16} />
            Role Descriptions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AVAILABLE_ROLES.map(role => (
              <div key={role.value} className="flex items-start gap-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role.value)}`}>
                  {role.label}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {role.value === 'admin' && 'Full system access, user management, platform configuration'}
                  {role.value === 'sacco' && 'Manage groups, loans, and financial services'}
                  {role.value === 'farmer' && 'Access to farming tools, marketplace, and farm management'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
