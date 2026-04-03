import React, { useState } from "react";
import Swal from "sweetalert2";
import { loadRazorpayScript } from "../utils/loadRazorpay";
import {
  createRazorpayOrderApi,
  verifyRazorpayPaymentApi,
  markPaymentFailedApi,
} from "../services/api";

export default function RazorpayPayButton({ booking, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        Swal.fire("Error", "Razorpay SDK failed to load", "error");
        return;
      }

      const { data } = await createRazorpayOrderApi(booking._id);

      if (!data?.success) {
        Swal.fire("Error", data?.message || "Unable to create order", "error");
        return;
      }

      const { key, order, booking: bookingInfo } = data;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: "WorkBuddy",
        description: bookingInfo?.serviceTitle || "Service Booking Payment",
        image: "/logo.png", // optional
        order_id: order.id,

        handler: async function (response) {
          try {
            const verifyPayload = {
              bookingId: booking._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await verifyRazorpayPaymentApi(verifyPayload);

            if (verifyRes.data?.success) {
              Swal.fire({
                icon: "success",
                title: "Payment Successful",
                text: "Your booking payment has been completed.",
                confirmButtonText: "OK",
              });

              onPaymentSuccess?.(verifyRes.data.booking);
            } else {
              Swal.fire("Error", "Payment verification failed", "error");
            }
          } catch (err) {
            console.error(err);
            Swal.fire("Error", "Payment verification failed", "error");
          }
        },

        prefill: {
          name: booking?.user?.name || "",
          email: booking?.user?.email || "",
          contact: booking?.user?.phone || "",
        },

        notes: {
          bookingId: booking._id,
        },

        theme: {
          color: "#4f46e5",
        },

        modal: {
          ondismiss: async function () {
            try {
              await markPaymentFailedApi(booking._id);
            } catch (e) {
              console.error("dismiss mark failed:", e);
            }
          },
        },
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on("payment.failed", async function () {
        try {
          await markPaymentFailedApi(booking._id);
        } catch (e) {
          console.error("payment.failed error:", e);
        }

        Swal.fire("Failed", "Payment failed. Please try again.", "error");
      });

      paymentObject.open();
    } catch (error) {
      console.error("handlePayment error:", error);
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Something went wrong during payment",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 px-4 transition"
    >
      {loading ? "Processing..." : `Pay ₹${booking?.totalAmount || 0}`}
    </button>
  );
}