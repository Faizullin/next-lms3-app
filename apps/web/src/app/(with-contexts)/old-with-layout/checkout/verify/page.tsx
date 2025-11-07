"use client";

import { InvoicesStatus } from "@workspace/common-models";
import { Button } from "@workspace/ui/components/button";
import { CheckCircle, Clock, AlertCircle, Home } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PaymentVerificationStatus } from "./payment-verification-status";
import { useAddress } from "@/components/contexts/address-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

export default function Page() {
  const params = useSearchParams();
  const id = params?.get("id");
  const [paymentStatus, setPaymentStatus] = useState<InvoicesStatus>("pending");
  const [loading, setLoading] = useState(false);
  const { address } = useAddress();

  const verifyPayment = async () => {
    setPaymentStatus("pending"); // Hide check status again
    try {
      setLoading(true);
      const response = await fetch(
        `${address.backend}/api/payment/verify-new`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        },
      );
      const responseData = await response.json();
      if (responseData.status) {
        setPaymentStatus(responseData.status);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyPayment();
  }, []);

  const getStatusIcon = (status: InvoicesStatus) => {
    switch (status) {
      case "paid":
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        );
      case "pending":
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-10 h-10 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
        );
    }
  };

  const getStatusTitle = (status: InvoicesStatus) => {
    switch (status) {
      case "paid":
        return "Payment Verified Successfully!";
      case "pending":
        return "Payment Verification in Progress";
      default:
        return "Payment Verification Failed";
    }
  };

  const getStatusDescription = (status: InvoicesStatus) => {
    switch (status) {
      case "paid":
        return "Your payment has been confirmed and your order is being processed.";
      case "pending":
        return "We're currently verifying your payment. This usually takes a few minutes.";
      default:
        return "There was an issue verifying your payment. Please contact support.";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Payment Verification
            </CardTitle>
            <p className="text-muted-foreground">Order #{id}</p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {/* Status Icon */}
            {getStatusIcon(paymentStatus)}

            {/* Status Title */}
            <h2 className="text-2xl font-bold text-gray-900">
              {getStatusTitle(paymentStatus)}
            </h2>

            {/* Status Description */}
            <p className="text-lg text-muted-foreground leading-relaxed">
              {getStatusDescription(paymentStatus)}
            </p>

            {/* Order Details */}
            <div className="bg-muted/30 p-4 rounded-lg border border-muted-foreground/20">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-6 h-6 rounded-sm border-2 border-brand-primary/30 flex items-center justify-center bg-white">
                  <span className="text-brand-primary text-xs font-bold">
                    #
                  </span>
                </div>
                <span className="font-medium">Order Number</span>
              </div>
              <Badge variant="outline" className="text-lg font-mono">
                {id}
              </Badge>
            </div>

            {/* Status Specific Content */}
            {paymentStatus === "paid" ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We have sent a confirmation email with order details and
                  tracking information.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    asChild
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white"
                  >
                    <Link href="/dashboard/my-content">Go to Dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/support">Need Help?</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <PaymentVerificationStatus
                  status={paymentStatus}
                  onRetryVerification={verifyPayment}
                  loading={loading}
                />
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={verifyPayment}
                    disabled={loading}
                    className="bg-brand-primary hover:bg-brand-primary-hover text-white"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      "Check Status Again"
                    )}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/support">Contact Support</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm text-muted-foreground">
                If you have any questions about your order, please don't
                hesitate to contact our support team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
