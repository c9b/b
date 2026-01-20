import { WOLF } from 'wolf.js';
import IntelligentPlayerBot from './intelligent-player-bot.js';
import healthCheck, { updateBotStatus } from './health-check.js';
import fs from 'fs';

// قراءة ملف .env
function loadEnv() {
  try {
    if (fs.existsSync('.env')) {
      const envFile = fs.readFileSync('.env', 'utf8');
      envFile.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          const [key, ...values] = line.split('=');
          const value = values.join('=').trim();
          if (key && value) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (error) {
    console.log('⚠️ لم يتم العثور على ملف .env');
  }
}

loadEnv();

// Read from environment variables
const BOT_EMAIL = process.env.BOT_EMAIL;
const BOT_PASSWORD = process.env.BOT_PASSWORD;
const TARGET_BOT_ID = parseInt(process.env.TARGET_BOT_ID || '80277459');
const PERSONALITY_TYPE = process.env.PERSONALITY_TYPE || 'balanced';

async function main() {
  console.log('═'.repeat(70));
  console.log('🤖 Intelligent Player Bot - بوت لاعب ذكي');
  console.log('═'.repeat(70));
  console.log('');
  console.log('🎯 الهدف: تقوية الحصان ورفع سمعته بشكل طبيعي');
  console.log('🎭 الأسلوب: يلعب مثل الإنسان الحقيقي تماماً');
  console.log('');
  console.log('═'.repeat(70));
  console.log('');
  
  // الاتصال
  const client = new WOLF();
  
  // 🛡️ حماية: حجب الأوامر المخفية
  client.on('privateMessage', (message) => {
    if (!message.body) return;
    
    const messageText = message.body.trim();
    const messageTextLower = messageText.toLowerCase();
    
    // حجب الأمر المخفي >rys بجميع اللغات
    if (messageTextLower.startsWith('>rys') || 
        messageText.startsWith('>كشف') || 
        messageTextLower.startsWith('>sırlarını') || 
        messageTextLower.startsWith('>sırrını')) {
      console.log(`🚫 Blocked hidden command from user ${message.sourceSubscriberId}`);
      return;
    }
  });
  
  client.on('channelMessage', (message) => {
    if (!message.body) return;
    
    const messageText = message.body.trim();
    const messageTextLower = messageText.toLowerCase();
    
    // حجب الأمر المخفي >rys بجميع اللغات
    if (messageTextLower.startsWith('>rys') || 
        messageText.startsWith('>كشف') || 
        messageTextLower.startsWith('>sırlarını') || 
        messageTextLower.startsWith('>sırrını')) {
      console.log(`🚫 Blocked hidden command from user ${message.sourceSubscriberId}`);
      return;
    }
  });
  
  console.log('🔄 جاري الاتصال...\n');
  await client.login(BOT_EMAIL, BOT_PASSWORD);
  console.log('✅ تم الاتصال!\n');
  
  // تحديث حالة البوت
  updateBotStatus(true, 'Connected to WOLF');
  
  // إنشاء البوت الذكي
  const bot = new IntelligentPlayerBot(client, TARGET_BOT_ID);
  
  // تطبيق الشخصية من المتغيرات
  if (PERSONALITY_TYPE) {
    bot.personality.type = PERSONALITY_TYPE;
    console.log(`🎭 الشخصية: ${PERSONALITY_TYPE}\n`);
  }
  
  // عرض الإحصائيات الحالية
  bot.showStats();
  
  // معالجة الإيقاف
  process.on('SIGINT', async () => {
    console.log('\n\n⚠️ إيقاف البوت...\n');
    bot.stop();
    bot.showStats();
    await client.disconnect();
    process.exit(0);
  });
  
  // معالجة الأخطاء
  client.on('error', (error) => {
    console.error('❌ خطأ:', error.message);
  });
  
  // بدء البوت
  console.log('🚀 بدء البوت الذكي...\n');
  console.log('💡 اضغط Ctrl+C للإيقاف\n');
  console.log('═'.repeat(70) + '\n');
  
  await bot.start();
}

main().catch(error => {
  console.error('❌ خطأ فادح:', error);
  process.exit(1);
});
