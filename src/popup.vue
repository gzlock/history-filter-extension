<template>
  <div class="container">
    <div class="text-center">
      <el-switch class="rule-switch" v-model="isBlockRules" :active-text="strBlockRules" :inactive-text="strAllowRules"
        @change="handleIsBlockRulesChange" />
    </div>
    <div class="text-center">
      <el-text>{{ strInterceptedCount }}: </el-text>
      <el-text type="success">{{ count }}</el-text>
    </div>
    <el-divider />
    <div>
      <el-text v-if="rules.length === 0">{{ strNoActiveRules }}</el-text>
      <div v-else>
        <el-text>{{ strActiveRules }}:</el-text>
        <div class="rules">
          <div v-for="r in rules" :key="r">
            <el-text type="info" size="small">{{ r }}</el-text>
          </div>
        </div>
      </div>
    </div>
    <el-divider />
    <el-button-group class="text-center" style="display: flex;justify-content:center;">
      <el-button type="primary" @click="openEditor">{{ strOpenEditor }}</el-button>
      <el-button @click="openLog">{{ strOpenLog }}</el-button>
    </el-button-group>
  </div>
</template>

<style>
  .container {
    min-width: 400px;
  }

  .text-center {
    text-align: center;
  }

  .rules {
    max-height: 200px;
    overflow-y: auto;
  }
</style>

<script setup lang="ts">
  import 'element-plus/theme-chalk/dark/css-vars.css'
  import '~/style.css';
  import ElementPlus from "element-plus";
  import "element-plus/dist/index.css";
  import type { App } from "vue";
  import { onMounted, ref } from "vue";
  import { saveIsBlockRules } from "~utils";
  import { useDark, useToggle } from '@vueuse/core';


  const strBlockRules = chrome.i18n.getMessage("blockRulesShort");
  const strAllowRules = chrome.i18n.getMessage("allowRulesShort");
  const strNoActiveRules = chrome.i18n.getMessage("noActiveRules");
  const strActiveRules = chrome.i18n.getMessage("activeRules");
  const strInterceptedCount = chrome.i18n.getMessage("interceptedCount");
  const strOpenEditor = chrome.i18n.getMessage("openEditor");
  const strOpenLog = chrome.i18n.getMessage("openLog");


  const isBlockRules = ref(false);
  const count = ref(0);
  const rules = ref<Array<string>>([]);


  const isDark = useDark({
    selector: 'html', // 默认切换 <html> 上的 class
    attribute: 'class',
    valueDark: 'dark',
    valueLight: 'light',
  });
  const toggleDark = useToggle(isDark) as any;

  defineOptions({
    prepare(app: App) {
      // Use any plugins here:
      // app.use
      app.use(ElementPlus)
    }
  });

  onMounted(async () => {
    chrome.runtime.sendMessage({ type: 'popup' });
  });

  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === 'popup') {
      rules.value = request.data.rules;
      count.value = request.data.count;
      isBlockRules.value = request.data.isBlockRules;
      const isDarkMode = request.data.darkMode;
      if (isDarkMode && !isDark)
        toggleDark();
      sendResponse({ success: true });
    }
  });
  const handleIsBlockRulesChange = async (newValue: boolean) => {
    await saveIsBlockRules(newValue);
    chrome.runtime.sendMessage({ type: 'updated' });
  }
  const openEditor = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html#rules") });
  }
  const openLog = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html#logs") });
  }
</script>
