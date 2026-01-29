export enum RuleMode {
    disable = 0,
    enable = 1,
    block = 2,
    allow = 3
}

export interface Rule {
    id: string;
    pattern: string;
    mode: RuleMode;
    isWildcard: boolean;
}

/**
 * 优化后的存储格式
 * [id, pattern, mode, isWildcard]
 * mode: 0 = disable, 1 = enable, 2 = block, 3 = allow
 * isWildcard: 0 = false, 1 = true
 */
export type StoredRule = [string, string, number, number];

export type BackGroundRule = {
    pattern: string | RegExp;
    mode: RuleMode;
}

export interface ExtConfig {
    isBlockRules: boolean;
    rules: Rule[];
    showBadge: boolean;
    darkMode: boolean;
}

export interface LogItem {
    pattern: string;
    url: string;
    timestamp: number;
}

/**
 * 优化后的日志存储格式
 * [pattern, url, timestamp]
 */
export type StoredLogItem = [string, string, number];
