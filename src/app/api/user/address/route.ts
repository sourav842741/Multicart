import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

// GET all saved addresses of current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();
    const user = await User.findOne({ email: session.user.email }).select("addresses name phone");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    let addresses = user.addresses || [];

    // ✅ Automatic fetch: If user has no saved addresses, check latest order!
    if (addresses.length === 0) {
      const Order = (await import("@/models/order.model")).default;
      const latestOrder = await Order.findOne({ buyer: user._id }).sort({ createdAt: -1 });
      if (latestOrder && latestOrder.address) {
        const autoAddress = {
          name: latestOrder.address.name || user.name || "",
          phone: latestOrder.address.phone || user.phone || "",
          address: latestOrder.address.address || "",
          city: latestOrder.address.city || "",
          state: latestOrder.address.state || "",
          pincode: latestOrder.address.pincode || "",
          type: "Home",
          isDefault: true,
        };
        user.addresses = [autoAddress as any];
        await user.save();
        addresses = user.addresses;
      }
    }

    return NextResponse.json(
      {
        addresses,
        userProfile: { name: user.name, phone: user.phone },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET ADDRESSES ERROR:", error);
    return NextResponse.json(
      { message: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// POST add a new saved address
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, address, city, state, pincode, type, isDefault } =
      await req.json();

    if (!name || !phone || !address || !city || !pincode) {
      return NextResponse.json(
        { message: "Name, phone, address, city and pincode are required" },
        { status: 400 }
      );
    }

    await connectDb();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.addresses) {
      user.addresses = [];
    }

    const shouldBeDefault = isDefault || user.addresses.length === 0;

    if (shouldBeDefault) {
      user.addresses.forEach((addr: any) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      name,
      phone,
      address,
      city,
      state: state || "",
      pincode,
      type: type || "Home",
      isDefault: shouldBeDefault,
    });

    // Also update phone if user doesn't have phone
    if (!user.phone && phone) {
      user.phone = phone;
    }

    await user.save();

    return NextResponse.json(
      {
        message: "Address saved successfully ✅",
        addresses: user.addresses,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("ADD ADDRESS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to save address" },
      { status: 500 }
    );
  }
}

// DELETE an address by addressId
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get("addressId");

    if (!addressId) {
      return NextResponse.json(
        { message: "Address ID required" },
        { status: 400 }
      );
    }

    await connectDb();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.addresses) {
      return NextResponse.json({ message: "User or addresses not found" }, { status: 404 });
    }

    user.addresses = user.addresses.filter(
      (addr: any) => addr._id?.toString() !== addressId
    );

    // If no default address remains and some addresses exist, set first as default
    if (user.addresses.length > 0 && !user.addresses.some((a: any) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return NextResponse.json(
      {
        message: "Address removed successfully ✅",
        addresses: user.addresses,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE ADDRESS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to delete address" },
      { status: 500 }
    );
  }
}

// PUT set default address
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { addressId } = await req.json();

    if (!addressId) {
      return NextResponse.json(
        { message: "Address ID required" },
        { status: 400 }
      );
    }

    await connectDb();
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.addresses) {
      return NextResponse.json({ message: "User or addresses not found" }, { status: 404 });
    }

    user.addresses.forEach((addr: any) => {
      addr.isDefault = addr._id?.toString() === addressId;
    });

    await user.save();

    return NextResponse.json(
      {
        message: "Default address updated ✅",
        addresses: user.addresses,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("SET DEFAULT ADDRESS ERROR:", error);
    return NextResponse.json(
      { message: "Failed to update address" },
      { status: 500 }
    );
  }
}
