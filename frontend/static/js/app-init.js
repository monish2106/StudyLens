/* StudyLens - Module initialization wrapper for non-module script tag */
(async function() {
  // Import modules dynamically
  const { initAuth, handleSignIn, handleSignUp, handleSignOut, switchAuthTab, toggleUserMenu, closeAuthModal, AuthState } = await import('./auth.js');
  const { loadDashboard, loadDocument, toggleFavorite, deleteDocument } = await import('./dashboard.js');

  // Make functions globally available
  window.handleSignIn = handleSignIn;
  window.handleSignUp = handleSignUp;
  window.handleSignOut = handleSignOut;
  window.switchAuthTab = switchAuthTab;
  window.toggleUserMenu = toggleUserMenu;
  window.closeAuthModal = closeAuthModal;
  window.loadDashboard = loadDashboard;
  window.loadDocument = loadDocument;
  window.toggleFavorite = toggleFavorite;
  window.deleteDocument = deleteDocument;

  // Initialize auth on load
  await initAuth();
})();
