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
import { UserService } from './user.service';

@UseGuards(JwtAuthGuard)
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('/updateprofile')
  updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    return this.userService.updateProfile(req, updateProfileDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/getme')
  async getMe(@Req() req: Request) {
    return this.userService.getMe(req);
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
