// Wait for Firebase to initialize
const waitForFirebase = () => {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        const check = () => {
            attempts++;
            if (window.db && window.storage) {
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

// Check authentication
if (!localStorage.getItem('clientId') && localStorage.getItem('userRole') !== 'admin') {
    console.log('No client ID found, redirecting to login...');
    window.location.href = './index.html';
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    console.log('Logging out...');
    localStorage.clear();
    window.location.href = './index.html';
});

// Initialize Firebase and set up event listeners
waitForFirebase().then(() => {
    console.log('Firebase ready, setting up category buttons...');
    
    // Handle category selection
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const category = button.dataset.category;
            console.log('Selected category:', category);
            
            try {
                // Get catalog metadata from Firestore
                const catalogDoc = await window.db.collection('catalogs').doc(category).get();
                const catalogData = catalogDoc.data();
                console.log('Retrieved catalog data:', catalogData);

                if (!catalogData || !catalogData.downloadURL) {
                    console.log('No catalog data found');
                    document.getElementById('pdfViewer').innerHTML = '<div class="no-catalog">No catalog available for this category</div>';
                    return;
                }

                // Load PDF viewer
                const pdfViewer = document.getElementById('pdfViewer');
                pdfViewer.innerHTML = `
                    <div class="pdf-container">
                        <embed src="${catalogData.downloadURL}" type="application/pdf" width="100%" height="100%">
                        <div class="pdf-info">
                            <p>Last updated: ${new Date(catalogData.last_updated).toLocaleString()}</p>
                            <p>Size: ${(catalogData.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    </div>
                `;
                console.log('PDF viewer updated');

            } catch (error) {
                console.error('Error loading catalog:', error);
                alert('Error loading catalog');
            }
        });
    });
});
