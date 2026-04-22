import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFees } from '../../hooks/useFees';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, Pagination } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  DollarSign,
  Search,
  Filter,
  FileText,
  Download,
  CreditCard,
  Banknote,
  CheckCircle,
  Printer
} from 'lucide-react';
import { FEE_STATUS_CONFIG, PAYMENT_METHODS, MONTHS } from '../../lib/constants';
import { formatCurrency, getCurrentMonthYear } from '../../lib/utils';
import { generateWhatsAppLink, generateFeeReminderMessage } from '../../lib/whatsapp';
import FeeReceipt from '../../components/fees/FeeReceipt';

function Fees() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const { month, year } = getCurrentMonthYear();
  const { fees, loading, summary, recordPayment, generateMonthlyFees } = useFees({
    search,
    status: statusFilter || undefined,
    month,
    year
  });

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    const formData = new FormData(e.target);
    const paymentData = {
      amount: parseFloat(formData.get('amount')),
      method: formData.get('method'),
      reference: formData.get('reference')
    };

    const { data, error } = await recordPayment(selectedFee.id, {
      ...paymentData,
      totalDue: selectedFee.amount_due
    });

    if (error) {
      showError('Failed to record payment');
    } else {
      success('Payment recorded successfully');
      setPaymentModalOpen(false);
      setReceiptModalOpen(true);
    }
  };

  const handleGenerateFees = async () => {
    const { count, error } = await generateMonthlyFees(month, year);
    if (error) {
      showError('Failed to generate fees');
    } else {
      success(`Generated ${count} fee records`);
    }
  };

  const handleWhatsAppReminder = (fee) => {
    const message = generateFeeReminderMessage(
      fee.students?.parent_name || 'Parent',
      fee.students?.name || 'Student',
      fee.amount_due,
      MONTHS[fee.month - 1]
    );
    const link = generateWhatsAppLink(fee.students?.parent_phone, message);
    window.open(link, '_blank');
  };

  const columns = [
    {
      key: 'students',
      title: 'Student',
      render: (value) => (
        <div>
          <p className="font-medium text-text-primary">{value?.name}</p>
          <p className="text-sm text-text-muted">{value?.course}</p>
        </div>
      )
    },
    {
      key: 'month',
      title: 'Month',
      render: (value) => MONTHS[value - 1]
    },
    {
      key: 'amount_due',
      title: 'Amount Due',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'amount_paid',
      title: 'Amount Paid',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => {
        const variantMap = { green: 'success', red: 'danger', yellow: 'warning' };
        const badgeVariant = variantMap[FEE_STATUS_CONFIG[value]?.color] || 'muted';
        return (
          <Badge variant={badgeVariant}>
            {FEE_STATUS_CONFIG[value]?.label || value}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      title: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {row.status !== 'paid' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedFee(row);
                  setPaymentModalOpen(true);
                }}
              >
                <CreditCard className="w-4 h-4 mr-1" />
                Pay
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleWhatsAppReminder(row)}
              >
                Remind
              </Button>
            </>
          )}
          {row.status === 'paid' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFee(row);
                setReceiptModalOpen(true);
              }}
            >
              <FileText className="w-4 h-4 mr-1" />
              Receipt
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Fees & Billing</h1>
          <p className="text-text-muted">Manage student fee payments and billing.</p>
        </div>

        <div className="flex gap-2">
          {isAdmin() && (
            <Button
              variant="secondary"
              onClick={handleGenerateFees}
            >
              Generate Monthly Fees
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Total Due</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(summary.totalDue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Total Paid</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(summary.totalPaid)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Outstanding</p>
            <p className="text-2xl font-bold text-yellow-400">{formatCurrency(summary.totalOutstanding)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Overdue</p>
            <p className="text-2xl font-bold text-red-400">{summary.overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-border rounded-md pl-10 pr-4 py-2 text-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white/5 border border-border rounded-md px-4 py-2 text-sm text-text-primary"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          <Table
            columns={columns}
            data={fees}
            loading={loading}
            emptyMessage="No fee records found"
          />
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Payment"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="payment-form"
            >
              Record Payment
            </Button>
          </>
        }
      >
        {selectedFee && (
          <form id="payment-form" onSubmit={handlePayment} className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5">
              <p className="text-sm text-text-muted">Student</p>
              <p className="font-medium text-text-primary">{selectedFee.students?.name}</p>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm text-text-muted">Amount Due</p>
                  <p className="font-medium text-text-primary">{formatCurrency(selectedFee.amount_due)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Amount Paid</p>
                  <p className="font-medium text-text-primary">{formatCurrency(selectedFee.amount_paid)}</p>
                </div>
              </div>
            </div>

            <Input
              label="Payment Amount (AED)"
              name="amount"
              type="number"
              defaultValue={selectedFee.amount_due - selectedFee.amount_paid}
              required
              min="1"
              max={selectedFee.amount_due - selectedFee.amount_paid}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Payment Method</label>
              <select
                name="method"
                required
                className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm"
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Reference Number (Optional)"
              name="reference"
              placeholder="e.g., Bank transfer reference"
            />
          </form>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Payment Receipt"
        size="lg"
      >
        {selectedFee && (
          <FeeReceipt
            fee={selectedFee}
            student={selectedFee.students}
            onClose={() => setReceiptModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}

export default Fees;
