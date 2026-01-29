<template>
    <el-form label-width="auto" label-position="top">
        <el-form-item :label="strRuleMode">
            <div style="display: block !important;">
                <el-radio-group v-model="rule.mode">
                    <el-radio-button :value="RuleMode.disable">{{ strModeDisable }}</el-radio-button>
                    <el-radio-button :value="RuleMode.enable">{{ strModeFllowGlobal }}</el-radio-button>
                    <el-radio-button :value="RuleMode.block">{{ strModelBlock }}</el-radio-button>
                    <el-radio-button :value="RuleMode.allow">{{ strModelAllow }}</el-radio-button>
                </el-radio-group>
                <br>
                <el-text type="primary" v-if="rule.mode > RuleMode.enable" size="small">
                    * {{ strRuleModeDisc }}
                </el-text>
            </div>
        </el-form-item>
        <el-form-item :label="isAdd ? strAddRule : strEditRule">
            <el-input ref="$input" v-model="rule.pattern" />
        </el-form-item>
        <el-form-item :label=strEnableWildcard>
            <div style="flex-basis: 100%;"><el-switch v-model="rule.isWildcard" /></div>
            <div v-if="rule.isWildcard" style="display: inline-block !important; width: auto;max-width: auto;"
                class="el-table--fit el-table--border el-table--enable-row-hover el-table el-table--layout-fixed is-scrolling-none">
                <div class="el-table__inner-wrapper">
                    <div class="el-table__body-wrapper">
                        <!-- 表格主体 -->
                        <table class="el-table__body" cellspacing="0" cellpadding="0">
                            <!-- 表头 -->
                            <thead class="has-gutter">
                                <tr class="">
                                    <!-- is-leaf: 给表头加下边框 -->
                                    <th class="el-table__cell is-leaf">
                                        <div class="cell">{{ strWildCard }}</div>
                                    </th>
                                    <th class="el-table__cell is-leaf">
                                        <div class="cell">{{ strWildCardDisc }}</div>
                                    </th>
                                </tr>
                            </thead>

                            <!-- 表体 -->
                            <tbody>
                                <!-- el-table__row: 每一行的类名 -->
                                <tr class="el-table__row">
                                    <td class="el-table__cell">
                                        <div class="cell">*</div>
                                    </td>
                                    <td class="el-table__cell">
                                        <pre class="cell">{{ strWildCardStarDisc }}<br>a*e = abcbe</pre>
                                    </td>
                                </tr>
                                <tr class="el-table__row">
                                    <td class="el-table__cell">
                                        <div class="cell">?</div>
                                    </td>
                                    <td class="el-table__cell">
                                        <pre class="cell">{{ strWildCardQuestionMarkDisc }}<br>a?c = abc</pre>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="onSubmit">
                {{ isAdd ? strAddRule : strSave }}
            </el-button>
        </el-form-item>
    </el-form>
    <el-divider />
    <rule-tester ref="tester" :rule="rule" />
</template>

<style scoped>
.wildcard-table {
    margin: auto;
    border-collapse: collapse;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
}

.wildcard-table thead {
    background: linear-gradient(90deg, #4facfe, #00f2fe);
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.wildcard-table thead th {
    padding: 6px 14px;
    text-align: left;
}

.wildcard-table tbody tr {
    background-color: #fff;
    transition: background-color 0.3s ease;
}

.wildcard-table tbody tr:nth-child(even) {
    background-color: #f9fbfd;
}

.wildcard-table tbody tr:hover {
    background-color: #e6f7ff;
}

.wildcard-table tbody td {
    padding: 12px 14px;
    border-bottom: 1px solid #e0e6ed;
}
</style>

<script setup lang="ts">
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue';
import { RuleMode, type Rule } from '~types';
import { formatRawUrl } from '~utils';
import RuleTester from './ruleTester.vue';

const strEnable = chrome.i18n.getMessage('enable');
const strAddRule = chrome.i18n.getMessage('addRule');
const strEditRule = chrome.i18n.getMessage('editRule');
const strSave = chrome.i18n.getMessage('save');
const strEmptyRulePattern = chrome.i18n.getMessage('emptyRulePattern');
const strEnableWildcard = chrome.i18n.getMessage('enableWildcard');
const strWildCardStarDisc = chrome.i18n.getMessage('wildcardStarDisc');
const strWildCardQuestionMarkDisc = chrome.i18n.getMessage('wildcardQuestionMarkDisc');
const strWildCard = chrome.i18n.getMessage('wildcard');
const strWildCardDisc = chrome.i18n.getMessage('wildcardDisc');
const strRuleMode = chrome.i18n.getMessage('ruleMode');
const strModeDisable = chrome.i18n.getMessage('modeDisable');
const strModeFllowGlobal = chrome.i18n.getMessage('modeFllowGlobal');
const strModelBlock = chrome.i18n.getMessage('modelBlock');
const strModelAllow = chrome.i18n.getMessage('modelAllow');
const strRuleModeDisc = chrome.i18n.getMessage('ruleModeDisc');

const props = defineProps<{ rule: Rule | undefined, onSubmit: (rule: Rule) => boolean }>();
const rule = ref<Rule | undefined>();
const $input = ref<HTMLInputElement>();

const isPattern = ref(false);

watch(() => props.rule, () => {
    rule.value = Object.assign({}, props.rule);
    test();
    nextTick(() => {
        $input.value?.focus();
    });
}, { deep: true });

watch(() => rule.value?.pattern, () => {
    test();
})

const test = () => {
    console.log('ruleEditor', 'test', rule.value);
    isPattern.value = rule.value.pattern.includes('*') || rule.value.pattern.includes('?');
    tester.value?.test();
}

const isAdd = computed(() => rule.value?.id === 'new');

const onSubmit = () => {
    replacePrefix();
    if (!rule.value.pattern) {
        alert(strEmptyRulePattern);
        return false;
    }
    props.onSubmit(rule.value);
}

function replacePrefix() {
    rule.value.pattern = formatRawUrl(rule.value.pattern);
}

const tester = ref<InstanceType<typeof RuleTester>>();

onBeforeMount(() => {
    rule.value = Object.assign({ 'id': 'new' }, props.rule);
})
</script>