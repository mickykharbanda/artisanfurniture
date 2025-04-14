// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAVpGh2lD5xjIPNetCEuA_Ln3OFqjHGLnA",
    authDomain: "artisansfurniture.firebaseapp.com",
    projectId: "artisansfurniture",
    storageBucket: "artisansfurniture.appspot.com",
    messagingSenderId: "373076673543",
    appId: "1:373076673543:web:2fd65c716086b6bf4d16a2"
};

// Initialize Firebase
let app;
try {
    app = firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized');
} catch (error) {
    if (error.code === 'app/duplicate-app') {
        app = firebase.app();
        console.log('Using existing Firebase app');
    } else {
        console.error('Error initializing Firebase:', error);
        throw error;
    }
}

// Initialize Firebase services
let db, storage;
try {
    db = firebase.firestore();
    storage = firebase.storage();

    // Enable persistence for offline support
    db.enablePersistence()
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code == 'unimplemented') {
                console.warn('The current browser does not support persistence.');
            }
        });

    // Export Firebase services
    window.db = db;
    window.storage = storage;

    // Simple client verification
    if (localStorage.getItem('userRole') === 'client') {
        const clientId = localStorage.getItem('clientId');
        if (clientId) {
            db.collection('clients').doc(clientId).get()
                .then((doc) => {
                    if (doc.exists && doc.data().active) {
                        console.log('Client verified');
                    } else {
                        console.warn('Client not found or inactive');
                        localStorage.clear();
                        window.location.href = './index.html';
                    }
                })
                .catch((error) => {
                    console.error('Client verification error:', error);
                    localStorage.clear();
                    window.location.href = './index.html';
                });
        }
    }
} catch (error) {
    console.error('Error initializing Firebase services:', error);
}
