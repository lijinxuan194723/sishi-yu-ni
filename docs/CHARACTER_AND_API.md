# 夏彦角色依据与接口说明

核验日期：2026-09-09。

## 夏彦设定

- 私家侦探、阳光开朗、行动技能与青梅竹马的感情：官方主要角色介绍 https://tot.tw.hoyoverse.com/tw/zh-tw/information/all/detail/129025
- 回到未名市、重逢背景：官方首支宣传报道 https://wd.mihoyo.com/information/detail/3625
- 生日 12 月 5 日：官方生日公告 https://wd.mihoyo.com/information/detail/113871
- 立绘：https://tot.hoyoverse.com/en-us/character

系统提示词在 lib/model.ts。角色事实与同人演绎规则分开；不把预设台词当成用户亲历，不编造未知卡面台词，不主动展开病情等剧情。问到现实身份时如实回答 AI 同人聊天。

## 模型与记忆

配置 HTTPS Base URL（包含服务商要求的 /v1 等前缀）或完整 /chat/completions 地址、模型名、API Key。已知提供商域名通过本站固定白名单转发以避免 CORS；其他自定义域名从浏览器直接请求，须自行允许 CORS。无有效 Key 时不生成伪造回复。接口错误、超时或取消保留用户消息，重试不会重复写入用户消息。

每次请求携带角色提示词、用户固定记忆、滚动摘要、最近对话和按关键词检索的旧用户消息。摘要累计整理旧记录，成功后才推进处理位置；失败不删记录。原始全文保存在 localStorage 的 luke-companion-v1，旧版文件可直接导入。摘要是有损整理，可手工校正；关键词检索不等同于语义检索，不保证每次召回全部细节。

完整存档仅保存在浏览器，不写入云端数据库。调用模型时，必要的聊天上下文会经本站代理转发（自定义域名则直接请求）给所选模型商，代理不持久化保存请求内容。密钥保留在当前标签页 sessionStorage，不进入聊天备份。删除浏览器数据会删除本地记录，换设备要导出/导入。本站托管转发不要求用户购买服务器；API 使用费用由提供商决定。

## 彩云天气

- 综合接口：https://docs.caiyunapp.com/weather-api/v2/v2.6/6-weather.html
- 实况字段：https://docs.caiyunapp.com/weather-api/v2/v2.6/1-realtime.html
- 降水阈值：https://docs.caiyunapp.com/weather-api/v2/v2.6/tables/precip.html
- 备用来源：https://open-meteo.com/en/docs

使用 v2.6 综合接口，经度在前、纬度在后。密钥通过 POST 交给本站固定彩云代理，再按彩云要求放入上游 URL；不记录密钥或返回上游错误正文。每 5 分钟与重新显示页面时更新，保留来源和数据时间，失败/过期数据不作为实时提醒或模型天气上下文。分钟级预测与预警依套餐权限，没有这些字段仍展示实况；降水预报按默认雷达强度 >=0.031 判断。关闭网页不提供后台推送。
