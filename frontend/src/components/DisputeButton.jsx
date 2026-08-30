import React, { useState } from 'react';
import { api } from '../services/api';
import { AlertTriangle, Send, CheckCircle2, Clock, X } from 'lucide-react';

const DisputeButton = ({ bookingId, currentStatus, disputeStatus, disputeResolution, onDisputeFiled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('Moisture reading incorrect');
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const REASONS = [
    'Moisture reading incorrect',
    'Grade assessment unfair',
    'Weighment error',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const fullReason = `${reason}: ${explanation}`;
      await api.post(`/queue/${bookingId}/dispute`, { reason: fullReason });
      setSuccess('Dispute filed successfully');
      setTimeout(() => {
        setIsOpen(false);
        if (onDisputeFiled) onDisputeFiled();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to file dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (disputeStatus === 'RESOLVED') {
    return (
      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-800">Dispute Resolved</h4>
            <p className="text-sm text-green-700 mt-1">{disputeResolution}</p>
          </div>
        </div>
      </div>
    );
  }

  if (disputeStatus === 'PENDING') {
    return (
      <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">Dispute Under Review</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm font-medium"
      >
        <AlertTriangle className="h-4 w-4" />
        Dispute Quality / प्रतवारी विवाद
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                File a Dispute
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide details about why you are disputing this result..."
                  required
                />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
              {success && <div className="text-sm text-green-600 bg-green-50 p-2 rounded">{success}</div>}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : (
                    <>
                      <Send className="h-4 w-4" /> Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DisputeButton;
