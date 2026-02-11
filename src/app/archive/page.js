'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

function formatCurrency(amount, currency = 'USD') {
    if (currency === 'NOK') {
        return `${new Intl.NumberFormat('nb-NO').format(amount)} kr`;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
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
    const [userName, setUserName] = useState('');
    const [exchangeRates, setExchangeRates] = useState({ USD: 10.5, EUR: 11.5 });
    const router = useRouter();

    const fetchExchangeRates = async () => {
        try {
            const { data, error } = await supabase.from('exchange_rates').select('code, rate_to_nok');
            if (error) throw error;
            if (data) {
                const rates = {};
                data.forEach(r => rates[r.code] = r.rate_to_nok);
                setExchangeRates(prev => ({ ...prev, ...rates }));
            }
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
        }
    };

    const fetchArchived = async () => {
        try {
            const { data, error } = await supabase
                .from('archived_subscriptions')
                .select('*')
                .order('ended_at', { ascending: false });

            if (error) throw error;
            if (data) setArchived(data);
        } catch (error) {
            console.error('Error fetching archived subscriptions:', error);
        }
    };

    const fetchUserName = (currentUser) => {
        if (currentUser?.user_metadata?.first_name) {
            setUserName(`${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name}`);
        } else if (currentUser?.email) {
            setUserName(currentUser.email);
        }
    };

    useEffect(() => {
        const initPage = async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/');
                return;
            }
            setUser(session.user);
            fetchUserName(session.user);
            await fetchExchangeRates();
            await fetchArchived();
            setLoading(false);
        };
        initPage();
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

    const totalAllTimeSpent = archived.reduce((acc, item) => {
        const spent = parseFloat(item.total_spent) || 0;
        if (item.currency === 'NOK') return acc + spent;
        const rate = exchangeRates[item.currency] || 1; // Default to 1 if rate not found, or use a fallback like USD/EUR defaults
        return acc + (spent * rate);
    }, 0);

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
                    <span className="header-email">
                        {user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : user?.email}
                    </span>
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
                            <div className="stat-label">Total Spent (NOK)</div>
                            <div className="stat-value" style={{ color: 'var(--accent-primary-hover)' }}>
                                {formatCurrency(totalAllTimeSpent, 'NOK')}
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
                                            {formatCurrency(item.total_spent, item.currency)}
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
                                            {formatCurrency(item.price, item.currency)}
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
