import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  LoginService,
  RefreshService,
  LoginCommand,
  RefreshCommand,
} from "@hl8/auth";
import { LoginRequestDto, LoginResponseDto } from "../dto/login.dto.js";
import { RefreshRequestDto } from "../dto/refresh.dto.js";

/**
 * @description 认证控制器，实现登录与刷新令牌接口
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly refreshService: RefreshService,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  public async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    const result = await this.loginService.execute(
      new LoginCommand(dto.email, dto.password),
    );
    return LoginResponseDto.fromResult(result);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  public async refresh(
    @Body() dto: RefreshRequestDto,
  ): Promise<LoginResponseDto> {
    const result = await this.refreshService.execute(
      new RefreshCommand(dto.refreshToken),
    );
    return LoginResponseDto.fromResult(result);
  }
}
