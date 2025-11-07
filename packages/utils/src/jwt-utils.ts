import jwt, { type SignOptions } from "jsonwebtoken";

const jwtUtils = {
  generateToken(
    payload: object,
    secret: string,
    expiresIn: SignOptions["expiresIn"] = "1h",
  ) {
    return jwt.sign(payload, secret, { expiresIn });
  },

  verifyToken(token: string, secret: string) {
    return jwt.verify(token, secret);
  },
};

export default jwtUtils;
