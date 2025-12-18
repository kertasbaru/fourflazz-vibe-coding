import { Head, router } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { useState, useEffect } from 'react';
import axios from 'axios';

function CountdownTimer({ expiresAt }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!expiresAt) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const expiry = new Date(expiresAt);
            const diff = expiry - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeLeft('Expired');
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h ${minutes}m`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    if (!expiresAt) return null;

    return (
        <div className={`flex items-center gap-1 text-xs ${isExpired ? 'text-red-500' : 'text-slate-500'}`}>
            <span className="material-symbols-outlined text-sm">timer</span>
            <span>{timeLeft}</span>
        </div>
    );
}

function SessionCard({ session, onExtend, onDelete, onResend, loading }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full flex items-center justify-center ${session.is_active && !session.is_expired
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-slate-100 dark:bg-slate-700'
                        }`}>
                        <span className={`material-symbols-outlined text-xl ${session.is_active && !session.is_expired
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                            }`}>
                            {session.is_active ? 'verified_user' : 'pending'}
                        </span>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            {session.masked_phone}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${session.is_active && !session.is_expired
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : session.is_expired
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                {session.is_active && !session.is_expired ? 'Active' : session.is_expired ? 'Expired' : 'Pending OTP'}
                            </span>
                            <span className="text-slate-500">
                                {session.provider.toUpperCase()}
                            </span>
                        </div>
                        {session.expires_at && session.is_active && (
                            <CountdownTimer expiresAt={session.expires_at} />
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {session.is_expired && session.is_active && (
                        <button
                            onClick={() => onResend(session)}
                            disabled={loading}
                            className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Resend OTP"
                        >
                            <span className="material-symbols-outlined text-xl">send</span>
                        </button>
                    )}
                    {session.can_extend && (
                        <button
                            onClick={() => onExtend(session.id)}
                            disabled={loading}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Extend Session"
                        >
                            <span className="material-symbols-outlined text-xl">refresh</span>
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(session.id)}
                        disabled={loading}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Session"
                    >
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function ConfirmCloseModal({ isOpen, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm m-4 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-amber-600">warning</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Discard OTP Request?
                    </h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                    An OTP has been sent to your phone. If you close now, you'll need to request a new OTP.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Continue
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Discard
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddSessionModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep] = useState('phone'); // phone, otp
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [canResendIn, setCanResendIn] = useState(0);
    const [otpSent, setOtpSent] = useState(false);
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    // Countdown timer for resend
    useEffect(() => {
        if (canResendIn > 0) {
            const timer = setTimeout(() => setCanResendIn(canResendIn - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [canResendIn]);

    const formatPhone = (value) => {
        // Remove non-digits
        let digits = value.replace(/\D/g, '');

        // Convert 08 to 628
        if (digits.startsWith('08')) {
            digits = '628' + digits.substring(2);
        }
        // Add 62 if starts with 8
        else if (digits.startsWith('8')) {
            digits = '62' + digits;
        }

        return digits;
    };

    const requestOtp = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/otp-sessions/request-otp', {
                phone: formatPhone(phone),
                provider: 'kmsp',
            });

            const data = response.data;

            if (data.success) {
                setSessionId(data.data.session_id);
                setCanResendIn(data.data.can_resend_in || 60);
                setStep('otp');
                setOtpSent(true);
            } else {
                setError(data.message || 'Failed to request OTP');
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Network error. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/otp-sessions/verify-otp', {
                session_id: sessionId,
                otp: otp,
            });

            const data = response.data;

            if (data.success) {
                onSuccess();
                handleClose(true);
            } else {
                setError(data.message || 'Invalid OTP');
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Network error. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseAttempt = () => {
        if (otpSent && step === 'otp') {
            setShowConfirmClose(true);
        } else {
            handleClose(false);
        }
    };

    const handleClose = (force = false) => {
        if (!force && otpSent && step === 'otp') {
            setShowConfirmClose(true);
            return;
        }
        setStep('phone');
        setPhone('');
        setOtp('');
        setSessionId(null);
        setError('');
        setOtpSent(false);
        setShowConfirmClose(false);
        setCanResendIn(0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseAttempt}>
                <div
                    className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md m-4 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {step === 'phone' ? 'Add OTP Session' : 'Enter OTP Code'}
                        </h3>
                        <button onClick={handleCloseAttempt} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {step === 'phone' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Phone Number (XL/AXIS/LIVEON)
                                    </label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="08xxxxxxxxxx"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">
                                        Enter your XL, AXIS, or LIVEON phone number
                                    </p>
                                </div>
                                <button
                                    onClick={requestOtp}
                                    disabled={loading || !phone}
                                    className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading && <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>}
                                    Request OTP
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    OTP code has been sent to <strong>{formatPhone(phone)}</strong>
                                </p>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        OTP Code
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                        placeholder="Enter 6-digit OTP"
                                        maxLength={6}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-center text-2xl tracking-widest"
                                    />
                                </div>
                                <button
                                    onClick={verifyOtp}
                                    disabled={loading || otp.length !== 6}
                                    className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading && <span className="animate-spin material-symbols-outlined text-lg">progress_activity</span>}
                                    Verify OTP
                                </button>
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setStep('phone')}
                                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        ← Change number
                                    </button>
                                    {canResendIn > 0 ? (
                                        <span className="text-sm text-slate-500">
                                            Resend in {canResendIn}s
                                        </span>
                                    ) : (
                                        <button
                                            onClick={requestOtp}
                                            disabled={loading}
                                            className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmCloseModal
                isOpen={showConfirmClose}
                onConfirm={() => handleClose(true)}
                onCancel={() => setShowConfirmClose(false)}
            />
        </>
    );
}

export default function OtpSessionsIndex({ sessions, isAdmin }) {
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const extendSession = async (id) => {
        setLoading(true);
        try {
            const response = await axios.post(`/otp-sessions/${id}/extend`);
            const data = response.data;
            if (data.success) {
                router.reload({ only: ['sessions'] });
            } else {
                alert(data.message || 'Failed to extend session');
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Network error';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const deleteSession = async (id) => {
        if (!confirm('Are you sure you want to delete this session?')) return;

        setLoading(true);
        try {
            const response = await axios.delete(`/otp-sessions/${id}`);
            const data = response.data;
            if (data.success) {
                router.reload({ only: ['sessions'] });
            } else {
                alert(data.message || 'Failed to delete session');
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Network error';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async (session) => {
        setLoading(true);
        try {
            const response = await axios.post('/otp-sessions/request-otp', {
                phone: session.phone,
                provider: session.provider,
            });
            const data = response.data;
            if (data.success) {
                router.reload({ only: ['sessions'] });
                alert('OTP has been resent. Please check your phone.');
            } else {
                alert(data.message || 'Failed to resend OTP');
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Network error';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const syncSessions = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/otp-sessions/sync');
            const data = response.data;
            if (data.success) {
                router.reload({ only: ['sessions'] });
                alert(data.message);
            } else {
                alert(data.message || 'Failed to sync sessions');
            }
        } catch (e) {
            const message = e.response?.data?.message || 'Network error';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <Head title="OTP Sessions" />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">OTP Sessions</h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Manage your XL/AXIS login sessions for purchasing products
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {isAdmin && (
                            <button
                                onClick={syncSessions}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-lg">sync</span>
                                Sync
                            </button>
                        )}
                        <button
                            onClick={() => setModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Add Session
                        </button>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-blue-600">info</span>
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                            <p className="font-medium mb-1">What are OTP Sessions?</p>
                            <p>Some products require you to login with your XL/AXIS account. Add a session by entering your phone number and verifying with the OTP code sent via SMS.</p>
                        </div>
                    </div>
                </div>

                {/* Sessions List */}
                <div className="space-y-3">
                    {sessions && sessions.length > 0 ? (
                        sessions.map((session) => (
                            <SessionCard
                                key={session.id}
                                session={session}
                                onExtend={extendSession}
                                onDelete={deleteSession}
                                onResend={resendOtp}
                                loading={loading}
                            />
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2">phone_locked</span>
                            <p>No OTP sessions yet</p>
                            <p className="text-sm">Add a session to purchase products that require login</p>
                        </div>
                    )}
                </div>
            </div>

            <AddSessionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={() => router.reload({ only: ['sessions'] })}
            />
        </DashboardLayout>
    );
}
