'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { Save, User, Bell, Shield, Paintbrush, Globe, Smartphone } from 'lucide-react';

export default function GeneralSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Paintbrush },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <DashboardLayout 
      title="Settings"
      subtitle="Manage your personal preferences and application settings."
    >
      <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-colors ${
                    isActive 
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-800' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">Public Profile</h3>
                <p className="text-sm text-slate-500 mt-1">This information will be displayed publicly so be careful what you share.</p>
              </div>
              <div className="p-5 sm:p-6 space-y-6">
                
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-xl font-bold text-slate-700">
                    AD
                  </div>
                  <div>
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      Change Avatar
                    </button>
                    <p className="text-[11px] text-slate-400 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">First Name</label>
                    <input type="text" defaultValue="Admin" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Last Name</label>
                    <input type="text" defaultValue="User" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <input type="email" defaultValue="admin@example.com" className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Bio</label>
                  <textarea rows={3} defaultValue="Administrator for the EduStalls platform." className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-slate-800 resize-none max-h-32" />
                  <p className="text-[11px] text-slate-400">Brief description for your profile. URLs are hyperlinked.</p>
                </div>
              </div>
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab !== 'profile' && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-12 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Section Under Construction</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                These settings are currently being implemented. Check back later for updates to this section.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
