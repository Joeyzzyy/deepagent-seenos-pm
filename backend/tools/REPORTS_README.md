# Report Generation Tools

## 概述

本模块提供了将 Markdown 内容转换为多种格式报告的工具：

- **`markdown_to_html_report`**: 生成带 Chart.js 图表的交互式 HTML 报告
- **`markdown_to_docx`**: 生成 Microsoft Word 文档 (.docx)

## 安装依赖

```bash
# 安装报告生成所需的依赖
pip install markdown python-docx

# 或使用 requirements 文件
pip install -r requirements-reports.txt
```

## 工具说明

### 1. markdown_to_html_report

将 Markdown 转换为交互式 HTML 报告，自动检测表格并生成图表。

**功能特性：**
- 自动将表格转换为 Chart.js 图表
  - 时间序列表格 → 折线图
  - 对比表格 → 柱状图
  - 百分比表格 → 饼图
- 响应式设计，支持移动端和桌面端
- 专业的样式和排版
- 自动生成目录

**使用示例：**

```python
from tools.reports import get_report_tools

# 获取工具
tools = get_report_tools()
markdown_to_html_report = tools[0]  # 第一个工具

# 生成报告
result = markdown_to_html_report(
    markdown_content="""
# My Report

## Data Table

| Month | Traffic | Growth |
|-------|---------|--------|
| Jan   | 10000   | +5%    |
| Feb   | 12000   | +20%   |
| Mar   | 15000   | +25%   |
""",
    title="Monthly Traffic Report",
    user_id="user_123",
    conversation_id="conv_456"
)

if result['success']:
    print(f"Report saved to: {result['file_path']}")
    print(f"Charts generated: {result['charts_generated']}")
```

**返回值：**

```python
{
    "success": True,
    "title": "Monthly Traffic Report",
    "file_path": "reports/report_20250109_143022.html",
    "file_url": "file:///path/to/reports/report_20250109_143022.html",
    "html_content": "<!DOCTYPE html>...",  # 前 5000 字符预览
    "charts_generated": 3,
    "file_size": 15234,
    "message": "HTML report generated: report_20250109_143022.html"
}
```

---

### 2. markdown_to_docx

将 Markdown 转换为 Microsoft Word 文档。

**功能特性：**
- 支持标题层级 (H1-H4)
- 表格转换
- 代码块格式化
- 引用块样式
- 列表支持（有序和无序）
- 专业的文档样式

**使用示例：**

```python
from tools.reports import get_report_tools

# 获取工具
tools = get_report_tools()
markdown_to_docx = tools[1]  # 第二个工具

# 生成 Word 文档
result = markdown_to_docx(
    markdown_content="""
# Competitor Analysis Report

## Executive Summary

This report analyzes 5 competitors...

## Key Findings

| Competitor | Traffic | Strategy |
|------------|---------|----------|
| A.com      | 450K    | SEO      |
| B.com      | 380K    | PPC      |

## Recommendations

1. Focus on SEO
2. Build backlinks
3. Create content
""",
    filename="competitor-analysis.docx",
    user_id="user_123",
    conversation_id="conv_456"
)

if result['success']:
    print(f"Document saved to: {result['file_path']}")
```

**返回值：**

```python
{
    "success": True,
    "filename": "competitor-analysis.docx",
    "file_path": "reports/competitor-analysis.docx",
    "file_url": "file:///path/to/reports/competitor-analysis.docx",
    "file_size": 23456,
    "message": "Word document generated: competitor-analysis.docx"
}
```

---

## 在 Agent 中使用

这些工具已自动注册到 `get_all_tools()`，可以直接在 Agent 中使用：

```python
from tools import get_all_tools

# 获取所有工具（包括报告工具）
all_tools = get_all_tools()

# 工具会自动提供给 LangGraph Agent
```

---

## 图表自动生成规则

HTML 报告会根据表格内容自动生成合适的图表类型：

### 1. 折线图 (Line Chart)
**触发条件：** 第一列包含月份或日期

```markdown
| Month   | Traffic | Keywords |
|---------|---------|----------|
| Jan     | 10000   | 500      |
| Feb     | 12000   | 550      |
| Mar     | 15000   | 600      |
```

