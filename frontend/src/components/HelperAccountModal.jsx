import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Users, UserPlus, Trash2, X, Phone, Heart } from 'lucide-react';

const HelperAccountModal = ({ open, onClose }) => {
  const [helpers, setHelpers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    helperName: '',
    helperPhone: '',
    relationship: 'Son'
  });
  const [submitting, setSubmitting] = useState(false);

  const RELATIONSHIPS = ['Son', 'Daughter', 'Spouse', 'Village Helper', 'Other'];

  useEffect(() => {
    if (open) {
      fetchHelpers();
    }
  }, [open]);

  const fetchHelpers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/auth/farmer/helpers');
      setHelpers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load helpers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      await api.post('/auth/farmer/add-helper', formData);
      setIsAdding(false);
      setFormData({ helperName: '', helperPhone: '', relationship: 'Son' });
      await fetchHelpers();
    } catch (err) {
      setError(err.message || 'Failed to add helper');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this helper?')) return;
    
    try {
      await api.delete(`/auth/farmer/helpers/${id}`);
      await fetchHelpers();
    } catch (err) {
      setError('Failed to remove helper');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Family Helpers / परिवार सहायक
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">
              Current Helpers
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {helpers.length}/3
              </span>
            </span>
            {!isAdding && helpers.length < 3 && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:text-blue-800"
              >
                <UserPlus className="h-4 w-4" /> Add
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-4 text-gray-500 text-sm">Loading helpers...</div>
          ) : isAdding ? (
            <form onSubmit={handleAdd} className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.helperName}
                  onChange={(e) => setFormData({...formData, helperName: e.target.value})}
                  className="w-full border border-gray-300 rounded p-1.5 text-sm"
                  placeholder="Helper name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.helperPhone}
                  onChange={(e) => setFormData({...formData, helperPhone: e.target.value})}
                  className="w-full border border-gray-300 rounded p-1.5 text-sm"
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Relationship</label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                  className="w-full border border-gray-300 rounded p-1.5 text-sm"
                >
                  {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-600 bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </form>
          ) : helpers.length === 0 ? (
            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm">No helpers added yet.</p>
              <p className="text-xs mt-1">Add a family member to manage your account.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {helpers.map(helper => (
                <div key={helper.id || helper.helperPhone} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{helper.name || helper.helperName}</div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {helper.phone || helper.helperPhone}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {helper.relationship}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(helper.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Remove helper"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelperAccountModal;
