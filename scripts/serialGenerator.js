// Serial generator skeleton for Firestore (Node admin SDK)
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

async function getNextServiceSerial() {
  const ref = db.collection('counters').doc('services');
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    let next = 1;
    if (doc.exists) next = (doc.data().last || 0) + 1;
    tx.set(ref, { last: next }, { merge: true });
    const d = new Date();
    const date = d.toISOString().slice(0,10).replace(/-/g,'');
    return `SRV-${date}-${String(next).padStart(4,'0')}`;
  });
}

module.exports = { getNextServiceSerial };