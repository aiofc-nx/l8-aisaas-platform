import type { AppAbility } from "@hl8/auth";

export interface PolicyHandler {
  handle(ability: AppAbility): boolean | Promise<boolean>;
}

export type PolicyHandlerCallback = (
  ability: AppAbility,
) => boolean | Promise<boolean>;

export type PolicyHandlerDescriptor = PolicyHandler | PolicyHandlerCallback;
