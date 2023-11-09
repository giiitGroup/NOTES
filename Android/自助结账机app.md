# 自助结账机
## 准备
### 商米相关
- demo https://developer.sunmi.com/docs/preview/zh-CN/rqfeghjk535
- IoT能力接入 https://developer.sunmi.com/docs/zh-CN/xeghjk491/rareghjk568
- 开发者账号
- appId、appKey
### app基础配置
- 版本
  - jdk 1.8
  - gradle 7.3.3(7.2+)
  - Android Gradle Plugin 4.2.2
  - Android compile sdk 32
- jks或keystore的md5值
### 开发准备

- IDE工具
  - Android Studio
  - HbuilderX
- 自助结账机可通过数据线连接至电脑，进行真机调试
- 自助结账机需要在网络环境下通过商米鉴权，获取商米的license，放入后续的请求头中进行交互

## 开发
### 架构设计
Android作为载体，并负责与硬件交互，页面交给uniapp开发，打包为h5嵌入webview中，通过JSBridge与Android交互
> 硬件能力 <=商米IoT=> Android <=调用硬件=> uniapp <=数据流转=> 服务端

### 硬件能力
- 刷手牌 ✔
- 扫预订单 ✔
- 扫会员码 ✔
- 刷会员卡 ✔
- 支付扫码 ✔
- 打印 ✔

### 软件功能
- 账单 ✔
- 增删会员卡 ✔
- 增删预订单 ✔
- 支付 ✔

## 安卓端
> 基于官方demo项目结构，使用java进行开发

### 硬件
- #### USB Reader

  机器左下角 扫码、读卡器均可以通过监听此硬件的广播获取数据

  参考文档
  > https://sunmi-ota.oss-cn-hangzhou.aliyuncs.com/DOC/resource/re_cn/%E6%89%AB%E7%A0%81%E5%A4%B4/%E6%89%AB%E7%A0%81%E5%A4%B4%E5%BC%80%E5%8F%91%E5%8F%8A%E7%94%A8%E6%88%B7%E6%96%87%E6%A1%A3.pdf
- #### 打印机 

  小票打印

