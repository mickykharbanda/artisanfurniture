// Admin credentials
const ADMIN = {
    id: 'admin@sai',
    password: 'Admin123@sai'
};

// Wait for Firebase to initialize
const waitForFirebase = () => {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        const check = () => {
            attempts++;
            if (window.db) {
                resolve();
            } else if (attempts >= maxAttempts) {
                reject(new Error('Firebase initialization timeout'));
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Firebase
    try {
        await waitForFirebase();
    } catch (error) {
        console.error('Firebase initialization failed:', error);
    }
    const loginForm = document.getElementById('loginForm');
    const clientIdInput = document.getElementById('clientId');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.querySelector('.toggle-password');

    // Error handling
    function showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();

        const error = document.createElement('div');
        error.className = 'error-message';
        error.style.cssText = 'color: #e74c3c; margin-top: 10px; text-align: center;';
        error.textContent = message;
        loginForm.appendChild(error);
    }

    // Password toggle
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.onclick = (e) => {
            e.preventDefault();
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePasswordBtn.className = `fas ${type === 'password' ? 'fa-eye-slash' : 'fa-eye'} input-icon right-icon toggle-password`;
        };
    }

    // Login handler
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = clientIdInput.value.trim();
        const password = passwordInput.value;

        // Validate inputs
        if (!id || !password) {
            showError('Please enter both Client ID and Password');
            return;
        }

        // Show loading
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;

        try {
            // Check admin login first
            if (id === ADMIN.id && password === ADMIN.password) {
                localStorage.setItem('userRole', 'admin');
                window.location.href = 'admin/index.html';
                return;
            }

            // Check client login
            const clientsRef = window.db.collection('clients');
            const clientDoc = await clientsRef.doc(id).get();

            if (clientDoc.exists) {
                const clientData = clientDoc.data();
                if (clientData.password === password && clientData.active) {
                    localStorage.setItem('userRole', 'client');
                    localStorage.setItem('clientId', id);
                    window.location.href = 'catalog.html';
                    return;
                }
            }

            // Reset button state
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
            showError('Invalid credentials');
        } catch (error) {
            console.error('Login error:', error);
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
            showError('An error occurred. Please try again.');
        }
    };
});