### 2. 饼图 (Pie Chart)
**触发条件：** 第二列包含百分比

```markdown
| Category    | Share |
|-------------|-------|
| Organic     | 65%   |
| Paid        | 25%   |
| Social      | 10%   |
```

### 3. 柱状图 (Bar Chart)
**触发条件：** 默认类型，用于对比数据

```markdown
| Competitor  | Traffic | Keywords |
|-------------|---------|----------|
| A.com       | 450000  | 12500    |
| B.com       | 380000  | 9800     |
| C.com       | 220000  | 7200     |
```

---

## 文件输出

所有生成的报告都保存在 `reports/` 目录下：

```
reports/
├── report_20250109_143022.html      # HTML 报告
├── competitor-analysis.docx          # Word 文档
└── test_report.html                  # 测试报告
```

---

## 测试

### 运行测试脚本

```bash
# 从项目根目录运行
cd /path/to/deepagent-mini-seenos
python3 test_report_generation.py
```

### 预期输出

```
============================================================
Report Generation Test
============================================================
Testing HTML report generation...
✅ HTML report generated successfully
   File: reports/test_report.html
   Size: 15234 bytes
   URL: file:///path/to/reports/test_report.html

Testing DOCX report generation...
✅ DOCX report generated successfully
   File: reports/test_report.docx
   Size: 23456 bytes
   URL: file:///path/to/reports/test_report.docx

============================================================
Test Summary
============================================================
HTML Report: ✅ PASS
DOCX Report: ✅ PASS

🎉 All tests passed!
```

---

## 配置

可以通过 `config.json` 禁用特定工具：

```json
{
  "enabled_tools": {
    "markdown_to_html_report": true,
    "markdown_to_docx": true
  }
}
```

---

## 故障排除

### 问题 1: ImportError: No module named 'markdown'

**解决方案：**
```bash
pip install markdown
```

### 问题 2: ImportError: No module named 'docx'

**解决方案：**
```bash
pip install python-docx
```

### 问题 3: 图表未生成

**原因：** 表格格式不符合自动检测规则

**解决方案：**
- 确保表格至少有 2 列和 3 行（标题 + 分隔符 + 数据）
- 第一列用于标签（月份、类别、名称等）
- 数据列应包含数字

### 问题 4: DOCX 表格格式错误

**原因：** Markdown 表格格式不规范

**解决方案：**
- 确保每行的 `|` 数量一致
- 使用标准的 Markdown 表格分隔符 `|---|---|`

---

## 技术细节

### HTML 报告结构

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="Chart.js CDN"></script>
    <style>/* 专业样式 */</style>
  </head>
  <body>
    <div class="container">
      <!-- Markdown 转换的 HTML 内容 -->
      <div class="chart-container">
        <canvas id="chart_0"></canvas>
        <canvas id="chart_1"></canvas>
      </div>
    </div>
    <script>/* Chart.js 配置 */</script>
  </body>
</html>
```

### DOCX 文档结构

- 使用 `python-docx` 库
- 应用内置样式（Light Grid Accent 1）
- 支持自定义段落样式
- 保留 Markdown 格式化（粗体、斜体等）

---

## 最佳实践

### 1. Markdown 编写建议

```markdown
# 使用清晰的标题层级
## 二级标题
### 三级标题

# 表格格式规范
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |

# 使用引用块突出重点
> **重要提示：** 这是关键信息

# 代码块使用语言标识
\`\`\`python
def example():
    return "Hello"
\`\`\`
```

### 2. 性能优化

- 限制表格大小（建议 <50 行）
- 大型报告考虑分页
- 图表数量建议 <10 个

### 3. 可访问性

- 使用语义化的标题
- 表格包含清晰的列标题
- 图表提供文本说明

---

## 更新日志

### v1.0.0 (2025-01-09)
- ✅ 初始版本
- ✅ HTML 报告生成
- ✅ DOCX 报告生成
- ✅ 自动图表生成
- ✅ 响应式设计

---

## 许可证

MIT License

---

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。

