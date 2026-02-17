import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import getStream from 'get-stream';
import { getFirestoreAdmin, getAdminApp } from '@/firebase/server-init';

export async function GET(request: any, context: any) {
  const params = context?.params || {};
  try {
    const shipmentId = params.shipmentId;
    if (!shipmentId) return NextResponse.json({ error: 'missing shipmentId' }, { status: 400 });

    const db = getFirestoreAdmin();
    const snap = await db.collection('shipments').doc(shipmentId).get();
    if (!snap.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const shipment = snap.data() as any;

    // Validate company isolation: require token matches shipment.companyId
    try {
      const { requireCompanyFromRequest } = await import('@/lib/companyContext');
      await requireCompanyFromRequest(request.headers, shipment.companyId);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'unauthorized' }, { status: 401 });
    }

    // Generate PDF in memory
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.fontSize(20).text('Crownshift Logistics — Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Shipment: ${shipment.trackingNumber}`);
    doc.text(`Origin: ${shipment.origin?.city}, ${shipment.origin?.country}`);
    doc.text(`Destination: ${shipment.destination?.city}, ${shipment.destination?.country}`);
    doc.text(`Service: ${shipment.serviceSlug}`);
    doc.text(`Payment status: ${shipment.payment?.paymentStatus || 'unknown'}`);
    doc.moveDown();

    // VAT and totals (example)
    const base = shipment.payment?.metadata?.amount || 0;
    const vat = Math.round(base * 0.16);
    const total = base + vat;
    doc.text(`Subtotal: ${base}`);
    doc.text(`VAT (16%): ${vat}`);
    doc.text(`Total: ${total}`);

    doc.end();
    const buffer = await getStream.buffer(doc);

    // upload to Storage
    const adminApp = getAdminApp();
    const bucket = adminApp.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const filePath = `invoices/${shipmentId}.pdf`;
    const file = bucket.file(filePath);
    await file.save(buffer, { contentType: 'application/pdf' });

    // get public URL (or signed URL)
    const [url] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 60 * 24 * 7 });

    await db.collection('invoices').doc().set({ companyId: shipment.companyId, shipmentId, storagePath: filePath, url, createdAt: new Date() });

    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('Invoice generate error', err);
    return NextResponse.json({ error: err.message || 'invoice error' }, { status: 500 });
  }
}
