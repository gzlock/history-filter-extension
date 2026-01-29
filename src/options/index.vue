<template>
    <div class="height100Percent">
        <el-tabs type="border-card" class="main_tabs height100Percent" v-model="tab">
            <el-tab-pane :label=tabEditor name="rules">
                <Rules />
            </el-tab-pane>
            <el-tab-pane :label="tabLog" name="logs">
                <Log />
            </el-tab-pane>
            <el-tab-pane :label=tabAbout name="about">
                <About />
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<style>

    html,
    body {
        margin: 0;
        padding: 0;
        height: 100vh;
    }

    body {
        box-sizing: border-box;
        padding: 10px;
    }

    .main_tabs .el-tab-pane {
        height: 100%;
    }
</style>

<script lang="ts" setup>    ;
    import ElementPlus from "element-plus";
    import "element-plus/dist/index.css";
    import { onMounted, ref, type App } from 'vue';
    import About from './about/index.vue';
    import Rules from './rules/index.vue';
    import Log from './log/index.vue';


    const tabEditor = chrome.i18n.getMessage("tabNameEditor");
    const tabLog = chrome.i18n.getMessage("tabNameLog");
    const tabAbout = chrome.i18n.getMessage("tabNameAbout");

    const tab = ref('rules');

    defineOptions({
        prepare(app: App) {
            // Use any plugins here:
            // app.use
            app.use(ElementPlus);
            document.title = chrome.i18n.getMessage('extensionName');

            // 增加关闭页面前的警告
            // window.addEventListener("beforeunload", (e) => {
            //     e.preventDefault();
            //     e.returnValue = "";
            // });
        }
    });

    // 识别url的hashtag，切换到对应的tab
    onMounted(() => {
        const hash = window.location.hash;
        if (hash) {
            const tabName = hash.replace('#', '');
            if (tabName === 'rules' || tabName === 'logs' || tabName === 'about') {
                tab.value = tabName;
            }
        }
    })
</script>