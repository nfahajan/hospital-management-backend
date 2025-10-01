import { Request, Response, NextFunction } from "express";
import UnauthenticatedError from "../errors/unauthenticated";
import { getPermissionsByRoles } from "../modules/role/role.service";
import ForbiddenError from "../errors/forbidden";

const hasPermission =
  (...requiredPermissions: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthenticatedError("Invalid logged In User");
    }

    const permissions = await getPermissionsByRoles(req.user.roles);

    permissions.push(...req.user.permissions);

    if (req.user.roles.includes("superadmin")) {
      next();
      return;
    }

    // match required permissions

    for (let i = 0; i < requiredPermissions.length; i++) {
      if (!permissions.includes(requiredPermissions[i])) {
        throw new ForbiddenError(
          "You dont have permission to perform this task!"
        );
      }
    }

    next();
  };

export default hasPermission;
