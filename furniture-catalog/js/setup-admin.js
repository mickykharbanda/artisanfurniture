const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function setupAdmin() {
    try {
        // Create admin user
        const userRecord = await admin.auth().createUser({
            uid: 'admin',
            password: 'supersecure123'
        });

        // Set admin claim
        await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

        console.log('Successfully set up admin account with admin privileges');
    } catch (error) {
        if (error.code === 'auth/uid-already-exists') {
            // If admin already exists, just set the claim
            await admin.auth().setCustomUserClaims('admin', { admin: true });
            console.log('Admin account already exists, updated admin privileges');
        } else {
            console.error('Error setting up admin:', error);
        }
    }
}

setupAdmin().then(() => process.exit());
