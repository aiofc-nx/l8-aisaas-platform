import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { LoginUseCase, RefreshTokenUseCase } from "@hl8/auth";
import { LoginRequestDto, LoginResponseDto } from "../dto/login.dto.js";
import { RefreshRequestDto } from "../dto/refresh.dto.js";

/**
 * @description 认证控制器，实现登录与刷新令牌接口
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  public async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
    return LoginResponseDto.fromResult(result);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  public async refresh(
    @Body() dto: RefreshRequestDto,
  ): Promise<LoginResponseDto> {
    const result = await this.refreshTokenUseCase.execute({
      refreshToken: dto.refreshToken,
    });
    return LoginResponseDto.fromResult(result);
  }
}
