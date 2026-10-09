import { NextRequest, NextResponse } from "next/server";
import uploadOnCloudinary from "@/lib/cloudinary";
import Product from "@/models/product.model";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import mongoose from "mongoose";

export async function PUT(req: NextRequest) {
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

    // ✅ ✅ PRODUCT ID FROM FRONTEND
    const productId = formData.get("productId") as string;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid product id" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // ✅ ✅ ONLY SAME VENDOR CAN EDIT
    if (String(product.vendor) !== String(session.user.id)) {
      return NextResponse.json(
        { message: "Not allowed to edit this product" },
        { status: 403 }
      );
    }

    // ✅ BASIC FIELDS
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    const category = formData.get("category") as string;

    // ✅ Wearable
    const isWearable = formData.get("isWearable") === "true";
    const sizes = formData.getAll("sizes");

    // ✅ Policies
    const replacementDays = Number(
      formData.get("replacementDays") || 0
    );
    const freeDelivery = formData.get("freeDelivery") === "true";
    const warranty =
      (formData.get("warranty") as string) || "No Warranty";
    const payOnDelivery =
      formData.get("payOnDelivery") === "true";

    // ✅ Details
    const detailsPoints = formData.getAll("detailsPoints");

    // ✅ Images (support multi-image upload or individual slots)
    const newImagesBlobs: Blob[] = [];
    const imagesFromAll = formData.getAll("images") as Blob[];
    for (const img of imagesFromAll) {
      if (img && typeof img === "object" && "size" in img && (img as any).size > 0) {
        newImagesBlobs.push(img);
      }
    }

    let productImages: string[] = product.images && product.images.length > 0 
      ? [...product.images] 
      : [product.image1, product.image2, product.image3, product.image4].filter(Boolean);

    if (newImagesBlobs.length > 0) {
      const uploadedResults = await Promise.all(
        newImagesBlobs.map((blob) => uploadOnCloudinary(blob))
      );
      const validUrls = uploadedResults.filter(
        (url): url is string => Boolean(url)
      );
      if (validUrls.length > 0) {
        productImages = validUrls;
      }
    }

    const img1 = formData.get("image1") as Blob | null;
    const img2 = formData.get("image2") as Blob | null;
    const img3 = formData.get("image3") as Blob | null;
    const img4 = formData.get("image4") as Blob | null;

    let image1 = productImages[0] || product.image1;
    let image2 = productImages[1] || product.image2 || image1;
    let image3 = productImages[2] || product.image3 || image2;
    let image4 = productImages[3] || product.image4 || image3;

    if (img1 && (img1 as any).size > 0) image1 = await uploadOnCloudinary(img1);
    if (img2 && (img2 as any).size > 0) image2 = await uploadOnCloudinary(img2);
    if (img3 && (img3 as any).size > 0) image3 = await uploadOnCloudinary(img3);
    if (img4 && (img4 as any).size > 0) image4 = await uploadOnCloudinary(img4);

    // Sync productImages
    productImages = [image1, image2, image3, image4].filter(Boolean);

    // ✅ Wearable validation
    if (isWearable && sizes.length === 0) {
      return NextResponse.json(
        { message: "Sizes are required for wearable product" },
        { status: 400 }
      );
    }

    // ✅ ✅ ✅ UPDATE PRODUCT + RESET VERIFICATION
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        title,
        description,
        price,
        stock,
        isStockAvailable: stock > 0,

        image1,
        image2,
        image3,
        image4,
        images: productImages,

        category,

        isWearable,
        sizes: isWearable ? sizes : [],

        replacementDays,
        freeDelivery,
        warranty,
        payOnDelivery,

        detailsPoints,

        // ✅ IMPORTANT RESET
        verificationStatus: "pending",
        isActive: false,
      },
      { new: true }
    );

    return NextResponse.json(
      {
        message:
          "Product updated & sent for re-verification ✅",
        product: updatedProduct,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("EDIT PRODUCT ERROR:", error);
    return NextResponse.json(
      { message: "Server Error", error },
      { status: 500 }
    );
  }
}
