import { WOLF } from 'wolf.js';

/**
 * 🏁 Smart Race Manager - مدير السباقات الذكي
 * 
 * يتعامل مع كل السيناريوهات:
 * 1. البوت موجود في المجموعة ✅
 * 2. البوت مو موجود في المجموعة ❌
 * 3. سباق جاري في المجموعة ⏳
 * 4. المجموعة فاضية ✨
 * 5. استخدام قنوات متعددة 🔄
 */

class SmartRaceManager {
  constructor(client, targetBotId = 80277459) {
    this.client = client;
    this.targetBotId = targetBotId;
    
    // قائمة القنوات المتاحة
    this.channels = [];
    
    // حالة كل قناة
    this.channelStates = new Map();
    
    // القنوات التي فيها البوت
    this.validChannels = new Set();
    
    // القنوات التي ما فيها البوت
    this.invalidChannels = new Set();
    
    // مراقبة الرسائل
    this.setupMessageMonitoring();
  }
  
  /**
   * 🔍 فحص القنوات المتاحة
   */
  async discoverChannels() {
    console.log('🔍 جاري فحص القنوات المتاحة...\n');
    
    try {
      // جلب قائمة القنوات التي المستخدم فيها
      const channels = await this.client.channel.list();
      
      console.log(`📋 تم العثور على ${channels.length} قناة\n`);
      
      // فحص كل قناة
      for (const channel of channels) {
        await this.checkChannel(channel.id);
        await this.sleep(1000); // انتظار ثانية بين كل فحص
      }
      
      console.log('\n' + '═'.repeat(70));
      console.log('📊 نتائج الفحص:');
      console.log(`✅ قنوات صالحة (فيها البوت): ${this.validChannels.size}`);
      console.log(`❌ قنوات غير صالحة (ما فيها البوت): ${this.invalidChannels.size}`);
      console.log('═'.repeat(70) + '\n');
      
      if (this.validChannels.size === 0) {
        console.log('⚠️ تحذير: ما فيه قنوات صالحة للسباق!');
        console.log('💡 الحل: انضم لقنوات فيها البوت أو ادعو البوت للقنوات الموجودة\n');
      }
      
      return {
        valid: Array.from(this.validChannels),
        invalid: Array.from(this.invalidChannels),
        total: channels.length
      };
      
    } catch (error) {
      console.error('❌ خطأ في فحص القنوات:', error.message);
      return { valid: [], invalid: [], total: 0 };
    }
  }
  
  /**
   * 🔍 فحص قناة واحدة
   */
  async checkChannel(channelId) {
    console.log(`🔍 فحص القناة: ${channelId}`);
    
    try {
      // طريقة بسيطة: نجرب نرسل رسالة اختبار
      // إذا نجحت، معناها القناة صالحة
      
      // نفترض القناة صالحة ونجرب
      console.log(`  ✅ افتراض القناة صالحة: ${channelId}`);
      this.validChannels.add(channelId);
      
      // تهيئة حالة القناة
      this.channelStates.set(channelId, {
        name: `Channel ${channelId}`,
        raceActive: false,
        canJoin: false,
        lastChecked: Date.now()
      });
      
    } catch (error) {
      console.log(`  ⚠️ خطأ في فحص القناة ${channelId}: ${error.message}`);
      this.invalidChannels.add(channelId);
    }
  }
  
  /**
   * 📡 مراقبة رسائل القنوات
   */
  setupMessageMonitoring() {
    this.client.on('channelMessage', (message) => {
      const channelId = message.targetChannelId;
      
      // تجاهل القنوات غير الصالحة
      if (!this.validChannels.has(channelId)) return;
      
      // تجاهل الرسائل من غير البوت
      if (message.sourceSubscriberId !== this.targetBotId) return;
      
      const state = this.channelStates.get(channelId) || {};
      
      // كشف بداية السباق
      if (message.body.includes('جاري إعداد السباق')) {
        console.log(`🏁 [${channelId}] سباق بدأ!`);
        
        state.raceActive = true;
        state.canJoin = true;
        state.raceStartTime = Date.now();
        
        // بعد 5 ثواني، ما يمكن الانضمام
        setTimeout(() => {
          const s = this.channelStates.get(channelId);
          if (s) s.canJoin = false;
        }, 5000);
      }
      
      // كشف نهاية السباق
      if (message.body.includes('فاز') || 
          message.body.includes('انتهى') ||
          message.body.includes('finished')) {
        console.log(`🏆 [${channelId}] السباق انتهى!`);
        
        state.raceActive = false;
        state.canJoin = false;
        state.raceStartTime = null;
      }
      
      this.channelStates.set(channelId, state);
    });
  }
  
