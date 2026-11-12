import { RuleMode, type BackGroundRule } from "~types";
import { addLog, clearConfig, formatRawUrl, loadConfig, saveConfig, wildcardToReg } from "~utils";

// 1. 创建一个 Promise 来暴露加载状态
let readyPromise: Promise<void> | null = null;

// 全局规则
let isBlockRules = true;
let showBadge = true;
const ruleNames: string[] = [];
const ruleUrls: string[] = [];
const rules: BackGroundRule[] = [];

// 拦截次数
let count = 0;

// 推迟删除的 URL：处理时它们不是任何标签页的当前条目（可能处于后退栈中），
// 直接 deleteUrl 会移除后退条目，导致 SPA（如 NGA）无法回退，故延后到标签页关闭后处理。
// 持久化到 storage.local，使 MV3 worker 重启后仍能恢复，避免孤儿历史无法清理。
const PENDING_KEY = "pending_delete";
const pendingDelete = new Set<string>();

async function loadPending(): Promise<void> {
    const r = await chrome.storage.local.get([PENDING_KEY]);
    const arr = (r && r[PENDING_KEY]) || [];
    pendingDelete.clear();
    for (const u of arr) pendingDelete.add(u);
}

async function savePending(): Promise<void> {
    await chrome.storage.local.set({ [PENDING_KEY]: [...pendingDelete] });
}

function ruleMatcher(rule: BackGroundRule, url: string): boolean {
    if (typeof rule.pattern === "string") {
        return rule.pattern === url;
    }
    return rule.pattern.test(url);
}

// 所有活动标签页“当前条目”的 URL 集合（需要 tabs 权限读取普通网页 URL）
async function getCurrentEntryUrls(): Promise<Set<string>> {
    const tabs = await chrome.tabs.query({});
    const set = new Set<string>();
    for (const tab of tabs) {
        if (tab.url) set.add(tab.url);
    }
    return set;
}

// 安全删除（实时查询，不依赖内存标记，可正确处理后退/前进重新产生的访问）：
// - 当前条目 -> 立即删除（Chrome 保留导航栈，仅清历史库，重复调用也安全）
// - 非当前且历史库中无访问记录（replaceState 产生的“幽灵 onVisited”）-> 跳过
// - 非当前且历史库中仍有访问记录 -> 推迟，避免移除后退条目
async function safeDeleteUrl(rawUrl: string): Promise<"deleted" | "pending" | "skipped"> {
    const currentUrls = await getCurrentEntryUrls();
    if (currentUrls.has(rawUrl)) {
        chrome.history.deleteUrl({ url: rawUrl });
        return "deleted";
    }
    const visits = await chrome.history.getVisits({ url: rawUrl });
    if (!visits || visits.length === 0) {
        return "skipped";
    }
    pendingDelete.add(rawUrl);
    await savePending();
    return "pending";
}

// 标签页关闭后处理推迟集合：仅删除已不在任何活动标签页当前条目中的 URL
async function flushPending(): Promise<void> {
    if (pendingDelete.size === 0) return;
    const currentUrls = await getCurrentEntryUrls();
    for (const u of [...pendingDelete]) {
        if (!currentUrls.has(u)) {
            pendingDelete.delete(u);
            const visits = await chrome.history.getVisits({ url: u });
            if (visits && visits.length > 0) {
                chrome.history.deleteUrl({ url: u });
            }
            await savePending();
        }
    }
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
    for (let i = 0; i < rules.length; i++) {
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

    if ((isBlock && matched) || (!isBlock && !matched)) {
        await safeDeleteUrl(item.url);
        const log = {
            timestamp: Date.now(),
            pattern: name ?? '=none=',
            url: item.url
        };
        count++;
        chrome.runtime.sendMessage({ type: 'popup', data: { rules: ruleUrls, count } }).catch(() => {});
        if (showBadge) {
            chrome.action.setBadgeText({ text: count.toString() });
        }
        await addLog(log);
        chrome.runtime.sendMessage({ type: 'blocked', log }).catch(() => {});
    }
})

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === 'updated') {
        readyPromise = load();
    } else if (request.type === 'popup') {
        chrome.runtime.sendMessage({ type: 'popup', data: { rules: ruleNames, count, isBlockRules } }).catch(() => {});
    }
    sendResponse({ success: true });
});

// 标签页关闭：其导航栈销毁，可安全清理推迟集合中不再属于任何活动标签的 URL
chrome.tabs.onRemoved.addListener(() => {
    setTimeout(flushPending, 500);
});

async function load(): Promise<void> {
    const { isBlockRules: _isBlockRules, showBadge: _showBadge, rules: _rules } = await loadConfig();
    isBlockRules = _isBlockRules;
    showBadge = _showBadge;
    rules.length = 0;
    ruleNames.length = 0;
    ruleUrls.length = 0;

    for (let index = 0; index < _rules.length; index++) {
        const rule = _rules[index];

        if (rule.mode > 0) {
            ruleNames.push(rule.pattern);
            ruleUrls.push(rule.pattern);
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

    // 恢复持久化的推迟集合，worker 重启后仍可继续清理孤儿历史
    await loadPending();
}

readyPromise = load();

if (process.env.PLASMO_PUBLIC_SCREENSHOT_MODE === "true") {
    console.log('处于自动化截图模式');

    (async () => {
        await clearConfig();
        await saveConfig({
            isBlockRules: true,
            showBadge: true,
            darkMode: false,
            rules: [
                {
                    id: '1',
                    pattern: 'example.com*',
                    mode: RuleMode.block,
                    isWildcard: true
                },
                {
                    id: '2',
                    pattern: 'x.com*',
                    mode: RuleMode.block,
                    isWildcard: true
                }
            ]
        });
    })();

}
