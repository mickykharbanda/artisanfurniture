const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Function to generate a random password
function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Create 50 client records
async function setupClients() {
    const batch = db.batch();
    const clients = [];

    for (let i = 1; i <= 50; i++) {
        const clientId = `CL${i.toString().padStart(4, '0')}`;
        const password = generatePassword();
        
        const clientRef = db.collection('clients').doc(clientId);
        batch.set(clientRef, {
            clientId: clientId,
            password: password,
            active: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        clients.push({ clientId, password });
    }

    try {
        await batch.commit();
        console.log('Successfully created client records:');
        console.log('ClientID | Password');
        console.log('-----------------');
        clients.forEach(({ clientId, password }) => {
            console.log(`${clientId} | ${password}`);
        });
        
        // Verify first client
        const firstClient = await db.collection('clients').doc('CL0001').get();
        if (firstClient.exists) {
            console.log('\nVerification - First client data:', {
                ...firstClient.data(),
                password: '[HIDDEN]'
            });
        }
        
        // Export to CSV
        exportToCSV(clients);
    } catch (error) {
        console.error('Error creating client records:', error);
        throw error; // Re-throw to handle in the calling function
    }
}

// Export clients to CSV
function exportToCSV(clients) {
    const csvContent = 'Client ID,Password\n' + 
        clients.map(({clientId, password}) => `${clientId},${password}`).join('\n');
    
    const exportPath = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath);
    }
    
    const filePath = path.join(exportPath, `client_credentials_${Date.now()}.csv`);
    fs.writeFileSync(filePath, csvContent);
    console.log(`\nExported credentials to: ${filePath}`);
}

// Function to verify client records
async function verifyClients() {
    try {
        const snapshot = await db.collection('clients').get();
        console.log('\nVerifying client records in Firestore:');
        console.log(`Total clients found: ${snapshot.size}`);
        
        if (snapshot.size === 0) {
            console.log('No client records found. Creating new records...');
            await setupClients();
        } else {
            console.log('Sample client records:');
            snapshot.docs.slice(0, 3).forEach(doc => {
                console.log(`${doc.id}: ${JSON.stringify(doc.data())}`);
            });
        }
    } catch (error) {
        console.error('Error verifying clients:', error);
    }
}

// Run verification first, then setup if needed
verifyClients()
    .then(() => process.exit())
    .catch(error => {
        console.error('Error:', error);
        process.exit(1);
    });
