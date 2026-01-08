import { useState, useEffect, useCallback } from 'react';
import { usePlayer, useAuthAPI, useAuthState } from '@/shared/contexts';
import { BottomNav, type NavTabId } from '@/shared/components/layout';
import { SkipLinks, FeedbackModal, AuthModal, AccountLinkBanner, type AuthMode } from '@/shared/components';
import { CompactHeader } from './CompactHeader';
import { PlayTab, ProfileTab, LearnTab, SettingsTab } from './tabs';
import './Dashboard.css';

export function Dashboard() {
  const { profile, currentRankInfo, checkStreak } = usePlayer();
  const { logout } = useAuthAPI();
  const { isGuest, isFirebaseUser, isAnonymous } = useAuthState();
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

  // Placeholder handler - will be connected to Firebase auth when configured
  const handleGoogleSignIn = useCallback(async () => {
    console.log('[Dashboard] Google sign-in requested');
    // When Firebase is configured, this will use useFirebaseAuthAPI
    return false;
  }, []);

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
      />
    </div>
  );
}
