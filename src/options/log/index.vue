<template>
    <div class="height100Percent" style="display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between;">
            <div>
                <el-text size="small">* {{ strLogTips }}</el-text>
                <el-text size="small" style="margin-left: 5px;color: blue;">{{ logs.length }}</el-text>
            </div>
            <div>
                <el-button @click="onClearLog" size="small" type="danger">{{ strClearLog }}</el-button>
            </div>
        </div>
        <ul class="logs">
            <li v-for="log in logs.toReversed()">
                <el-text class="time">{{ formatTime(log.timestamp) }}</el-text>
                <el-text class="content" v-if="log.pattern === '=none='">
                    {{ strNotMatched }}
                    ,
                    {{ strIntercepted }}
                </el-text>
                <el-text class="content" v-else>
                    {{ strMatched }}
                    {{ log.pattern }}
                    ,
                    {{ strIntercepted }}
                </el-text>
                <a target="_blank" :href="log.url" underline="never">{{ log.url }}</a>
            </li>
        </ul>
    </div>
</template>
<style scoped>
    .logs {
        padding: 10px;
        flex: 1;
        background: #333;
        height: 100%;
        overflow-y: auto;
    }

    .logs li {
        list-style: none;
        margin-top: 5px;
        /* 自动换行 */
        word-break: break-all;
        white-space: pre-wrap;
    }

    .logs li .time {
        color: #fff;
        display: inline-block;
        margin-right: 5px;
    }

    .logs .content {
        color: #bbb !important;
        display: inline-block;
        margin-right: 5px;
    }

    .logs a {
        color: #fff !important;
        text-decoration: none;
    }
</style>
<script setup lang="ts">
    import { ref, onMounted, computed } from 'vue';
    import { ElText } from 'element-plus';
    import '~/style.css';
    import type { LogItem } from '~types';
    import { clearLog, loadLogs } from '~utils';

    const strLogTips = chrome.i18n.getMessage('logTips');
    const strMatched = chrome.i18n.getMessage('matched');
    const strIntercepted = chrome.i18n.getMessage('intercepted');
    const strNotMatched = chrome.i18n.getMessage('notMatched');
    const strClearLog = chrome.i18n.getMessage('clearLog');

    const logs = ref<LogItem[]>([
        { pattern: '=none=', url: 'https://example.com', timestamp: Date.now() },
        { pattern: 'example.com', url: 'https://example.com', timestamp: Date.now() },
        { pattern: 'a.com*', url: 'https://a.com', timestamp: Date.now() },
        { pattern: 'b.com', url: 'https://b.com', timestamp: Date.now() },
        { pattern: 'c.com', url: 'https://c.com', timestamp: Date.now() },
        { pattern: 'd.com', url: 'https://d.com', timestamp: Date.now() },
    ]);

    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.type === 'blocked') {
            logs.value.push(request.log);
        }
    })

    function formatTime(time: number) {
        return new Date(time).toLocaleString();
    }

    onMounted(async () => {
        logs.value = await loadLogs();
    });


    function onClearLog() {
        clearLog();
        logs.value.length = 0;
    }
</script>