### 主要实现
#### webview交互
- 创建webview
``` java
        WebView webView = (WebView) findViewById(R.id.web_view);
        // 内容页面的访问地址
        String url = "http://172.16.9.79:8080/#/";
        WebSettings webSettings = webView.getSettings();

        // 可以访问https
        webSettings.setBlockNetworkImage(false);
        // 开启JavaScript
        webSettings.setJavaScriptEnabled(true);
        // 不加载缓存内容
        webSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        // 向js暴露调用的方法 
        webView.addJavascriptInterface(new WebAppInterface(this),"K2");

        webView.loadUrl(url);
        webView.setWebViewClient(new MyWebViewClient(){
            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed();// 接受所有网站的证书
                super.onReceivedSslError(view, handler, error);
            }
        });
```
- webview对外暴露的方法
``` java
    public class WebAppInterface {
        Context mContext;
        private int ret;

        WebAppInterface(Context c) {
            mContext = c;
        }
        // 打印小票方法
        @JavascriptInterface
        public void doPrint(String b64) {
            print(PrintUtil.getPicRequest(b64));
        }
        // 提示信息方法
        @JavascriptInterface
        public void doToast(String msg) {
            LogUtil.e(TAG, "webview send-----:" + msg);
            Toast.makeText(app, "webview打印：" + msg, Toast.LENGTH_SHORT).show();
        }
    }
```
#### 监听广播
onCreate中建立监听
``` java
    private IntentFilter filter;
    private SMSReceiver sms;
    // 在官方文档中获取的广播id
    private static final String ACTION_DATA_CODE_RECEIVED = "com.sunmi.scanner.ACTION_DATA_CODE_RECEIVED";
```
``` java
    filter = new IntentFilter(ACTION_DATA_CODE_RECEIVED);
    sms = new SMSReceiver();
    registerReceiver(sms, filter);
```
监听类
``` java
    class SMSReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            String code = intent.getStringExtra(DATA);
            String arr = Arrays.toString(intent.getByteArrayExtra(SOURCE));

            Log.d("TTTT", "读手牌：" + code + "---" + arr);
            WebView webView = (WebView) findViewById(R.id.web_view);
            // 通知webview
            runOnUiThread(() -> {
                webView.loadUrl("javascript:recK2Msg('" + code + "')");
            });
        }
    }
```
#### 打印小票
在application中获取硬件服务
``` java
    private void getService() {
        int initResult = ThingSDK.getInstance().init(getApplicationContext(), license, new ThingSDK.StatusListener() {
            @Override
            public void connected() {
                try {
                    printerList = ThingSDK.getInstance().getService("printer");
                    LogUtil.e(TAG+"  print: ", printerList + " ------------- " + printerList.size());
                } catch (RemoteException e) {
                    e.printStackTrace();
                }

            }

            @Override
            public void disconnected() {
                LogUtil.e(TAG, "disconnected");
            }
        });
        LogUtil.i(TAG, "ThingSDK init result: " + initResult);
    }
```
打印方法
> 考虑到排版美观和可控，采用图片打印，即前端页面=>图片=>base64
```java
    private synchronized void print(CommandRequest request) {
        if (Application.printerList == null || Application.printerList.size() == 0) {
            Toast.makeText(this, "获取打印机失败", Toast.LENGTH_SHORT).show();
            return;
        } else {
            LogUtil.e(TAG, "sass send------:" + PrintUtil.gson.toJson(Application.printerList.get(0)));
        }
        String callUuid = null;
        ThingService service = Application.printerList.get(0);

        final long time = SystemClock.elapsedRealtime();
        LogUtil.e(TAG, "sass send:" + SystemClock.elapsedRealtime());
        try {
            callUuid = ThingSDK.getInstance().execute(service, ThingSDK.ACTION_TYPE_COMMAND, ThingSDK.ACTION_EXECUTE, PrintUtil.gson.toJson(request), new IResponseCallback.Stub() {
                @Override
                public void response(String uuid, Map data) throws RemoteException {
                    LogUtil.e(TAG, "sass receive:" + SystemClock.elapsedRealtime());
                    LogUtil.e(TAG, uuid + ";" + time);
                    long t1 = SystemClock.elapsedRealtime();
                    LogUtil.e(TAG, time + ";" + t1 + "  ; " + (t1 - time));
                    if (data != null) {
                        StringBuilder builder = new StringBuilder("print-->");
                        for (Object s : data.keySet()) {
                            builder.append(s + "  :  " + data.get(s) + "；");
                        }
                        LogUtil.e(TAG, "res:" + builder.toString() + "    ;" + t1);
                    }
                }
            });
        } catch (RemoteException e) {
            e.printStackTrace();
        }
        LogUtil.e(TAG, " print call :" + callUuid + ";" + PrintUtil.gson.toJson(request));
    }
```
## h5端
### 与硬件交互设计
通过window对象获取安卓webview中对外暴露的对象K2，K2会主动通知扫码与读卡事件，因为是同一广播，只能凭借经验对code进行判断区分，前端通过eventBus的机制进行全局监听和响应。
#### 初始化
app.vue
```javascript
	const cxt  = getCurrentInstance()
	const bus = cxt.appContext.config.globalProperties.$bus
	const K2 = window.K2;
	if(!K2){
    showFailToast("硬件初始化失败")
	}
	window.recK2Msg = function(code){
		console.log('收到K2消息：', code)
		// 是否只有数字
		const reg = /^[0-9]*$/
		if (reg.test(code)) {
			if(code.length > 10){
				if(code.length === 12){
					// 预订单券码
					bus.emit('recResrOrderCode', code)
				}else{
					// 支付码
					K2.doToast("支付码")
					bus.emit('recPayCode', code)
				}
			}else{
				// 手牌号或会员卡号
				bus.emit('recCardUid', code)
			}
		}else{
			K2.doToast("无法识别，请重试")
		}
	}
```
