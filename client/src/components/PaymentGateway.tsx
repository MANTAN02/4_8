import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentGatewayProps {
  amount: number;
  businessId: string;
  businessName: string;
  qrCodeId?: string;
  onSuccess: (paymentData: any) => void;
  onFailure?: (error: any) => void;
}

export default function PaymentGateway({
  amount,
  businessId,
  businessName,
  qrCodeId,
  onSuccess,
  onFailure
}: PaymentGatewayProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'wallet'>('upi');

  const calculateBCoins = () => {
    return Math.floor(amount * 0.08); // 8% B-Coins
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // Create payment order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount,
          business_id: businessId,
          qr_code_id: qrCodeId,
          description: `Payment to ${businessName}`
        })
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Configure Razorpay options
      const options = {
        key: orderData.order.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'Baartal Mumbai',
        description: `Payment to ${businessName}`,
        order_id: orderData.order.id,
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || '',
          contact: localStorage.getItem('userPhone') || ''
        },
        theme: {
          color: '#ff6b35'
        },
        method: {
          upi: selectedMethod === 'upi',
          card: selectedMethod === 'card',
          wallet: selectedMethod === 'wallet',
          netbanking: false,
          emi: false
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              toast.success(`Payment successful! You earned ${verifyData.transaction.bcoins_earned} B-Coins`);
              onSuccess(verifyData.transaction);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
            onFailure?.(error);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast.info('Payment cancelled');
          }
        }
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', async function (response: any) {
        // Report payment failure
        await fetch('/api/payments/failure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            razorpay_order_id: orderData.order.id,
            error_code: response.error.code,
            error_description: response.error.description
          })
        });

        setIsProcessing(false);
        toast.error(`Payment failed: ${response.error.description}`);
        onFailure?.(response.error);
      });

      rzp.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setIsProcessing(false);
      onFailure?.(error);
    }
  };

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Pay via UPI apps like PhonePe, GPay'
    },
    {
      id: 'card',
      name: 'Card',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Debit/Credit Card'
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: <Wallet className="w-5 h-5" />,
      description: 'Paytm, Mobikwik, etc.'
    }
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pay to {businessName}</span>
          <Badge variant="secondary">Mumbai</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Amount Display */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-orange-600">
            ₹{amount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            You'll earn <span className="font-semibold text-orange-600">
              {calculateBCoins()} B-Coins
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Choose Payment Method</label>
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedMethod === method.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedMethod(method.id as any)}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className={`p-2 rounded-full ${
                  selectedMethod === method.id ? 'bg-orange-100' : 'bg-gray-100'
                }`}>
                  {method.icon}
                </div>
                <div>
                  <div className="font-medium">{method.name}</div>
                  <div className="text-sm text-gray-600">{method.description}</div>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedMethod === method.id
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-gray-300'
              }`}>
                {selectedMethod === method.id && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-orange-600 hover:bg-orange-700"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ₹${amount.toLocaleString()}`
          )}
        </Button>

        {/* Security Note */}
        <div className="text-xs text-center text-gray-500">
          🔒 Secured by Razorpay • Your payment is safe and encrypted
        </div>
      </CardContent>
    </Card>
  );
}