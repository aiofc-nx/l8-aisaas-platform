import { Actions } from "../enums/actions.enum.js";
import { Subjects } from "../enums/subjects.enum.js";

/**
 * @description 权限实体，定义 CASL 所需的 Action/Subject
 */
export class Permission {
  constructor(
    public readonly permissionId: string,
    public readonly name: string,
    public readonly action: Actions,
    public readonly subject: Subjects,
  ) {}
}
