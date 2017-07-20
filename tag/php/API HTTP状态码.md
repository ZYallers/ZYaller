# API HTTP状态码

本小节描述 API 用到的状态码。每个 API 在响应说明小节内会列举可能存在的主要 HTTP 状态码，用于客户端解析和优化交互逻辑。

HTTP头代码 | 说明
---|---
200 OK|正常响应
201 Created|资源创建成功
204 No Content|操作成功，但无返回内容（如删除成功操作的返回）
400 Bad Request|错误的请求（如发送了错误的内容体格式）
401 Unauthorized|未授权、或鉴权失败、或鉴权已失效
403 Forbidden|当前用户无权访问本资源
404 Not Found|不存在此 API Endpoint / 资源
405 Method Not Allowed|API Endpoint 存在，但请求方法出错
422 Unprocessable Entity|无法处理的内容，数据校验失败
500 Internal Server Error|服务器程序出错，请随时通过BearyChat报告此问题

