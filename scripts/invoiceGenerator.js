// Invoice generator skeleton (Node)
// This is a template. Use puppeteer or pdfkit to render a PDF, upload to storage, and return a signed URL.
const admin = require('firebase-admin');
admin.initializeApp();
const storage = admin.storage();

async function generateInvoicePdf(order) {
    const html = `<html><body><h1>Invoice for ${order.id}</h1><p>Amount: ${order.amount}</p></body></html>`;
    const file = storage.bucket().file(`invoices/${order.id}.html`);
    await file.save(html, { contentType: 'text/html' });
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });
    return url;
}

module.exports = { generateInvoicePdf };