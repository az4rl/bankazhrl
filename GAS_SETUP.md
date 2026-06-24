# Setup Google Apps Script untuk MyWallet AI

## Panduan Lengkap

### 1. Buat Google Apps Script Project
1. Buka https://script.google.com
2. Klik **"+ Project"** untuk membuat project baru
3. Beri nama project: **"MyWallet AI Server"**
4. Ganti kode di `Code.gs` dengan script di bawah

### 2. Konfigurasi API Keys
Di Google Apps Script, simpan API keys Anda di **Project Settings**:

1. Klik **Project Settings** (di sidebar kiri, bawah)
2. Scroll ke **Script Properties**
3. Klik **"+ Add script property"**
4. Tambahkan beberapa GEMINI_KEY dengan nilai dari https://aistudio.google.com/apikey:
   - Property: `GEMINI_KEY_1` → Value: `[your-gemini-api-key]`
   - Property: `GEMINI_KEY_2` → Value: `[another-key-jika-ada]` (opsional)
5. (Opsional) Tambahkan OpenRouter key:
   - Property: `OPENROUTER_API_KEY` → Value: `[your-openrouter-key]`

### 3. Deploy sebagai Web App
1. Klik **Deploy** (tombol biru di atas)
2. Pilih **"New deployment"**
3. Pilih tipe: **Web app**
4. Isi:
   - Execute as: **Me** (user@gmail.com)
   - Who has access: **Anyone**
5. Klik **Deploy**
6. Akan muncul URL deployment: `https://script.google.com/macros/d/[ID]/userweb`
7. **Copy URL ini** → paste ke MyWallet Settings > AI Insight > GAS URL

### 4. Kode untuk `Code.gs`

