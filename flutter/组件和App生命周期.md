
# StatefulWidget生命周期
1. ## createState
   创建state，只执行一次
2. ## initState
    widget第一次插入树时调用，只执行一次
    
    初始化操作、订阅子组件通知等。
3. ## didChangeDependencies
    State对象的依赖发生变化时（例如系统语言Locale或应用主题改变时）

4. ## build
    第一次创建和UI需要更新时调用，只创建widget，其他操作会影响渲染效率。

    调用initState、didUpdateWidget、setState、didChangeDependencies之后

    在State对象从树中一个位置移除后（会调用deactivate）又重新插入到树的其它位置之后。
5. ## reassemble
    热更新
6. ## didUpdateWidget
    组件需要更新时调用(使用key对widget进行复用)，如父组件setState引起的子组件更新。
    > 在widget重新构建时，Flutter framework会调用Widget.canUpdate来检测Widget树中同一位置的新旧节点，然后决定是否需要更新，如果Widget.canUpdate返回true则会调用此回调。正如之前所述，Widget.canUpdate会在新旧widget的key和runtimeType同时相等时会返回true，也就是说在在新旧widget的key和runtimeType同时相等时didUpdateWidget()就会被调用。
    >
    > 很少使用

7. ## deactivate
    State对象从树中移动位置或移除时触发（组件不可见时）
8. ## dispose
    组件移除时执行，取消监听、动画操作。
***

# APP的生命周期
1. ## resumed

    可见，可响应用户操作
2. ## inactiv

    应用程序处于非激活状态，无法响应用户输入。在iOS上，打电话、响应TouchID请求、进入应用程序切换器或控制中心都处于此状态。在Android上，分屏应用，打电话，弹出系统对话框或其他窗口等。
3. ## paused

    不可见，不可响应，在后台活动
4. ## detached

    应用程序仍寄存在Flutter引擎上，但与平台 View 分离。
    如引擎首次加载过程中，Navigator.pop销毁了view时。