import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

export function setupAuth() {
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const userDashboardView = document.getElementById('user-dashboard-view');
    const loginForm = document.getElementById('login-form');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const registerToggleBtn = document.getElementById('register-toggle-btn');
    const registrationFields = document.getElementById('registration-fields');
    
    const logoutBtn = document.getElementById('logout-btn');
    const userLogoutBtn = document.getElementById('user-logout-btn');
    const loadingContainer = document.getElementById('login-loading');
    const loadingFill = document.getElementById('loading-fill');
    const loadingPct = document.getElementById('loading-pct');
    const togglePwdBtn = document.getElementById('toggle-password');
    const pwdInput = document.getElementById('password');

    let isRegisterMode = false;

    // Toggle Mode Logic
    if (registerToggleBtn) {
        registerToggleBtn.onclick = () => {
            isRegisterMode = !isRegisterMode;
            if (registrationFields) registrationFields.classList.toggle('hidden', !isRegisterMode);
            if (loginSubmitBtn) loginSubmitBtn.innerText = isRegisterMode ? 'Create Account' : 'Login';
            if (registerToggleBtn) registerToggleBtn.innerText = isRegisterMode ? 'Already have an account? Login' : "Don't have an account? Create one";
            
            // Toggle required attribute for validation
            const extraInputs = registrationFields?.querySelectorAll('input');
            extraInputs?.forEach(input => input.required = isRegisterMode);
        };
    }

    // UI Utilities
    const showLoading = () => {
        if(loginForm) loginForm.classList.add('hidden');
        if(loadingContainer) loadingContainer.classList.remove('hidden');
        window.isLoggingIn = true; 
    };
    
    const hideLoading = () => {
        if(loadingContainer) loadingContainer.classList.add('hidden');
        if(loginForm) loginForm.classList.remove('hidden');
        window.isLoggingIn = false;
        if(loadingFill) loadingFill.style.width = '0%';
        if(loadingPct) loadingPct.innerText = '0%';
    };

    const runProgress = () => {
        let p = 0;
        return setInterval(() => {
            p += Math.random() * 15;
            if (p > 90) p = 90;
            if(loadingFill) loadingFill.style.width = `${p}%`;
            if(loadingPct) loadingPct.innerText = `${Math.floor(p)}%`;
        }, 100);
    };

    const finishProgress = (interval) => {
        clearInterval(interval);
        if(loadingFill) loadingFill.style.width = '100%';
        if(loadingPct) loadingPct.innerText = '100%';
    };

    const showSuccess = (msg) => {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
          <div class="modal-overlay active" style="z-index:9999;">
            <div class="modal-content glow-panel" style="max-width: 400px; border-color: #238636;">
              <div class="modal-header" style="background: rgba(35, 134, 54, 0.1); border-bottom: 2px solid #238636;">
                <h3 style="color: #238636; display: flex; align-items: center; gap: 8px; margin: 0; font-family: 'Outfit'; font-weight: 700;">
                   <span style="font-size: 1.25rem;">✅</span> SUCCESS
                </h3>
                <button class="close-btn" id="close-success-modal" style="color: #238636;">&times;</button>
              </div>
              <div class="modal-body text-center" style="padding: 30px;">
                 <p style="font-weight: 800; color: #fff; margin-bottom: 15px; font-size: 1.2rem; letter-spacing: 1px;">ACTION SUCCESSFUL</p>
                 <p style="font-size: 0.95rem; color: var(--text-main); margin-bottom: 25px; line-height: 1.5;">${msg}</p>
                 <button id="success-ack-btn" class="btn-primary" style="width: 100%; background: #238636; color: #fff; font-weight: 800; border: none;">CONTINUE</button>
              </div>
            </div>
          </div>
        `;
        const close = () => modalContainer.innerHTML = '';
        document.getElementById('close-success-modal').onclick = close;
        document.getElementById('success-ack-btn').onclick = close;
    };

    const showError = (code, msg) => {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = `
          <div class="modal-overlay active" style="z-index:9999;">
            <div class="modal-content glow-panel" style="max-width: 400px; border-color: #ef4444;">
              <div class="modal-header" style="background: rgba(239, 68, 68, 0.1); border-bottom: 2px solid #ef4444;">
                <h3 style="color: #ef4444; display: flex; align-items: center; gap: 8px; margin: 0; font-family: 'Outfit'; font-weight: 700;">
                   <span style="font-size: 1.25rem;">🛑</span> SECURITY ALERT
                </h3>
                <button class="close-btn" id="close-error-modal" style="color: #ef4444;">&times;</button>
              </div>
              <div class="modal-body text-center" style="padding: 30px;">
                 <p style="font-weight: 800; color: #fff; margin-bottom: 10px; font-size: 1.2rem; letter-spacing: 2px;">ACCESS OR ACTION DENIED</p>
                 <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px; line-height: 1.5;">${msg}</p>
                 <div style="background: rgba(0,0,0,0.5); padding: 12px; border-radius: 6px; border: 1px dashed #ef4444; margin-bottom: 25px;">
                    <code style="color: #ef4444; font-size: 0.75rem;">SYS_ERR: ${code}</code>
                 </div>
                 <button id="error-ack-btn" class="btn-primary" style="width: 100%; background: #ef4444; color: #000; font-weight: 800; border: none;">ACKNOWLEDGE</button>
              </div>
            </div>
          </div>
        `;
        document.getElementById('close-error-modal').onclick = () => modalContainer.innerHTML = '';
        document.getElementById('error-ack-btn').onclick = () => modalContainer.innerHTML = '';
    };

    // Toggle Password Visibility
    if (togglePwdBtn && pwdInput) {
        togglePwdBtn.onclick = () => {
            const isPwd = pwdInput.type === 'password';
            pwdInput.type = isPwd ? 'text' : 'password';
            togglePwdBtn.style.color = isPwd ? 'var(--accent-primary)' : 'var(--text-muted)';
        };
    }

    // Load Roles & Determine Views
    // Load Roles & Determine Views
    const handleAuthRedirect = async (user) => {
        try {
            let role = 'user'; 
            let username = user.email.split('@')[0];
            
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    role = data.role || 'user';
                    username = data.username || username;
                } else {
                    // Failsafe sync
                    setDoc(doc(db, 'users', user.uid), { email: user.email, role: 'user', username: username }, {merge: true}).catch(e => console.warn(e));
                }
            } catch (dbErr) {
                console.warn("Firestore Read Blocked.", dbErr);
            }

            // SUPER ADMIN OVERRIDE
            if (user.email === 'ambaganjazzam@gmail.com') {
                role = 'admin';
                username = 'ADMIN_JAZZAM'; 
            }

            // Update UI with Username
            const disp = document.getElementById('display-name');
            const avatar = document.getElementById('user-avatar');
            if (disp) disp.innerText = username.toUpperCase();
            if (avatar) avatar.innerText = username.substring(0, 2).toUpperCase();
            
            const userDashEmail = document.getElementById('user-dashboard-email');
            if (userDashEmail) userDashEmail.innerText = `Username: ${username} | Clearance: ${role.toUpperCase()}`;

            // Store globally for other control scripts
            window.currentUserRole = role;

            // --- ROLE-BASED UI PROTECTION ---
            const navCases = document.getElementById('nav-cases');
            const navRoadmap = document.getElementById('nav-roadmap');
            const casesBlocked = document.getElementById('cases-blocked-overlay');
            const addCaseBtn = document.getElementById('add-case-btn');
            const recentPanel = document.querySelector('.recent-panel');
            const roleBadge = document.querySelector('.user-role');

            if (loginView) loginView.classList.add('hidden');
            if (userDashboardView) userDashboardView.classList.add('hidden');
            if (dashboardView) dashboardView.classList.remove('hidden');

            if (role === 'admin') {
                if (navCases) navCases.classList.remove('hidden');
                if (navRoadmap) navRoadmap.classList.remove('hidden');
                if (casesBlocked) casesBlocked.classList.add('hidden');
                if (addCaseBtn) addCaseBtn.classList.remove('hidden');
                if (recentPanel) recentPanel.classList.remove('hidden');
                if (roleBadge) {
                    roleBadge.innerText = 'Admin Level Access';
                    roleBadge.style.color = 'var(--accent-primary)';
                }
            } else {
                if (navCases) navCases.classList.add('hidden');
                if (navRoadmap) navRoadmap.classList.add('hidden');
                if (casesBlocked) casesBlocked.classList.remove('hidden');
                if (addCaseBtn) addCaseBtn.classList.add('hidden');
                if (recentPanel) recentPanel.classList.add('hidden');
                if (roleBadge) {
                    roleBadge.innerText = 'VIEWER ONLY';
                    roleBadge.style.color = 'var(--text-muted)';
                }
                const currentTab = document.querySelector('.nav-item.active')?.getAttribute('data-target');
                if (currentTab === 'cases-tab' || currentTab === 'roadmap-tab') {
                    document.getElementById('nav-overview')?.click();
                }
            }
        } catch (err) {
            console.error(err);
            showError("AUTH_REDIRECT_ERROR", "Security validation failed.");
        }
    };

    onAuthStateChanged(auth, async (user) => {
        if (user && !window.isLoggingIn) { 
            await handleAuthRedirect(user);
        } else if (!user) {
            if (loginView) loginView.classList.remove('hidden');
            if (dashboardView) dashboardView.classList.add('hidden');
            if (userDashboardView) userDashboardView.classList.add('hidden');
        }
    });

    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = pwdInput.value;

            showLoading();
            const interval = runProgress();

            try {
                let user;
                if (isRegisterMode) {
                    const username = document.getElementById('reg-username').value.trim();
                    const firstName = document.getElementById('reg-firstname').value.trim();
                    const lastName = document.getElementById('reg-lastname').value.trim();

                    if (!username || !firstName || !lastName) {
                        throw { code: 'missing-profile', message: 'All profile fields are required.' };
                    }

                    const userCred = await createUserWithEmailAndPassword(auth, email, password);
                    user = userCred.user;
                    
                    // Attempt Firestore registration (Silent if rules deny)
                    try {
                        await setDoc(doc(db, 'users', user.uid), {
                            email,
                            username,
                            firstName,
                            lastName,
                            role: 'user',
                            createdAt: new Date().toISOString()
                        });
                    } catch (fsErr) {
                        console.warn("Firestore Registration Sync Silenced:", fsErr);
                    }
                } else {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    user = userCredential.user;
                }
                
                finishProgress(interval);
                setTimeout(() => {
                    hideLoading();
                    if (isRegisterMode) {
                        showSuccess('Successful! "VIEWER ONLY" role assigned.');
                    }
                    handleAuthRedirect(user);
                }, 800);
            } catch (error) {
                clearInterval(interval);
                hideLoading();
                showError(error.code || 'authentication_failure', error.message || "Process failed.");
            }
        };
    }

    // Universal Logout Handler
    const buildLogout = (btnElement) => {
        if (!btnElement) return;
        btnElement.onclick = () => {
            const modalContainer = document.getElementById('modal-container');
            modalContainer.innerHTML = `
              <div class="modal-overlay active" style="z-index:9999;">
                <div class="modal-content glow-panel" style="max-width: 400px; text-align: center; border-color: var(--accent-secondary);">
                  <div class="modal-header">
                    <h3 style="color: var(--accent-secondary);">Terminating Session</h3>
                    <button class="close-btn" id="close-logout-modal">&times;</button>
                  </div>
                  <div class="modal-body" style="padding: 30px;">
                     <div style="font-size: 3rem; margin-bottom: 20px;">👤</div>
                     <p style="margin-bottom: 25px; color: var(--text-main); font-weight: 500;">Are you sure you want to log out of your session?</p>
                     <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="cancel-logout" class="btn-secondary" style="flex: 1;">Keep Active</button>
                        <button id="confirm-logout" class="btn-primary" style="flex: 1; background: var(--accent-secondary); color: #fff;">Log Out</button>
                     </div>
                  </div>
                </div>
              </div>
            `;
            const close = () => modalContainer.innerHTML = '';
            document.getElementById('close-logout-modal').onclick = close;
            document.getElementById('cancel-logout').onclick = close;
            document.getElementById('confirm-logout').onclick = () => {
                signOut(auth).catch(err => console.error(err));
                close();
            };
        };
    };

    buildLogout(logoutBtn);
    buildLogout(userLogoutBtn);
}