```javascript
function doPost(e) {
  var body = JSON.parse(e.postData.contents);
  if (body.action === "ai_insight") {
    var result = callGeminiAI(body.data, body.prompt);
    return ContentService.createTextOutput(JSON.stringify({ result: result }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllApiKeys() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var keys = [];
  
  for (var key in props) {
    if (key.indexOf('GEMINI_KEY') !== -1 && props[key]) {
      keys.push(props[key]);
    }
  }
  
  return keys.sort(function() { return 0.5 - Math.random(); });
}

function cleanOutput(text) {
  var aiText = text.replace(/```html/gi, "").replace(/```/g, "");
  return aiText.trim();
}

function callGeminiAI(data, prompt) {
  var apiKeys = getAllApiKeys();
  var openRouterKey = PropertiesService.getScriptProperties().getProperty('OPENROUTER_API_KEY');
  
  var geminiModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];
  
  var openRouterModels = [
    "openai/gpt-4o-mini",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-2.0-flash-001"
  ];
  
  var systemInstruction = `Anda adalah AI financial advisor untuk aplikasi MyWallet. Analisis data keuangan pribadi pengguna dengan detail dan actionable insights dalam bahasa Indonesia.

ATURAN OUTPUT (WAJIB):
1. Output WAJIB berupa HTML murni. DILARANG Markdown (**, *, #).
2. Gunakan format: <h3> untuk sub-judul, <p> untuk narasi, <ul><li> untuk bullet, <ol><li> untuk prioritas, <b> untuk emphasis.
3. JANGAN ulang detail per hari seperti robot. Rangkum tren, rata-rata, dan anomali saja.
4. Berikan analisis MENDALAM mengapa angka itu muncul.
5. Fokus pada insight actionable dan konkret untuk keputusan user.`;

  var geminiPayload = {
    "contents": [{ "parts": [{ "text": systemInstruction + "\n\nDATA:\n" + JSON.stringify(data) + "\n\nINSTRUKSI:\n" + prompt }] }]
  };
  
  // Try Gemini first
  for (var k = 0; k < apiKeys.length; k++) {
    var currentApiKey = apiKeys[k];
    
    for (var m = 0; m < geminiModels.length; m++) {
      var currentModel = geminiModels[m];
      var url = "https://generativelanguage.googleapis.com/v1beta/models/" + currentModel + ":generateContent?key=" + currentApiKey;
      
      try {
        var response = UrlFetchApp.fetch(url, {
          "method": "post",
          "contentType": "application/json",
          "payload": JSON.stringify(geminiPayload),
          "muteHttpExceptions": true,
          "timeout": 30
        });
        
        var responseCode = response.getResponseCode();
        var resultText = response.getContentText();
        
        if (responseCode === 200) {
          var result = JSON.parse(resultText);
          if (result.candidates && result.candidates[0].content.parts[0].text) {
            return cleanOutput(result.candidates[0].content.parts[0].text);
          }
        } 
        else if (responseCode === 429 || responseCode === 403 || responseCode === 404 || responseCode >= 500) {
          Logger.log("Gemini Key " + k + " Model " + currentModel + " gagal (" + responseCode + ")");
          continue;
        } 
        else {
          Logger.log("Error Gemini Key " + k + " Model " + currentModel + ": " + resultText);
          continue;
        }
      } catch(e) {
        Logger.log("Exception Gemini: " + e);
        continue;
      }
    }
  }
  
  // Fallback ke OpenRouter
  if (openRouterKey) {
    var openRouterPayload = {
      "messages": [
        { "role": "system", "content": systemInstruction },
        { "role": "user", "content": "DATA: " + JSON.stringify(data) + " INSTRUKSI: " + prompt }
      ]
    };
    
    for (var o = 0; o < openRouterModels.length; o++) {
      var currentORModel = openRouterModels[o];
      openRouterPayload.model = currentORModel;
      
      try {
        var orResponse = UrlFetchApp.fetch("https://openrouter.ai/api/v1/chat/completions", {
          "method": "post",
          "headers": {
            "Authorization": "Bearer " + openRouterKey,
            "HTTP-Referer": "https://mywallet.example.com"
          },
          "contentType": "application/json",
          "payload": JSON.stringify(openRouterPayload),
          "muteHttpExceptions": true,
          "timeout": 30
        });
        
        var orResponseCode = orResponse.getResponseCode();
        var orResultText = orResponse.getContentText();
        
        if (orResponseCode === 200) {
          var orResult = JSON.parse(orResultText);
          if (orResult.choices && orResult.choices[0].message && orResult.choices[0].message.content) {
            return cleanOutput(orResult.choices[0].message.content);
          }
        } else {
          Logger.log("OpenRouter Model " + currentORModel + " gagal (" + orResponseCode + ")");
          continue;
        }
      } catch(e) {
        Logger.log("Exception OpenRouter: " + e);
        continue;
      }
    }
  }
  
  return "Gagal memuat analisis. Pastikan API keys sudah benar di Project Settings.";
}
```

### 5. Atur di MyWallet Settings

1. Buka MyWallet → Pengaturan
2. Scroll ke **AI Insight**
3. Masukkan Google Apps Script URL (dari step 3)
4. Klik **Simpan**

### 6. Test

1. Buka MyWallet → AI Insight
2. Pilih salah satu prompt (Summary, Prediksi, Tips, dll)
3. Klik tombol prompt
4. Tunggu respons dari AI (pertama kali bisa lambat ~5-10 detik)

## Troubleshooting

**Error: "Request gagal"**
- Pastikan URL GAS benar (copy-paste dari deployment)
- Pastikan deployment tipe **Web app** dengan akses **Anyone**

**Error: "Gagal memuat analisis"**
- Cek Project Settings → Script Properties apakah GEMINI_KEY sudah ada
- Pastikan API key valid di https://aistudio.google.com/apikey
- Check Execution log di GAS untuk error details

**Gemini model not found**
- Update nama model di `geminiModels` array dengan yang tersedia di https://ai.google.dev/

---

Selesai! MyWallet sekarang menggunakan AI Gemini via Google Apps Script untuk analisis keuangan yang lebih baik.
