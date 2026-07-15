import type { Request, Response } from 'express';
import { asyncHandler } from '../../../shared/async-handler.js';
import { successResponse } from '../../../shared/responses/index.js';
import { authService } from '../service/auth.service.js';
import type { LoginBody, LogoutBody, RefreshBody } from '../validator/auth.validator.js';

function getRequestMeta(req: Request) {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  };
}

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginBody;
    const result = await authService.login(email, password, getRequestMeta(req));
    res.status(200).json(successResponse(result, 'Login successful'));
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshBody;
    const result = await authService.refresh(refreshToken, getRequestMeta(req));
    res.status(200).json(successResponse(result, 'Token refreshed'));
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as LogoutBody;
    await authService.logout(refreshToken, req.user?.id, getRequestMeta(req));
    res.status(200).json(successResponse({ success: true }, 'Logout successful'));
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.me(req.user!.id);
    res.status(200).json(successResponse(result, 'Profile retrieved'));
  });
}

export const authController = new AuthController();
