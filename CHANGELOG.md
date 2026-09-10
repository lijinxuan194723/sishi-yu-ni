# CHANGELOG

## v0.1（2026-09-09）
- 提交：`3cc5864`
- 说明：Build Luke companion website with local records and backups
- 新增：
  - 初始化前端项目结构（`app/`、`components/`、`lib/`、`hooks/`）和基础样式。
  - 引入 UI 组件库、Lint/构建配置和主要前端依赖。
  - 新增配置与校验文件（`.openai/hosting.json`、`components.json`、`VERIFICATION.md`、`next.config.ts` 等）。
- 修改：
  - 建立初始页面骨架与主入口流程。
  - 增加基础样式与入口布局。
- 修复：
  - 完成首版可运行结构与基础项目可构建状态。

## v0.2（2026-09-09）
- 提交：`4f37960`
- 说明：Connect Caiyun weather and model chat with persistent local Luke memory
- 新增：
  - 集成 Caiyun 天气服务代理接口与模型代理接口。
  - 新增 `CHARACTER_AND_API.md`，补充模型/天气接口说明。
  - 增加会话记忆持久化与模型/天气配置字段。
- 修改：
  - 扩展连接页与配置路径，完善验证流程。
  - 引入天气与模型相关工具函数。
  - 调整 `app/page.tsx` 与 `tsconfig` 配置以支持新功能。
- 修复：
  - 对输入参数（URL、位点、Token）增加合法性校验，降低无效配置风险。

## v0.3（2026-09-09）
- 提交：`e985508`
- 说明：Feature Luke artwork and direct chat API configuration
- 新增：
  - 新增艺术素材（`public/images/*`）与视觉展示资源。
  - 增加直接聊天 API 配置能力并增加对应检查。
- 修改：
  - `app/page.tsx` 与 `components/connections.tsx` 增强配置流程。
  - `components/` 与 `lib/` 中对模型连接与界面交互进行适配。
- 修复：
  - 调整聊天配置与展示逻辑，减少无效请求路径和界面异常。

## v0.4（2026-09-10）
- 提交：`76504d7`
- 说明：Publish for GitHub
- 新增：
  - 增加多处核心陪伴功能模块：四季体验、音乐、学习、专注、计划、手记、待办、倒计时等。
  - 新增移动端构建与打包入口（`mobile/` 相关文件）。
  - 引入更完整的业务组件与页面状态管理。
  - 扩展 `lib/` 业务逻辑（专注、学习、音乐、季节、位置、流式模型等）。
- 修改：
  - 优化主页面与样式，完善交互流程与状态显示。
  - 改进模型与天气请求链路在桌面与移动端的兼容处理。
- 修复：
  - 补齐更多边界校验与异常分支。

## v0.5（2026-09-10）
- 提交：`25bfda7`
- 说明：Prepare repository for GitHub release
- 新增：
  - 增加发布前的检查脚本集合（`check-*.mjs`）。
  - 补充 `.gitignore`，增强本地构建产物/缓存/敏感文件过滤。
  - 补充备份/历史相关图片与资源归档。
- 修改：
  - 完善发布前校验覆盖面（模型、天气、交互、季节、移动端体验等）。
  - 对关键链路做上线前一致性梳理。
- 修复：
  - 收口发布节奏相关问题，确保仓库内容更适合正式托管和持续维护。
