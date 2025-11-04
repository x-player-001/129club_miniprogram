# SSL证书问题排查指南

## 问题现象
- 浏览器可以正常访问 `https://www.greattrader.lol/api/user/info`
- 微信小程序无法访问，报错：`net::ERR_CONNECTION_CLOSED`
- 真机调试也无法访问
- 证书更新时间：Oct 22 23:54:18 2025（昨晚刚更新）
- 证书颁发者：Let's Encrypt R13

## 问题原因
**证书链不完整** - 服务器没有返回完整的SSL证书链，导致微信小程序握手失败。

浏览器能访问是因为浏览器会自动下载缺失的中间证书，但微信小程序不会。

## 解决方案

### 1. 检查当前Nginx配置

SSH登录服务器，查看Nginx配置：

```bash
# 查看nginx配置文件
cat /etc/nginx/sites-available/default
# 或者
cat /etc/nginx/nginx.conf
```

找到 `ssl_certificate` 配置行，查看使用的是哪个文件。

### 2. 检查Let's Encrypt证书文件

```bash
# 查看Let's Encrypt证书目录
ls -la /etc/letsencrypt/live/www.greattrader.lol/

# 应该看到以下文件：
# cert.pem        -> 只有域名证书（不完整）
# chain.pem       -> 中间证书
# fullchain.pem   -> 完整证书链（应该使用这个！）
# privkey.pem     -> 私钥
```

### 3. 修改Nginx配置使用完整证书链

编辑Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/default
```

确保配置如下：

```nginx
server {
    listen 443 ssl http2;
    server_name www.greattrader.lol;

    # ========== 重点：使用 fullchain.pem ==========
    ssl_certificate /etc/letsencrypt/live/www.greattrader.lol/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.greattrader.lol/privkey.pem;

    # 支持微信小程序要求的TLS版本
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    # 其他配置...
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. 测试配置并重启Nginx

```bash
# 测试配置文件语法
sudo nginx -t

# 如果测试通过，重启Nginx
sudo systemctl restart nginx

# 或者重新加载配置
sudo systemctl reload nginx
```

### 5. 验证证书链是否完整

使用在线工具验证：
- https://myssl.com/www.greattrader.lol
- https://www.ssllabs.com/ssltest/analyze.html?d=www.greattrader.lol

或者使用命令行：

```bash
# 检查证书链
openssl s_client -connect www.greattrader.lol:443 -servername www.greattrader.lol

# 应该看到多个证书，包括：
# - 服务器证书（CN=www.greattrader.lol）
# - 中间证书（CN=R13, O=Let's Encrypt）
# - 根证书（CN=ISRG Root X1）
```

## 快速检查命令

在服务器上运行以下命令，检查当前配置：

```bash
# 检查Nginx使用的证书文件
grep -r "ssl_certificate" /etc/nginx/

# 查看证书内容
openssl x509 -in /etc/letsencrypt/live/www.greattrader.lol/cert.pem -text -noout | grep "Subject:"
openssl x509 -in /etc/letsencrypt/live/www.greattrader.lol/fullchain.pem -text -noout | grep "Subject:"

# 对比文件大小（fullchain.pem应该更大）
ls -lh /etc/letsencrypt/live/www.greattrader.lol/
```

## 预期结果

修改后：
- ✅ cert.pem: ~2KB（只有一个证书）
- ✅ fullchain.pem: ~4-5KB（包含完整证书链）

Nginx应该使用 `fullchain.pem`

## 微信小程序SSL要求

1. **必须使用HTTPS协议**
2. **必须使用TLS 1.2或更高版本**
3. **必须提供完整的证书链**（包括中间证书）
4. **域名必须在微信公众平台配置**

## 常见错误

❌ **错误配置**：
```nginx
ssl_certificate /path/to/cert.pem;  # 只有域名证书，不完整
```

✅ **正确配置**：
```nginx
ssl_certificate /path/to/fullchain.pem;  # 包含完整证书链
```

## 参考链接

- Let's Encrypt证书文件说明：https://letsencrypt.org/docs/
- 微信小程序网络要求：https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html
- SSL Labs测试工具：https://www.ssllabs.com/ssltest/

---

**修改完成后，预计5分钟内小程序即可恢复访问。**
