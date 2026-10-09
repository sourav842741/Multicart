import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { lat, lon } = await req.json();

    if (!lat || !lon) {
      return NextResponse.json(
        { message: "Latitude and Longitude are required" },
        { status: 400 }
      );
    }

    // 1. Try OpenStreetMap Nominatim with proper User-Agent
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "MultiCart-Ecommerce-Platform/1.0 (contact@multicart.com)",
        "Accept-Language": "en",
      },
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      // Build road / building / locality
      const streetParts = [
        addr.house_number,
        addr.building,
        addr.commercial,
        addr.road,
        addr.residential,
        addr.suburb,
        addr.neighbourhood,
        addr.village,
      ].filter(Boolean);

      const street = streetParts.length > 0 ? streetParts.join(", ") : (data.name || "");
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.city_district ||
        addr.district ||
        addr.county ||
        "";
      const state = addr.state || "";
      const pincode = addr.postcode ? addr.postcode.replace(/\D/g, "").slice(0, 6) : "";

      return NextResponse.json({
        success: true,
        street: street || data.display_name?.split(",").slice(0, 2).join(", ") || "",
        city,
        state,
        pincode,
        formattedAddress: data.display_name || "",
        raw: addr,
      });
    }

    // 2. Fallback to BigDataCloud
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const bdcRes = await fetch(bdcUrl);
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      return NextResponse.json({
        success: true,
        street: [bdcData.locality, bdcData.principalSubdivisionDescription].filter(Boolean).join(", "),
        city: bdcData.city || bdcData.locality || "",
        state: bdcData.principalSubdivision || "",
        pincode: bdcData.postcode || "",
        formattedAddress: `${bdcData.locality || ""}, ${bdcData.city || ""}, ${bdcData.principalSubdivision || ""}`,
        raw: bdcData,
      });
    }

    return NextResponse.json(
      { message: "Could not resolve address from coordinates" },
      { status: 502 }
    );
  } catch (error: any) {
    console.error("REVERSE GEOCODE API ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Failed to reverse geocode" },
      { status: 500 }
    );
  }
}
