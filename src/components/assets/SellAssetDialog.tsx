import { DatePicker } from '@/components/shared/DatePicker';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateAsset } from '@/hooks/assets/useAssets';
import { useCreateIncome } from '@/hooks/finance/income';
import type { Asset } from '@/types/assets';
import type { PaymentMethod } from '@/types/finance';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { paymentMethodOptions } from '../finance/constants';

interface SellAssetDialogProps {
  asset: Asset;
}

export function SellAssetDialog({ asset }: SellAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [recordAsIncome, setRecordAsIncome] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [checkNumber, setCheckNumber] = useState('');

  const updateAsset = useUpdateAsset();
  const createIncome = useCreateIncome();

  const handleSubmit = async () => {
    if (!amount || !date) {
      toast.error('Please fill in all fields');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (recordAsIncome && paymentMethod === 'cheque' && !checkNumber) {
      toast.error('Please enter a cheque number');
      return;
    }

    try {
      await updateAsset.mutateAsync({
        id: asset.id,
        updates: {
          status: 'Sold',
          sold_amount: numericAmount,
          sold_date: date,
        },
      });

      if (recordAsIncome) {
        await createIncome.mutateAsync({
          amount: numericAmount,
          category: 'Asset Sale',
          payment_method: paymentMethod,
          date: date,
          description: `Sale of asset: ${asset.name}`,
          income_type: 'general_income',
          source_type: 'other',
          source: 'Asset Sale',
          branch_id: asset.branch_id,
          check_number: paymentMethod === 'cheque' ? checkNumber : undefined,
        });
      }

      toast.success(
        recordAsIncome
          ? 'Asset sold and income recorded'
          : 'Asset marked as sold'
      );
      setOpen(false);
    } catch (error) {
      console.error('Failed to sell asset:', error);
      toast.error('Failed to update asset status');
    }
  };

  const isSubmitting = updateAsset.isPending || createIncome.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          Sell Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sell Asset</DialogTitle>
          <DialogDescription>
            Mark this asset as sold. This will update its status and record the
            sale details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Sale Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                className="pl-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Sale Date</Label>
            <DatePicker
              value={date}
              onChange={setDate}
              formatDateLabel={(date) => format(new Date(date), 'dd MMM, yyyy')}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="recordIncome"
              checked={recordAsIncome}
              onCheckedChange={(checked) =>
                setRecordAsIncome(checked as boolean)
              }
            />
            <Label htmlFor="recordIncome">Record as Income</Label>
          </div>

          {recordAsIncome && (
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as PaymentMethod)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {recordAsIncome && paymentMethod === 'cheque' && (
            <div className="space-y-2">
              <Label htmlFor="checkNumber">Cheque Number</Label>
              <Input
                id="checkNumber"
                placeholder="Enter cheque number"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
