# TypeScript 配置文档

## 概述

本文档详细阐述了 hl8-platform monorepo 的 TypeScript 配置体系，包括配置架构、配置策略、使用方式和最佳实践。

## 配置架构

### 配置包结构

项目采用集中式的 TypeScript 配置管理，所有配置统一存放在 `packages/typescript-config` 目录：

```text
packages/typescript-config/
├── base.json              # 基础配置
├── nestjs.json            # NestJS 专用配置
├── nextjs.json            # Next.js 专用配置
├── react-library.json     # React 库配置
└── package.json           # 配置包定义
```

### 配置继承机制

所有子项目的 TypeScript 配置都通过 `extends` 字段继承自统一的配置包：

```json
{
  "extends": "@repo/typescript-config/<config-type>.json"
}
```

这种设计确保了：

- **统一性**：所有项目使用相同的编译选项
- **可维护性**：修改配置只需更新配置包
- **灵活性**：子项目可以根据需要覆盖特定选项

## 配置详解

### 1. 基础配置 (base.json)

基础配置定义了适用于所有项目的最小化编译选项：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "declaration": true, // 生成声明文件
    "declarationMap": true, // 为声明文件生成 source map
    "esModuleInterop": true, // 启用 ES 模块互操作性
    "incremental": false, // 禁用增量编译
    "isolatedModules": true, // 确保每个文件都可以独立编译
    "lib": ["es2022", "DOM", "DOM.Iterable"], // 包含的库文件
    "module": "NodeNext", // 使用 Node.js 的 ESM 模块系统
    "moduleDetection": "force", // 强制模块检测
    "moduleResolution": "NodeNext", // 使用 Node.js 的模块解析策略
    "noUncheckedIndexedAccess": true, // 索引访问需要明确检查
    "resolveJsonModule": true, // 支持导入 JSON 模块
    "skipLibCheck": true, // 跳过声明文件的类型检查
    "strict": true, // 启用所有严格类型检查选项
    "target": "ES2022" // 编译目标为 ES2022
  }
}
```

#### 核心编译选项说明

- **module: "NodeNext"**: 使用 Node.js 原生的 ESM 模块系统，支持 `import/export` 语法
- **moduleResolution: "NodeNext"**: 遵循 Node.js 的模块解析规则，包括 package.json 的 "exports" 字段
- **strict: true**: 启用所有严格类型检查，包括：
  - `noImplicitAny`: 禁止隐式 any 类型
  - `strictNullChecks`: 启用严格的 null 检查
  - `strictFunctionTypes`: 严格检查函数类型
  - `strictBindCallApply`: 严格检查 bind、call、apply 方法
  - `strictPropertyInitialization`: 严格检查类属性初始化
- **isolatedModules: true**: 确保每个文件都可以独立编译，不依赖其他文件的类型信息
- **noUncheckedIndexedAccess: true**: 通过索引访问对象属性时，返回值类型包含 undefined

### 2. NestJS 配置 (nestjs.json)

NestJS 配置继承自基础配置，并添加了框架特定的编译选项：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "NestJS",
  "extends": "./base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "removeComments": true, // 移除注释
    "emitDecoratorMetadata": true, // 为装饰器生成元数据
    "experimentalDecorators": true, // 启用实验性装饰器支持
    "allowSyntheticDefaultImports": true, // 允许从没有默认导出的模块中导入
    "sourceMap": true, // 生成 source map
    "incremental": true, // 启用增量编译
    "strictNullChecks": false, // 放宽 null 检查（NestJS 需要）
    "noImplicitAny": false, // 允许隐式 any
    "strictBindCallApply": false, // 放宽 bind/call/apply 检查
    "forceConsistentCasingInFileNames": false, // 放宽文件名大小写检查
    "noFallthroughCasesInSwitch": false // 允许 switch 语句 fallthrough
  }
}
```

#### NestJS 特定选项说明

- **experimentalDecorators: true**: 启用装饰器语法支持（NestJS 的核心特性）
- **emitDecoratorMetadata: true**: 为装饰器生成运行时元数据，支持依赖注入
- **strictNullChecks: false**: 由于 NestJS 的依赖注入机制，某些场景下需要放宽 null 检查
- **incremental: true**: 启用增量编译提升构建速度

### 3. Next.js 配置 (nextjs.json)

