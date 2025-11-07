import { NestFactory } from "@nestjs/core";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { FastifyAdapter } from "@nestjs/platform-fastify";
import type { Logger } from "@hl8/logger";
import { applyExpressCompatibilityRecommendations } from "./express-compatibility.js";
import {
  type CreateFastifyApplicationOptions,
  type FastifyApplicationContext,
  type FastifyBootstrapConfig,
} from "./fastify-bootstrap.types.js";
import { buildFastifyAdapter } from "./fastify-adapter.factory.js";
import { callOrUndefinedIfException } from "../utils/call-or-undefined-if-exception.js";
import { registerProcessErrorHandlers } from "../utils/process-error-handlers.js";

/**
 * @description 创建 NestFastifyApplication，并在内部完成常见的引导配置
 * @typeParam TConfig 应用配置类型
 * @typeParam TLogger Logger 类型
 * @param options 创建应用所需的参数
 * @returns 包含应用实例、配置与日志器的上下文对象
 * @throws Error 当 NestFactory 创建应用失败时抛出底层异常
 * @example
 * ```typescript
 * const context = await createFastifyApplication({
 *   module: AppModule,
 *   appConfigToken: AppConfig,
 *   loggerToken: Logger,
 * });
 * ```
 */
export async function createFastifyApplication<
  TConfig extends FastifyBootstrapConfig,
  TLogger extends Logger = Logger,
>(
  options: CreateFastifyApplicationOptions<TConfig, TLogger>,
): Promise<FastifyApplicationContext<TConfig, TLogger>> {
  const {
    module,
    adapter,
    adapterOptions,
    appConfigToken,
    loggerToken,
    loggerChildContext,
    applyExpressCompatibility = true,
    enableShutdownHooks = true,
    onAppCreated,
  } = options;

  const resolvedAdapter: FastifyAdapter =
    adapter ?? buildFastifyAdapter(adapterOptions);

  const app = await NestFactory.create<NestFastifyApplication>(
    module,
    resolvedAdapter,
    {},
  );

  if (enableShutdownHooks) {
    app.enableShutdownHooks();
  }

  if (applyExpressCompatibility) {
    callOrUndefinedIfException(() =>
      applyExpressCompatibilityRecommendations(
        app.getHttpAdapter().getInstance(),
      ),
    );
  }

  const config =
    appConfigToken !== undefined
      ? callOrUndefinedIfException(() => app.get(appConfigToken))
      : undefined;

  const logger =
    loggerToken !== undefined
      ? callOrUndefinedIfException(() => app.get(loggerToken))
      : undefined;

  const bootstrapLogger = resolveBootstrapLogger(logger, loggerChildContext);

  registerProcessErrorHandlers((message) => {
    if (bootstrapLogger) {
      if (isLoggerWithError(bootstrapLogger)) {
        bootstrapLogger.error(message);
      } else if (isLoggerWithLog(bootstrapLogger)) {
        bootstrapLogger.log(message);
      }
    } else {
      console.error(`[Process] ${message}`);
    }
  });

  if (config && bootstrapLogger && isLoggerWithLog(bootstrapLogger)) {
    bootstrapLogger.log(
      `[Bootstrap] 应用配置已加载，当前环境: ${config.NODE_ENV}`,
    );
  }

  const context: FastifyApplicationContext<TConfig, TLogger> = {
    app,
    config,
    logger: logger as TLogger | undefined,
    bootstrapLogger: bootstrapLogger as TLogger | undefined,
  };

  if (onAppCreated) {
    await onAppCreated(context);
  }

  return context;
}

function resolveBootstrapLogger(
  logger: Logger | undefined,
  loggerChildContext?: Record<string, unknown>,
): Logger | undefined {
  if (!logger) {
    return undefined;
  }

  if (
    loggerChildContext &&
    typeof (logger as LoggerWithChild).child === "function"
  ) {
    return (logger as LoggerWithChild).child!(loggerChildContext);
  }

  return logger;
}

function isLoggerWithError(
  logger: Logger,
): logger is Logger & { error: (message: string) => void } {
  return typeof (logger as Logger).error === "function";
}

function isLoggerWithLog(
  logger: Logger,
): logger is Logger & { log: (message: string) => void } {
  return typeof (logger as Logger).log === "function";
}

interface LoggerWithChild extends Logger {
  child: (bindings: Record<string, unknown>) => Logger;
}
