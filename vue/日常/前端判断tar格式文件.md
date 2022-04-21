# 前端判断tar文件格式

## 正常的文件判断方式
> 文件后缀+文件头魔数校验
```javascript
let type = file.name.split('.').reverse()[0];
```
## tar的特殊性
> tar是一种归档文件，作为一个文件可能包括多个文件
> tar文件读取时，每个文件由文件头+文件内容+2个512字节填充内容
> 根据规范，文件头中magic应为'ustar'加一个null，读取为'\u0000'，根据此特征进行判断

```javascript

export function tarFormatCheck(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            let buffer = reader.result;
            let fileInfo = [];
            let offset = 0;
            while (offset < buffer.byteLength - 512) {
                let magic = '';
                let size = 0;
                let name = '';

                // 文件名长度不为0
                let file_name = new Uint8Array(buffer, offset, 100);
                let i = 0;
                while (file_name[i] != 0) {
                    name += String.fromCharCode(file_name[i]);
                    i++;
                }
                if (name.length == 0) {
                    break;
                }
                // magic校验 非ustar\u0000的不符合格式标准
                let file_magic = new Uint8Array(buffer, offset + 257, 7);
                for (let i = 0; i < 6; i++) {
                    magic += String.fromCharCode(file_magic[i]);
                }
                if (magic != 'ustar\u0000') {
                    reject;
                    break;
                }

                // 文件size
                let file_size = new Uint8Array(buffer, offset + 124, 12);
                for (let i = 0; i < 11; i++) {
                    size += String.fromCharCode(file_size[i]);
                }
                size = parseInt(size, 8);
                fileInfo.push({
                    magic,
                    size,
                });

                // 偏移量计算 填充2个512结尾
                offset += 512 + 512 * Math.trunc(size / 512);
                if (size % 512) {
                    offset += 512;
                }
            }
            resolve(fileInfo);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
```

参考规范

http://www.gnu.org/software/tar/manual/html_node/Standard.html

https://www.ibm.com/docs/en/zos/2.1.0?topic=formats-tar-format-tar-archives