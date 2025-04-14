const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function activateAllClients() {
    try {
        const batch = db.batch();
        let count = 0;

        // Create batch of updates for all 50 clients
        for (let i = 1; i <= 50; i++) {
            const clientId = `CL${i.toString().padStart(4, '0')}`;
            const clientRef = db.collection('clients').doc(clientId);
            batch.update(clientRef, {
                active: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            count++;
        }

        // Commit the batch
        await batch.commit();
        console.log(`Successfully activated ${count} clients`);

        // Verify a few random clients
        const verifyIds = ['CL0001', 'CL0025', 'CL0050'];
        for (const id of verifyIds) {
            const client = await db.collection('clients').doc(id).get();
            if (client.exists) {
                console.log(`Verified client ${id}:`, {
                    ...client.data(),
                    password: '[HIDDEN]'
                });
            }
        }
    } catch (error) {
        console.error('Error activating clients:', error);
        throw error;
    }
}

// Activate all clients
activateAllClients()
    .then(() => process.exit())
    .catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
