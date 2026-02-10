'use client';

import { useState } from 'react';

export default function AddSubscriptionModal({ onClose, onAdd }) {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [renewalDate, setRenewalDate] = useState('');
    const [subscriptionEmail, setSubscriptionEmail] = useState('');
    const [subscriptionType, setSubscriptionType] = useState('normal');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onAdd({
                name: name.trim(),
                price: parseFloat(price),
                renewal_date: renewalDate,
                subscription_email: subscriptionEmail.trim(),
                subscription_type: subscriptionType,
            });
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
                <h3>Add New Subscription</h3>

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

                    <div className="form-group">
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
                            {loading ? <span className="spinner" /> : 'Add Subscription'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
