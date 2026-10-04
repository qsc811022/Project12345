# 韓文起步

給繁體中文使用者的韓文入門網站，依據 `spec.md` v0.3 開發。以原生 HTML、CSS、JavaScript ES modules 製作，沒有框架、建置程序、API 金鑰或後端依賴，可直接部署到 GitHub Pages。

## 本機開啟

在專案根目錄執行：

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

瀏覽 <http://127.0.0.1:8000/>。請透過 HTTP 伺服器開啟；直接雙擊 `index.html` 的 `file://` 模式無法正常載入 JSON 教材。

也可使用內建的開發驗證伺服器（需要 Node.js）：

```powershell
node tests/server.mjs
```

瀏覽 <http://127.0.0.1:4173/>；<http://127.0.0.1:4173/korean-start/> 可模擬 GitHub Pages 的 repository 子路徑。以 `Ctrl+C` 停止伺服器。這個伺服器只用於本機驗證，部署時不需要執行。

## 第一版內容

- 15 個可標記完成的單元：5 個字母單元、5 個單字主題、5 個句型情境。
- 40 個字母、50 個單字、15 個句型、30 則文法，每則文法至少 2 個例句。
- 45 題題庫：字母、單字、句型各 15 題；也可選擇綜合練習。
- 每回 10 題，題目與選項隨機排列；即時解說、錯題回顧與各題庫最佳成績。
- 單字收藏、文法已讀、最近學習、完成百分比與資料重設。
- 手機側邊選單、鍵盤操作、減少動畫設定、語音支援降級。
- 所有教材文字以 DOM 文字節點呈現，不將資料注入 `innerHTML`。

首頁與關於教材暫用網站名稱「韓文起步」。首頁展示圖為自行製作的 SVG 介面示意，沒有引用第三方圖片、字體或品牌素材。

## 檔案分工

| 路徑 | 用途 |
| --- | --- |
| `index.html` | 頁面入口、全站導覽與對話框 |
| `404.html` | 找尋所屬網站首頁並導回，支援不同 repository 名稱 |
| `assets/css/` | Design Tokens、基礎版面、元件與頁面樣式 |
| `assets/js/app.js` | 載入教材、初始化與串接頁面 |
| `assets/js/router.js` | Hash 導覽、瀏覽紀錄與離開確認 |
| `assets/js/data.js` | 教材讀取與資料契約驗證 |
| `assets/js/storage.js` | 儲存驗證、進度、收藏、最佳成績 |
| `assets/js/quiz.js` | 抽題、選項隨機、單次提交與計分 |
| `assets/js/menu.js`、`speech.js` | 手機選單與韓文語音 |
| `assets/js/components/`、`pages/` | DOM 元件與各頁渲染 |
| `assets/images/` | 本站自行製作的圖示與展示圖 |
| `data/` | 與程式分離的 UTF-8 JSON 教材 |
| `tests/` | 瀏覽器邏輯檢查、Node 檢查及端到端驗證 |

## 教材編輯

依 `spec.md` 第 9.2 節的資料契約編輯 `data/*.json`。ID 使用小寫英數與連字號，發布後應維持固定。文法 ID 與單元 ID 不可重複。測驗選項透過 `correctOptionId` 判定，不能以選項位置當答案。

無效項目會略過並輸出 console 警告；沒有可用教材時提供重試畫面。題庫不足 10 題不會開始測驗。

目前總進度分母按規格固定為 15。若新增學習單元，應同步更新 `spec.md`、`pages/home.js`、`pages/progress.js` 與數量檢查。

### 教材校對紀錄

| 日期 | 校對者 | 範圍與限制 |
| --- | --- | --- |
| 2026-10-04 | Codex（AI 輔助初校） | 檢查字母分類、單字與句型翻譯、文法接續說明、題目答案一致性及教材資料契約。尚未經韓文教師或母語者人工複核；正式對外發布前建議完成複核並在此補登。 |

