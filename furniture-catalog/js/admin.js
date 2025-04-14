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

// Check admin authentication
if (localStorage.getItem('userRole') !== 'admin') {
    window.location.href = '../index.html';
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '../index.html';
});

// Initialize upload boxes
waitForFirebase().then(() => {
    console.log('Firebase initialized');
    document.querySelectorAll('.upload-box').forEach(box => {
        const category = box.dataset.category;
        const dropZone = box.querySelector('.drop-zone');
        const fileInput = box.querySelector('.file-input');
        const lastUpdated = box.querySelector('.last-updated');

        // Load last updated time
        loadLastUpdated();

        // Handle drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.style.borderColor = '#000';
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.style.borderColor = '#ccc';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.style.borderColor = '#ccc';
            
            const file = e.dataTransfer.files[0];
            if (file) {
                uploadFile(file);
            }
        });

        // Handle click to upload
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadFile(file);
            }
        });

        async function loadLastUpdated() {
            try {
                const doc = await window.db.collection('catalogs').doc(category).get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data.downloadURL) {
                        const fileSize = data.fileSize ? `${(data.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size';
                        const filename = data.filename || 'catalog.pdf';
                        lastUpdated.innerHTML = `
                            <strong>${filename}</strong><br>
                            Size: ${fileSize}<br>
                            Last updated: ${new Date(data.last_updated).toLocaleString()}<br>
                            <a href="${data.downloadURL}" target="_blank" style="color: blue;">View PDF</a>
                        `;
                    } else {
                        lastUpdated.textContent = 'No catalog available';
                    }
                } else {
                    lastUpdated.textContent = 'No catalog uploaded yet';
                }
            } catch (error) {
                console.error('Error loading last updated:', error);
                lastUpdated.textContent = 'Error loading catalog info';
            }
        }

        async function uploadFile(file) {
            if (!file) return;
            
            if (file.type !== 'application/pdf') {
                alert('Please upload a PDF file');
                return;
            }

            try {
                dropZone.innerHTML = `
                    <div style="text-align: center;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <div>Preparing upload...</div>
                    </div>
                `;
                dropZone.style.backgroundColor = '#f4f4f4';

                // Delete existing file if it exists
                const storageRef = window.storage.ref();
                const filePath = `catalogs/${category}/catalog.pdf`;
                try {
                    const existingRef = storageRef.child(filePath);
                    await existingRef.delete();
                } catch (error) {
                    // Ignore error if file doesn't exist
                    if (error.code !== 'storage/object-not-found') {
                        throw error;
                    }
                }

                // Upload new file
                const uploadTask = storageRef.child(filePath).put(file, {
                    contentType: 'application/pdf'
                });

                uploadTask.on('state_changed', 
                    // Progress
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        dropZone.innerHTML = `
                            <div style="text-align: center;">
                                <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                                <div>Uploading: ${Math.round(progress)}%</div>
                            </div>
                        `;
                    },
                    // Error
                    (error) => {
                        console.error('Upload error:', error);
                        dropZone.innerHTML = 'Drop PDF here or click to upload';
                        dropZone.style.backgroundColor = 'white';
                        alert(`Upload failed: ${error.message}`);
                    },
                    // Complete
                    async () => {
                        try {
                            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                            await window.db.collection('catalogs').doc(category).set({
                                downloadURL,
                                filename: file.name,
                                fileSize: file.size,
                                contentType: file.type,
                                last_updated: new Date().toISOString(),
                                category
                            });

                            dropZone.innerHTML = 'Drop PDF here or click to upload';
                            dropZone.style.backgroundColor = 'white';
                            await loadLastUpdated();
                            alert('Upload successful!');
                        } catch (error) {
                            console.error('Error finalizing upload:', error);
                            dropZone.innerHTML = 'Drop PDF here or click to upload';
                            dropZone.style.backgroundColor = 'white';
                            alert(`Upload failed: ${error.message}`);
                        }
                    }
                );
            } catch (error) {
                console.error('Upload error:', error);
                dropZone.innerHTML = 'Drop PDF here or click to upload';
                dropZone.style.backgroundColor = 'white';
                alert(`Upload failed: ${error.message}`);
            }
        }
    });
});
