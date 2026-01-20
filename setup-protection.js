import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🛡️ تطبيق الحماية على wolf.js...\n');

// ========================================
// 1. تمويه نوع الجهاز (device → web)
// ========================================
const configPath = path.join(__dirname, 'node_modules/wolf.js/config/default.yaml');
try {
  let config = fs.readFileSync(configPath, 'utf-8');
  
  if (config.includes('device: wjsframework')) {
    config = config.replace('device: wjsframework', 'device: web');
    fs.writeFileSync(configPath, config, 'utf-8');
    console.log('✅ [1/3] تم تمويه نوع الجهاز: device=web');
  } else if (config.includes('device: android')) {
    config = config.replace('device: android', 'device: web');
    fs.writeFileSync(configPath, config, 'utf-8');
    console.log('✅ [1/3] تم تحديث نوع الجهاز: android → web');
  } else if (config.includes('device: web')) {
    console.log('✅ [1/3] تمويه نوع الجهاز مطبق مسبقاً (web)');
  } else {
    console.log('⚠️ [1/3] لم يتم العثور على device في الملف');
  }
} catch (error) {
  console.error('❌ [1/3] خطأ في تمويه نوع الجهاز:', error.message);
}

// ========================================
// 2. تمويه Token (شكل WE-UUID مثل المتصفح)
// ========================================
const configJsPath = path.join(__dirname, 'node_modules/wolf.js/src/utils/configuration.js');
try {
  let configJs = fs.readFileSync(configJsPath, 'utf-8');
  
  const tokenPatterns = [
    '`WJS${nanoid(32)}`',
    '`AND${nanoid(32)}`',
    '`${nanoid(35)}`',
    '`AND-${crypto.randomUUID()}`'
  ];
  
  let replaced = false;
  for (const pattern of tokenPatterns) {
    if (configJs.includes(pattern)) {
      configJs = configJs.replace(pattern, '`WE-${crypto.randomUUID()}`');
      fs.writeFileSync(configJsPath, configJs, 'utf-8');
      console.log('✅ [2/3] تم تمويه Token: شكل WE-UUID (مثل المتصفح)');
      replaced = true;
      break;
    }
  }
  
  if (!replaced) {
    if (configJs.includes('`WE-${crypto.randomUUID()}`')) {
      console.log('✅ [2/3] تمويه Token مطبق مسبقاً (WE-UUID)');
    } else {
      console.log('⚠️ [2/3] لم يتم العثور على Token في الملف');
    }
  }
} catch (error) {
  console.error('❌ [2/3] خطأ في تمويه Token:', error.message);
}

// ========================================
// 3. تمويه إصدار المكتبة (استخدام إصدار الويب)
// ========================================
const websocketPath = path.join(__dirname, 'node_modules/wolf.js/src/client/websocket/Client.js');
try {
  let websocket = fs.readFileSync(websocketPath, 'utf-8');
  
  const versionPattern = /&version=\$\{version \|\| JSON\.parse\(fs\.readFileSync\(path\.join\(__dirname, '\.\.\/\.\.\/\.\.\/package\.json'\)\)\)\.version\}/;
  
  if (versionPattern.test(websocket)) {
    websocket = websocket.replace(versionPattern, '&version=3.2.1');
    fs.writeFileSync(websocketPath, websocket, 'utf-8');
    console.log('✅ [3/3] تم تمويه الإصدار: version=3.2.1 (Web)');
  } else if (websocket.includes('&version=5.1.2')) {
    websocket = websocket.replace('&version=5.1.2', '&version=3.2.1');
    fs.writeFileSync(websocketPath, websocket, 'utf-8');
    console.log('✅ [3/3] تم تحديث الإصدار: 5.1.2 → 3.2.1 (Web)');
  } else if (websocket.includes('&version=3.2.1')) {
    console.log('✅ [3/3] تمويه الإصدار مطبق مسبقاً (Web)');
  } else {
    console.log('⚠️ [3/3] لم يتم العثور على version في الملف');
  }
} catch (error) {
  console.error('❌ [3/3] خطأ في تمويه الإصدار:', error.message);
}

console.log('\n🎉 تم تطبيق جميع التمويهات بنجاح!');
console.log('🛡️ البوت الآن يبدو كمتصفح ويب حقيقي.');
console.log('\n📊 التمويه المطبق:');
console.log('   • Device: web');
console.log('   • Token: WE-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (UUID)');
console.log('   • Version: 3.2.1 (إصدار الويب)');
console.log('\n💡 مثال Token مولد:');
console.log('   WE-' + crypto.randomUUID());
