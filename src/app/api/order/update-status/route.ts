import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Order from "@/models/order.model";
import { sendDeliveryOtpEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const { orderId, status } = await req.json();

    const order = await Order.findById(orderId).populate("buyer");

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    if (status === "confirmed" || status === "shipped") {
      order.orderStatus = status;
      await order.save();
      return NextResponse.json({ message: "Status updated" });
    }

    if (status === "delivered") {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      order.deliveryOtp = otp;
      order.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await order.save();

      const email = order.buyer?.email || order.address?.email;
      if (email) {
        try {
          await sendDeliveryOtpEmail(email, otp);
        } catch (mailErr) {
          console.warn("Could not send delivery OTP email (SMTP error):", mailErr);
        }
      }

      return NextResponse.json({ message: "OTP sent to buyer email", debugOtp: otp });
    }

    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
