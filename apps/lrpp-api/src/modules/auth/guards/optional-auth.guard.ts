import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalAuthGuard extends AuthGuard("supabase") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Don't throw error if no user - just return null
    if (err || !user) {
      return null;
    }
    return user;
  }
}
