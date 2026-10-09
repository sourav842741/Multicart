import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req:NextRequest) {
    try {
        const session = await auth()
        if(!session || !session.user){
            return NextResponse.json(null, {status:200})
        }
        await connectDb()
        const user = await User.findOne({email:session.user.email}).select("-password").populate("cart.product")
        if(!user){
            return NextResponse.json(null, {status:200})
        }
        return NextResponse.json(user ,{status:200})

    } catch (error) {
         console.error("Get Current User error:", error);
         return NextResponse.json({message:`Get Current User error ${error}`},{status:500})
    }
    
}