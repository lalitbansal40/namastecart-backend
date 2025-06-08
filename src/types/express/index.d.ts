// types/express/index.d.ts (or at top of auth.middleware.ts)
import { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: string | JwtPayload;
  }
}
