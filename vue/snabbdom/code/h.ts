import { vnode, VNode, VNodeData } from "./vnode";
import * as is from "./is";

export type VNodes = VNode[];
export type VNodeChildElement =
  | VNode
  | string
  | number
  | String
  | Number
  | undefined
  | null;
export type ArrayOrElement<T> = T | T[];
export type VNodeChildren = ArrayOrElement<VNodeChildElement>;

export function addNS(
  data: any,
  children: Array<VNode | string> | undefined,
  sel: string | undefined
): void {
  data.ns = "http://www.w3.org/2000/svg";
  if (sel !== "foreignObject" && children !== undefined) {
    for (let i = 0; i < children.length; ++i) {
      const child = children[i];
      if (typeof child === "string") continue;
      const childData = child.data;
      if (childData !== undefined) {
        addNS(childData, child.children as VNodes, child.sel);
      }
    }
  }
}
// 列举多种传参方式
// 重载
// @sel: 选择器
// @data: props
// @children: 内容或子节点
export function h(sel: string): VNode;
export function h(sel: string, data: VNodeData | null): VNode;
export function h(sel: string, children: VNodeChildren): VNode;
export function h(
  sel: string,
  data: VNodeData | null,
  children: VNodeChildren
): VNode;
// h函数
export function h(sel: any, b?: any, c?: any): VNode {
  let data: VNodeData = {};
  let children: any;
  let text: any;
  let i: number;
  // 如果有三个参数且children有值
  if (c !== undefined) {
    // 如果有props
    if (b !== null) {
      data = b;
    }
    if (is.array(c)) {
      // children是多个
      children = c;
    } else if (is.primitive(c)) {
      // 是内容 字符或数字
      text = c.toString();
    } else if (c && c.sel) {
      // 是单个vnode，即嵌套的h函数返回的vnode
      // 是单个children
      children = [c];
    }
  } else if (b !== undefined && b !== null) {
    // 只有两个参数，b不为空
    if (is.array(b)) {
      // b是数组，是children
      children = b;
    } else if (is.primitive(b)) {
      // b是文本，是text
      text = b.toString();
    } else if (b && b.sel) {
      // b是h函数返回的vnode，是单个children
      children = [b];
    } else {
      // 是data，无children
      data = b;
    }
  }
  // 如果有children
  if (children !== undefined) {
    for (i = 0; i < children.length; ++i) {
      // 文本内容的（没有子节点的），遍历赋vnode
      if (is.primitive(children[i]))
        children[i] = vnode(
          undefined,
          undefined,
          undefined,
          children[i],
          undefined
        );
    }
  }
  // 对svg的处理
  if (
    sel[0] === "s" &&
    sel[1] === "v" &&
    sel[2] === "g" &&
    (sel.length === 3 || sel[3] === "." || sel[3] === "#")
  ) {
    addNS(data, children, sel);
  }
  // 返回一个vnode对象
  return vnode(sel, data, children, text, undefined);
}

/**
 * @experimental
 */
export function fragment(children: VNodeChildren): VNode {
  let c: any;
  let text: any;

  if (is.array(children)) {
    c = children;
  } else if (is.primitive(c)) {
    text = children;
  } else if (c && c.sel) {
    c = [children];
  }

  if (c !== undefined) {
    for (let i = 0; i < c.length; ++i) {
      if (is.primitive(c[i]))
        c[i] = vnode(undefined, undefined, undefined, c[i], undefined);
    }
  }

  return vnode(undefined, {}, c, text, undefined);
}
