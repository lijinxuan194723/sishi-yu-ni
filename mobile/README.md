# 夏日来信 · 安卓版

安装包：`outputs/android/Summer-Luke-1.0.0.apk`。Android 8.0 及以上，使用系统 Android WebView；旧手机请先更新 Android System WebView。

## 安装和使用

1. 将 APK 发到手机，用手机文件管理器打开。如系统提示，允许该文件管理器安装此应用。
2. 打开“夏日来信”，进入“悄悄话 → 模型 API”，填写 HTTPS 接口地址、模型 ID 和 Key，先测试，再保存。
3. “设置 → API 连接”填写彩云 Token 和经纬度，或选择 Open-Meteo 免密钥试用。定位需要手机授权，也可以手填坐标。
4. 首页陪伴天数可点击修改。聊天、摘要、待办与手记保存在这台手机的应用数据中。
5. 迁移网页记录：先在旧网页导出备份，把 JSON 文件传到手机，再在应用“设置 → 日常 → 从备份恢复”选择文件。
6. 定期导出备份到自己选择的文件夹。卸载或清除应用数据会删除本地存档；覆盖安装同签名更新可保留应用数据。网页和 APK 不自动同步。

页面和图片随安装包提供，不需要电脑运行或购买服务器。联网时应用直接向所选模型服务商、彩云/Open-Meteo 发请求；聊天与记忆会作为上下文发给模型服务商。API 可能产生服务商费用。没有网络时可以查看本地记录、记手记和计划，模型回复和天气更新需联网。

Key 仅保存在当前应用网页会话，刷新可保留，应用进程被系统结束后可能需重新填写；不会写入聊天备份。天气在页面可见时刷新，关闭应用后没有后台推送。首次安装会显示独立的新存档，原网页数据不受影响。

## 可复现构建

在项目根目录安装原有依赖后执行 `pwsh -File mobile/build-apk.ps1 -SdkRoot <SDK目录>`。目录中需要 Android 35 的 `android.jar`、Build Tools 35.0.0，以及 PATH 上的 JDK 17 和 Node.js。脚本复用现有 React 页面，使用 Vite 构建本地静态资源，然后 javac → d8 → aapt → zipalign → apksigner。没有新增 npm 依赖。

签名密钥保存在项目外的 `../夏彦软件-assets/android-signing/`，不要公开或发给他人。后续更新必须保留该密钥，不能换签名；安装包不包含密钥。

## 实现与验证边界

- 固定本地 HTTPS 来源加载包内文件；禁止加载远程页面或 iframe，外链由系统浏览器打开。
- 联网由 Android HTTPS 连接完成，不受网页 CORS 限制；正常校验证书，不跟随重定向，不允许 HTTP 明文。
- 系统文件选择器处理备份导出/导入，不申请广泛存储访问权限；Android 云备份已关闭。
- 检查：`node --experimental-strip-types check-mobile.mjs`、原有两项检查、`npx tsc --noEmit`、打包脚本的签名/对齐/manifest 验证。
- [UNRUN] 真机安装、键盘/刘海屏、定位授权与文件选择器交互：安装后操作验证，当前未连接测试手机。
- [UNRUN] 用户真实模型 Key 和彩云 Token 的完整请求：未提供凭据，在应用内测试连接。

