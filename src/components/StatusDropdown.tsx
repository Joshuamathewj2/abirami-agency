'use client';

import { updateOrderStatusAction } from '@/app/actions/orderActions';
import { useState } from 'react';

export default function StatusDropdown({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const statuses = ['Pending', 'Processing', 'Completed', 'Cancelled'];

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setIsUpdating(true);
    await updateOrderStatusAction(orderId, newStatus);
    setIsUpdating(false);
  };

  return (
    <div className="relative inline-block w-full max-w-[130px]">
      <select
        value={status}
        onChange={handleChange}
        disabled={isUpdating}
        className={`appearance-none w-full border text-xs font-bold px-3 py-1.5 rounded-full outline-none cursor-pointer transition-colors ${getStatusColor(status)} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {statuses.map(s => (
          <option key={s} value={s} className="bg-white text-gray-900">{s}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  );
}
