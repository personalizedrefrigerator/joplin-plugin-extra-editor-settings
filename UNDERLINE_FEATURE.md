# Underline Markup Feature (++text++)

## 功能说明 / Feature Description

本次更新为 Joplin 插件添加了 Markdown 下划线语法支持，允许使用 `++text++` 语法来渲染带下划线的文本。

This update adds Markdown underline syntax support to the Joplin plugin, allowing you to use `++text++` syntax to render underlined text.

## 使用方法 / Usage

1. 在 Joplin 设置中找到 "Extra editor settings" / "扩展编辑器设置"
2. 在 "More" 选项组中找到 "Render underline syntax (++text++)" / "渲染下划线语法 (++text++)"
3. 启用该选项
4. 在编辑器中输入 `++这是下划线文本++`，文本将显示为带下划线样式

## 技术实现 / Technical Implementation

### 修改的文件 / Modified Files

1. **src/types.ts**
   - 在 `PluginSettings` 接口中添加了 `underlineMarkup: boolean` 字段

2. **src/localization.ts**
   - 添加了英文和克罗地亚语的本地化字符串：
     - `setting__underlineMarkup`: "Render underline syntax (++text++)"
     - `setting__underlineMarkup__description`: "Renders ++text++ as underlined text. This setting is independent of 'Hide Markdown' and works in all modes."

3. **src/settings.ts**
   - 在 `settingsSpec` 中注册了新的设置项 `underlineMarkup`
   - 默认值为 `false`
   - 位于 "More" 选项组（与 `showLinkTooltip` 相邻）

4. **src/contentScript/replace/replaceUnderline.ts** (新文件)
   - 实现了下划线语法的渲染逻辑
   - 使用 CodeMirror 6 的 ViewPlugin 和 Decoration API
   - 功能特点：
     - 当光标不在该行时：隐藏 `++` 标记符号，显示下划线效果
     - 当光标在该行时：显示 `++` 标记符号，保持下划线效果
     - 智能检测避免在行内代码 `` `code` `` 中渲染
     - 支持多行可见范围内的实时更新
     - 光标移动时实时切换标记显示/隐藏状态

5. **src/contentScript/replace/replacementExtension.ts**
   - 导入并集成 `replaceUnderline` 到替换扩展数组中
   - 下划线渲染在所有 "Hide Markdown" 模式下都可用

6. **src/contentScript/contentScript.ts**
   - 在 `updateSettings` 函数中添加条件渲染逻辑
   - 根据 `settings.underlineMarkup` 的值动态启用/禁用功能

## 设计决策 / Design Decisions

1. **独立于 "Hide Markdown" 设置**：下划线功能可以在任何模式下独立工作，不依赖于其他 Markdown 隐藏设置

2. **避免在代码块中渲染**：实现了简单的启发式检测，避免在行内代码中渲染下划线，防止破坏代码显示

3. **实时更新**：使用 CodeMirror 的 ViewPlugin，文档变化或视口滚动时自动更新装饰

4. **放置在 "More" 组**：按照用户要求，将设置项放在 "More" 选项组中，与其他高级 Markdown 渲染选项一起

## 测试建议 / Testing Suggestions

在 Joplin 中测试以下场景：

1. **基本功能**：`++这是下划线文本++` 应该显示为带下划线的文本
2. **光标行为**：
   - 光标不在该行时，`++` 标记应该被隐藏
   - 光标移动到该行时，`++` 标记应该显示出来
   - 光标离开该行时，`++` 标记应该再次隐藏
3. **行内代码保护**：`` `++代码中不应渲染++` `` 应该保持原样
4. **多个实例**：同一行中的多个 `++text++` 都应该正确渲染
5. **动态开关**：在设置中启用/禁用该选项应该立即生效
6. **与其他格式混用**：`**++粗体下划线++**` 应该同时显示粗体和下划线

## 构建结果 / Build Result

✅ 构建成功
- 插件包位置：`publish/io.github.personalizedrefrigerator.codemirror6-settings.jpl`
- 版本：1.11.0

## 注意事项 / Notes

- 该功能默认关闭，需要用户在设置中手动启用
- 下划线渲染使用 CSS `text-decoration: underline` 属性
- 该语法不是标准 Markdown 规范的一部分，但在某些 Markdown 扩展中被支持（如某些论坛和 Wiki 系统）
