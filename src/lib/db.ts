import mongoose from "mongoose";


const mongoDbUrl = process.env.MONGODB_URL
if(!mongoDbUrl){
    throw new Error("DB Error") 
}

let cached = global.mongoose

if(!cached){
    cached = global.mongoose = {conn:null,promise:null}
}

const connectDb = async ()=>{
    if(cached.conn){
        return cached.conn
    }
    if(!cached.promise){
        cached.promise = mongoose.connect(mongoDbUrl).then((conn)=>conn.connection)
    }
    try {
        const conn = await cached.promise
        return conn
    } catch (error) {
        console.log(error)
    }
}

export default connectDb