import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\user\\AppData\\Local\\Google\\Chrome\\User Data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pathToExtension = path.join(__dirname, 'build', 'chrome-mv3-dev');

const screenshotDir = path.join(__dirname, 'screenshot');

console.log('扩展路径', pathToExtension);

const lang = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'de', 'fr', 'it', 'pt-BR', 'ru', 'vi', 'th', 'es', 'ar'];

(async () => {

    for (const language of lang) {

        // Setup
        const browser = await chromium.launchPersistentContext(userDataDir, {
            executablePath: chromePath,
            headless: false,
            args: [
                `--lang=${language}`,
            ]
        });
        const context = await browser.newContext({
            viewport: {
                width: 1280,
                height: 800,
            },
        });

        const page = await context.newPage();

        // 输出confirm，等待按回车
        console.log('请按回车键继续...');
        await new Promise((resolve) => process.stdin.on('data', () => resolve()));

        console.log('按了回车');




        await page.goto('chrome-extension://clkdhnogmaboaeiokmdihmpmecijbfcl/options.html#rules');

        // 截图
        await page.screenshot({ path: path.join(screenshotDir, `${language}_rules.png`) });

        await page.goto('chrome-extension://clkdhnogmaboaeiokmdihmpmecijbfcl/options.html#logs');

        // 截图
        await page.screenshot({ path: path.join(screenshotDir, `${language}_logs.png`) });

        // Teardown
        // await context.close();
        await browser.close();
    }
})();