Next.js 配置继承自基础配置，并针对前端项目进行了优化：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }], // Next.js 插件
    "module": "ESNext", // 使用 ESNext 模块系统
    "moduleResolution": "Bundler", // 使用打包工具的模块解析
    "allowJs": true, // 允许 JavaScript 文件
    "jsx": "preserve", // 保留 JSX 语法
    "noEmit": true // 不生成输出文件（Next.js 负责编译）
  }
}
```

#### Next.js 特定选项说明

- **plugins: [{ "name": "next" }]**: 使用 Next.js 官方 TypeScript 插件
- **module: "ESNext"**: 使用最新的 ES 模块标准
- **moduleResolution: "Bundler"**: 使用打包工具的模块解析策略（优化前端打包）
- **allowJs: true**: 支持在 TypeScript 项目中直接使用 JavaScript 文件
- **jsx: "preserve"**: 保留 JSX 语法，由 Next.js 编译器处理
- **noEmit: true**: 不生成编译输出，Next.js 负责编译和打包

### 4. React 库配置 (react-library.json)

React 库配置用于开发和构建 React 组件库：

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React Library",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx" // 使用新的 JSX 转换
  }
}
```

#### React 库选项说明

- **jsx: "react-jsx"**: 使用 React 17+ 的新 JSX 转换，自动导入 `React`（不再需要 `import React from 'react'`）

## 配置继承关系

理解配置继承关系对于避免重复配置至关重要：

```text
base.json
  ├── nestjs.json (继承 base.json)
  │     ├── apps/fastify-api/tsconfig.json (继承 nestjs.json)
  │     └── libs/infra/config/tsconfig.json (继承 nestjs.json)
  ├── nextjs.json (继承 base.json)
  └── react-library.json (继承 base.json)
```

### 配置继承层级

1. **base.json**: 基础配置，包含所有项目的共同选项
2. **nestjs.json**: 继承 base.json，添加 NestJS 特定选项
3. **子项目 tsconfig.json**: 继承 nestjs.json，只包含项目特定的覆盖选项

### 重复配置警告

以下选项已在 `nestjs.json` 中定义，子项目**不应**重复配置：

- ❌ `experimentalDecorators` - 已在 nestjs.json 中设为 true
- ❌ `emitDecoratorMetadata` - 已在 nestjs.json 中设为 true
- ❌ `module` 和 `moduleResolution` - 已在 nestjs.json 中设为 NodeNext
- ❌ `noImplicitAny` - 已在 nestjs.json 中设为 false
- ❌ `strictNullChecks` - 已在 nestjs.json 中设为 false

子项目只应在需要**覆盖**继承的配置时才重新定义这些选项。

## 使用方式

### 1. 子项目配置示例

#### NestJS 项目

```json
// apps/fastify-api/tsconfig.json
{
  "extends": "@repo/typescript-config/nestjs.json",
  "compilerOptions": {
    "strictPropertyInitialization": false,
    "outDir": "./dist",
    "baseUrl": "./",
    "strict": false,
    "useDefineForClassFields": false
  }
}
```

> **注意**: `experimentalDecorators` 和 `emitDecoratorMetadata` 已经在 `nestjs.json` 中配置，子项目无需重复定义。

#### 基础设施库

```json
// libs/infra/config/tsconfig.json
{
  "extends": "@repo/typescript-config/nestjs.json",
  "compilerOptions": {
    "allowJs": true,
    "esModuleInterop": true,
    "incremental": false,
    "baseUrl": ".",
    "outDir": "./dist"
  },
  "include": ["src", "src/**/*.spec.ts", "src/**/*.test.ts", "test"],
  "exclude": ["node_modules", "dist"]
}
```

### 2. 构建配置分离

为了区分开发配置和构建配置，项目通常使用 `tsconfig.build.json`：

```json
// libs/infra/config/tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "test"]
}
```

这样做的好处是：

- 开发时包含测试文件，方便 IDE 类型检查
- 构建时排除测试文件，减少编译时间
- 保持配置清晰和可维护

## 配置策略

### 1. 严格的类型检查

基础配置启用了 `strict: true`，这包括：

- **noImplicitAny**: 禁止隐式 any 类型
- **strictNullChecks**: 严格的 null/undefined 检查
- **strictFunctionTypes**: 严格检查函数类型
- **strictBindCallApply**: 严格检查 bind/call/apply
- **strictPropertyInitialization**: 严格检查类属性初始化
- **alwaysStrict**: 以严格模式解析代码

### 2. ES 模块支持

项目全面采用 ES 模块（ESM）：

- **module: "NodeNext"**: 使用 Node.js 原生的 ESM
- **moduleResolution: "NodeNext"**: 遵循 Node.js 的模块解析规则
- **isolatedModules: true**: 确保每个文件都可以独立编译

这使得项目可以：

- 使用 `import/export` 语法
- 支持 `package.json` 的 "exports" 字段
- 更好的 Tree-shaking 支持

### 3. 增量编译优化

