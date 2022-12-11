import { Module } from "./modules/module";
import { vnode, VNode } from "./vnode";
import * as is from "./is";
import { htmlDomApi, DOMAPI } from "./htmldomapi";

type NonUndefined<T> = T extends undefined ? never : T;

function isUndef(s: any): boolean {
  return s === undefined;
}
function isDef<A>(s: A): s is NonUndefined<A> {
  return s !== undefined;
}

type VNodeQueue = VNode[];

const emptyNode = vnode("", {}, [], undefined, undefined);
// 判断是同一个节点
function sameVnode(vnode1: VNode, vnode2: VNode): boolean {
  // key
  const isSameKey = vnode1.key === vnode2.key;
  // 都定义了data
  const isSameIs = vnode1.data?.is === vnode2.data?.is;
  // 选择器
  const isSameSel = vnode1.sel === vnode2.sel;
  // sel是undefined，纯文本内容时，内容是否一样
  const isSameTextOrFragment =
    !vnode1.sel && vnode1.sel === vnode2.sel
      ? typeof vnode1.text === typeof vnode2.text
      : true;

  return isSameSel && isSameKey && isSameIs && isSameTextOrFragment;
}

/**
 * @todo Remove this function when the document fragment is considered stable.
 */
function documentFragmentIsNotSupported(): never {
  throw new Error("The document fragment is not supported on this platform.");
}

function isElement(
  api: DOMAPI,
  vnode: Element | DocumentFragment | VNode
): vnode is Element {
  return api.isElement(vnode as any);
}

function isDocumentFragment(
  api: DOMAPI,
  vnode: DocumentFragment | VNode
): vnode is DocumentFragment {
  return api.isDocumentFragment!(vnode as any);
}

type KeyToIndexMap = { [key: string]: number };

type ArraysOf<T> = {
  [K in keyof T]: Array<T[K]>;
};

type ModuleHooks = ArraysOf<Required<Module>>;

function createKeyToOldIdx(
  children: VNode[],
  beginIdx: number,
  endIdx: number
): KeyToIndexMap {
  const map: KeyToIndexMap = {};
  for (let i = beginIdx; i <= endIdx; ++i) {
    const key = children[i]?.key;
    if (key !== undefined) {
      map[key as string] = i;
    }
  }
  return map;
}
// 生命周期
const hooks: Array<keyof Module> = [
  "create",
  "update",
  "remove",
  "destroy",
  "pre",
  "post",
];

// TODO Should `domApi` be put into this in the next major version bump?
export type Options = {
  experimental?: {
    fragments?: boolean;
  };
};

