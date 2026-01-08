import { useState, useEffect, useCallback } from 'react';
import { usePlayer, useAuthAPI, useAuthState } from '@/shared/contexts';
import { BottomNav, type NavTabId } from '@/shared/components/layout';
import { SkipLinks, FeedbackModal, AuthModal, AccountLinkBanner, type AuthMode } from '@/shared/components';
import { useFirebaseAuthAPI, useFirebaseAuthState } from '@/firebase/useFirebaseAuthHooks';
import { CompactHeader } from './CompactHeader';
import { PlayTab, ProfileTab, LearnTab, SettingsTab } from './tabs';
import './Dashboard.css';

export function Dashboard() {
  const { profile, currentRankInfo, checkStreak } = usePlayer();
  const { logout } = useAuthAPI();
  const { isGuest, isFirebaseUser, isAnonymous } = useAuthState();
  const firebaseAPI = useFirebaseAuthAPI();
  const firebaseState = useFirebaseAuthState();
  const [activeTab, setActiveTab] = useState<NavTabId>('home');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');

  // Check streak on mount
  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  const handleFeedbackClick = useCallback(() => {
    setIsFeedbackOpen(true);
  }, []);

  const handleFeedbackClose = useCallback(() => {
    setIsFeedbackOpen(false);
  }, []);

  const handleSignInClick = useCallback(() => {
    setAuthMode('signin');
    setIsAuthModalOpen(true);
  }, []);

  const handleLinkClick = useCallback(() => {
    setAuthMode('link');
    setIsAuthModalOpen(true);
  }, []);

  const handleAuthModalClose = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Google sign-in handler using Firebase
  const handleGoogleSignIn = useCallback(async () => {
    if (!firebaseState.isFirebaseAvailable) {
      console.warn('[Dashboard] Firebase not available for Google sign-in');
      return false;
    }

    // If user is anonymous, link to Google account to preserve progress
    if (firebaseState.isAnonymous) {
      const success = await firebaseAPI.linkToGoogle();
      if (success) {
        setIsAuthModalOpen(false);
      }
      return success;
    }

    // Otherwise do a regular sign-in
    const success = await firebaseAPI.signInWithGoogle();
    if (success) {
      setIsAuthModalOpen(false);
    }
    return success;
  }, [firebaseState.isFirebaseAvailable, firebaseState.isAnonymous, firebaseAPI]);

  // Email sign-in handler using Firebase
  const handleEmailSignIn = useCallback(async (email: string, password: string) => {
    if (!firebaseState.isFirebaseAvailable) {
      console.warn('[Dashboard] Firebase not available for email sign-in');
      return false;
    }

    const success = await firebaseAPI.signInWithEmail(email, password);
    if (success) {
      setIsAuthModalOpen(false);
    }
    return success;
  }, [firebaseState.isFirebaseAvailable, firebaseAPI]);

  // Email sign-up handler using Firebase
  const handleEmailSignUp = useCallback(async (email: string, password: string) => {
    if (!firebaseState.isFirebaseAvailable) {
      console.warn('[Dashboard] Firebase not available for email sign-up');
      return false;
    }

    // If user is anonymous, link to email account to preserve progress
    if (firebaseState.isAnonymous) {
      const success = await firebaseAPI.linkToEmail(email, password);
      if (success) {
        setIsAuthModalOpen(false);
      }
      return success;
    }

    // Otherwise create new account
    const success = await firebaseAPI.createAccount(email, password);
    if (success) {
      setIsAuthModalOpen(false);
    }
    return success;
  }, [firebaseState.isFirebaseAvailable, firebaseState.isAnonymous, firebaseAPI]);

  return (
    <div className="page">
      <SkipLinks mainId="dashboard-main" />
      <div className="content-wrap">
        <CompactHeader
          profile={profile}
          rankInfo={currentRankInfo}
          streak={profile.streak}
          isGuest={isGuest}
          isFirebaseUser={isFirebaseUser}
          onLogout={isGuest ? undefined : logout}
          onSignIn={isGuest ? handleSignInClick : undefined}
        />

        {/* Show link banner for anonymous Firebase users */}
        {isAnonymous && (
          <AccountLinkBanner onLinkClick={handleLinkClick} />
        )}

        <main id="dashboard-main" tabIndex={-1}>
          {activeTab === 'home' && <PlayTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'learn' && <LearnTab />}
          {activeTab === 'settings' && <SettingsTab onFeedbackClick={handleFeedbackClick} />}
        </main>
      </div>
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onFeedbackClick={handleFeedbackClick}
      />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={handleFeedbackClose} />
      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        onClose={handleAuthModalClose}
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={firebaseState.isFirebaseAvailable ? handleEmailSignIn : undefined}
        onEmailSignUp={firebaseState.isFirebaseAvailable ? handleEmailSignUp : undefined}
        isLoading={firebaseState.isLoading}
        error={firebaseState.error}
      />
    </div>
  );
}
