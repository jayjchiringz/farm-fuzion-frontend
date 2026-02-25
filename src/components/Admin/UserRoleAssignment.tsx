import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Save,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Mail,
  Calendar,
  Building2,
  User
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  group_id: string | null;
  group_name?: string;
  created_at: string;
  // Optional farmer fields - might not exist for all users
  phone?: string | null;
  county?: string | null;
  sub_county?: string | null;
}

interface UserRoleAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const API_BASE = import.meta.env.MODE === "development"
  ? "/api"
  : "https://us-central1-farm-fuzion-abdf3.cloudfunctions.net/api";

// Available roles based on your schema constraint
const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Admin', color: 'purple', description: 'Full system access' },
  { value: 'sacco', label: 'SACCO', color: 'blue', description: 'Manage groups and loans' },
  { value: 'farmer', label: 'Farmer', color: 'green', description: 'Farm management and marketplace' }
];

export default function UserRoleAssignment({ isOpen, onClose, onSuccess }: UserRoleAssignmentProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showError, setShowError] = useState<string | null>(null);
  const [editedRoles, setEditedRoles] = useState<Record<string, string>>({});
  
  const itemsPerPage = 10;

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(search) ||
        `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(search)
      );
    }
    
    // Apply role filter
    if (selectedRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRoleFilter);
    }
    
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, selectedRoleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    setShowError(null);
    try {
      const response = await fetch(`${API_BASE}/admin/users?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        const error = await response.json();
        setShowError(error.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setShowError('Failed to fetch users. Please try again.');
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
        setShowSuccess(`Role updated successfully for ${users.find(u => u.id === userId)?.email}`);
        
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
        
        // Call onSuccess callback if provided
        if (onSuccess) onSuccess();
        
        // Clear success message after 3 seconds
        setTimeout(() => setShowSuccess(null), 3000);
      } else {
        const error = await response.json();
        setShowError(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setShowError('Failed to update role. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkSave = async () => {
    const updates = Object.entries(editedRoles);
    if (updates.length === 0) return;

    let successCount = 0;
    let errorCount = 0;

    for (const [userId, newRole] of updates) {
      try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole })
        });

        if (response.ok) {
          successCount++;
          setUsers(prev => prev.map(user => 
            user.id === userId 
              ? { ...user, role: newRole }
              : user
          ));
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setEditedRoles({});
    
    if (successCount > 0) {
      setShowSuccess(`Successfully updated ${successCount} user${successCount > 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
      if (onSuccess) onSuccess();
    }
    
    if (errorCount > 0) {
      setShowError(`Failed to update ${errorCount} user${errorCount > 1 ? 's' : ''}`);
    }
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

  const getUserDisplayName = (user: User): string => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email.split('@')[0];
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle w-full max-w-6xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Shield size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">User Role Assignment</h3>
                  <p className="text-sm text-white/80">Assign and manage user roles (Admin, SACCO, Farmer)</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
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

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="relative md:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none"
                >
                  <option value="all">All Roles</option>
                  {AVAILABLE_ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 border border-gray-300 dark:border-gray-600"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>

              {Object.keys(editedRoles).length > 0 && (
                <button
                  onClick={handleBulkSave}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  Save All Changes ({Object.keys(editedRoles).length})
                </button>
              )}
            </div>

            {/* Users Table */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-purple-500/30 rounded-full"></div>
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">New Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                            <Users size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg font-medium">No users found</p>
                            <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map(user => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 flex items-center justify-center text-lg">
                                  <span>{getRoleIcon(user.role)}</span>
                                </div>
                                <div className="ml-3">
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {getUserDisplayName(user)}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                    ID: {user.id.slice(0, 8)}...
                                  </p>
                                  {user.group_name && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                      <Building2 size={10} />
                                      {user.group_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                                  <Mail size={12} className="text-gray-400" />
                                  {user.email}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Calendar size={10} className="text-gray-400" />
                                  Joined: {new Date(user.created_at).toLocaleDateString()}
                                </p>
                              </div>
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
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                                    ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md'
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
                                    <span>Update</span>
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
                {filteredUsers.length > 0 && (
                  <div className="mt-4 flex items-center justify-between px-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Role Legend */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <UserCog size={16} />
                Role Descriptions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AVAILABLE_ROLES.map(role => (
                  <div key={role.value} className="flex items-start gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role.value)}`}>
                      {role.label}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
