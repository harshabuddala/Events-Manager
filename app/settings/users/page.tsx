'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Search, Plus, MoreHorizontal, UserCheck, UserX, Shield, ShieldAlert, Mail } from 'lucide-react';

const mockUsers = [
  { id: '1', name: 'Alok Nath', email: 'alok.nath@example.com', role: 'Admin', status: 'Active', lastActive: '2 mins ago' },
  { id: '2', name: 'Priya Sharma', email: 'priya.s@example.com', role: 'Manager', status: 'Active', lastActive: '1 hr ago' },
  { id: '3', name: 'Rahul Verma', email: 'rahul.v@example.com', role: 'Volunteer', status: 'Inactive', lastActive: '2 days ago' },
  { id: '4', name: 'Neha Gupta', email: 'neha.g@example.com', role: 'Volunteer', status: 'Active', lastActive: '5 hours ago' },
  { id: '5', name: 'Amit Singh', email: 'amit.singh@example.com', role: 'Manager', status: 'Active', lastActive: 'Just now' },
];

export default function UsersAndRolesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout 
      title="Users & Roles"
      subtitle="Manage system access, roles, and user permissions."
      headerAction={
        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" />
          <span>Invite User</span>
        </button>
      }
    >
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search users, emails, or roles..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex-1 sm:flex-none">
              Filter by Role
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 hidden md:table-cell">Last Active</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {user.role === 'Admin' ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-violet-500" />
                      ) : user.role === 'Manager' ? (
                        <Shield className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="font-medium text-slate-700">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      user.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-slate-500 font-medium">
                    {user.lastActive}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </DashboardLayout>
  );
}
