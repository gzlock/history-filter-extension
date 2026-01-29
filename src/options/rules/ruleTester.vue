<template>
    <div>
        <div style="margin-bottom: 10px;">
            <el-text size="large">{{ strTest }}</el-text>
            <el-text size="small" type="info" style="margin-left: 10px;">({{ strTestInputAreaTips }})</el-text>
        </div>
        <el-input id="test-input" type="textarea" v-model="testContent" @input="handleInput"
            :autosize="{ minRows: 4, maxRows: 10 }" />
        <div>
            <div v-for="value in testResults" style="display: flex; align-items: center;">
                <div style="width: 20px; display: flex; align-items: center;">
                    <el-icon>
                        <Close v-if="!value.isMatch" color="red" />
                        <Check v-else color="green" />
                    </el-icon>
                </div>
                <el-text style="flex: 1;" :type="value.isMatch ? 'success' : 'danger'">{{ value.url }}</el-text>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { ref, type Ref } from 'vue';
    import type { Rule } from '~types';
    import { formatRawUrl, wildcardToReg } from '~utils';
    import { Close, Check } from '@element-plus/icons-vue'

    const strTest = chrome.i18n.getMessage("test");
    const strTestInputAreaTips = chrome.i18n.getMessage("testInputAreaTips");


    const props = defineProps<{ rule: Rule | undefined }>()
    const testResults: Ref<Array<RuleTest>> = ref([])
    const testContent = ref("")

    interface RuleTest {
        url: string,
        isMatch?: boolean
    }
    const handleInput = () => {
        handleTest()
    }

    defineExpose({
        test: handleTest,
        content: (c: string) => {
            testContent.value = c;
        },
        clear: () => {
            testResults.value.length = 0;
        }
    })

    function handleTest() {
        console.log('ruleTester', 'handleTest', props.rule);

        if (!props.rule) return;
        const rule = props.rule;
        const ruleMatcher = (url: string) => {
            if (rule.isWildcard) {
                return wildcardToReg(rule.pattern).test(url);
            } else {
                return rule.pattern === url;
            }
        };
        console.log('ruleTester', 'handleTest', { ruleMatcher });
        testResults.value = testContent.value.split('\n').filter((url) => url.trim() !== '').map((url) => {
            url = formatRawUrl(url);
            return {
                url,
                isMatch: ruleMatcher(url)
            }
        });
    }
</script>