# 四时与你（夏彦）

一个以夏彦为主题的本地陪伴式 Web 应用，围绕四季、天气、聊天、记录和日常陪伴展开。数据默认保存在浏览器本地，模型与天气服务由用户自行配置。

![四时与你](public/images/luke-sunset.jpg)

## 项目介绍

这是一个面向个人使用的四时陪伴空间：你可以在四季主题场景中与夏彦聊天，记录日记和待办，使用专注、学习、阅读、音乐等日常功能，也可以导入或导出本地备份。

角色设定、模型接入方式和天气接口说明见 [docs/CHARACTER_AND_API.md](docs/CHARACTER_AND_API.md)。项目不会在仓库中保存真实 API Key；请在本地设置页面中填写自己的接口配置。

## 主要功能

- 夏彦角色陪伴、聊天记录与本地记忆
- 春夏秋冬主题场景、图片和动态氛围
- 天气显示、降水提示与地点配置
- 日记、手记、待办、学习、阅读、专注和倒计时
- 本地数据导入导出，支持旧版备份迁移
- Android APK 发布包，见 [Releases](../../releases)

![四季场景](public/images/seasons/spring.png)

## 本地运行

环境要求：Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

构建生产版本：

```bash
npm run build
```

## Android 下载

每个 APK 都按版本单独放在 GitHub Releases 中，包含 `Summer-Luke` 和 `Four-Seasons-Luke` 两条版本线。打开 [Releases](../../releases) 后，选择需要的版本并下载对应 APK。

![夏彦角色图](public/images/luke-blossom.jpg)

## 目录说明

| 目录 | 内容 |
| --- | --- |
| `app/`、`components/` | Web 页面和界面组件 |
| `lib/`、`hooks/` | 业务逻辑和状态钩子 |
| `public/` | 角色、四季和应用资源 |
| `mobile/` | Android 壳与构建脚本 |
| `docs/` | 接口说明和验证记录 |
| `scripts/checks/` | 功能与交互检查脚本 |
| `CHANGELOG.md` | 版本变更记录 |

## 隐私与安全

- API Key、Token、密码和签名文件不会提交到仓库。
- 聊天记录和应用数据默认保存在当前浏览器，不写入项目服务器。
- 使用模型或天气服务时，请遵守对应服务商的条款与额度限制。

## 版本记录

完整变更记录见 [CHANGELOG.md](CHANGELOG.md)。历史版本标签包括 `v0.1` 至 `v0.5`。
