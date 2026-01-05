import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-cookie/jwt.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './type/jwt-payload.type';
import { UserService } from './user.service';

@UseGuards(JwtAuthGuard)
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get('/me')
  Me(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    return this.userService.getMe(userId);
  }

  @Patch('/updateprofile')
  updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.updateProfile(req, updateProfileDto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/deleteme')
  async deleteMe(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.deleteMe(req, res);
  }
}
