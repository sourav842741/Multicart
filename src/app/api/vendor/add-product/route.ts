import { NextRequest, NextResponse } from "next/server";
import uploadOnCloudinary from "@/lib/cloudinary";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { auth } from "@/auth";
import connectDb from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const category = formData.get("category") as string;

    // ✅ Wearable Fields
    const isWearable = formData.get("isWearable") === "true";
    const sizes = formData.getAll("sizes");

    // ✅ ✅ POLICY FIELDS
    const replacementDays = Number(formData.get("replacementDays") || 0);
    const freeDelivery = formData.get("freeDelivery") === "true";
    const warranty = (formData.get("warranty") as string) || "No Warranty";
    const payOnDelivery = formData.get("payOnDelivery") === "true";

    // ✅ Details points array
    const detailsPoints = formData.getAll("detailsPoints") as string[];

    // ✅ Collect all uploaded images (flexible array and/or image1..image4)
    const uploadedImagesBlobs: Blob[] = [];
    const imagesFromAll = formData.getAll("images") as Blob[];
    for (const img of imagesFromAll) {
      if (img && typeof img === "object" && "size" in img && (img as any).size > 0) {
        uploadedImagesBlobs.push(img);
      }
    }

    for (let i = 1; i <= 6; i++) {
      const single = formData.get(`image${i}`) as Blob | null;
      if (single && typeof single === "object" && "size" in single && (single as any).size > 0) {
        uploadedImagesBlobs.push(single);
      }
    }

    if (
      !title ||
      !description ||
      !price ||
      !stock ||
      !category ||
      uploadedImagesBlobs.length === 0
    ) {
      return NextResponse.json(
        { message: "All product details and at least 1 image are required" },
        { status: 400 }
      );
    }

    // ✅ Wearable validation
    if (isWearable && sizes.length === 0) {
      return NextResponse.json(
        { message: "Sizes are required for wearable product" },
        { status: 400 }
      );
    }

    // ✅ Upload all images to Cloudinary concurrently
    const uploadedResults = await Promise.all(
      uploadedImagesBlobs.map((blob) => uploadOnCloudinary(blob))
    );
    const uploadedUrls: string[] = uploadedResults.filter(
      (url): url is string => Boolean(url)
    );

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { message: "Failed to upload product images" },
        { status: 500 }
      );
    }

    // Populate image1..image4 fallbacks for backwards compatibility
    const image1 = uploadedUrls[0];
    const image2 = uploadedUrls[1] || uploadedUrls[0];
    const image3 = uploadedUrls[2] || uploadedUrls[1] || uploadedUrls[0];
    const image4 = uploadedUrls[3] || uploadedUrls[2] || uploadedUrls[1] || uploadedUrls[0];

    // ✅ ✅ CREATE PRODUCT WITH ALL FIELDS
    const product = await Product.create({
      title,
      description,
      price,
      stock,
      isStockAvailable: stock > 0,

      image1,
      image2,
      image3,
      image4,
      images: uploadedUrls,

      category,
      vendor: session.user.id,

      // ✅ Wearable
      isWearable,
      sizes: isWearable ? sizes : [],

      // ✅ ✅ Policies
      replacementDays,
      freeDelivery,
      warranty,
      payOnDelivery,

      // ✅ ✅ Detail Points
      detailsPoints,

      verificationStatus: "pending",
      isActive: false,
    });

    // ✅ PUSH PRODUCT ID INTO USER (VENDOR)
    await User.findByIdAndUpdate(
      session.user.id,
      {
        $push: { vendorProducts: product._id },
      },
      { new: true }
    );

    return NextResponse.json(
      { message: "Product added successfully ✅", product },
      { status: 201 }
    );

  } catch (error) {
    console.log("ADD PRODUCT ERROR:", error);
    return NextResponse.json(
      { message: "Server Error", error },
      { status: 500 }
    );
  }
}
