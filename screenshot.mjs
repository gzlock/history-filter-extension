import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
const { exec } = await import('node:child_process');
const { promisify } = await import('node:util');
const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const chromiumPath = 'C:\\Users\\user\\Downloads\\Compressed\\chrome-win\\chrome.exe';
const userDataDir = path.join(__dirname, 'user-data');

const screenshotDir = path.join(__dirname, 'screenshot');

const pathToExtension = path.join(__dirname, 'build', 'chrome-mv3-screenshot');


const languages = ['zh-CN', 'zh-TW', 'ko', 'ja', 'en', 'de', 'fr', 'it', 'pt-BR', 'ru', 'vi', 'th', 'es', 'ar'];

(async () => {


    console.log('Executing build command...');
    await execAsync('npm run build');
    await execAsync('npm run package');
    await execAsync('npm run build:screenshot');


    for (const language of languages) {
        console.log('当前语言', language);


        // Setup
        const browser = await chromium.launchPersistentContext(userDataDir, {
            executablePath: chromiumPath,
            headless: true,
            viewport: {
                width: 1280,
                height: 800,
            },
            args: [
                `--lang=${language}`,
                `--load-extension=${pathToExtension}`,
                `--disable-extensions-except=${pathToExtension}`,
            ]
        });


        // 输出confirm，等待按回车
        // console.log('请按回车键继续...');
        // await new Promise((resolve) => process.stdin.on('data', () => resolve()));

        // console.log('按了回车');

        let page = await browser.newPage();

        // 输出confirm，等待按回车
        // console.log('请按回车键继续...');
        // await new Promise((resolve) => process.stdin.on('data', () => resolve()));

        // console.log('按了回车');


        await page.goto('chrome-extension://clkdhnogmaboaeiokmdihmpmecijbfcl/options.html');

        await page.waitForTimeout(500);

        await page.locator('.el-table__body .el-table__row').first().click();

        // 截图
        await page.screenshot({ path: path.join(screenshotDir, `${language}_rules.png`) });

        await page.close();

        page = await browser.newPage();

        await page.goto('chrome-extension://clkdhnogmaboaeiokmdihmpmecijbfcl/options.html#logs');

        await page.waitForTimeout(1000);

        // 截图
        await page.screenshot({ path: path.join(screenshotDir, `${language}_logs.png`) });


        await page.waitForTimeout(1000);

        // Teardown
        // await context.close();
        await browser.close();
    }
})();