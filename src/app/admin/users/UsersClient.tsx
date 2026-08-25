'use client';

import { useState, useEffect } from 'react';

interface UserItem {
  id?: string;
  _id?: string;
  email?: string;
  full_name?: string;
  name?: string;
  phone?: string;
  role?: string;
  created_at?: string;
  provider?: string;
}

export default function UsersClient() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const result = await res.json();
      if (result && result.success) {
        setUsers(Array.isArray(result.data) ? result.data : []);
      } else {
        setFetchError(result?.error || 'Failed to load users from API');
        setUsers([]);
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Network error fetching users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!userId) return;
    setUpdatingId(userId);

    // Capture original role for accurate rollback if update fails
    const originalRole = users.find(u => u?.id === userId)?.role ?? 'customer';

    // Optimistic update
    setUsers(prev => prev.map(u => u?.id === userId ? { ...u, role: newRole } : u));
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole }),
      });
      const result = await res.json();
      if (!result?.success) {
        console.error('Role update failed. Raw API response:', result);
        // Rollback to original role
        setUsers(prev => prev.map(u => u?.id === userId ? { ...u, role: originalRole } : u));
        alert(result?.error || 'Failed to update role');
      }
    } catch (err) {
      console.error('Network error updating role:', err);
      // Rollback to original role
      setUsers(prev => prev.map(u => u?.id === userId ? { ...u, role: originalRole } : u));
      alert('Network error updating role');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (user?.email || '').toLowerCase().includes(q) ||
      (user?.full_name || '').toLowerCase().includes(q) ||
      (user?.name || '').toLowerCase().includes(q) ||
      (user?.phone || '').toLowerCase().includes(q) ||
      (user?.id || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch (e) {
      return '—';
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-8 -mt-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
            User Management
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            All registered accounts — email and Google OAuth included.
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-red-700">Failed to load users</p>
            <p className="text-xs text-red-500 mt-0.5 font-mono">{fetchError}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search + Count */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-0 rounded-xl pl-9 pr-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-sky-500/20 outline-none"
            />
          </div>
          {!loading && (
            <span className="text-xs font-bold text-gray-400 shrink-0">
              {filteredUsers.length} account{filteredUsers.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Table / Loader */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 gap-4">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm font-bold tracking-wide">Fetching accounts from Supabase Auth...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4 text-right">Quick Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => {
                    const isAdmin = user?.role?.toLowerCase() === 'admin';
                    const isUpdating = !!(user?.id && updatingId === user.id);
                    const initials = (user?.full_name || user?.name || user?.email || '?')
                      .split(' ')
                      .map((w: string) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr key={user?.id || user?._id || `user-row-${index}`} className="hover:bg-sky-50/20 transition-colors">
                        {/* Name + provider badge */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isAdmin ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-600'}`}>
                              {initials}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 leading-none">
                                {user?.full_name || user?.name || <span className="text-gray-400 font-normal italic">No name</span>}
                              </div>
                              <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                user?.provider === 'google'
                                  ? 'bg-orange-50 text-orange-600'
                                  : 'bg-blue-50 text-blue-600'
                              }`}>
                                {user?.provider || 'email'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email / Phone */}
                        <td className="px-5 py-4 text-sm font-semibold text-gray-600">
                          <div>{user?.email || '—'}</div>
                          {user?.phone && (
                            <div className="text-xs text-gray-400 mt-1 font-medium">
                              📞 {user.phone}
                            </div>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-4 text-sm font-medium text-gray-400">{formatDate(user?.created_at)}</td>

                        {/* Role dropdown */}
                        <td className="px-5 py-4">
                          <select
                            disabled={isUpdating || !user?.id}
                            value={isAdmin ? 'admin' : 'customer'}
                            onChange={(e) => user?.id && handleRoleChange(user.id, e.target.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer transition-colors ${
                              isAdmin
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            <option value="customer">Customer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        {/* Quick Toggle */}
                        <td className="px-5 py-4 text-right">
                          <button
                            disabled={isUpdating || !user?.id}
                            onClick={() => user?.id && handleRoleChange(user.id, isAdmin ? 'customer' : 'admin')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
                              isAdmin
                                ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                            }`}
                          >
                            {isUpdating ? (
                              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                  d={isAdmin
                                    ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                    : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  }
                                />
                              </svg>
                            )}
                            {isUpdating ? 'Saving...' : isAdmin ? 'Make Customer' : 'Make Admin'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-14 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm font-bold text-gray-400">No accounts found</p>
                        <p className="text-xs text-gray-300">Try refreshing or check your Supabase connection</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
