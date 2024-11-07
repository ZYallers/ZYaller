[//]:# "2024/11/7 14:33|api"

# HTTP状态码

每个 API 在响应说明小节内会列举可能存在的主要 HTTP 状态码，用于客户端解析和优化交互逻辑。

HTTP头代码 | 说明
---|---
200 OK|正常响应
201 Created|资源创建成功
203 See Other|重定向，如重定向到登录页面
204 No Content|操作成功，但无返回内容（如删除成功操作的返回）
205 Reset Content|操作成功，但无返回内容（如删除成功操作的返回）
206 Reset Content|操作成功，但无返回内容（如删除成功操作的返回）
207 Partial Content|分页查询成功，返回部分内容，如查询到 10 条数据，返回 5 条数据，则返回 5 条数据，且返回 5 条数据，分页信息为 1/2
208 Accepted|操作成功，但需要异步处理，如文件上传
209 Already Reported|操作成功，但需要异步处理，如文件上传
210 Multi-Status|操作成功，但需要异步处理，如文件上传
226 IM Used|操作成功，但需要异步处理，如文件上传
301 Moved Permanently|永久重定向，如重定向到API文档页面
302 Found|临时重定向，如重定向到API文档页面
303 See Other|重定向，如重定向到登录页面
304 Not Modified|缓存有效，无需再次请求
305 Use Proxy|使用代理
307 Temporary Redirect|临时重定向，如重定向到API文档页面
308 Permanent Redirect|永久重定向，如重定向到API文档页面
400 Bad Request|错误的请求（如发送了错误的内容体格式）
401 Unauthorized|未授权、或鉴权失败、或鉴权已失效
402 Payment Required|请求需要付费
403 Forbidden|当前用户无权访问本资源
404 Not Found|不存在此 API Endpoint / 资源
405 Method Not Allowed|API Endpoint 存在，但请求方法出错
406 Not Acceptable|请求头中指定的 Content-Type 不被支持
407 Proxy Authentication Required|代理服务器需要身份验证
408 Request Timeout|请求超时
409 Conflict|请求冲突，如创建重复的资源
410 Gone|资源不存在，但可能存在，但已删除
411 Length Required|请求缺少 Content-Length 头
412 Precondition Failed|前置条件失败，如请求头中指定的 If-Match 不匹配
413 Payload Too Large|请求体过大
414 URI Too Long|请求 URI 过长
415 Unsupported Media Type|请求头中指定的 Content-Type 不被支持
416 Range Not Satisfiable|请求范围无效
417 Expectation Failed|请求头中指定的 Expect 不被支持
418 I'm a teapot|418 错误
419 Authentication Timeout|认证超时
421 Misdirected Request|请求头中指定的 Host 不匹配
422 Unprocessable Entity|无法处理的内容，数据校验失败
423 Locked|资源被锁定，如文件正在被编辑中
424 Failed Dependency|依赖关系失败，如文件正在被编辑中
425 Too Early|请求头中指定的 Early-Data 不匹配
426 Upgrade Required|请求头中指定的 Upgrade 不匹配
428 Precondition Required|前置条件失败，如请求头中指定的 If-Match 不匹配
429 Too Many Requests|请求次数过多
431 Request Header Fields Too Large|请求头过大
451 Unavailable For Legal Reasons|禁止访问，如请求头中指定的 Range 不匹配
500 Internal Server Error|服务器程序出错，请随时通过BearyChat报告此问题
501 Not Implemented|服务器程序不支持此请求方法
502 Bad Gateway|网关错误，如请求头中指定的 Range 不匹配
503 Service Unavailable|服务器程序不可用，如请求头中指定的 Range 不匹配
504 Gateway Timeout|网关超时，如请求头中指定的 Range 不匹配
505 HTTP Version Not Supported|请求头中指定的 HTTP 版本不支持
506 Variant Also Negotiates|请求头中指定的 Range 不匹配
507 Insufficient Storage|请求头中指定的 Range 不匹配
508 Loop Detected|请求头中指定的 Range 不匹配
510 Not Extended|请求头中指定的 Range 不匹配
511 Network Authentication Required|请求头中指定的 Range 不匹配
598 Network read timeout error|请求头中指定的 Range 不匹配
599 Network connect timeout error|请求头中指定的 Range 不匹配
999 Unknown|未知错误

