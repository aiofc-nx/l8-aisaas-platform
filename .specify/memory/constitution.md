<!--
Sync Impact Report
Version change: N/A → 1.0.0
Modified principles: 新增 I. 中文优先原则, 新增 II. 代码即文档原则, 新增 III. 技术栈约束原则, 新增 IV. 测试要求原则, 新增 V. 配置模块使用规范, 新增 VI. 日志模块使用规范
Added sections: 实施要求, 开发流程守则
Removed sections: 无
Templates requiring updates: ✅ .specify/templates/plan-template.md, ✅ .specify/templates/spec-template.md, ✅ .specify/templates/tasks-template.md, ✅ .specify/templates/agent-file-template.md, ✅ .specify/templates/checklist-template.md, ⚠ 无 commands 模板可用
Follow-up TODOs: TODO(RATIFICATION_DATE)——需项目负责人补充初次批准日期
-->

# hl8-aisaas-platform Constitution

## Core Principles

### I. 中文优先原则
- 所有代码注释、技术文档、错误消息、日志、界面文案必须使用中文，变量命名可使用英文但需配套中文注释解释业务含义。
- Git 提交信息必须使用英文，保持与仓库规范一致。
- 任何新增文档或工具模板须在发布前完成中文化审查。
**理由**：面向中国大陆企业级客户，中文优先可以降低沟通成本，确保业务语义一致并提升交付效率。

### II. 代码即文档原则
- 所有公共 API、类、方法、接口、枚举必须编写符合 TSDoc 规范的中文注释，明确功能、业务规则、前后置条件和注意事项。
- @description、@param、@returns、@throws 等标签必须覆盖完整的业务语义，并随代码变更同步维护。
- 评审时将 TSDoc 注释视为业务文档，缺失或陈旧注释视为阻断问题。
**理由**：以代码承载业务知识，减少额外文档维护成本，确保团队对业务逻辑的统一理解。

### III. 技术栈约束原则
- 服务端与工具链统一使用 Node.js + TypeScript，依托 pnpm workspace 管理依赖，禁止引入 CommonJS 模块体系。
- TypeScript 编译配置必须设置 `module: "NodeNext"`、`moduleResolution: "NodeNext"`、`target: "ES2022"`、`strict: true`。
- `package.json` 必须声明 `type: "module"` 和 `engines: { "node": ">=20" }`，保障运行环境一致。
**理由**：保持技术栈一致性可提升类型安全、运行效率与未来兼容性，便于跨包协作。

### IV. 测试要求原则
- 采用分层测试架构：单元测试与源码同目录（`*.spec.ts`），集成测试置于 `test/integration/`，端到端测试置于 `test/e2e/`。
- 核心业务逻辑测试覆盖率不得低于 80%，关键路径不低于 90%，所有公共 API 必须具备测试用例。
- 测试遵循就近与独立可验证原则，提交前需运行相关层级测试并记录结果。
**理由**：系统化测试保障快速反馈和稳定交付，覆盖率要求确保关键业务可靠性。

### V. 配置模块使用规范
- 所有配置读取与管理必须通过 `@hl8/config` 模块完成，不得直接操作环境变量或自定义解析器。
- 根据业务需求定义配置类，并使用 `class-validator` 装饰器声明字段校验规则，提供默认值与错误提示（中文）。
- 配置项变更需更新对应文档与 TSDoc 注释，评审时需验证配置类与校验逻辑完整性。
**理由**：统一配置入口和校验机制可提升类型安全与运行时可靠性，降低配置漂移风险。

### VI. 日志模块使用规范
- 日志记录必须通过 `@hl8/logger` 模块，禁止直接引用第三方日志库或 NestJS 内置 Logger。
- 需要扩展日志能力时，应先在 `@hl8/logger` 中提供标准接口，再由业务模块调用。
- 日志内容需使用中文描述上下文，并遵循项目脱敏与分级策略。
**理由**：统一日志管道保证可观测性一致、降低故障排查成本，并确保合规脱敏。

## 实施要求

- 架构设计必须优先复用 monorepo 既有包，新增包需说明业务价值与维护策略。
- 基础设施（如配置、日志、测试脚手架）应在功能开发前完成，避免后续返工。
- 所有文档、模板、脚手架脚本需在交付前进行中文与技术栈合规检查。

## 开发流程守则

- 代码评审必须验证六项核心原则的落实情况，缺失时直接驳回。
- 提交前必须运行对应层级测试并附带结果摘要，关键路径需提供覆盖率截图或报告链接。
- 版本规划需在计划阶段列出配置、日志、注释、测试等合规任务，确保任务清单可追踪。

## Governance

- 本章程优先级高于其他项目文档，冲突时以本章程为准。
- 修订章程需提交 RFC，说明变更动机、影响范围与配套迁移计划，经项目技术委员会批准后生效。
- 章程版本遵循语义化版本号：新增原则或重大扩展记为 MINOR；重定义或移除原则记为 MAJOR；措辞澄清记为 PATCH。
- 每季度进行一次合规审查，评估代码库、文档与模板对章程的执行情况，并形成报告。
- 任何违反原则的代码不得合并至主干，发现违规需在一个迭代内完成整改并记录。

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): 请补充初次批准日期 | **Last Amended**: 2025-11-07