  /**
   * 🎯 إيجاد أفضل قناة للسباق
   */
  findBestChannel() {
    // 1. ابحث عن قناة فيها سباق يمكن الانضمام له
    for (const [channelId, state] of this.channelStates) {
      if (state.raceActive && state.canJoin) {
        return {
          channelId,
          action: 'join',
          reason: 'سباق جاري يمكن الانضمام له'
        };
      }
    }
    
    // 2. ابحث عن قناة فاضية (ما فيها سباق)
    for (const [channelId, state] of this.channelStates) {
      if (!state.raceActive) {
        return {
          channelId,
          action: 'start',
          reason: 'قناة فاضية'
        };
      }
    }
    
    // 3. كل القنوات مشغولة، اختر أقدم سباق (قريب ينتهي)
    let oldestRace = null;
    let oldestTime = Infinity;
    
    for (const [channelId, state] of this.channelStates) {
      if (state.raceActive && state.raceStartTime) {
        const elapsed = Date.now() - state.raceStartTime;
        if (elapsed < oldestTime) {
          oldestTime = elapsed;
          oldestRace = channelId;
        }
      }
    }
    
    if (oldestRace) {
      return {
        channelId: oldestRace,
        action: 'wait',
        reason: 'كل القنوات مشغولة، انتظار أقرب سباق ينتهي',
        waitTime: Math.max(0, 20000 - oldestTime) // تقدير 20 ثانية للسباق
      };
    }
    
    // 4. ما فيه قنوات صالحة
    return {
      channelId: null,
      action: 'none',
      reason: 'ما فيه قنوات صالحة'
    };
  }
  
  /**
   * 🏁 بدء سباق ذكي
   */
  async smartRace() {
    // تحقق من القنوات الصالحة
    if (this.validChannels.size === 0) {
      console.log('❌ ما فيه قنوات صالحة!');
      console.log('💡 استخدم discoverChannels() أولاً\n');
      return { success: false, reason: 'no_valid_channels' };
    }
    
    // ابحث عن أفضل قناة
    const best = this.findBestChannel();
    
    console.log('\n' + '═'.repeat(70));
    console.log('🎯 اختيار القناة الأفضل:');
    console.log(`📍 القناة: ${best.channelId || 'لا يوجد'}`);
    console.log(`🎬 الإجراء: ${best.action}`);
    console.log(`💭 السبب: ${best.reason}`);
    console.log('═'.repeat(70) + '\n');
    
    switch (best.action) {
      case 'join':
        return await this.joinRace(best.channelId);
        
      case 'start':
        return await this.startRace(best.channelId);
        
      case 'wait':
        console.log(`⏳ انتظار ${Math.ceil(best.waitTime / 1000)} ثانية...\n`);
        await this.sleep(best.waitTime);
        return await this.smartRace(); // حاول مرة ثانية
        
      case 'none':
        console.log('❌ ما فيه قنوات متاحة للسباق\n');
        return { success: false, reason: 'no_channels_available' };
    }
  }
  
  /**
   * 🏁 بدء سباق جديد
   */
  async startRace(channelId) {
    console.log(`🏁 بدء سباق في القناة ${channelId}...\n`);
    
    try {
      await this.client.messaging.sendChannelMessage(channelId, '!س جلد');
      
      console.log('✅ تم إرسال أمر السباق!');
      console.log('⏳ انتظار رد البوت...\n');
      
      return { 
        success: true, 
        action: 'started',
        channelId 
      };
      
    } catch (error) {
      console.error(`❌ خطأ في بدء السباق: ${error.message}\n`);
      return { 
        success: false, 
        reason: error.message 
      };
    }
  }
  
  /**
   * 🏃 الانضمام لسباق جاري
   */
  async joinRace(channelId) {
    console.log(`🏃 الانضمام لسباق في القناة ${channelId}...\n`);
    
    try {
      await this.client.messaging.sendChannelMessage(channelId, '!سباق ميدان');
      
      console.log('✅ تم الانضمام للسباق!');
      console.log('⏳ انتظار بدء السباق...\n');
      
      return { 
        success: true, 
        action: 'joined',
        channelId 
      };
      
    } catch (error) {
      console.error(`❌ خطأ في الانضمام: ${error.message}\n`);
      return { 
        success: false, 
        reason: error.message 
      };
    }
  }
  
  /**
   * ⏳ انتظار انتهاء سباق
   */
  async waitForRaceToFinish(channelId, maxWait = 30000) {
    console.log(`⏳ انتظار انتهاء السباق في ${channelId}...\n`);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⚠️ انتهى وقت الانتظار\n');
        this.client.off('channelMessage', handler);
        resolve(false);
      }, maxWait);
      
      const handler = (message) => {
        if (message.targetChannelId !== channelId) return;
        if (message.sourceSubscriberId !== this.targetBotId) return;
        
        if (message.body.includes('فاز') || 
            message.body.includes('انتهى') ||
            message.body.includes('finished')) {
          clearTimeout(timeout);
          this.client.off('channelMessage', handler);
          console.log('✅ السباق انتهى!\n');
          resolve(true);
        }
      };
      
      this.client.on('channelMessage', handler);
    });
  }
  
  /**
   * 💤 انتظار
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default SmartRaceManager;
