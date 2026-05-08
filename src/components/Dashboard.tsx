import React, { useEffect, useState } from 'react';
import { WPServices, Reservation } from '../lib/wp-api';
import { RefreshCw, Users, CheckCircle2, Clock, CalendarDays } from 'lucide-react';

export function Dashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const fetchStats = () => {
    return {
      pending: reservations.filter((r) => r.status === 'Pending').length,
      approved: reservations.filter((r) => r.status === 'Approved').length,
      guestsToday: reservations
        .filter((r) => r.status === 'Approved')
        .reduce((sum, r) => sum + r.guests, 0),
      parties: reservations.filter((r) => r.type === 'PARTY').length,
    };
  };

  // Banner if using mock data
  const [hasConfig, setHasConfig] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = await WPServices.getConfig();
      setHasConfig(!!config?.url);
      
      const data = await WPServices.getReservations();
      setReservations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (id: string | number, currentStatus: string, newStatus: 'Approved' | 'Declined' | 'Completed') => {
    setUpdatingId(id);
    try {
      await WPServices.updateReservationStatus(id, newStatus);
      // Optimistic update
      setReservations(prev => 
        prev.map(res => res.id === id ? { ...res, status: newStatus } : res)
      );
    } catch (err) {
      alert('Failed to update status. Check WordPress connection.');
    } finally {
      setUpdatingId(null);
    }
  };

  const stats = fetchStats();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Banner if using mock data */}
      {!hasConfig && (
        <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-3 rounded-xl flex items-center justify-between text-sm shadow-sm">
          <p>
            <strong className="font-semibold">Demo Mode:</strong> You are viewing mock data. Go to Settings to connect your WordPress site and view live bookings.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-bg-surface p-6 rounded-2xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-text-muted tracking-wider uppercase">Pending</p>
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-4xl font-black text-text-main">{stats.pending}</p>
        </div>
        
        <div className="bg-bg-surface p-6 rounded-2xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-text-muted tracking-wider uppercase">Approved</p>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-4xl font-black text-text-main">{stats.approved}</p>
        </div>

        <div className="bg-bg-surface p-6 rounded-2xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-text-muted tracking-wider uppercase">Guests Today</p>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-4xl font-black text-text-main">{stats.guestsToday}</p>
        </div>

        <div className="bg-bg-surface p-6 rounded-2xl border border-border-subtle shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span role="img" aria-label="party" className="text-6xl">🎉</span>
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <p className="text-xs font-bold text-text-muted tracking-wider uppercase">Party Requests</p>
            <CalendarDays className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-4xl font-black text-text-main relative z-10">{stats.parties}</p>
        </div>
      </div>

      {/* Recent Reservations */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-bg-base/30">
          <h3 className="text-xl font-bold text-text-main">Recent Bookings</h3>
          <button 
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg-surface border-b border-border-subtle text-text-muted font-semibold tracking-wide uppercase text-xs">
              <tr>
                <th className="py-4 px-6 font-semibold">Guest Info</th>
                <th className="py-4 px-6 font-semibold">Date & Time</th>
                <th className="py-4 px-6 font-semibold">Details</th>
                <th className="py-4 px-6 font-semibold">Table</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading && reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">Loading reservations...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">No reservations found.</td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-bg-base/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-text-main">{res.name}</span>
                        <span className="text-text-muted text-xs mt-0.5">{res.email}</span>
                        <span className="text-text-muted text-xs mt-0.5">{res.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-main">{res.date}</span>
                        <span className="text-text-muted text-sm">{res.time}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col items-start gap-1.5">
                        {res.type === 'PARTY' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 tracking-wider">
                            PARTY
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-bg-base text-text-muted font-semibold text-[10px] tracking-wider border border-border-subtle">
                            STANDARD
                          </span>
                        )}
                        <span className="text-text-main font-semibold text-sm">{res.guests} <span className="text-text-muted font-normal text-xs">Guests</span></span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-text-main font-medium">
                      {res.table === 'Manual Assign' ? (
                        <span className="text-orange-500 italic text-sm">Assign</span>
                      ) : (
                        <span>Table {res.table}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {res.status === 'Pending' ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold text-orange-700 bg-orange-100 border border-orange-200">
                          Pending
                        </span>
                      ) : res.status === 'Approved' ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold text-green-700 bg-green-100 border border-green-200">
                          Approved
                        </span>
                      ) : res.status === 'Declined' ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold text-red-700 bg-red-100 border border-red-200">
                          Declined
                        </span>
                      ) : (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold text-text-muted bg-bg-base border border-border-subtle">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {updatingId === res.id ? (
                        <span className="text-xs text-text-muted font-medium inline-block py-2">Updating...</span>
                      ) : res.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleStatusUpdate(res.id, res.status, 'Approved')}
                            className="text-green-600 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(res.id, res.status, 'Declined')}
                            className="text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs font-medium">No actions</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
