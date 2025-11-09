/**
 * @description CASL 操作枚举，对齐多租户授权场景常用权限颗粒度
 */
export enum Actions {
  Manage = "manage",
  Create = "create",
  Read = "read",
  ReadOwn = "read:own",
  ReadAny = "read:any",
  Update = "update",
  UpdateOwn = "update:own",
  UpdateAny = "update:any",
  Delete = "delete",
  DeleteOwn = "delete:own",
  DeleteAny = "delete:any",
}
