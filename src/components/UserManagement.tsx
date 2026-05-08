import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, getDocs, setDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { UserPlus, UserX, UserSearch, AlertCircle, ShieldAlert } from 'lucide-react';

export function UserManagement({ role, email: currentUserEmail }: { role: string; email: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'users'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      if (role !== 'superadmin') {
         setUsers(fetchedUsers.filter((u: any) => u.email !== 'highprofiled@gmail.com'));
      } else {
         setUsers([{ email: 'highprofiled@gmail.com', role: 'superadmin' }, ...fetchedUsers]);
      }
    } catch (err: any) {
      if (err.message.includes('Missing or insufficient permissions')) {
         setError('You do not have permission to view all users. You can still add members.');
      } else {
        setError(err.message);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [role]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsAdding(true);
    try {
      const emailLower = newEmail.toLowerCase();
      if (emailLower === 'highprofiled@gmail.com') throw new Error("Cannot modify superadmin");
      
      if (users.find(u => u.email === emailLower)) {
          throw new Error("User already exists");
      }

      await setDoc(doc(db, 'users', emailLower), {
        email: emailLower,
        role: 'member',
        createdAt: new Date().toISOString()
      });
      setNewEmail('');
      await fetchUsers();
    } catch (err: any) {
       handleFirestoreError(err, OperationType.CREATE, `users/${newEmail.toLowerCase()}`);
    } finally {
       setIsAdding(false);
    }
  };

  const handleRemoveUser = async (emailToRemove: string) => {
    if (emailToRemove === 'highprofiled@gmail.com') return;
    if (role !== 'superadmin') {
      alert("Only superadmin can remove users.");
      return;
    }
    if (confirm(`Remove ${emailToRemove}?`)) {
      try {
        await deleteDoc(doc(db, 'users', emailToRemove));
        setUsers(users.filter(u => u.email !== emailToRemove));
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, `users/${emailToRemove}`);
      }
    }
  };

  return (
    <section className="bg-bg-surface p-6 md:p-8 rounded-2xl border border-border-subtle shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <UserSearch className="w-5 h-5 text-primary" />
            User Management
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Manage who has access to the admin dashboard. Members can add other members.
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm mb-6">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <form onSubmit={handleAddUser} className="space-y-4 bg-bg-base p-5 rounded-xl border border-border-subtle">
            <h3 className="font-semibold text-text-main text-sm">Add New Member</h3>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full bg-bg-surface border border-border-subtle rounded-lg py-2 px-3 text-sm text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isAdding}
              className="w-full bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {isAdding ? 'Inviting...' : 'Add Member'}
            </button>
            <p className="text-xs text-text-muted mt-2">
              New members can log in using their email address via the Magic Link option.
            </p>
          </form>
        </div>

        <div className="md:col-span-2 overflow-x-auto">
          {loading ? (
             <div className="text-center py-8 text-text-muted text-sm">Loading users...</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-bg-base border-y border-border-subtle text-text-muted font-semibold tracking-wide uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  {role === 'superadmin' && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {users.map((u, i) => (
                  <tr key={u.email || i} className="hover:bg-bg-base/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-text-main">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'superadmin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 tracking-wider">
                           <ShieldAlert className="w-3 h-3" /> SUPERADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 tracking-wider border border-gray-200">
                           MEMBER
                        </span>
                      )}
                    </td>
                    {role === 'superadmin' && (
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'superadmin' && (
                          <button
                            onClick={() => handleRemoveUser(u.email)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title="Remove User"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
