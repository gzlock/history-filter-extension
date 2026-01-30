import type { ExtConfig, LogItem, Rule, StoredLogItem, StoredRule } from "~types";

export const toStoredRule = (rule: Rule): StoredRule => {
    return [rule.id, rule.pattern, rule.mode, rule.isWildcard ? 1 : 0];
};

export const fromStoredRule = (stored: any): Rule => {
    const [id, pattern, mode, isWildcard] = stored as StoredRule;
    return {
        id,
        pattern,
        mode,
        isWildcard: isWildcard === 1,
    };
};

export const toStoredLog = (log: LogItem): StoredLogItem => {
    return [log.pattern, log.url, log.timestamp];
};

export const fromStoredLog = (stored: any): LogItem => {
    return {
        pattern: stored[0],
        url: stored[1],
        timestamp: stored[2],
    };
};

export async function loadRules(): Promise<Rule[]> {
    const stored = await load<StoredRule[]>('rules', []);
    return stored.map(fromStoredRule);
}

export async function saveRules(rules: Rule[]) {
    const stored = rules.map(toStoredRule);
    return chrome.storage.sync.set({ rules: stored });
}

export async function saveIsBlockRules(isBlockRules: boolean) {
    return chrome.storage.sync.set({ isBlockRules });
}

export async function loadConfig(): Promise<ExtConfig> {
    const [isBlockRules, showBadge, darkMode, rules] = await Promise.all([
        load('isBlockRules', true),
        load('showBadge', true),
        load('darkMode', false),
        loadRules(),
    ]) as [boolean, boolean, boolean, Rule[]];
    return { isBlockRules, showBadge, darkMode, rules, };
}

async function load<T>(key: string, defaultValue: T): Promise<T> {
    const result = await chrome.storage.sync.get([key]);
    return result.hasOwnProperty(key) ? result[key] : defaultValue;
}

export async function saveConfig(config: ExtConfig) {
    const storedRules = config.rules.map(toStoredRule);
    await chrome.storage.sync.set({
        isBlockRules: config.isBlockRules,
        showBadge: config.showBadge,
        rules: storedRules,
        darkMode: config.darkMode,
    });
}

export async function loadLogs(): Promise<LogItem[]> {
    const result = await chrome.storage.local.get(['logs']);
    const stored = (result && result.logs) || [];
    return stored.map(fromStoredLog);
}
export async function addLog(log: LogItem) {
    await navigator.locks.request('add_log', async () => {
        const logs = await loadLogs();
        logs.push(log);
        // 限制最多100条
        if (logs.length > 100) {
            logs.shift();
        }
        const stored = logs.map(toStoredLog);
        await chrome.storage.local.set({ logs: stored });
    });
}
export function clearConfig() {
    // 清空所有扩展配置
    return chrome.storage.sync.clear();
}

export function clearLog() {
    return chrome.storage.local.clear();
}

export function createId(): string {
    return encode62(Date.now());
}


const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const encode62 = (num: number) => {
    let result = '';
    while (num > 0) {
        result = chars[num % 62] + result;
        num = Math.floor(num / 62);
    }
    return result;
};