Android 官方参考：[WebView 本地内容](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content)、[WebView 联网与 JavaScript 接口](https://developer.android.com/develop/ui/views/layout/webapps/webview)、[应用签名](https://developer.android.com/tools/apksigner)。

## 1.1.0 四季与昼夜

界面按设备本地时间自动变化：3–5 月春、6–8 月夏、9–11 月秋、12–2 月冬。清晨、早上、正午、午后、傍晚、夜晚与深夜有各自的问候；光照层连续交叉渐变，夜间降低亮度并调整文字对比度。此处按北半球月份和本地钟表时间营造氛围，不宣称实际日出日落或降雪。应用每 30 秒检查时间，恢复前台时立即更新，后台暂停装饰动画，遵守系统减少动态效果设置。

API 连接与测试统一放在“设置 → API 连接”。悄悄话不显示 API 表单、模型编号或“初版预设”，日期仍可点击修改但不再显示操作提示。

优先检索了 GitHub 的 [SunCalc](https://github.com/mourner/suncalc) 与 [Animate.css 动效实践](https://github.com/animate-css/animate.css/blob/main/docsSource/sections/03-best-practices.md)。当前需求只需本地时间，不引入太阳位置计算或整套动画库；用现有 Lucide 图标、CSS transform/opacity 实现缓慢漂浮与交叉淡入。未复制第三方源码，未新增依赖。

验证：`node --experimental-strip-types check-ambience.mjs` 覆盖四季边界、七个时段、全天每 30 秒光照连续性和跨午夜衔接。使用原签名、相同包名，versionCode 升为 2，APK 为 Summer-Luke-1.1.0.apk，支持覆盖更新。

## 1.2.0 聊天与设置整理
- 悄悄话固定占满可用屏幕，去掉页头介绍与外层滚动，只在消息区域滚动；查看旧消息时不强制跳回底部。Android 键盘仍由系统 resize/insets 适配。
- 设置分为日常与数据、聊天模型、天气与位置、四季与昼夜、聊天记忆。两个 API 分别编辑和保存，不覆盖另一类配置。
- 默认 Open-Meteo；升级时未持有彩云会话 Token 的旧默认设置转为 Open-Meteo，有正在使用的彩云 Token 则保留。GPS 定位成功后，从手机直连 BigDataCloud 查询城市和县区；如果名称查询失败，保留坐标并提示手填，不伪造县区。
- 季节、七个时段可独立选择，也可恢复自动；偏好本地保存，设置内有即时光影预览，按钮与面板使用线性过渡。
- 聊天显示正在输入状态，stream:true 请求实时 SSE，Android 原生流式桥与网页代理均逐段转发；只显示 delta.content，不显示模型思考字段。停止、超时、断流时保存已收到的正文。不支持 SSE 而返回普通 JSON 的服务仍只能整段显示。
- 检查新增 check-settings.mjs、check-stream.mjs，覆盖县区字段、手动/自动恢复、SSE 分片、UTF-8/表情拼接、首段提前出现与中断场景。
- [UNRUN] 真机滚动、键盘和定位服务实测，以及真实模型凭据的流式调用。签名、类型与逻辑检查不代替真机验证。
- 逆地理编码遵循 [BigDataCloud 免费客户端规则](https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free)：仅在用户请求定位后，从其设备提交实时 GPS，不用服务器代理或测试用假坐标调用免费端点。县区提取以夹具验证。

## 1.3.0 — 四时与你
- 保留 com.luke.summer 和原签名，versionCode 4，支持覆盖升级。
- 按用户文件夹选用四幅原图，未修改源图：春天 6b57a8…；夏天 45ebef…；秋天 75455c…；冬天 2233b7…。已逐幅检查所选图无明显社交平台水印。
- 四季改为照片、页面底色、卡片、消息气泡、导航、按钮的整套主题。两层照片加载后交叉淡入，避免切换空白。昼夜保留连续光照过渡。
- 动画研究参考 https://github.com/tsparticles/presets（雪粒/萤光预设思路）；使用现有 CSS 实现不同大小、速度、漂移的粒子，无新运行库和远程资源。季节动画开关持久保存，关闭后停用粒子和天气特效；尊重系统减少动态效果。
- 定位成功立即保存；首页独立显示位置，县区查询失败时显示坐标，不再冒充“我的位置”。
- 原生隐藏状态栏并在窗口重新获得焦点时恢复，保留导航栏/输入法与刘海安全区。参考 Android 官方 https://developer.android.com/develop/ui/views/layout/immersive。
- 红圈生成提示条已移除；停止操作放入输入框按钮；消息 HH:mm 可点开完整本地年月日时分秒。旧的无日期消息不捏造日期。
- 通用标题、保存状态和查看记忆只留首页，其它页面保留设置入口，聊天保留专用页头。

核验：check.mjs、check-integrations.mjs、check-mobile.mjs、check-ambience.mjs、check-settings.mjs、check-stream.mjs、check-seasons.mjs 全通过；tsc --noEmit、npm run build、pwsh -File mobile/build-apk.ps1 成功。
安装包 outputs/android/Four-Seasons-Luke-1.3.0.apk，39,459,029 bytes。
SHA256 B875D97360719AC3DC918439032F95201A2F13814415990E903965AE4B09C93A。
签名 SHA256 dead016865cc532374c46776de8feb08f4c7dd3c5c0a1f49e52fab65179cdfda，与旧版一致；APK v2/v3 签名与 zipalign 验证通过。
[UNRUN] 真机外观、系统栏/键盘、GPS 县区查询、用户模型接口：覆盖安装后到设置手动切换四季/昼夜，获取位置并发送一条消息核对。
网站未重新发布，本次交付是本地资源打包的 Android APK。

## 1.4.0 — 地点、持久连接与纪念日
交付：outputs/android/Four-Seasons-Luke-1.4.0.apk（39,864,858 bytes），versionCode 5。
SHA256：305D40810362748CDC3007FC9EB185D9D603407E64A173924586E477FE60031A。
签名证书 SHA256：dead016865cc532374c46776de8feb08f4c7dd3c5c0a1f49e52fab65179cdfda，与前版一致。

密钥从 sessionStorage 迁移到 localStorage，现存临时密钥自动迁移；聊天备份仍排除密钥。
县区增加 Android Geocoder 并严格排除社区等名称。BigDataCloud 只使用新获取的 GPS 坐标。提供默认关闭的 Nominatim 备用服务，启用前显示使用规则、限制及 OSM 数据署名，可修改服务地址；低频请求与内存缓存。联网探测发现普通 jsonv2 缺少海淀区，geocodejson 的 admin.level6 包含海淀区，已按该字段解析。实测是公开测试坐标，并非用户真机位置。
参考：https://developer.android.com/reference/android/location/Geocoder
备用服务：https://nominatim.org/release-docs/latest/api/Reverse/ 与 https://operations.osmfoundation.org/policies/nominatim/。

闪屏修复：不再先绘制春天默认界面；解码目标照片后提交主题，保留旧图 DOM；CSS 注册颜色属性，让渐变背景也能平滑插值；原生窗口/WebView/加载画面统一底色。
消息时间改为原位切换；搜索移为独立页面并支持日期筛选、跳回原消息和安卓返回键。
新增生日、周年及自定义纪念日，兼容旧存档并随备份导入导出；公历闰日规则明确，跨日监听，生日祝福每日确认后不重复自动弹出。
lib/daily.ts 包含 120 条独立文案（六个合理时段，每组20条），按日期变化并可手动切换。

检查通过：check.mjs、check-integrations.mjs、check-mobile.mjs、check-ambience.mjs、check-settings.mjs、check-stream.mjs、check-seasons.mjs、check-daily.mjs；npx tsc --noEmit；npm run build；pwsh -File mobile/build-apk.ps1。
APK v2/v3 签名、zipalign、版本/权限清单均验证通过。
[UNRUN] 真机县区、启动/快速切换是否完全无闪屏、重启后的密钥、全屏祝福外观、输入法：覆盖安装后逐项操作验证。未重新发布在线网站。

## 1.4.1 — 分页顶栏
主页相伴天数与纪念日入口；人物页动态状态与切换日常；日历当天日期与“今天”；手记数量与写作入口。非聊天页面顶栏吸顶，聊天和搜索沿用固定的独立顶栏，避免双顶栏。移除原来标题/设置/保存提示多行留白，将保存状态与查看记忆移入设置。
交付 outputs/android/Four-Seasons-Luke-1.4.1.apk，versionCode 6，原包名与原签名。
SHA256 DD2214577AA7694CF70404BF255F8D224379C30CE6CC7773B9825BF55DE73E0A。
检查：tsc --noEmit、check-settings.mjs、check-seasons.mjs、Android 构建、APK 签名/对齐/清单均通过。
[UNRUN] 真机顶栏视觉与输入法：覆盖安装后切换五个页面，验证吸顶、今天、写作、搜索返回按钮。

## 1.4.2 — 状态栏与顶栏安全区
按用户手机截图修正：顶栏改为64px平直通栏、统一16px左右边距、缩小装饰图标、44px操作触点；聊天改为同样的通栏顶栏，移除顶部卡片圆角和外侧间隙。
恢复系统状态栏与导航栏，按季节与昼夜设置底色和图标明暗。Android 30+ 使用独立原生容器，通过 WebView 的布局边距处理系统栏、刘海及键盘 inset，替代 WebView 内部 padding，确保网页视口尺寸对应可用区域。旧版 Android 继续由系统窗口处理安全区。窗口恢复焦点仍显示系统栏。
修正短页面背景重复形成的水平接缝。
交付 outputs/android/Four-Seasons-Luke-1.4.2.apk，versionCode 7，原包名与原签名，可覆盖升级。
检查：tsc --noEmit、check-seasons.mjs、check-settings.mjs、Android构建、APK签名/对齐/权限清单通过。
[UNRUN] 真机状态栏、顶栏视觉、键盘：覆盖安装后切换各页并打开聊天键盘确认。用户提供的图片是旧版反馈，不代表新版真机验证。

## 1.4.3 — 生日预览定位修复
普通 DialogContent 附带 -translate-x/y-1/2；生日层只覆盖 inset 后仍存在居中位移样式风险。新增明确 fullScreen 模式，完全不带普通弹窗的位置、平移与缩放动画类。预览先关闭设置，收下/关闭后返回原设置页。安卓返回优先关闭最后一个弹窗。祝福内容在小视口可滚动。
检查：tsc --noEmit、check-birthday-dialog.mjs、check-daily.mjs、安卓构建、APK签名/对齐通过。
交付 outputs/android/Four-Seasons-Luke-1.4.3.apk，versionCode 8，原包名和签名。
[UNRUN] 真机生日预览视觉与点击：覆盖安装，设置→生日与纪念日→看看生日祝福，检查完整铺满、收下返回、再次打开及安卓返回键。

## 1.4.4 — 设置季节切换闪屏修复
将按季节 key 更换 DOM 改为两个固定图像节点，队列保证正在进行的淡入完整结束，过期且尚未开始的请求跳过。图片解码和动画期间旧图始终不透明，失败时保留旧图。每一帧图像使用自己的裁切位置，不再跟随全局季节立即跳动。
去掉弹窗遮罩的实时背景模糊，减轻主题更新时整页合成。原生 systemTheme 相同色值直接返回，颜色更新不再重复调用系统栏 show。
检查：check-photo-transition.mjs 验证解码/淡入/取消/失败过程旧画面保留；check-daily.mjs、tsc --noEmit、安卓构建、签名与对齐通过。
交付 outputs/android/Four-Seasons-Luke-1.4.4.apk，versionCode 9，原包名与签名。
[UNRUN] 真机 WebView 连续四季切换的视觉帧：覆盖安装后在设置依次及快速切换四季确认。逻辑测试不能证明手机上已完全无闪屏。

## 1.4.5 — 季节切换性能
外观设置拆成独立组件及局部主题作用域，预览不再驱动整页 React 重渲染和原生系统栏更新；关闭设置后读取已保存选项同步主页面。四季粒子树缓存复用，隐藏非当前季节层及设置背后的粒子。设置内只保留 opacity/transform 过渡，避免长时间继承颜色插值使整个粒子子树逐帧重算。保留照片解码、650ms淡入、季节动画及昼夜光照。
真实反馈环：npx vite build --config mobile/vite.config.mts，然后 node check-season-performance.mjs。412×892、DPR2.5、Chrome headless、4倍CPU限速，明确强制 prefers-reduced-motion:no-preference（所有动画开启）。原始1.4.4打包网页：51帧>50ms，最大237.6ms；最终新版：0帧>50ms，最大46.9ms。快速连点最终照片、昼夜、动画开关、关闭同步、刷新持久化通过。
诊断早期环境默认减少动态效果，因此早期8倍CPU的109ms→41ms对照不作为完整动画的验收证据。极端8倍完整动画压力仍出现停顿；未声称所有设备绝不卡顿。
检查：tsc、daily/settings/seasons/photo-transition/birthday-dialog/mobile 通过；APK签名/对齐/联网权限通过。版本1.4.5、versionCode10，原包名com.luke.summer、原证书dead016865cc532374c46776de8feb08f4c7dd3c5c0a1f49e52fab65179cdfda。原照片及本地数据键不变。
[UNRUN] 安卓真机GPU/WebView体验：覆盖安装后设置→四季与昼夜，连续切换、快速连点、关闭设置并重启确认。桌面限速测试不是安卓真机测试。
交付 outputs/android/Four-Seasons-Luke-1.4.5.apk；SHA256 A06B67C69667FCC0A508F3AC83EEC5B3A680986E84381375F1EF2B68024967EC。

## 1.4.6 — 移除启动过渡
启动时禁用整页过渡，等首页主图解码及两帧样式提交后恢复日常动画。Android WebView 先保持 INVISIBLE（仍测量布局），JS pageReady 后使用 postVisualStateCallback 再设为 VISIBLE；启动期间缓存系统栏颜色，到显示首页时一起应用，避免提前露出空白或中间配色。正常四季切换不变。
反馈环：PowerShell 设置 $env:STARTUP='1' 后 node check-season-performance.mjs（mobile 构建后）。旧版首次首页根元素活动配色动画192帧；新版0帧。随后完整动画四季切换0帧超过50ms，快速连点/昼夜/特效开关/关闭同步/重启持久化通过。tsc、check-mobile、check-seasons、Android编译、APK签名/对齐通过。
[UNRUN] 安卓真机冷启动首帧：覆盖安装1.4.6，划掉后台再打开，分别检查浅色和夜晚主题。浏览器首帧验证不等于原生绘制回调真机验证。
包名和签名不变，versionCode11。outputs/android/Four-Seasons-Luke-1.4.6.apk，SHA256 151591C4B65E5E2B9F8669B7BBA2BB6AD332A368F0D635BA5BFC2639EF7DFA35。

## 1.4.7 — 随身歌单与内置日期
“他的此刻”加入截图30首歌，进入页面随机排序，换一首遍历整轮不重复，新一轮避免紧邻重复。听音乐情景使用歌单卡片；只显示歌名/歌手，不包含音频、播放器或音乐订阅。已向用户询问实际播放需求，未收到音频来源，按随机显示实现。
新存档默认相识2023-07-08、生日2002-10-05，继续使用现有设置输入框修改。已有存档不自动覆盖日期；未改动保存逻辑、聊天及API密钥。
检查：check-music、check-daily、tsc通过；MUSIC=1 STARTUP=1的真实移动网页测试验证新存档日期、按钮切换30首不重复、启动0根动画帧及四季切换/保存。Android构建、签名及对齐通过，原包名/签名，versionCode12。
[UNRUN] 安卓真机更新后歌单与日期设置，覆盖安装后“他的此刻”→换一首、设置→生日与纪念日。
歌名主要来自用户截图；Live演唱者校对 https://www.kugou.com/mixsong/3ntef124.html ，红尘之客姓名校对 https://www.bilibili.com/video/BV1Ef4y1e7g8/ 。未下载音乐音频。

## 1.4.8 — 昼夜直切与独立自动模式
按用户授权移除昼夜光照淡入及整页颜色插值，保留四季照片淡入和粒子/按钮运动。两个自动模式分别命名“随日期”和“随时间”，移除会同时重置两项的总按钮；已有存储格式不变。季节固定任意四季时，period:auto仍使用设备当地钟表时间；反向组合也保留。
统一.page-bar右侧两个44px槽位，设置始终最右，聊天搜索在左槽；搜索子页亦保留右侧设置。真实412×892移动网页测得5主页面设置按钮均x352/y9.5/44×44。
检查：tsc、check-independent-appearance、check-settings、check-photo-transition通过；UIFIX=1 node check-season-performance.mjs验证昼夜无颜色/光照CSS过渡、独立选项保存、五页坐标一致，后续四季快速切换及重启保存通过。APK签名/对齐通过，versionCode13，原包名与签名。
[UNRUN] 安卓真机昼夜直切视觉：覆盖安装后四季与昼夜选择固定季节+随时间，并快速切换早上/夜晚确认。
交付Four-Seasons-Luke-1.4.8.apk，SHA256 8098C35994373C50BBFF7F5EA84E847BBFC3C15CA2EC60DB2B76AC518E11E13C。

### 1.4.9 · 模型优先顺序
- 设置 / 聊天模型：首选和可选备用各自配置地址、模型 ID、密钥，可单独测试；原首选配置兼容保留。
- 聊天及长期记忆请求优先首选，未输出时失败才尝试备用一次；手动取消、部分输出不切换。下次请求重新优先首选。
- 已验证：TypeScript；check-model-fallback、check-integrations、check-stream、check-daily；MODELS=1 浏览器实际表单保存和重载、手机宽度、季节性能回归（0 帧超过 50ms）。
- APK 1.4.9 / 14；原包名及签名，INTERNET 权限保留，签名 v2/v3、zipalign 通过。
- SHA256: 7DF1081617DBDBB85F7933547DA6B273CF8D738118FC826DA9B5F7C9336B86DB
- [UNRUN] 实体安卓手机及付费模型真实凭据；手机覆盖安装后在设置分别测试两个模型。

### 1.5.0 · 心情与收藏
- 时光手记新增五种心情、近七天回顾、手记/收藏分类、关键字搜索和原位编辑。允许只记心情。
- 聊天消息星标收藏，可从手记返回原消息；不复制原文、不更改聊天记忆内容。
- 新字段可选，兼容旧存档；心情与收藏进入现有 JSON 备份，密钥仍不进入备份。
- 验证：tsc --noEmit；check-journal、check-integrations、check-daily、check-model-fallback；JOURNAL=1 浏览器实际表单保存、搜索、编辑中插入、收藏跳转、重载和手机宽度。截图 work/journal-mobile.png 已查看。
- 原包名、签名及联网权限保留，APK v2/v3 签名、zipalign 通过；versionCode 15。
- SHA256: DD235E1D378D327B90E05B9D271F5E0C14C6136A754857254347CCFB74FE11AA
- [UNRUN] 实体安卓手机；覆盖安装后可在时光手记记录心情，在聊天点星标检查收藏。

### 1.6.0 · 一起专注与计划管理
- 他的此刻：1–180 分钟专注计时、暂停继续、重启按时间恢复、最近五次记录及当天累计。返回计时页面时结算，不发送后台提醒。
- 一起计划：重要标记、编辑、改期、完成筛选、六个快捷计划、进度条；确认删除及本页撤销。
- 聊天草稿保存到本地；首页最近七天打卡、计划、手记及专注汇总。
- 新字段进入现有备份，兼容旧存档；旧 API 设置和签名保留。
- 验证：tsc；check-extras、check-journal、check-integrations、check-model-fallback；EXTRAS=1 手机尺寸浏览器验证草稿重启、计划全流程、计时恢复与结算幂等、统计与宽度；季节回归 0 帧超过 50ms。已查看 work/focus-mobile.png 和 work/plans-mobile.png，随后将原生进度条改为主题色。
- 最终 APK versionCode 16，签名 v2/v3、zipalign 和 INTERNET 权限通过。
- SHA256: 9E61EB36F38BB49FF2734900F2AC3A0957F0933432FA44D8F2D55A7144962931
- [UNRUN] 实体安卓手机；覆盖安装后在他的此刻启动计时，退出再打开核对，在一起计划检查编辑改期。

### 1.6.1 · 番茄钟
- 一起专注可切换陪伴计时/番茄钟；默认 25/5/15 分钟及每轮 4 个，自定义 1–180 分钟、1–12 个。
- 专注完成进入短休息，每轮最后一次进入长休息；休息结束准备下一次专注。每阶段手动开始，支持暂停、恢复、跳过休息、重开一轮。
- 仅完成的专注计入日志，番茄记录单独标记；统计当天番茄数；兼容旧备份及计时。
- 验证：tsc；check-pomodoro（四阶段循环、自定义、一致性及备份校验）、check-extras、check-integrations；TOMATO=1 浏览器手机尺寸实际操作（暂停恢复、重启、短长休息、跳过与日志）；季节回归 0 帧超过 50ms。已查看 work/pomodoro-mobile.png。
- APK versionCode 17，原签名、包名、联网权限；v2/v3 签名及 zipalign 通过。
- SHA256: 77295C6BF1A7F1E61C4D3896D2438AA6F1054C80CF57FE315EFAA3F6D36A0A70
- [UNRUN] 实体安卓手机；覆盖安装后在他的此刻 → 一起专注 → 番茄钟体验。不发送后台提醒。

### 1.6.2 · 独立计时页与倒计时
- 底部第六项“计时”，陪伴计时、番茄钟及记录从他的此刻迁移；右上设置位置保持一致。
- 新增独立倒计时：小时/分钟/秒（最长23:59:59）、5/10/30分钟快捷设置、暂停继续重置、关闭后恢复；到时页面提示，不写专注记录，不发送后台通知。
- 可选 countdown 字段包含在本地备份，兼容旧数据；原 focus 和 focusLog 保留。
- 验证：tsc；check-pomodoro、check-extras；COUNTDOWN=1 TOMATO=1 手机尺寸浏览器检查六项导航320/412宽度、倒计时设置暂停重载到时、独立运行、旧位置移除及番茄循环；查看 work/countdown-mobile.png。
- APK versionCode18，同包名及原签名，v2/v3、zipalign、INTERNET权限核验通过。
- SHA256: 48C3CE0CB4B0A77758053C9968414D42260BC793877A03F92061E6B82A6AFC2C
- [UNRUN] 实体安卓手机；覆盖安装后点击底部计时，检查倒计时与番茄钟。

### 1.7.0 · 专注待办与统计
- 计时页内新增待办/计时/统计分区与今日时长、次数、番茄数和当前时间。
- 专注待办：自定义名称、1–180分钟、分组筛选、编辑删除；开始直接启动番茄钟。日志保存当时事项名称，删除待办不删除日志。
- 统计：累计次数/分钟、首次记录至今日自然日日均；当日选择与前后切换；日周月及自定义范围分布、明细与JSON导出；月日历和本月完成小时分布。按完成时间归属，只统计已完成专注。
- 沉浸专注使用应用内全屏界面，可退出，不锁定手机；原倒计时保留。
- 新字段均兼容旧备份，按白名单恢复并验证数据；原包名/签名/权限保留。
- 验证：tsc；check-focus-dashboard、check-pomodoro、check-extras、check-integrations；DASHBOARD=1真实浏览器手机尺寸测试：待办创建分组编辑启动、标题快照、沉浸进出、累计/周/无效自定义日期、删除保留历史及横向宽度；已查看截图并修正日期按钮布局与统计条主题色。
- APK versionCode19，v2/v3签名、zipalign与INTERNET核验通过。
- SHA256: 1E014B45B62B0EAEFDA0E3B52DF8F40FD0C5BA7DDA9F972BB2018D54F2CC83CB
- [UNRUN] 实体安卓手机；覆盖安装后进入计时页，添加待办并完成一轮检查统计。系统锁机未实现，提供可退出的应用内沉浸模式。

## 1.7.1（2026-09-09）
- 修复输入法占位：Android IME insets 统一通知页面，手机输入时隐藏底部导航并回收聊天底部预留空间；收起键盘恢复。网页提供 visualViewport 回退。
- 专注支持自定义分类，待办分类随启动、休息、完成记录及备份保留；统计可筛选分类，时间分布显示各分类分钟与占比，明细及导出包含分类。旧记录保留为未分类。
- 验证：tsc、check-focus-dashboard、check-pomodoro、check-extras；KEYBOARD=1 浏览器模拟原生键盘信号，检查导航隐藏/恢复、输入框边界、数学25分钟/英语10分钟和筛选。查看键盘截图；四季切换回归通过。
- APK versionCode20，v2/v3签名、zipalign、INTERNET及原签名证书核验通过。
- SHA256: EABC4310E3CBDFBFF35FAA045BA1C6CEC4198A55E094BF0182E0794EFEC4C662
- [UNRUN] 实体安卓输入法：覆盖安装后弹出/收起输入法确认底栏，并各完成一次数学、英语专注检查统计。浏览器模拟不等同真机验证。

## 1.8.0（2026-09-09）
- 计时页简化为科目输入、正向计时、结束保存及日/周/月/年科目时长统计。移除页面中的番茄钟、倒计时、任务管理、沉浸及复杂统计入口；旧记录和旧存档字段保留。
- 学习会话保存开始时间，切页/重开继续计算。结束时按当地午夜分段，记录秒级时长；重复结束不重复写入。正在进行的时间在结束后计入统计。
- 首页四季相册：春5、夏5、秋4、冬6张，来自用户季节文件夹；触摸左右滑动或箭头切换。复用双图片节点预解码过渡，未添加全页切换动画。
- 验证：tsc、check-study、check-extras、check-focus-dashboard；STUDY=1真实浏览器检查科目开始/刷新恢复/结束、日周月年分组统计、相册箭头与触屏滑动、320/412宽度；已查看手机尺寸截图。四季连续切换回归通过。
- APK versionCode21，原包名及证书保留，v2/v3签名、zipalign与INTERNET通过。构建因C盘空间耗尽迁至F:/luke-build-temp，未清理用户文件。
- SHA256: 821053A279ECCC543CD539BDFBA145C95AC29D6A0AF972FA01B96E6882E8AFB8
- [UNRUN] 实体安卓手机：覆盖安装后计时并重开一次，结束查看科目统计；各季节左右滑图确认显示。

## 1.8.1（2026-09-09）
- 首页移除箭头及数字控件，使用已有 Embla 依赖实现随手指拖动、释放后平滑停靠的循环滑图。图片轨道移动，文字与按钮保持固定；纵向页面滚动保留，键盘左右键也可换图。
- 修正旧季节照片绝对定位对滑轨布局的覆盖。未改动计时、存储或API设置。
- 验证：tsc；check-gallery-swipe.mjs 通过 CDP 真实触摸事件检查拖动中位移、松手后一整张停靠、箭头不存在、纵向滚动；已查看截图。APK versionCode22、v2/v3、zipalign、原证书及INTERNET检查通过。
- SHA256: 1969F3560927E091C94B4A172722B8331490511F30F33EA29A1A97129C2223F7
- [UNRUN] 安卓真机手势手感，覆盖安装后左右滑首页照片确认。

## 1.8.2（2026-09-09）
- 计时页的科目和统计日期改为应用内主题控件：科目菜单、月份小日历，不再唤起突兀的原生 datalist/date 面板。
- 验证：tsc；check-ui-tuning.mjs 检查手机尺寸下没有原生日期/数据列表控件，主题菜单和内嵌日历正常。
- APK versionCode23，v2/v3签名、zipalign、原证书及INTERNET核验通过。
- SHA256: 9BE43EBE88E6F49AA977DB7DBB6085B090915BAB507C2769481C0F335DBEF280
- [UNRUN] 安卓真机弹出菜单的触摸手感。

## 1.8.3（2026-09-09）
- 按用户要求将计时统计日期恢复为原生 date 输入，移除自定义小日历入口及状态。
- 全局真实按钮/复选框/单选框点击通过安卓 performHapticFeedback(KEYBOARD_TAP) 轻触反馈，遵循系统设置；禁用按钮、程序点击及滑动不触发。70ms 去重。
- 验证：tsc、check-date-haptic（日期改变统计周期、可信点击只调用一次触感桥、程序点击不触发）；APK versionCode24、v2/v3、zipalign、原签名与联网权限通过。
- SHA256: FF15657CFBE85E0F4057A66B06A2114A4BA249A97687D5348C316D9FC6712950
- [UNRUN] 安卓真机日期弹窗及振动马达；覆盖安装后点击日期、按钮检查。系统关闭触感反馈时遵循系统设置。

## 1.8.4（2026-09-09）
- 首页七天回顾及学习统计统一显示已满的整数分钟，不展示小数或秒数；先累计原始精度再格式化，原记录不改写。
- tsc、check-study（长小数、整数分钟、累计后取整及原始日志精度）通过；APK versionCode25，v2/v3签名、zipalign、联网权限通过。
- SHA256: 99048407436D02BF1252DC0B7B5A60D4B043CB491B5781AD7A2D41474C3D1A1A
- [UNRUN] 实体安卓页面验证；覆盖安装查看首页七天回顾。

## 1.8.5（2026-09-09）
- 个人模型配置从签名目录 personal-model.json 打入安卓独立资产，由原生桥读取；网页公开资源不含该文件。默认优先 gpt-5.6-luna，失败时使用 gpt-5.3-codex-spark。
- 首次安装使用内置配置；已有有效配置优先，修改后持久保存。设置 → 聊天模型 → 恢复内置配置 → 保存聊天模型，可切回打包默认值。
- tsc、模型故障切换检查、首次安装/修改重开/恢复配置浏览器检查通过（浏览器使用测试凭据）；两个真实模型连接测试均成功。
- 最终 APK 私有配置比对、原证书、v2/v3签名、zipalign、versionCode26及联网权限通过。
- SHA256: 560FE583711154D108A889A255B320E711C5FD139A90B68010E9D997AE1BE100
- [UNRUN] 实体安卓安装及聊天；覆盖安装后按需恢复内置配置并发送消息验证。

## 1.8.6（2026-09-09）
- 修正夜间通用圆形按钮样式覆盖顶栏透明按钮的问题；昼夜共用相同点击区域与位置，键盘焦点改为小幅内描边。
- 夜间统一深灰蓝底色和柔和边框，四季保留低饱和强调色，改善文字及输入控件对比。
- check-night-toolbar 验证四季昼夜顶栏几何一致、背景和边框透明；手机尺寸截图已检查。构建、v2/v3签名、zipalign、versionCode27及联网权限通过。
- SHA256: 02DDA179DB1F9629AFB755E515280B1B86701F8E4755C1DDB346D85164322B17
- [UNRUN] 实体安卓显示；覆盖安装后切换夜晚检查。

## 1.8.7（2026-09-09）
- 科目菜单支持点外部关闭、Escape关闭并返回焦点；限制高度并允许内部滚动。开始计时关闭菜单并退出输入焦点。
- 计划筛选无结果时补充状态提示；长文字换行、统计数字对齐及“今天”点击区域微调。
- tsc、check-detail-polish（菜单交互、360px无横向溢出）、check-study通过；APK签名、对齐、versionCode28及联网权限通过。
- SHA256: 5799BEA2281025AF7B94941197B9A93B62B1BF67354C92F75DE02DD416A77A6B
- [UNRUN] 实体手机手感与输入法收起效果；覆盖安装检查。

## 1.8.8（2026-09-09）
- 复用并验证本地聊天草稿保存；上翻时保留阅读位置，增加回到最新消息按钮。输入框与发送按钮统一46px，长草稿内部滚动。
- 安卓返回键先收键盘；网页返回处理关闭可见弹窗、科目菜单、搜索，再回首页。首页再次返回移到后台。
- 完整备份入口明确涵盖聊天、记忆、草稿、计划、手记、生日纪念日与学习记录；恢复确认展示数量，取消后允许重选同一文件，文件名含时间防止同日混淆。接口配置不变。
- 当前季节相册优先加载当前及两侧照片，其他图片沿用原生懒加载，异步解码，不创建额外图片缓存。
- tsc、check-chat-experience、check-extras、check-gallery-swipe通过；签名、对齐及联网权限通过，versionCode29。
- SHA256: 7DAFED6FACC0939943934BE6A7441B3F0E5A8596982C07CBD2A5262284E2C328
- [UNRUN] 实体安卓输入法/返回手势及系统文件选择器，覆盖安装检查。

## 1.8.9（2026-09-09）
- 手机首页顶栏及底栏移除硬边线，改用12px柔和渐隐，不使用实时模糊、不移动按钮。
- 默认称呼冬清，沿用设置里的“你的称呼”。首次升级将旧默认“我”替换为冬清；自定义名称保留，迁移标记防止再次覆盖用户选择。
- tsc、check-name-edges（新装默认、修改重开、旧默认迁移、夜间边界）及截图检查通过；签名、zipalign、versionCode30和联网权限通过。
- SHA256: F6944C10E1E53C51F156E8FFDCBE894854B09335CAE55418214B35ACADDA9403
- [UNRUN] 实体安卓显示效果；覆盖安装检查。

## 1.8.10（2026-09-09）
- 聊天输入框焦点取消棕黄描边，保留原主题边框、光标和46px高度。
- check-chat-experience 验证四季昼夜焦点边框不变、outline为none及原聊天交互通过；APK versionCode31、签名及对齐通过。
- SHA256: 93C8998D4D79A189EA9C31901CAD984316F1753542ABB25864E665CE8E3EBBAF
- [UNRUN] 实体安卓输入法状态；覆盖安装点输入框确认。

## 1.8.11（2026-09-09）
- 首页文案48条（8官方短句附链接、40原创）、24组小确幸、16时段问候、8页脚句子；按日期与打开次数轮换，手动换句也更新下一次起点。原创不标为官方台词。
- 40条天气提醒按雨雪雷雾、温度、降雨预测及晴夜区分；过期数据仍不输出当前天气建议。
- 计时/手记页调整间距、统计周期和阅读层次；共读书架含《活着》《海子诗全集》《许三观卖血记》，可切书、查看来源、追加读后感草稿，不含书籍全文。
- 官方短句来源在 lib/home-copy.ts 每项记录（米哈游官网、HoYoverse官网及未定事件簿官方TapTap）。书目来源在 components/reading-moment.tsx（泉州市图书馆、CiNii、澎湃余华访谈）。检索日期2026-09-09。
- tsc、check-home-copy、check-integrations、check-reading-ui及360px截图检查通过；签名、对齐及联网权限通过，versionCode32。
- SHA256: DB8984A6F98DA3DC05198431F014D48A769424A66DB30BEB88C17C816B78676E
- [UNRUN] 实体手机显示与阅读来源外链，覆盖安装检查。
