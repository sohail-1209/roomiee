import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Spinner from '../components/ui/Spinner';

import { auth, applyActionCode, checkActionCode } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmEmailVerified } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (!mode || !oobCode) {
      setStatus('error');
      setMessage(t('invalidVerification'));
      return;
    }

    const verify = async () => {
      try {
        // Check the action code first
        await checkActionCode(auth, oobCode);
        // Apply it to verify the email
        const info = await applyActionCode(auth, oobCode);
        const email = info.data.email;

        // Confirm with our backend
        await confirmEmailVerified(email);

        setStatus('success');
        toast.success(t('emailVerified'));
        setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
      } catch (err) {
        setStatus('error');
        if (err.code === 'auth/invalid-action-code') {
          setMessage(t('linkExpired'));
        } else {
          setMessage(err.message || t('verificationFailed'));
        }
      }
    };

    verify();
  }, [searchParams]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          {status === 'loading' && (
            <>
              <Spinner size="lg" className="mx-auto mb-4" />
              <h1 className="font-display font-bold text-xl text-surface-900 mb-2">{t('verifyingEmail')}</h1>
              <p className="text-surface-500 text-sm">{t('pleaseWait')}</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <MailCheck size={32} className="text-green-600" />
              </div>
              <h1 className="font-display font-bold text-xl text-surface-900 mb-2">{t('emailVerifiedSuccess')}</h1>
              <p className="text-surface-500 text-sm">{t('redirecting')}</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle size={32} className="text-red-600" />
              </div>
              <h1 className="font-display font-bold text-xl text-surface-900 mb-2">{t('verificationFailed')}</h1>
              <p className="text-surface-500 text-sm mb-4">{message}</p>
              <Link to="/register" className="text-sm font-medium text-primary-600 hover:underline">
                {t('goBackToRegistration')}
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default VerifyEmailPage;
