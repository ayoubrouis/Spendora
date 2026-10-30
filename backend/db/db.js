const mongoose = require("mongoose");

const db = async () => {
    try{
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGO_URI)
        console.log("DB connected successfully")
    } catch (error) {
        console.error("DB connecting error:", error);
        throw error;
    }
}

module.exports = {db}