教材例句與中文說明為本專案自行編寫，並非摘錄外部教材。字母與音節結構參考 [韓國國立國語院：About Hangeul](https://www.korean.go.kr/eng_hangeul/principle/001.html)、[韓文字母與母音介紹](https://www.korean.go.kr/hangeul/cpron/01_elementary/02_vowel.htm)。延伸查詢可使用 [韓語基礎詞典](https://krdict.korean.go.kr/eng/mainAction?flag=PC)。

「11 個複合母音」沿用規格的教學分組，詳情頁特別說明這不等同於現代語音學中的雙母音分類。字母發音說明屬入門提示，語音朗讀不作為發音評分依據。

## 儲存與語音

只使用 `localStorage` 的 `korean-learning:v1`。資料包含完成單元、已讀文法、收藏、最佳成績與最近學習。資料格式版本為 1，損壞或不相容時回到預設狀態並提示；儲存受限時以記憶體維持本次操作。

不同 repository 若共用同一 `github.io` 網域，其 localStorage 來源相同，因此這個固定 key 會共用。若要在同一網域部署多個獨立版本，須同步修改 `storage.js` 中的 key。

Speech Synthesis API 會等待裝置語音清單，優先選用名稱或 voiceURI 帶有 Google 標記的韓文語音；沒有時依序使用裝置預設韓文語音、其他韓文語音。教材頁會顯示實際使用的聲音，語音清單更新時會重新選擇。若完全沒有韓文語音，朗讀按鈕停用並顯示原因。

這是瀏覽器提供的 Google 語音整合，不需要 API 金鑰，仍可直接部署到 GitHub Pages。Google 語音是否可用由瀏覽器及裝置決定，網站無法強制安裝；沒有串接 Google Cloud Text-to-Speech API。API 只能使用瀏覽器回傳的聲音，見 [MDN getVoices 文件](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices)。

測驗中重新整理或關閉分頁使用瀏覽器原生離開提示，提示文字及觸發條件由瀏覽器決定。

## 驗證

不需要安裝 npm 套件即可執行邏輯檢查（使用支援 ES modules 的近期 Node.js）：

```powershell
node tests/run.mjs
```

也可以開啟 <http://127.0.0.1:8000/tests/> 查看同一組檢查的瀏覽器結果。

端到端驗證腳本 `tests/browser.cjs` 使用 Playwright。它是選用的開發工具，網站執行不依賴它。已安裝 Playwright 時，先啟動 `node tests/server.mjs`，再執行：

```powershell
node tests/browser.cjs
```

可用 `PLAYWRIGHT_MODULE` 指向現有 `playwright` 或 `playwright-core` 模組；使用 `playwright-core` 時可用 `CHROME_PATH` 指定瀏覽器執行檔。`TEST_URL` 可覆寫預設 `http://127.0.0.1:4173/korean-start/`。

測試涵蓋完整教材路由、收藏與進度持久化、10 題作答、離開確認、返回／前進、手機選單焦點、360／768／1280px 版面、載入錯誤與重試、語音降級與重設資料。截圖與報告輸出至 `test-results/`，已加入 Git 忽略。

本次實測：15／15 邏輯檢查、16／16 Chromium 瀏覽器檢查通過。詳見 [驗證紀錄與未驗證環境](tests/VERIFICATION.md)。

Google 語音選擇的獨立驗證可用 `node tests/speech.cjs` 執行，沿用上述 Playwright 環境設定。6／6 情境通過，包含 Google 優先、語言篩選、系統語音備援及延遲載入；使用模擬語音清單驗證選擇和呼叫，沒有將測試結果視為實際聲音品質驗證。

## 部署至 GitHub Pages

1. 將專案檔案提交至指定 GitHub repository 的 `main` 分支，`index.html` 放在根目錄。
2. 在 repository 的 **Settings → Pages** 將來源選為 **Deploy from a branch**。
3. 選擇 `main` 與 `/ (root)`，儲存後等待部署完成。
4. 開啟 GitHub 顯示的 HTTPS 網址，通常為 `https://<帳號>.github.io/<repository>/`。
5. 檢查首頁、`#/grammar/eun-neun` 深層連結、重新整理、測驗、收藏及進度保存。

保留根目錄 `.nojekyll`，不需要設定建置指令。所有 CSS、JavaScript、圖片與資料皆以相對路徑載入，hash 路由不需要伺服器重寫。`404.html` 在誤入實體路徑時向父目錄尋找本站首頁。

本次交付為本機靜態網站；尚未推送 GitHub 或實際發布。