NestJS 配置启用了增量编译：

```json
{
  "incremental": true
}
```

这会在构建过程中生成 `.tsbuildinfo` 文件，记录编译信息，提升后续构建速度。

### 4. 声明文件生成

所有配置都启用了声明文件生成：

```json
{
  "declaration": true,
  "declarationMap": true
}
```

这使得项目可以：

- 为其他项目提供类型定义
- 支持类型检查和 IDE 提示
- 在构建产物中包含 `.d.ts` 文件

## 最佳实践

### 1. 选择合适的配置类型

根据项目类型选择合适的配置：

| 项目类型         | 使用配置             | 说明                 |
| ---------------- | -------------------- | -------------------- |
| NestJS 后端应用  | `nestjs.json`        | 支持装饰器、依赖注入 |
| Next.js 前端应用 | `nextjs.json`        | 支持 JSX、SSR        |
| React 组件库     | `react-library.json` | 支持 JSX、组件开发   |
| Node.js 工具库   | `base.json`          | 基础配置，可按需扩展 |

### 2. 最小化配置覆盖

尽量继承基础配置，只在必要时覆盖：

```json
{
  "extends": "@repo/typescript-config/nestjs.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "."
  }
}
```

**重要原则**：

- ✅ 只定义项目中需要覆盖的选项
- ❌ 不要重复定义已在 `nestjs.json` 中的选项
- ❌ 不要复制整个 nestjs.json 的内容

在创建或修改 tsconfig.json 前，先检查 `nestjs.json` 是否已包含所需选项。

### 3. 分离开发构建配置

使用 `tsconfig.build.json` 分离开发和生产配置：

```json
// tsconfig.json - 开发配置
{
  "extends": "@repo/typescript-config/nestjs.json",
  "include": ["src", "src/**/*.spec.ts"]
}

// tsconfig.build.json - 构建配置
{
  "extends": "./tsconfig.json",
  "exclude": ["**/*.spec.ts", "test"]
}
```

### 4. 合理使用 include/exclude

明确指定包含和排除的文件：

```json
{
  "include": ["src", "src/**/*.spec.ts"],
  "exclude": ["node_modules", "dist", "**/*.js"]
}
```

这样可以：

- 避免编译不相关的文件
- 提升编译速度
- 减少类型检查错误

### 5. 配置模块路径映射

使用 `paths` 和 `baseUrl` 简化导入路径：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"]
    }
  }
}
```

## 常见问题

### 1. 装饰器不生效

**问题**: NestJS 装饰器不生效或报错

**解决方案**:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 2. 模块导入路径错误

**问题**: 使用相对路径导入时出现 `Cannot find module` 错误

**解决方案**:

- 检查 `moduleResolution` 设置
- 确保使用 ESM 语法（`.js` 扩展名）
- 配置 `paths` 简化导入路径

### 3. 类型声明文件缺失

**问题**: 编译后的 `.js` 文件没有对应的 `.d.ts` 文件

**解决方案**:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true
  }
}
```

### 4. 严格类型检查过于严格

**问题**: 某些 NestJS 特性需要放宽类型检查

**解决方案**:

```json
{
  "compilerOptions": {
    "strictNullChecks": false,
    "noImplicitAny": false
  }
}
```

### 5. 增量编译缓存问题

**问题**: 增量编译缓存导致奇怪的错误

**解决方案**:

```bash
# 清理缓存
rm -rf *.tsbuildinfo dist/
```

## 配置维护

### 1. 更新配置包

修改 `packages/typescript-config` 中的配置会影响所有使用该配置的项目：

```bash
# 1. 修改配置
# packages/typescript-config/base.json

# 2. 验证配置
pnpm type-check --filter="@repo/typescript-config"

# 3. 应用配置到所有项目
pnpm type-check
```

### 2. 版本管理

配置包使用内部版本管理：

```json
{
  "name": "@repo/typescript-config",
  "version": "0.0.0",
  "private": true
}
```

由于是 monorepo 内部包，使用 `workspace:*` 版本管理。

### 3. 向下兼容

更新配置时应考虑向下兼容：

- 避免移除已使用的配置选项
- 新增配置选项时提供默认值
- 重大变更应文档化并通知团队

## 总结

hl8-platform monorepo 的 TypeScript 配置体系通过集中管理、配置继承和类型安全，确保了：

1. **统一性**: 所有项目使用统一的编译选项
2. **可维护性**: 集中管理配置，易于更新
3. **灵活性**: 子项目可按需覆盖特定选项
4. **类型安全**: 启用严格类型检查，提升代码质量

这种配置方式为项目的长期维护和扩展提供了坚实的基础。
