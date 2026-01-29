import { RuleMode, type BackGroundRule } from "~types";
import { addLog, formatRawUrl, loadConfig, wildcardToReg } from "~utils";

// chrome.action.onClicked.addListener(() => { chrome.runtime.openOptionsPage() });

// 1. 创建一个 Promise 来暴露加载状态
let readyPromise: Promise<void> | null = null;

// 全局规则
let isBlockRules = true;
let showBadge = true;
const ruleNames: string[] = [];
const rules: BackGroundRule[] = [];

// 拦截次数
let count = 0;

function ruleMatcher(rule: BackGroundRule, url: string): boolean {
    let matched = false;
    if (typeof rule.pattern === "string") {
        matched = rule.pattern === url;
    } else {
        matched = rule.pattern.test(url);
    }
    return matched;
}
chrome.history.onVisited.addListener(async (item: chrome.history.HistoryItem) => {
    // 2. 确保加载完成
    if (readyPromise) {
        await readyPromise;
    }
    const url = formatRawUrl(item.url);
    let matched = false;
    let isBlock = isBlockRules;
    let name: string;
    for (let i = 0; i < ruleNames.length; i++) {
        const r = rules[i];
        if (ruleMatcher(r, url)) {
            name = ruleNames[i];
            if (r.mode == RuleMode.block) {
                isBlock = true;
            } else if (r.mode == RuleMode.allow) {
                isBlock = false;
            }
            matched = true;
            break;
        }
    }
    // console.log('background', 'onVisited', { rule, url, matched, isBlockRules });

    if ((isBlock && matched) || (!isBlock && !matched)) {
        chrome.history.deleteUrl({ url: item.url });
        const log = {
            timestamp: Date.now(),
            pattern: name ?? '=none=',
            url: item.url
        };
        count++;
        // 发送消息给popup
        chrome.runtime.sendMessage({ type: 'popup', data: { rules: Object.keys(rules), count } });
        // 设置徽标
        if (showBadge) {
            chrome.action.setBadgeText({ text: count.toString() });
        }
        await addLog(log);
        chrome.runtime.sendMessage({ type: 'blocked', log });
    }
})

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === 'updated') {
        readyPromise = load();
    } else if (request.type === 'popup') {
        chrome.runtime.sendMessage({ type: 'popup', data: { rules: ruleNames, count, isBlockRules } });
    }
    sendResponse({ success: true });
});

async function load(): Promise<void> {
    const { isBlockRules: _isBlockRules, showBadge: _showBadge, rules: _rules } = await loadConfig();
    isBlockRules = _isBlockRules;
    showBadge = _showBadge;
    rules.length = 0;
    ruleNames.length = 0;

    for (let index = 0; index < _rules.length; index++) {
        const rule = _rules[index];

        if (rule.mode > 0) {
            ruleNames.push(rule.pattern);
            rules.push({
                pattern: rule.isWildcard ? wildcardToReg(rule.pattern) : rule.pattern,
                mode: rule.mode
            });
        }
    }
    console.log('background', 'load', { isBlockRules, showBadge, rules: _rules }, `最终规则: ${ruleNames}`);

    if (!showBadge) {
        chrome.action.setBadgeText({ text: '' });
    }
}

readyPromise = load();