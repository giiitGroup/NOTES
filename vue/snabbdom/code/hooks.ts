import { VNode } from "./vnode";

export type PreHook = () => any;
export type InitHook = (vNode: VNode) => any;
export type CreateHook = (emptyVNode: VNode, vNode: VNode) => any;
export type InsertHook = (vNode: VNode) => any;
export type PrePatchHook = (oldVNode: VNode, vNode: VNode) => any;
export type UpdateHook = (oldVNode: VNode, vNode: VNode) => any;
export type PostPatchHook = (oldVNode: VNode, vNode: VNode) => any;
export type DestroyHook = (vNode: VNode) => any;
export type RemoveHook = (vNode: VNode, removeCallback: () => void) => any;
export type PostHook = () => any;

export interface Hooks {
  // patch 阶段开始。
  pre?: PreHook;
  // 已添加一个 VNode。
  init?: InitHook;
  // 基于 VNode 创建了一个 DOM 元素。
  create?: CreateHook;
  // 一个元素已添加到 DOM 元素中。
  insert?: InsertHook;
  // 一个元素即将进入 patch 阶段。
  prepatch?: PrePatchHook;
  // 一个元素开始更新。
  update?: UpdateHook;
  // 一个元素完成 patch 阶段。
  postpatch?: PostPatchHook;
  // 一个元素直接或间接被删除。
  destroy?: DestroyHook;
  // 一个元素直接从 DOM 元素中删除。
  remove?: RemoveHook;
  // patch 阶段结束。
  post?: PostHook;
}
