# @kway-teow/http

一个实用的 TypeScript 工具函数库，提供了常用的工具函数集合。

## 安装

```bash
npm install @kway-teow/http
# 或者
yarn add @kway-teow/http
# 或者
pnpm add @kway-teow/http
```

## 使用

### HTTP 工具类

```typescript
import { Http } from '@kway-teow/http'

// 创建 HTTP 实例
const http = new Http('https://api.example.com')

// 发送 GET 请求
const response = await http.get('/users')
```

## 开发要求

- Node.js >= 22
- pnpm >= 10

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 运行测试
pnpm test

# 生成测试覆盖率报告
pnpm coverage

# 生成文档
pnpm typedoc

# 监听文档变化
pnpm typedoc:dev

# 构建项目
pnpm build

# 代码提交
pnpm cz

# 发布新版本
pnpm release
```

## 文档

[API 文档](https://kway-teow.github.io/http/index.html)

## 特性

- 使用 TypeScript 编写，提供完整的类型定义
- 100% 测试覆盖率
- 完整的 API 文档
- 支持 ESM 和 CommonJS

## License

MIT
