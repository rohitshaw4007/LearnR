import jwt from "jsonwebtoken";

export const getDataFromToken = (request) => {
  try {
    const token = request.cookies.get("token")?.value || "";
    
    if (!token) {
      return null;
    }

    // Security Check: Ensure Env Variable exists
    if (!process.env.JWT_SECRET) {
        throw new Error("FATAL ERROR: JWT_SECRET is not defined in .env file");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    return decodedToken.id;
    
  } catch (error) {
    console.log("Token Verification Error:", error.message);
    return null;
  }
};