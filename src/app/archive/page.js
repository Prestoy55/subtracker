'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatDuration(days) {
    if (days < 30) return `${days} day${days !== 1 ? 's' : ''}`;
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    let result = `${months} month${months !== 1 ? 's' : ''}`;
    if (remainingDays > 0) result += `, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
    return result;
}

export default function ArchivePage() {
    const [user, setUser] = useState(null);
    const [archived, setArchived] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
                return;
            }
            setUser(session.user);

            const { data, error } = await supabase
                .from('archived_subscriptions')
                .select('*')
                .order('ended_at', { ascending: false });

            if (!error && data) setArchived(data);
            setLoading(false);
        };
        checkAuth();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="loading-page">
                <div className="spinner" />
            </div>
        );
    }

    const totalAllTimeSpent = archived.reduce((sum, a) => sum + parseFloat(a.total_spent), 0);

    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="header-left">
                    <span className="header-brand">SubTracker</span>
                    <nav className="header-nav">
                        <Link href="/dashboard">Dashboard</Link>
                        <Link href="/archive" className="active">Archive</Link>
                    </nav>
                </div>
                <div className="header-right">
                    <span className="header-email">{user?.email}</span>
                    <button className="btn-logout" onClick={handleLogout}>Log Out</button>
                </div>
            </header>

            <main className="main-content">
                <div className="page-header">
                    <div>
                        <h2>Subscription Archive</h2>
                        <p>History of your past subscriptions</p>
                    </div>
                </div>

                {archived.length > 0 && (
                    <div className="stats-row">
                        <div className="stat-card">
                            <div className="stat-label">Archived Subscriptions</div>
                            <div className="stat-value accent">{archived.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Total All-Time Spent</div>
                            <div className="stat-value" style={{ color: 'var(--accent-primary-hover)' }}>
                                {formatCurrency(totalAllTimeSpent)}
                            </div>
                        </div>
                    </div>
                )}

                {archived.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <h3>No archived subscriptions</h3>
                        <p>When you remove a subscription from your dashboard, it will appear here with all its history.</p>
                    </div>
                ) : (
                    <div className="archive-grid">
                        {archived.map((item) => (
                            <div className="archive-card" key={item.id}>
                                <div className="archive-card-header">
                                    <h3>{item.name}</h3>
                                    <span className={`sub-type-badge ${item.subscription_type}`}>
                                        {item.subscription_type === 'temporary' ? '⏱ Temp' : '✦ Normal'}
                                    </span>
                                </div>
                                <div className="archive-stats">
                                    <div className="archive-stat">
                                        <div className="archive-stat-label">Total Spent</div>
                                        <div className="archive-stat-value total-spent">
                                            {formatCurrency(item.total_spent)}
                                        </div>
                                    </div>
                                    <div className="archive-stat">
                                        <div className="archive-stat-label">Duration</div>
                                        <div className="archive-stat-value">
                                            {formatDuration(item.duration_days)}
                                        </div>
                                    </div>
                                    <div className="archive-stat">
                                        <div className="archive-stat-label">Monthly Price</div>
                                        <div className="archive-stat-value">
                                            {formatCurrency(item.price)}
                                        </div>
                                    </div>
                                    <div className="archive-stat">
                                        <div className="archive-stat-label">Email</div>
                                        <div className="archive-stat-value">
                                            {item.subscription_email}
                                        </div>
                                    </div>
                                    <div className="archive-stat">
                                        <div className="archive-stat-label">Started</div>
                                        <div className="archive-stat-value">
                                            {formatDate(item.started_at)}
                                        </div>
                                    </div>
                                    <div className="archive-stat">
                                        <div className="archive-stat-label">Ended</div>
                                        <div className="archive-stat-value">
                                            {formatDate(item.ended_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
