# Feishu Sidebar Snap Plugin Login

飞书侧边栏插件，用于在飞书多维表格中浏览、搜索 Snapchat 媒体素材并写入表格。

## 环境要求

- Node 16+

## 启动

```bash
npm install -g yarn
yarn
yarn run start
```

控制台输出 URL 后，在飞书多维表格中配置该 URL 为插件地址即可。

---

## 项目结构

```
src/
├── LoadApp.tsx              # 主页面，负责 UI 组装和数据流转
├── components/
│   ├── HeaderBar.tsx        # 顶部栏：账户选择、关键字搜索、上传、设置
│   ├── MediaGrid.tsx        # Snap 媒体素材网格（可多选）
│   ├── AllMediaGrid.tsx     # 亿帆素材网格
│   ├── PreviewModal.tsx     # 图片/视频预览弹窗
│   ├── SettingsDrawer.tsx   # 写入配置抽屉（目标字段、写入模式）
│   └── UploadMedia.tsx      # 上传素材
└── hooks/
    ├── useLoginCheck.ts     # 登录态检测（通过隐藏 iframe 读取 bf.show cookie）
    ├── useLocalConfig.ts    # localStorage 持久化写入配置
    ├── useTableData.ts      # bitable 初始化，读取字段列表和记录列表
    ├── useSnapMedia.ts      # Snapchat 媒体库 API + 分页
    ├── useAllMedia.ts       # 亿帆素材库 API + 分页
    ├── useCustomerMedia.ts  # 客户素材列表接口
    └── useTableWrite.ts     # 写入飞书表格（新增 / 覆盖 / 填充空白三种模式）
```

## 核心功能

### 媒体素材（snap tab）
- 按广告账户筛选，支持关键字搜索（300ms 防抖）
- 多选素材后点击"写入选中数据到表格"

### 亿帆素材（all tab）
- 按登录用户的 ssid 拉取素材列表

### 写入模式（设置抽屉）

| 模式 | 说明 |
|------|------|
| 新增 | 以选中账户所在行为模板，每条素材创建一条新记录 |
| 覆盖 | 将第一条选中素材写入当前选中单元格 |
| 填充空白 | 将选中素材依次填入指定列中所有空白单元格 |

### 登录流程
通过隐藏 iframe 从 `https://bf.show` 读取 `inmad_user_info` cookie，验证登录态。未登录时弹出提示引导用户前往登录后刷新。
