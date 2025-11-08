import { SetMetadata } from "@nestjs/common";
import type { PolicyHandlerDescriptor } from "../policies/policy-handler.type.js";

export const POLICIES_KEY = "auth.policies";

/**
 * @description 为控制器或处理器声明需要满足的策略处理器
 */
export const CheckPolicies = (
  ...handlers: PolicyHandlerDescriptor[]
): ReturnType<typeof SetMetadata> => SetMetadata(POLICIES_KEY, handlers);
