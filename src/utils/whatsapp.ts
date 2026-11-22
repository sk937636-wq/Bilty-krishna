import { BiltyRecord, CompanyProfile } from '../types';

/**
 * Formats a Lorry Receipt / Bilty into a professional WhatsApp message
 * and opens WhatsApp for instant sharing with Party, Transporter, or Driver.
 */
export function generateBiltyWhatsAppText(bilty: BiltyRecord, company: CompanyProfile): string {
  const freightFormatted = Number(bilty.grandTotal || 0).toLocaleString('en-IN');
  const advanceFormatted = Number(bilty.advance || 0).toLocaleString('en-IN');
  const balanceFormatted = Number(bilty.balance || 0).toLocaleString('en-IN');

  const lines = [
    `🚚 *${company.companyName.toUpperCase()}*`,
    `📋 *LORRY RECEIPT / BILTY*`,
    `───────────────────────`,
    `🔢 *Bilty (LR) No:* #${bilty.lrNo}`,
    `📅 *Date:* ${bilty.date || new Date().toISOString().split('T')[0]}`,
    `🚛 *Gadi No:* ${bilty.vehicleNo || 'N/A'} (${bilty.vehicleSize || '22 FT'})`,
    `📍 *Route:* ${bilty.fromCity} ➔ ${bilty.toCity}`,
    `───────────────────────`,
    `🏢 *Bhejne Wala (Consignor):* ${bilty.consignorName || 'N/A'}`,
    `🏬 *Paane Wala (Consignee):* ${bilty.consigneeName || 'N/A'}`,
    `📦 *Maal / Item:* ${bilty.goodsDescription || 'General Goods'}`,
    `⚖️ *Wajan / Qty:* ${bilty.quantity ? bilty.quantity + ' Nag' : ''} ${bilty.netWeight ? '| ' + bilty.netWeight : ''}`,
    bilty.eWayBillNo ? `📑 *E-Way Bill:* ${bilty.eWayBillNo}` : '',
    `───────────────────────`,
    `💰 *Kul Bhada (Total):* ₹${freightFormatted}`,
    `💵 *Advance Jama:* ₹${advanceFormatted}`,
    `⚠️ *Baki Balance:* ₹${balanceFormatted} (${bilty.paymentMode.replace(/_/g, ' ')})`,
    `───────────────────────`,
    company.phone ? `📞 *Sampark:* ${company.phone}` : '',
    `_Bilty safalta se generate hui hai._`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function shareBiltyOnWhatsApp(
  bilty: BiltyRecord,
  company: CompanyProfile,
  phone?: string
): void {
  const text = generateBiltyWhatsAppText(bilty, company);
  const encodedText = encodeURIComponent(text);

  let url = `https://api.whatsapp.com/send?text=${encodedText}`;
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`;
  }

  // Open in a new tab / launch WhatsApp app
  window.open(url, '_blank');
}
