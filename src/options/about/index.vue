<template>
    <div v-html="strAboutContent"></div>
</template>

<script setup lang="ts">
import { onBeforeMount } from 'vue';

let strAboutContent = chrome.i18n.getMessage("aboutContent");
const strIssue = chrome.i18n.getMessage("issue");
const extName = chrome.runtime.getManifest().name;
const version = chrome.runtime.getManifest().version;
const author = chrome.runtime.getManifest().author as any;

onBeforeMount(() => {
    strAboutContent = strAboutContent.replace("{name}", extName).replace("{version}", version).replace("{author}", author);
})
</script>