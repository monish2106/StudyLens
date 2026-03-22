import { Auth, DB, supabase } from './supabase.js';

const AuthState = {
  user: null,
  session: null,
  profile: null,
  isGuest: false
};

export async function initAuth() {
  const session = await Auth.getSession();

  if (session) {
    AuthState.session = session;
    AuthState.user = session.user;
    await loadUserProfile();
    showAuthenticatedUI();
    if (window.showView) window.showView('dashboard');
  } else {
    showAuthModal();
  }

  Auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') {
      AuthState.session = session;
      AuthState.user = session.user;
      await loadUserProfile();
      showAuthenticatedUI();
      closeAuthModal();
      if (window.showView) window.showView('dashboard');
      if (window.showToast) window.showToast('Welcome back!');
    } else if (event === 'SIGNED_OUT') {
      AuthState.user = null;
      AuthState.session = null;
      AuthState.profile = null;
      showAuthModal();
    }
  });
}

async function loadUserProfile() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', AuthState.user.id)
      .maybeSingle();

    if (data) {
      AuthState.profile = data;
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

export function showAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('active');
}

export function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('active');
}

export function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

  if (tab === 'signin') {
    document.querySelector('.auth-tab:first-child').classList.add('active');
    document.getElementById('signinForm').classList.add('active');
  } else {
    document.querySelector('.auth-tab:last-child').classList.add('active');
    document.getElementById('signupForm').classList.add('active');
  }

  hideAuthError();
}

export async function handleSignIn(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('signinBtn');
  const email = form.email.value;
  const password = form.password.value;

  try {
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    hideAuthError();

    await Auth.signIn(email, password);
  } catch (err) {
    showAuthError(err.message || 'Sign in failed. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
}

export async function handleSignUp(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('signupBtn');
  const fullname = form.fullname.value;
  const email = form.email.value;
  const password = form.password.value;

  try {
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    hideAuthError();

    await Auth.signUp(email, password, fullname);

    if (window.showToast) {
      window.showToast('Account created successfully! Signing you in...');
    }
  } catch (err) {
    showAuthError(err.message || 'Sign up failed. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}

export async function handleSignOut() {
  try {
    await Auth.signOut();
    if (window.showToast) window.showToast('Signed out successfully');
    if (window.showView) window.showView('upload');
  } catch (err) {
    console.error('Sign out error:', err);
  }
}

function showAuthError(message) {
  const errorEl = document.getElementById('authError');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

function hideAuthError() {
  const errorEl = document.getElementById('authError');
  if (errorEl) {
    errorEl.classList.remove('show');
  }
}

function showAuthenticatedUI() {
  const userMenu = document.getElementById('userMenu');
  const userAvatar = document.getElementById('userAvatar');
  const userEmail = document.getElementById('userEmail');
  const userTier = document.getElementById('userTier');

  if (userMenu) userMenu.style.display = 'block';

  if (AuthState.user && userEmail) {
    userEmail.textContent = AuthState.user.email;
  }

  if (AuthState.profile) {
    if (userAvatar) {
      const initials = AuthState.profile.full_name
        ? AuthState.profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : AuthState.user.email[0].toUpperCase();
      userAvatar.textContent = initials;
    }
    if (userTier) {
      userTier.textContent = AuthState.profile.subscription_tier.toUpperCase() + ' PLAN';
    }
  }
}

export function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

document.addEventListener('click', (e) => {
  const userMenu = document.getElementById('userMenu');
  const dropdown = document.getElementById('userDropdown');
  if (dropdown && userMenu && !userMenu.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

export function getAuthState() {
  return AuthState;
}

export { AuthState };
