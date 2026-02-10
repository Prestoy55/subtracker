'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AddSubscriptionModal from './AddSubscriptionModal';

function getDaysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export default function DashboardPage() {
    const [user, setUser] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    const fetchSubscriptions = useCallback(async () => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .order('renewal_date', { ascending: true });

        if (!error && data) setSubscriptions(data);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
                return;
            }
            setUser(session.user);
            await fetchSubscriptions();
            setLoading(false);
        };
        checkAuth();
    }, [router, fetchSubscriptions]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleAdd = async (subData) => {
        const { error } = await supabase.from('subscriptions').insert({
            ...subData,
            user_id: user.id,
        });
        if (error) throw error;
        await fetchSubscriptions();
    };

    const handleDelete = async (sub) => {
        const now = new Date();
        const created = new Date(sub.created_at);
        const durationDays = Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));

        // Calculate total spent: price * number of months (at least 1)
        const months = Math.max(1, Math.ceil(durationDays / 30));
        const totalSpent = parseFloat(sub.price) * months;

        // Insert into archive
        const { error: archiveError } = await supabase.from('archived_subscriptions').insert({
            user_id: user.id,
            name: sub.name,
            price: sub.price,
            subscription_email: sub.subscription_email,
            subscription_type: sub.subscription_type,
            total_spent: totalSpent,
            started_at: sub.created_at,
            ended_at: now.toISOString(),
            renewal_date: sub.renewal_date,
            duration_days: durationDays,
        });

        if (archiveError) {
            console.error('Archive error:', archiveError);
            return;
        }

        // Delete from active
        const { error: deleteError } = await supabase
            .from('subscriptions')
            .delete()
            .eq('id', sub.id);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return;
        }

        await fetchSubscriptions();
    };

    if (loading) {
        return (
            <div className="loading-page">
                <div className="spinner" />
            </div>
        );
    }

    const totalMonthly = subscriptions.reduce((sum, s) => sum + parseFloat(s.price), 0);
    const tempCount = subscriptions.filter((s) => s.subscription_type === 'temporary').length;
    const urgentCount = subscriptions.filter((s) => {
        const days = getDaysUntil(s.renewal_date);
        return days >= 0 && days <= 5;
    }).length;

    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="header-left">
                    <span className="header-brand">SubTracker</span>
                    <nav className="header-nav">
                        <Link href="/dashboard" className="active">Dashboard</Link>
                        <Link href="/archive">Archive</Link>
                    </nav>
                </div>
                <div className="header-right">
                    <span className="header-email">
                        {user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : user?.email}
                    </span>
                    <button className="btn-logout" onClick={handleLogout}>Log Out</button>
                </div>
            </header>

            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h2>Your Subscriptions</h2>
                        <p>Manage and track all your active subscriptions</p>
                    </div>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        <span className="icon">+</span>
                        Add Subscription
                    </button>
                </div>

                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-label">Active Subscriptions</div>
                        <div className="stat-value accent">{subscriptions.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Monthly Total</div>
                        <div className="stat-value">{formatCurrency(totalMonthly)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Temporary</div>
                        <div className="stat-value warning">{tempCount}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Renewing Soon</div>
                        <div className="stat-value" style={{ color: urgentCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
                            {urgentCount}
                        </div>
                    </div>
                </div>

                {subscriptions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>No subscriptions yet</h3>
                        <p>Add your first subscription to start tracking renewals and never miss a deadline.</p>
                    </div>
                ) : (
                    <div className="sub-grid">
                        {subscriptions.map((sub) => {
                            const daysUntil = getDaysUntil(sub.renewal_date);
                            let urgencyClass = 'ok';
                            let urgencyLabel = `${daysUntil} days`;
                            if (daysUntil < 0) {
                                urgencyClass = 'past';
                                urgencyLabel = `${Math.abs(daysUntil)} days overdue`;
                            } else if (daysUntil === 0) {
                                urgencyClass = 'urgent';
                                urgencyLabel = 'Today!';
                            } else if (daysUntil <= 3) {
                                urgencyClass = 'urgent';
                            } else if (daysUntil <= 7) {
                                urgencyClass = 'warning';
                            }

                            return (
                                <div className="sub-card" key={sub.id}>
                                    <div className="sub-card-header">
                                        <span className="sub-name">{sub.name}</span>
                                        <span className={`sub-type-badge ${sub.subscription_type}`}>
                                            {sub.subscription_type === 'temporary' ? '⏱ Temp' : '✦ Normal'}
                                        </span>
                                    </div>

                                    <div className="sub-details">
                                        <div className="sub-detail">
                                            <span className="sub-detail-label">Price</span>
                                            <span className="sub-price">{formatCurrency(sub.price)}</span>
                                        </div>
                                        <div className="sub-detail">
                                            <span className="sub-detail-label">Email</span>
                                            <span className="sub-detail-value">{sub.subscription_email}</span>
                                        </div>
                                        <div className="sub-detail">
                                            <span className="sub-detail-label">Renewal</span>
                                            <span className="sub-detail-value">{formatDate(sub.renewal_date)}</span>
                                        </div>
                                    </div>

                                    <div className="sub-renewal">
                                        <span className="renewal-label">Time Left</span>
                                        <span className={`renewal-days ${urgencyClass}`}>{urgencyLabel}</span>
                                    </div>

                                    <div className="sub-card-actions">
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(sub)}
                                        >
                                            Archive & Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {showModal && (
                <AddSubscriptionModal
                    onClose={() => setShowModal(false)}
                    onAdd={handleAdd}
                />
            )}
        </div>
    );
}
