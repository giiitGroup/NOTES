# el-tree 全部节点的展开收起
---
*element觉得这不是一个常用的功能，所以并没有提供此method，在issue中发现官方回复推荐手动触发点击事件。*
> https://jsfiddle.net/zhqfhfv8/
> 
> *基于上面链接中的方法做出改动，遍历点击，不推荐对大量节点进行此操作*

HTML
``` html
<div id="app">
    <el-button @click="toggle">Toggle first node</el-button>
    <el-tree :data="data" :props="defaultProps" @node-click="handleNodeClick"></el-tree>
</div>
```
JS
``` javascript
var Main = {
    data() {
      return {
        data: [{
          label: '一级 1',
          children: [{
            label: '二级 1-1',
            children: [{
              label: '三级 1-1-1'
            }]
          }]
        }, {
          label: '一级 2',
          children: [{
            label: '二级 2-1',
            children: [{
              label: '三级 2-1-1'
            }]
          }, {
            label: '二级 2-2',
            children: [{
              label: '三级 2-2-1'
            }]
          }]
        }, {
          label: '一级 3',
          children: [{
            label: '二级 3-1',
            children: [{
              label: '三级 3-1-1'
            }]
          }, {
            label: '二级 3-2',
            children: [{
              label: '三级 3-2-1'
            }]
          }]
        }],
        defaultProps: {
          children: 'children',
          label: 'label'
        }
      };
    },
    methods: {
      toggle() {
        //   选取全部节点并遍历，进行模拟点击事件触发内部展开收起
        document.querySelectorAll('.el-tree-node').forEach(node => {
        	node.click();
        })
      },
      handleNodeClick(data) {
        console.log(data);
      }
    }
  };
var Ctor = Vue.extend(Main)
new Ctor().$mount('#app')
```