export function init(
  modules: Array<Partial<Module>>,
  domApi?: DOMAPI,
  options?: Options
) {
  const cbs: ModuleHooks = {
    create: [],
    update: [],
    remove: [],
    destroy: [],
    pre: [],
    post: [],
  };

  const api: DOMAPI = domApi !== undefined ? domApi : htmlDomApi;

  for (const hook of hooks) {
    for (const module of modules) {
      const currentHook = module[hook];
      if (currentHook !== undefined) {
        (cbs[hook] as any[]).push(currentHook);
      }
    }
  }

  function emptyNodeAt(elm: Element) {
    const id = elm.id ? "#" + elm.id : "";

    // elm.className doesn't return a string when elm is an SVG element inside a shadowRoot.
    // https://stackoverflow.com/questions/29454340/detecting-classname-of-svganimatedstring
    const classes = elm.getAttribute("class");

    const c = classes ? "." + classes.split(" ").join(".") : "";
    return vnode(
      api.tagName(elm).toLowerCase() + id + c,
      {},
      [],
      undefined,
      elm
    );
  }

  function emptyDocumentFragmentAt(frag: DocumentFragment) {
    return vnode(undefined, {}, [], undefined, frag);
  }
  // 返回删除节点的方法
  function createRmCb(childElm: Node, listeners: number) {
    return function rmCb() {
      if (--listeners === 0) {
        const parent = api.parentNode(childElm) as Node;
        api.removeChild(parent, childElm);
      }
    };
  }

  function createElm(vnode: VNode, insertedVnodeQueue: VNodeQueue): Node {
    let i: any;
    let data = vnode.data;
    // 有props
    if (data !== undefined) {
      // 如果有初始化的钩子 执行
      const init = data.hook?.init;
      if (isDef(init)) {
        init(vnode);
        data = vnode.data;
      }
    }
    const children = vnode.children;
    const sel = vnode.sel;
    // 注释节点
    if (sel === "!") {
      if (isUndef(vnode.text)) {
        vnode.text = "";
      }
      vnode.elm = api.createComment(vnode.text!);
    } else if (sel !== undefined) {
      // Parse selector
      // 解析sel 
      const hashIdx = sel.indexOf("#");
      const dotIdx = sel.indexOf(".", hashIdx);
      const hash = hashIdx > 0 ? hashIdx : sel.length;
      const dot = dotIdx > 0 ? dotIdx : sel.length;
      // 获得tag
      const tag =
        hashIdx !== -1 || dotIdx !== -1
          ? sel.slice(0, Math.min(hash, dot))
          : sel;
      // 创建dom
      const elm = (vnode.elm =
        isDef(data) && isDef((i = data.ns))
          ? api.createElementNS(i, tag, data)
          : api.createElement(tag, data));
      // id
      if (hash < dot) elm.setAttribute("id", sel.slice(hash + 1, dot));
      // class
      if (dotIdx > 0)
        elm.setAttribute("class", sel.slice(dot + 1).replace(/\./g, " "));
      // 执行create的钩子
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
      // children是数组
      if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
          const ch = children[i];
          if (ch != null) {
            // 手动调用自己 创建子节点
            api.appendChild(elm, createElm(ch as VNode, insertedVnodeQueue));
          }
        }
      } else if (is.primitive(vnode.text)) {
        // 是文本节点 直接append
        api.appendChild(elm, api.createTextNode(vnode.text));
      }
      // 在子节点的insert之后再添加，保证子节点的insert先执行
      const hook = vnode.data!.hook;
      if (isDef(hook)) {
        // 执行data中的create钩子
        hook.create?.(emptyNode, vnode);
        if (hook.insert) {
          // insert追加到队列
          insertedVnodeQueue.push(vnode);
        }
      }
    } else if (options?.experimental?.fragments && vnode.children) {
      // 如果没有sel且不是注释
      vnode.elm = (
        api.createDocumentFragment ?? documentFragmentIsNotSupported
      )();
      // create钩子
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
      // 遍历创建节点
      for (i = 0; i < vnode.children.length; ++i) {
        const ch = vnode.children[i];
        if (ch != null) {
          api.appendChild(
            vnode.elm,
            createElm(ch as VNode, insertedVnodeQueue)
          );
        }
      }
    } else {
      // 纯文本
      vnode.elm = api.createTextNode(vnode.text!);
    }
    return vnode.elm;
  }

  function addVnodes(
    parentElm: Node,
    before: Node | null,
    vnodes: VNode[],
    startIdx: number,
    endIdx: number,
    insertedVnodeQueue: VNodeQueue
  ) {
    for (; startIdx <= endIdx; ++startIdx) {
      const ch = vnodes[startIdx];
      if (ch != null) {
        api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
      }
    }
  }
  // destroy钩子 递归调用且顺序执行
  function invokeDestroyHook(vnode: VNode) {
    const data = vnode.data;
    if (data !== undefined) {
      data?.hook?.destroy?.(vnode);
      for (let i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
      if (vnode.children !== undefined) {
        for (let j = 0; j < vnode.children.length; ++j) {
          const child = vnode.children[j];
          if (child != null && typeof child !== "string") {
            invokeDestroyHook(child);
          }
        }
      }
    }
  }
  // 删除节点
  function removeVnodes(
    parentElm: Node,
    vnodes: VNode[],
    startIdx: number,
    endIdx: number
  ): void {
    for (; startIdx <= endIdx; ++startIdx) {
      let listeners: number;
      let rm: () => void;
      const ch = vnodes[startIdx];
      if (ch != null) {
        if (isDef(ch.sel)) {
          // destroy钩子
          invokeDestroyHook(ch);
          listeners = cbs.remove.length + 1;
          rm = createRmCb(ch.elm!, listeners);
          // module的remove钩子
          for (let i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm);
          // ch的remove钩子
          const removeHook = ch?.data?.hook?.remove;
          if (isDef(removeHook)) {
            removeHook(ch, rm);
          } else {
            rm();
          }
        } else if (ch.children) {
          // Fragment node
          invokeDestroyHook(ch);
          removeVnodes(
            parentElm,
            ch.children as VNode[],
            0,
            ch.children.length - 1
          );
        } else {
          // Text node
          api.removeChild(parentElm, ch.elm!);
        }
      }
    }
  }

  function updateChildren(
    parentElm: Node,
    oldCh: VNode[],
    newCh: VNode[],
    insertedVnodeQueue: VNodeQueue
  ) {
    let oldStartIdx = 0;
    let newStartIdx = 0;
    let oldEndIdx = oldCh.length - 1;
    let oldStartVnode = oldCh[0];
    let oldEndVnode = oldCh[oldEndIdx];
    let newEndIdx = newCh.length - 1;
    let newStartVnode = newCh[0];
    let newEndVnode = newCh[newEndIdx];
    let oldKeyToIdx: KeyToIndexMap | undefined;
    let idxInOld: number;
    let elmToMove: VNode;
    let before: any;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (oldStartVnode == null) {
        // 索引偏移
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
      } else if (oldEndVnode == null) {
        // 索引偏移
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (newStartVnode == null) {
        // 索引偏移
        newStartVnode = newCh[++newStartIdx];
      } else if (newEndVnode == null) {
        // 索引偏移
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) {
        // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        api.insertBefore(
          parentElm,
          oldStartVnode.elm!,
          api.nextSibling(oldEndVnode.elm!)
        );
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) {
        // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        api.insertBefore(parentElm, oldEndVnode.elm!, oldStartVnode.elm!);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        // key和idx的对应
        if (oldKeyToIdx === undefined) {
          oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        }
        idxInOld = oldKeyToIdx[newStartVnode.key as string];
        // 新key在旧的对应关系中是否存在
        if (isUndef(idxInOld)) {
          // New element
          api.insertBefore(
            parentElm,
            createElm(newStartVnode, insertedVnodeQueue),
            oldStartVnode.elm!
          );
        } else {
          // 记录旧节点
          elmToMove = oldCh[idxInOld];
          // sel改变了，依然需要创建新节点
          if (elmToMove.sel !== newStartVnode.sel) {
            api.insertBefore(
              parentElm,
              createElm(newStartVnode, insertedVnodeQueue),
              oldStartVnode.elm!
            );
          } else {
            // 完全相同
            patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
            oldCh[idxInOld] = undefined as any;
            // 放在旧节点的左侧
            api.insertBefore(parentElm, elmToMove.elm!, oldStartVnode.elm!);
          }
        }
        newStartVnode = newCh[++newStartIdx];
      }
    }
    // 遍历结束后，如果是新节点未遍历完成，添加节点
    if (newStartIdx <= newEndIdx) {
      before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
      addVnodes(
        parentElm,
        before,
        newCh,
        newStartIdx,
        newEndIdx,
        insertedVnodeQueue
      );
    }
    // 旧节点未遍历完成，删除中间剩余的节点
    if (oldStartIdx <= oldEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function patchVnode(
    oldVnode: VNode,
    vnode: VNode,
    insertedVnodeQueue: VNodeQueue
  ) {
    const hook = vnode.data?.hook;
    // prepatch钩子
    hook?.prepatch?.(oldVnode, vnode);
    const elm = (vnode.elm = oldVnode.elm)!;
    // 同一节点直接return
    if (oldVnode === vnode) return;
    if (
      vnode.data !== undefined ||
      (isDef(vnode.text) && vnode.text !== oldVnode.text)
    ) {
      // 执行update钩子
      vnode.data ??= {};
      oldVnode.data ??= {};
      for (let i = 0; i < cbs.update.length; ++i)
        cbs.update[i](oldVnode, vnode);
      vnode.data?.hook?.update?.(oldVnode, vnode);
    }
    const oldCh = oldVnode.children as VNode[];
    const ch = vnode.children as VNode[];
    if (isUndef(vnode.text)) {
      // 新内容不是文字
      if (isDef(oldCh) && isDef(ch)) {
        // 都存在子节点
        if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue);
      } else if (isDef(ch)) {
        // 旧节点是文字，先清空，再addVnodes
        if (isDef(oldVnode.text)) api.setTextContent(elm, "");
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
      } else if (isDef(oldCh)) {
        // 旧节点有子节点，新节点为空 清空
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      } else if (isDef(oldVnode.text)) {
        // 旧节点是文本，新节点为空，直接空text
        api.setTextContent(elm, "");
      }
    } else if (oldVnode.text !== vnode.text) {
      // 新的文本是文字，旧节点存在子节点，直接清空
      if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      }
      api.setTextContent(elm, vnode.text!);
    }
    // postPatch钩子
    hook?.postpatch?.(oldVnode, vnode);
  }

  return function patch(
    oldVnode: VNode | Element | DocumentFragment,
    vnode: VNode
  ): VNode {
    let i: number, elm: Node, parent: Node;
    // 生命周期
    const insertedVnodeQueue: VNodeQueue = [];
    // 钩子
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();
    // 将dom和批量节点进行初始化
    if (isElement(api, oldVnode)) {
      // 先判断是不是一个dom元素
      // nodeType === 1
      // 第一次时，oldVnode就是所选的dom
      oldVnode = emptyNodeAt(oldVnode);
    } else if (isDocumentFragment(api, oldVnode)) {
      // 判断是不是批量的
      // nodeType === 11
      oldVnode = emptyDocumentFragmentAt(oldVnode);
    }
    if (sameVnode(oldVnode, vnode)) {
      // 如果是同一个vnode 就精细化处理
      patchVnode(oldVnode, vnode, insertedVnodeQueue);
    } else {
      // 不是的话创建新节点替换

      elm = oldVnode.elm!;
      // 获取父元素
      parent = api.parentNode(elm) as Node;
      // 创建节点
      createElm(vnode, insertedVnodeQueue);

      if (parent !== null) {
        // elm非空
        api.insertBefore(parent, vnode.elm!, api.nextSibling(elm));
        removeVnodes(parent, [oldVnode], 0, 0);
      }
    }
    // 执行insert 类似mount钩子
    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      insertedVnodeQueue[i].data!.hook!.insert!(insertedVnodeQueue[i]);
    }
    // post结束patch阶段
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
    // 返回vnode，作为以后的oldVnode
    return vnode;
  };
}
