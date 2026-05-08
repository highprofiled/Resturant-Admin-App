import React, { useState } from 'react';

export function TableManagement() {
  const [tables, setTables] = useState<{id: number, name: string, capacity: string}[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('');

  const handleAddTable = () => {
    if (newTableName && newTableCapacity) {
      setTables([...tables, { id: Date.now(), name: newTableName, capacity: newTableCapacity }]);
      setNewTableName('');
      setNewTableCapacity('');
    }
  };

  const handleDeleteTable = (id: number) => {
    setTables(tables.filter(t => t.id !== id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in duration-500">
      
      {/* Add New Table */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm col-span-1 h-fit overflow-hidden">
        <div className="p-6 border-b border-border-subtle bg-bg-base/30">
          <h3 className="text-xl font-bold text-text-main">Add Table</h3>
          <p className="text-sm text-text-muted mt-1">Configure a new seating area.</p>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">
              Table Identifier
            </label>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="e.g. Window Booth 1"
              className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-muted/50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">
              Seating Capacity
            </label>
            <input
              type="number"
              value={newTableCapacity}
              onChange={(e) => setNewTableCapacity(e.target.value)}
              placeholder="max guests"
              className="w-full bg-bg-base border border-border-subtle rounded-lg py-2.5 px-4 text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-muted/50"
            />
          </div>
          <button 
            onClick={handleAddTable}
            className="w-full bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-sm shadow-primary/20 mt-2"
          >
            Add to Active Layout
          </button>
        </div>
      </div>

      {/* Active Tables */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border-subtle bg-bg-base/30">
          <h3 className="text-xl font-bold text-text-main">Active Tables</h3>
          <p className="text-sm text-text-muted mt-1">Manage current restaurant capacity.</p>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg-surface border-b border-border-subtle">
              <tr>
                <th className="py-4 px-6 font-semibold text-text-muted uppercase text-xs tracking-wider">Table Name</th>
                <th className="py-4 px-6 font-semibold text-text-muted uppercase text-xs tracking-wider">Capacity</th>
                <th className="py-4 px-6 font-semibold text-text-muted uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {tables.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-text-muted bg-bg-base/30">
                    <p className="font-semibold text-base mb-1">No tables configured.</p>
                    <p className="text-sm">Add a table using the form to the left.</p>
                  </td>
                </tr>
              ) : (
                tables.map(table => (
                  <tr key={table.id} className="hover:bg-bg-base/50 transition-colors group">
                    <td className="py-4 px-6 font-bold text-text-main">{table.name}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-bg-base text-text-muted font-semibold text-xs border border-border-subtle">
                        Up to {table.capacity} guests
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleDeleteTable(table.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
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
