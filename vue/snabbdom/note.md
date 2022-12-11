# snabbdom

著名的虚拟 dom 库，diff 算法的鼻祖，vue 借鉴了
虚拟 dom：js 对象描述 dom 的层次结构，dom 的属性都在虚拟 dom 中有对应的属性
diff 是新旧虚拟 dom 的比较
dom 变为虚拟 dom

## h 函数

arguments
标签名 属性对象 内容

一个虚拟节点

```javascript
{
  children: data: {
  }
  elm: key: sel: "div";
  text: "111";
}
```

## diff 原理

- key 最小量
- key 相同才精细化
- 同层比较 不跨层

## h 函数

3 个参数 sel， data, children，可以嵌套
根据参数的数量和值类型，赋值，并返回一个 vnode 对象

## hooks

- pre patch 阶段开始。
- init 已添加一个 VNode。
- create 基于 VNode 创建了一个 DOM 元素。
- insert 一个元素已添加到 DOM 元素中。
- prepatch 一个元素即将进入 patch 阶段。
- update 一个元素开始更新。
- postpatch 一个元素完成 patch 阶段。
- destroy 一个元素直接或间接被删除。
- remove 一个元素直接从 DOM 元素中删除。
- post patch 阶段结束。

## htmldomapi

dom 的判断，操作和初始化

## init

### patch 函数

实现 diff 对比，实现更新 接收 oldVnode vnode
判断 oldVnode 类型 dom，有单个 dom 和批量 dom，均初始化赋空 vnode，此时 key 为 undefined，后面判断 isSame 必不通过
判断 issame 的条件：sel，key，是否都有 data，文本类时的内容是否一样

oldVnode 和 vnode 是同一个节点时，精细处理。
不是同一个时，创建新节点删除旧节点，也就是将 vnode 转为了 dom

patchVnode 精细处理

- prepatch 钩子
- 是否同一节点
- 新节点是否是文本类
- 新旧节点的子节点对比
- postpatch 钩子

updateChildren 更新子节点

- 已存在且 same 的节点，newstart 和 oldstart，newend 和 oldend，newstart 和 oldend，newend 和 oldstart，四种新旧头尾的对比，前两种为原位置比较，后两种是对顺序变化的比较，通过后向中间移动索引
- 根据 oldKeyToIdx 查询新节点的 key 是否存在，存在是更新，不存在是创建新节点
- 更新时，判断 sel，如果不同依然需要新创建
- 更新暂存一个旧节点，更新后放在旧节点的左侧，然后 newstart 右移
- 遍历完成后，如果是 old 标记先结束，表示有新增，添加 new 剩余部分，如果 new 标记先结束，删除 old 剩余部分

removeVnodes 删除节点

> 根据类型进行不同的删除，并且触发了对应模块和节点的 destory 和 remove 钩子

createElm

> - 注释类
> - 节点类
> - 批量
> - 纯文本

## 附属知识

### module

支持 snabbdom 操作 vnode 的支持模块， ./modules
也有自己的 hooks，代码中通过 cbs 保存

- attributesModule 为 DOM 元素设置属性，在属性添加和更新时使用 setAttribute 方法。

```javascript
h("a", { attrs: { href: "/foo" } }, "Go to Foo");
```

- classModule 用来动态设置和切换 DOM 元素上的 class 名称。

```javascript
h("a", { class: { active: true, selected: false } }, "Toggle");
```

- datasetModule 为 DOM 元素设置自定义数据属性（data- \*）。然后可以使用 HTMLElement.dataset 属性访问它们。

```javascript
h("button", { dataset: { action: "reset" } }, "Reset");
```

- eventListenersModule 为 DOM 元素绑定事件监听器。

```javascript
h("div", { on: { click: clickHandler } });
```

- propsModule 为 DOM 元素设置属性，如果同时使用 attributesModule，则会被 attributesModule 覆盖。

```javascript
h("a", { props: { href: "/foo" } }, "Go to Foo");
```

- styleModule 为 DOM 元素设置 CSS 属性。

```javascript
h("span", { style: { color: "#c0ffee" } }, "Say my name");
```

### insertedVnodeQueue

insertedVnodeQueue 队列 收集每个节点的 insert 钩子，且优先 append 子节点的 insert，保证执行顺序
