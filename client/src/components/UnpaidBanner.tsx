import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import { AlertCircle, CreditCard, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UnpaidBanner: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [paymentStatus, setPaymentStatus] = useState<string>('NOT_SUBMITTED');
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'participant') {
      setVisible(false);
      return;
    }

    const checkPayment = async () => {
      try {
        const res = await api.payments.getMyStatus();
        const status = res.data?.status || 'NOT_SUBMITTED';
        setPaymentStatus(status);

        if (status === 'VERIFIED' || status === 'successful') {
          setVisible(false); // Disappears immediately when verified
        } else if (!dismissed) {
          setVisible(true);
        }
      } catch (err) {
        console.warn('Failed to check payment status');
      }
    };

    // First appearance after ~20 seconds
    const firstTimer = setTimeout(() => {
      checkPayment();
    }, 20000);

    // Repeating interval every 3 minutes
    const interval = setInterval(() => {
      checkPayment();
    }, 180000);

    checkPayment(); // Initial check

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [isAuthenticated, user, dismissed]);

  if (!visible || paymentStatus === 'VERIFIED' || paymentStatus === 'successful') {
    return null;
  }

  return (
    <div className="w-full bg-[#9B0A12] border-t border-[#FF3B30] text-[#F2F2F4] py-3 px-4 shadow-lg z-30 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#E8A317] shrink-0 animate-bounce" />
          <p className="text-xs sm:text-sm font-medium">
            <strong className="font-bold text-[#F2F2F4]">Payment Required:</strong> Pay the registration fee first to unlock event registrations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/dashboard#payment"
            className="px-4 py-1.5 bg-[#E01B24] hover:bg-[#FF3B30] text-[#F2F2F4] text-xs font-bold font-mono rounded-lg transition-transform hover:scale-105 flex items-center gap-2 shadow-md"
          >
            <CreditCard className="w-3.5 h-3.5" />
            PAY NOW
          </Link>

          <button
            onClick={() => setDismissed(true)}
            className="text-[#9A9AA2] hover:text-[#F2F2F4] p-1 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
