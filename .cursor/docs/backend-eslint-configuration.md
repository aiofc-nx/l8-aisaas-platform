# 后端项目 ESLint 配置文档

## 概述

本文档详细阐述了 hl8-platform monorepo 后端项目的 ESLint 配置体系，涵盖配置架构、规则说明、使用方式、最佳实践和常见问题。

## 文档结构

- [ESLint 配置架构](#eslint-配置架构)
- [配置继承体系](#配置继承体系)
- [核心配置解析](#核心配置解析)
- [使用方式](#使用方式)
- [规则详解](#规则详解)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## ESLint 配置架构

### 配置包结构

项目采用集中式的 ESLint 配置管理，所有配置统一存放在 `packages/eslint-config` 目录：

```text
packages/eslint-config/
├── eslint-base.config.mjs       # 基础配置
├── eslint-nest.config.mjs       # NestJS 专用配置
├── eslint-next.config.mjs       # Next.js 专用配置
├── eslint-react-internal.config.mjs  # React 库配置
├── prettier-base.config.mjs     # Prettier 配置
└── package.json                 # 配置包定义
```

### 配置继承机制

所有后端项目的 ESLint 配置都通过 `import` 和扩展（spread）继承自统一的配置包：

```javascript
import nest from "@repo/eslint-config/eslint-nest.config.mjs";

export default [
  ...nest,
  {
    // 项目特定的覆盖配置
  },
];
```

这种设计确保了：

- **统一性**：所有项目使用相同的代码检查规则
- **可维护性**：修改规则只需更新配置包
- **灵活性**：子项目可以根据需要覆盖特定规则

## 配置继承体系

### 配置层级

```text
eslint-base.config.mjs (基础配置)
  └── eslint-nest.config.mjs (NestJS 配置)
      └── 后端项目 eslint.config.mjs (项目配置)
```

### 1. 基础配置 (eslint-base.config.mjs)

所有项目的 ESLint 配置继承自基础配置：

```javascript
import eslint from "@eslint/js";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tsEslint from "typescript-eslint";

export default tsEslint.config(
  eslint.configs.recommended, // ESLint 推荐规则
  ...tsEslint.configs.recommended, // TypeScript ESLint 推荐规则
  prettierRecommended, // Prettier 集成
  {
    ignores: [".*.?(c|m)js", "*.setup*.?(c|m)js", "*.config*.?(c|m)js", "*.d.ts", ".turbo/", ".git/", "build/", "dist/", "coverage/", "node_modules/"],
  },
);
```

**包含的配置**：

- ✅ **ESLint 推荐规则**：ESLint 官方推荐的 JavaScript 最佳实践
- ✅ **TypeScript ESLint 推荐规则**：TypeScript 特定的代码质量规则
- ✅ **Prettier 集成**：自动集成 Prettier 格式化规则
- ✅ **全局忽略**：排除构建产物、依赖等不需要检查的文件

### 2. NestJS 配置 (eslint-nest.config.mjs)

NestJS 专用配置继承自基础配置，添加了框架特定的规则：

```javascript
import baseConfig from "./eslint-base.config.mjs";

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true, // 启用 TypeScript 项目服务
        tsconfigRootDir: import.meta.dirname,
      },
    },
    ignores: [],
    rules: {
      // NestJS 特定的规则配置
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];
```

**NestJS 特定规则**：

- **接口命名前缀**：关闭接口必须以 `I` 开头的规则（NestJS 不需要）
- **函数返回类型**：关闭要求显式声明返回类型的规则
- **模块边界类型**：关闭要求模块导出显式类型的规则
- **any 类型**：关闭禁止使用 `any` 的规则（基配置中会开启）
- **未使用变量**：配置未使用变量的警告规则，允许以下划线开头的变量

### 3. 项目配置

后端项目通过扩展 nestjs 配置，添加项目特定的规则：

```javascript
import nest from "@repo/eslint-config/eslint-nest.config.mjs";

export default [
  ...nest,
  {
    ignores: ["jest.config.ts"],
  },
  {
    files: ["**/*.ts"],
    ignores: ["**/*.spec.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error", // 生产代码禁止 any
    },
  },
  {
    files: ["**/*.spec.ts", "**/*.test.ts"],
    rules: {
      // 测试文件允许使用 any 等更宽松的规则
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "prefer-const": "off",
      "no-console": "off",
    },
  },
];
```

## 核心配置解析

### TypeScript 项目服务

```javascript
languageOptions: {
  parserOptions: {
    projectService: true,
    tsconfigRootDir: import.meta.dirname,
  },
}
```

- **projectService: true**: 启用 TypeScript 项目服务，提供更准确的类型检查
- **tsconfigRootDir**: 指定 TypeScript 配置文件的根目录

### 文件匹配规则

ESLint 使用 `files` 和 `ignores` 配置来匹配需要检查的文件：

```javascript
{
  files: ["**/*.ts"],                    // 匹配所有 .ts 文件
  ignores: ["**/*.spec.ts"],             // 排除测试文件
  rules: { /* ... */ }
}
```

### 规则配置层级

ESLint 配置支持多个配置对象，后配置会覆盖前配置：

```javascript
export default [
  ...nest, // 1. 基础配置
  {
    ignores: ["jest.config.ts"], // 2. 全局忽略配置
  },
  {
    files: ["**/*.ts"], // 3. 生产代码规则
    ignores: ["**/*.spec.ts"],
    rules: {
      /* ... */
    },
  },
  {
    files: ["**/*.spec.ts"], // 4. 测试代码规则
    rules: {
      /* ... */
    },
  },
];
```

## 使用方式

### 1. 创建项目 ESLint 配置

创建 `eslint.config.mjs` 文件：

```javascript
import nest from "@repo/eslint-config/eslint-nest.config.mjs";

export default [
  ...nest,
  {
    ignores: ["jest.config.ts", "dist/**"],
  },
  {
    files: ["**/*.ts"],
    ignores: ["**/*.spec.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["**/*.spec.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "prefer-const": "off",
      "no-console": "off",
    },
  },
];
```

### 2. 配置 package.json 脚本

```json
{
  "scripts": {
    "lint": "eslint . --fix",
    "lint:check": "eslint ."
  }
}
```

### 3. 运行 ESLint

```bash
# 自动修复可修复的问题
pnpm lint

# 只检查不修复
pnpm lint:check

# 检查特定文件
pnpm lint -- src/main.ts
```

## 规则详解

### 生产代码规则

生产代码（非测试文件）遵循严格的规则：

```javascript
{
  files: ["**/*.ts"],
  ignores: ["**/*.spec.ts", "**/*.test.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",  // 禁止使用 any
  },
}
```

**核心规则**：

- **no-explicit-any**: 禁止使用显式的 `any` 类型，强制使用具体类型或 `unknown`
- **no-unsafe-\***: 禁止不安全的类型操作（需要启用严格规则）

### 测试代码规则

测试代码使用更宽松的规则：

```javascript
{
  files: ["**/*.spec.ts", "**/*.test.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",           // 允许 any
    "@typescript-eslint/no-unused-vars": "off",           // 允许未使用变量
    "@typescript-eslint/no-non-null-assertion": "off",    // 允许非空断言
    "@typescript-eslint/ban-ts-comment": "off",          // 允许 TS 注释
    "prefer-const": "off",                                // 允许 let
    "no-console": "off",                                  // 允许 console
  },
}
```

**原因**：

- 测试代码需要更灵活的写法
- 允许使用 `any` 类型进行快速原型
- 允许 `console` 输出调试信息
- 允许未使用的变量（测试用例中常见）

### 未使用变量规则

基础配置中的未使用变量规则：

```javascript
"@typescript-eslint/no-unused-vars": [
  "warn",
  {
    argsIgnorePattern: "^_",        // 参数以下划线开头时忽略
    varsIgnorePattern: "^_",        // 变量以下划线开头时忽略
    caughtErrorsIgnorePattern: "^_", // 捕获的错误以下划线开头时忽略
  },
],
```

**用法示例**：

```typescript
// ✅ 允许：以下划线开头表示故意未使用
function example(_unused: string, used: string) {
  console.log(used);
}

// ✅ 允许：未使用的错误变量
try {
  // ...
} catch (_error) {
  // 忽略错误
}

// ❌ 警告：未使用的变量
let unused = "value";
```

## 最佳实践

### 1. 最小化配置覆盖

尽量继承基础配置，只在必要时覆盖规则：

```javascript
export default [
  ...nest,
  {
    files: ["**/*.ts"],
    ignores: ["**/*.spec.ts"],
    rules: {
      // 只添加项目特定的规则
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];
```

### 2. 区分生产和测试规则

为生产和测试代码设置不同的规则：

```javascript
export default [
  ...nest,
  {
    // 生产代码：严格规则
    files: ["**/*.ts"],
    ignores: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // 测试代码：宽松规则
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
```

### 3. 合理使用忽略规则

使用下划线前缀表示故意未使用的变量：

```typescript
// ✅ 正确：使用下划线前缀
function handler(req: Request, _res: Response, next: NextFunction) {
  next();
}

// ❌ 错误：未使用的变量会触发警告
function handler(req: Request, res: Response, next: NextFunction) {
  next();
  // res 未使用
}
```

### 4. 使用 ESLint 注释

在特殊情况下使用 ESLint 注释禁用规则：

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processData(data: any) {
  // 特殊处理
}

// 或在代码块中禁用
/* eslint-disable @typescript-eslint/no-explicit-any */
function legacyCode(data: any) {
  // ...
}
/* eslint-enable @typescript-eslint/no-explicit-any */
```

### 5. 配置编辑器集成

在 `.vscode/settings.json` 中配置编辑器自动修复：

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

## 常见问题

### 1. ESLint 配置不生效

**问题**: ESLint 配置修改后不生效

**解决方案**:

- 检查配置文件名称是否为 `eslint.config.mjs`
- 确保使用了正确的配置格式（flat config）
- 重启 ESLint 服务器或编辑器
- 清除 ESLint 缓存：`eslint --cache-location .eslintcache --clear-cache`

### 2. TypeScript 类型检查错误

**问题**: ESLint 无法正确识别 TypeScript 类型

**解决方案**:

```javascript
{
  languageOptions: {
    parserOptions: {
      projectService: true,  // 启用项目服务
    },
  },
}
```

### 3. Prettier 冲突

**问题**: ESLint 和 Prettier 格式化冲突

**解决方案**:

- 确保已安装 `eslint-plugin-prettier`
- 使用 `prettierRecommended` 配置
- 在配置文件中正确引入：

```javascript
import prettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  // ... 其他配置
  prettierRecommended,
];
```

### 4. 规则覆盖不生效

**问题**: 项目配置的规则无法覆盖基础配置

**解决方案**:

- 确保配置对象的顺序正确（后配置覆盖前配置）
- 检查 `files` 和 `ignores` 匹配是否正确
- 使用 `rules` 而不是 `overrides`（flat config 使用 `files`）

### 5. 性能问题

**问题**: ESLint 运行缓慢

**解决方案**:

- 启用缓存：`eslint --cache`
- 排除不必要的文件：

```javascript
{
  ignores: [
    "dist/**",
    "node_modules/**",
    "coverage/**",
    "*.config.mjs",
  ],
}
```

- 使用 `projectService: true` 提升 TypeScript 类型检查性能

### 6. Monorepo 包导入警告

**问题**: 导入 monorepo 包时出现模块解析警告

**解决方案**:

- 确保在根目录运行 ESLint
- 配置 `parserOptions` 指定项目根目录：

```javascript
{
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
  },
}
```

### 7. 规则级别设置

ESLint 规则使用三个级别：

- **"off"** 或 **0**: 关闭规则
- **"warn"** 或 **1**: 警告级别（不会导致失败）
- **"error"** 或 **2**: 错误级别（会导致失败）

```javascript
rules: {
  "rule-name": "off",    // 关闭
  "rule-name": "warn",   // 警告
  "rule-name": "error",  // 错误
}
```

## 配置检查清单

创建新后端项目时，确保以下配置正确：

### ESLint 配置

- [ ] 创建 `eslint.config.mjs` 文件
- [ ] 继承 `@repo/eslint-config/eslint-nest.config.mjs`
- [ ] 配置生产和测试代码的不同规则
- [ ] 正确配置 `ignores` 排除不需要检查的文件
- [ ] 配置 `parserOptions.projectService` 启用类型检查

### package.json 脚本

- [ ] 配置 `lint` 脚本（自动修复）
- [ ] 配置 `lint:check` 脚本（仅检查）
- [ ] 确保依赖包含 `@repo/eslint-config`

### 编辑器集成

- [ ] 安装 ESLint VS Code 扩展
- [ ] 配置保存时自动修复
- [ ] 配置 ESLint 验证的文件类型

### 常见配置检查

- [ ] 生产代码禁用 `any` 类型
- [ ] 测试代码允许 `any` 类型
- [ ] 未使用变量使用下划线前缀
- [ ] 排除构建产物和依赖目录

## 总结

本文档阐述了后端项目的 ESLint 配置体系：

1. **配置继承**: 通过继承统一的配置包确保代码规范一致性
2. **分层配置**: 基础配置 → 框架配置 → 项目配置
3. **规则差异化**: 生产代码严格，测试代码宽松
4. **最佳实践**: 最小化覆盖、合理忽略、类型安全

通过遵循本文档的指导，可以确保后端项目的代码质量、风格统一，并提升开发效率。
