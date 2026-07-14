// ReportModal — modal for reporting a listing with reason + details.
// Calls reportsAPI.create on submit. Closes on success or cancel.
import React, { useState, useEffect } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { reportsAPI } from '../../services/endpoints';
import { getErrorMessage } from '../../utils/helpers';

const REPORT_REASONS = [
  { value: '', label: 'Select a reason…' },
  { value: 'FAKE_LISTING', label: 'Fake listing / Doesn\'t exist' },
  { value: 'WRONG_PRICE', label: 'Wrong / misleading price' },
  { value: 'SCAM', label: 'Scam or fraud attempt' },
  { value: 'ALREADY_RENTED', label: 'Already rented out' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { value: 'WRONG_LOCATION', label: 'Wrong location / address' },
  { value: 'OTHER', label: 'Other' },
];

/**
 * @param {boolean}       isOpen    - Controls modal visibility
 * @param {Function}      onClose   - Called when modal should close
 * @param {string|number} listingId - ID of the listing being reported
 */
const ReportModal = ({ isOpen, onClose, listingId }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDetails('');
      setSubmitted(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const { mutate: submitReport, isPending, isError, error, reset } = useMutation({
    mutationFn: () =>
      reportsAPI.create({ listingId, reason, details: details.trim() || undefined }),
    onSuccess: () => {
      setSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    reset();
    submitReport();
  };

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="card w-full max-w-md p-6 animate-[fadeInUp_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-danger-50 flex items-center justify-center">
              <Flag size={16} className="text-danger-500" />
            </div>
            <h2
              id="report-modal-title"
              className="font-display font-semibold text-surface-800 text-base"
            >
              Report Listing
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-ghost btn-sm w-8 h-8 rounded-lg p-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success state */}
        {submitted ? (
          <div className="flex flex-col items-center text-center py-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <div>
              <p className="font-semibold text-surface-800">Report Submitted</p>
              <p className="text-sm text-surface-500 mt-1">
                Thank you. Our team will review this listing shortly.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary btn-md mt-2 w-full"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Reason */}
            <div className="mb-4">
              <label htmlFor="report-reason" className="label">
                Reason <span className="text-danger-500">*</span>
              </label>
              <select
                id="report-reason"
                className="input text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                {REPORT_REASONS.map(({ value, label }) => (
                  <option key={value} value={value} disabled={value === ''}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Details */}
            <div className="mb-5">
              <label htmlFor="report-details" className="label">
                Additional Details{' '}
                <span className="text-surface-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="report-details"
                className="input text-sm resize-none h-24"
                placeholder="Describe the issue in more detail…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-surface-400 mt-1 text-right">
                {details.length}/500
              </p>
            </div>

            {/* Error message */}
            {isError && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-danger-50 text-danger-600 text-sm mb-4">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                {getErrorMessage(error)}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary btn-md flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!reason || isPending}
                className="btn-danger btn-md flex-1"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
