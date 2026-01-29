export function wildcardToReg(pattern: string): RegExp {
    // 转义正则特殊字符
    const escaped = pattern.replace(/([.+^${}()|[\]\\])/g, '\\$1');

    // 替换通配符
    const regexStr = escaped
        .replace(/\*/g, '.*')   // * → 任意长度
        .replace(/\?/g, '.')    // ? → 单个字符
        ;

    return new RegExp(regexStr);
}