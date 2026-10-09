import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode");

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json(
        { message: "Valid 6-digit pincode required" },
        { status: 400 }
      );
    }

    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: "Failed to query postal API" },
        { status: 502 }
      );
    }

    const data = await res.json();
    if (
      Array.isArray(data) &&
      data[0]?.Status === "Success" &&
      Array.isArray(data[0]?.PostOffice) &&
      data[0].PostOffice.length > 0
    ) {
      const poList = data[0].PostOffice;
      const primary = poList[0];

      const city = primary.Block || primary.District || primary.Division || "";
      const district = primary.District || "";
      const state = primary.State || "";
      const localities = poList.map((p: any) => p.Name).slice(0, 10);

      return NextResponse.json({
        success: true,
        city: city === "NA" ? district : city,
        district,
        state,
        localities,
      });
    }

    return NextResponse.json(
      { message: "Pincode not found or invalid" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("PINCODE API ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Failed to lookup pincode" },
      { status: 500 }
    );
  }
}
