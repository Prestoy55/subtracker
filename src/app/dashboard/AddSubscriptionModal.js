'use client';

import { useState } from 'react';

export default function AddSubscriptionModal({ onClose, onAdd, onUpdate, initialData = null }) {
    const [name, setName] = useState(initialData?.name || '');
    const [price, setPrice] = useState(initialData?.price || '');
    const [renewalDate, setRenewalDate] = useState(initialData?.renewal_date || '');
    const [subscriptionEmail, setSubscriptionEmail] = useState(initialData?.subscription_email || '');
    const [subscriptionType, setSubscriptionType] = useState(initialData?.subscription_type || 'normal');
    const [currency, setCurrency] = useState(initialData?.currency || 'USD');
    const [loading, setLoading] = useState(initialData === 'loading'); // reused state if needed
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const subData = {
            name: name.trim(),
            price: parseFloat(price),
            renewal_date: renewalDate,
            subscription_email: subscriptionEmail.trim(),
            subscription_type: subscriptionType,
            currency,
        };

        try {
            if (initialData) {
                await onUpdate(initialData.id, subData);
            } else {
                await onAdd(subData);
            }
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <h3>{initialData ? 'Edit Subscription' : 'Add New Subscription'}</h3>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Subscription Type</label>
                        <div className="type-toggle">
                            <button
                                type="button"
                                className={`type-option ${subscriptionType === 'normal' ? 'active-normal' : ''}`}
                                onClick={() => setSubscriptionType('normal')}
                            >
                                ✦ Normal
                            </button>
                            <button
                                type="button"
                                className={`type-option ${subscriptionType === 'temporary' ? 'active-temp' : ''}`}
                                onClick={() => setSubscriptionType('temporary')}
                            >
                                ⏱ Temporary
                            </button>
                        </div>
                        <p className="type-hint">
                            {subscriptionType === 'temporary'
                                ? 'For free trials or short-term subs. You\'ll get reminders 5 days and 1 day before renewal.'
                                : 'For ongoing subscriptions. You\'ll get a reminder 3 days before renewal.'}
                        </p>
                    </div>

                    <div className="form-group">
                        <label>Subscription Name</label>
                        <input
                            id="sub-name"
                            type="text"
                            placeholder="e.g. Netflix, Spotify, Adobe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row-nested" style={{ display: 'flex', gap: '12px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Price</label>
                            <input
                                id="sub-price"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="9.99"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ width: '100px' }}>
                            <label>Currency</label>
                            <select
                                id="sub-currency"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="styled-select"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    outline: 'none'
                                }}
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="NOK">NOK (kr)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Renewal Date</label>
                        <input
                            id="sub-renewal-date"
                            type="date"
                            value={renewalDate}
                            onChange={(e) => setRenewalDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email used for this subscription</label>
                        <input
                            id="sub-email"
                            type="email"
                            placeholder="you@example.com"
                            value={subscriptionEmail}
                            onChange={(e) => setSubscriptionEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <span className="spinner" /> : (initialData ? 'Save Changes' : 'Add Subscription')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
