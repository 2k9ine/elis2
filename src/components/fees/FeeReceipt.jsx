import { useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Button from '../ui/Button';
import { Printer, Download, X } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { APP_NAME, APP_LOCATION, TRINITY_CENTER_REF } from '../../lib/constants';

function FeeReceipt({ fee, student, onClose }) {
  const receiptRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${fee.receipt_number || fee.id}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    }
  };

  // fee.month is 1-indexed from the DB (1=January), JS Date() month param is 0-indexed
  const monthYear = new Date(fee.year, fee.month - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-4">
      {/* Receipt Actions */}
      <div className="flex items-center justify-end gap-2 print:hidden">
        <Button variant="secondary" onClick={handleDownloadPDF}>
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Receipt Content */}
      <div
        ref={receiptRef}
        className="bg-white text-gray-900 p-8 rounded-lg"
        style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-gray-200 pb-6">
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="text-gray-600 mt-1">Music & Arts School</p>
          <p className="text-gray-500 text-sm mt-1">{APP_LOCATION}</p>
          <p className="text-gray-500 text-sm">Trinity Center: {TRINITY_CENTER_REF}</p>
        </div>

        {/* Receipt Title */}
        <div className="text-center py-4">
          <h2 className="text-xl font-bold text-gray-900">PAYMENT RECEIPT</h2>
          <p className="text-gray-500 text-sm mt-1">Receipt No: {fee.receipt_number || fee.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Student Details */}
        <div className="space-y-2 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Student Name</p>
              <p className="font-medium text-gray-900">{student?.name || '-'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Course</p>
              <p className="font-medium text-gray-900">{student?.course || '-'}</p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="border-t border-gray-200 py-6">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-2 text-gray-600">Fee Period</td>
                <td className="py-2 text-right font-medium text-gray-900">{monthYear}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Amount Due</td>
                <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(fee.amount_due)}</td>
              </tr>
              <tr>
                <td className="py-2 text-gray-600">Amount Paid</td>
                <td className="py-2 text-right font-medium text-green-600">{formatCurrency(fee.amount_paid)}</td>
              </tr>
              {student?.discount_percent > 0 && (
                <tr>
                  <td className="py-2 text-gray-600">Discount</td>
                  <td className="py-2 text-right font-medium text-green-600">{student.discount_percent}%</td>
                </tr>
              )}
              <tr className="border-t border-gray-200">
                <td className="py-3 text-gray-900 font-bold">Payment Status</td>
                <td className="py-3 text-right">
                  <span className={`font-bold ${
                    fee.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {fee.status === 'paid' ? 'PAID IN FULL' : fee.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Method & Date */}
        <div className="border-t border-gray-200 pt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-sm">Payment Method</p>
            <p className="font-medium text-gray-900 capitalize">{fee.payment_method?.replace('-', ' ') || 'Cash'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Payment Date</p>
            <p className="font-medium text-gray-900">{formatDate(fee.payment_date) || formatDate(new Date())}</p>
          </div>
          {fee.reference_number && (
            <div className="col-span-2">
              <p className="text-gray-500 text-sm">Reference Number</p>
              <p className="font-medium text-gray-900">{fee.reference_number}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 mt-6 pt-6 text-center">
          <p className="text-gray-500 text-sm">Thank you for your payment!</p>
          <p className="text-gray-400 text-xs mt-2">
            This is a computer-generated receipt and does not require a signature.
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white,
          .bg-white * {
            visibility: visible;
          }
          .bg-white {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default FeeReceipt;
