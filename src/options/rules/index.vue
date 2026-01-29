<template>
    <div class="editor_container height100Percent">
        <el-form label-width="150px">
            <el-form-item :label="strGlobalMode">
                <el-switch class="rule-switch" v-model="config.isBlockRules" :active-text="strBlockRules"
                    :inactive-text="strAllowRules" />
            </el-form-item>
            <el-form-item :label="strShowBadge">
                <el-switch class="rule-switch" v-model="config.showBadge" />
            </el-form-item>
            <el-form-item :label="strDarkMode">
                <el-switch class="rule-switch" v-model="config.darkMode" />
            </el-form-item>
        </el-form>
        <el-divider />
        <div class="height100Percent" style="flex: 1;">
            <el-row :gutter="10" class="el-row height100Percent">
                <el-col :span="12" class="height100Percent" style="overflow-y: auto;">
                    <el-table ref="$table" :data="searchedRules" highlight-current-row
                        @current-change="handleCurrentChange" :border="true" height="100%" :empty-text="strRulesEmpty">
                        <!-- <el-table-column type="index" width="50" /> -->
                        <el-table-column show-overflow-tooltip prop="pattern">
                            <template #header>
                                <el-input v-model="search" size="small" :placeholder="strSearch" :clearable=true />
                            </template>
                        </el-table-column>
                        <el-table-column width="100">
                            <template #header>
                                <el-tooltip :content="strAddRule" placement="top">
                                    <el-button size="small" type="success" @click="onAddRule" :icon="Plus" />
                                </el-tooltip>
                            </template>
                            <template #default="scope">
                                <el-button size="small" type="danger" @click="onDeleteRule(scope.$index, scope.row)"
                                    :icon="Delete" />
                            </template>
                        </el-table-column>
                    </el-table>
                </el-col>
                <el-col :span="12" class="height100Percent" style="overflow-y: auto;">
                    <rule-editor v-if="currentRow" :rule="currentRow" :on-submit="onSubmit" />
                </el-col>
            </el-row>
        </div>

    </div>
</template>

<style scoped>
.editor_container {
    display: flex;
    flex-direction: column;
}
</style>

<script setup lang="ts">
import 'element-plus/theme-chalk/dark/css-vars.css'
import '~/style.css';
import { computed, onMounted, ref, watch, type Ref } from 'vue';
import { Delete, Plus } from '@element-plus/icons-vue';
import { RuleMode, type ExtConfig, type Rule } from '~types';
import RuleEditor from './ruleEditor.vue';
import { createId, loadConfig, saveConfig } from '~utils';
import type { ElTable } from 'element-plus';
import { useDark, useToggle } from '@vueuse/core';


const isDark = useDark({
    selector: 'html', // 默认切换 <html> 上的 class
    attribute: 'class',
    valueDark: 'dark',
    valueLight: 'light',
});
const toggleDark = useToggle(isDark) as any;

const config = ref<ExtConfig>({
    isBlockRules: true,
    rules: [],
    showBadge: true,
    darkMode: false,
});

const strBlockRules = chrome.i18n.getMessage("blockRules");
const strAllowRules = chrome.i18n.getMessage("allowRules");
const strSearch = chrome.i18n.getMessage("search");
const strRuleExists = chrome.i18n.getMessage("ruleExists");
const strConfirmDelete = chrome.i18n.getMessage("confirmDelete");
const strAddRule = chrome.i18n.getMessage("addRule");
const strShowBadge = chrome.i18n.getMessage("showBadge");
const strGlobalMode = chrome.i18n.getMessage("globalMode");
const strDarkMode = chrome.i18n.getMessage("darkMode");
const strRulesEmpty = chrome.i18n.getMessage("rulesEmpty");

const search = ref('');
const currentRow = ref<Rule | undefined>();

const searchedRules = computed(() => {
    return config.value.rules.filter(rule => rule.pattern.toLowerCase().includes(search.value.toLowerCase()));
})

const handleCurrentChange = (val: Rule | undefined) => {
    currentRow.value = val;
}

const $table = ref<InstanceType<typeof ElTable>>(null)

const onAddRule = () => {
    $table.value.setCurrentRow(undefined);
    currentRow.value = {
        id: 'new',
        pattern: "",
        mode: RuleMode.enable,
        isWildcard: false,
    };
}
function onSubmit(rule?: Rule): boolean {
    if (rule) {
        if (rule.id === 'new') {
            $table.value.setCurrentRow(undefined);
            const hasSamePattern = config.value.rules.find((item) => item.pattern === rule.pattern);
            if (hasSamePattern) {
                alert(strRuleExists.replace('{pattern}', rule.pattern));
                return false;
            }
            rule.id = createId();
            config.value.rules.push(rule);
            $table.value.setCurrentRow(rule);
        } else {
            const hasSamePattern = config.value.rules.find((item) => item.pattern === rule.pattern);
            if (hasSamePattern && hasSamePattern.id !== rule.id) {
                alert(strRuleExists.replace('{pattern}', rule.pattern));
                return false;
            }
            const index = config.value.rules.findIndex((item) => item.id === rule.id);
            if (index !== -1) {
                config.value.rules[index] = rule;
                $table.value.setCurrentRow(rule);
            }
        }
    }
    console.log('保存', config.value.rules);
    save();
    return true;
}

function onDeleteRule(index: number, row: Rule) {
    console.log('删除', index, row);

    const r = confirm(strConfirmDelete.replace('{pattern}', row.pattern))
    if (!r) return;
    const rule = config.value.rules[index];
    if (row.id && rule.id == row.id) {
        config.value.rules.splice(index, 1);
    }
    if (currentRow.value?.id == row.id) {
        currentRow.value = undefined;
    }
    save();
}

onMounted(async () => {
    load();
    watch(() => config.value, () => {
        save();
        toggleDark(config.value.darkMode);
    }, { deep: true });
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === 'updated') {
        load();
        sendResponse({ success: true });
    }
});

const load = async () => {
    config.value = await loadConfig();
    console.log('rules/index.vue', '读取配置', config);
}
const save = async () => {
    await saveConfig(config.value);
    chrome.runtime.sendMessage({ type: 'updated' });
}


</script>