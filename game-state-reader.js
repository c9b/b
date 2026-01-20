import { WOLF } from 'wolf.js';

/**
 * 📖 Game State Reader - قارئ حالة اللعبة
 * 
 * يقرأ البيانات الحقيقية من بوت Jockey:
 * - الطاقة
 * - المهارات (سرعة، تحمل، رشاقة)
 * - المستوى
 * - XP
 * - النقاط
 * - معلومات الحيوان
 */

class GameStateReader {
  constructor(client, targetBotId = 80277459) {
    this.client = client;
    this.targetBotId = targetBotId;
    
    // آخر حالة معروفة
    this.lastState = null;
    this.lastUpdate = null;
  }
  
  /**
   * 📊 قراءة الحالة الكاملة
   */
  async readFullState() {
    console.log('📖 قراءة حالة اللعبة...');
    
    try {
      // انتظار 2 ثانية للتأكد من الاتصال
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // إرسال أمر العرض (view)
      const response = await this.sendCommand('!سباق عرض');
      
      if (!response) {
        console.log('⚠️ لم يرد البوت');
        return this.lastState;
      }
      
      // تحليل الرد
      const state = this.parseStateResponse(response);
      
      // حفظ الحالة
      this.lastState = state;
      this.lastUpdate = Date.now();
      
      console.log('✅ تم قراءة الحالة');
      
      return state;
      
    } catch (error) {
      console.error('❌ خطأ في قراءة الحالة:', error.message);
      return this.lastState;
    }
  }
  
  /**
   * 📨 إرسال أمر وانتظار الرد
   */
  async sendCommand(command, timeout = 15000) {
    return new Promise((resolve, reject) => {
      let resolved = false;
      
      // معالج الرد
      const handler = (message) => {
        if (resolved) return;
        if (message.sourceSubscriberId !== this.targetBotId) return;
        
        // وجدنا الرد!
        resolved = true;
        this.client.off('privateMessage', handler);
        clearTimeout(timeoutId);
        
        resolve(message.body);
      };
      
      // تسجيل المعالج
      this.client.on('privateMessage', handler);
      
      // إرسال الأمر
      this.client.messaging.sendPrivateMessage(this.targetBotId, command)
        .catch(error => {
          if (resolved) return;
          resolved = true;
          this.client.off('privateMessage', handler);
          clearTimeout(timeoutId);
          reject(error);
        });
      
      // timeout
      const timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        this.client.off('privateMessage', handler);
        resolve(null); // لا نرفض، نرجع null
      }, timeout);
    });
  }
  
  /**
   * 🔍 تحليل رد الحالة (HTML Message Pack)
   */
  parseStateResponse(response) {
    const state = {
      energy: null,
      stats: { speed: null, stamina: null, agility: null },
      level: null,
      xp: null,
      progress: null,
      points: null,
      animalName: null,
      animalType: null,
      totalRaces: null,
      racesWon: null,
      avgPosition: null,
      raw: response
    };
    
    try {
      // البوت يرد بـ HTML Message Pack
      // نستخرج البيانات من HTML
      
      // الطاقة: <p class="jockey-mp-view__content__energyPercentage">100%</p>
      const energyMatch = response.match(/energyPercentage">(\d+)%</);
      if (energyMatch) {
        state.energy = parseInt(energyMatch[1]);
      }
      
      // المستوى: <p class="jockey-mp-view__content__levelText">2</p>
      const levelMatch = response.match(/levelText">(\d+)</);
      if (levelMatch) {
        state.level = parseInt(levelMatch[1]);
      }
      
      // التحمل: <div class="jockey-mp-view__content__statStm"><p style="text-align: left;">1</p>
      const staminaMatch = response.match(/statStm"><p[^>]*>(\d+)</);
      if (staminaMatch) {
        state.stats.stamina = parseInt(staminaMatch[1]);
      }
      
      // السرعة: <div class="jockey-mp-view__content__statSpd"><p style="text-align: left;">2</p>
      const speedMatch = response.match(/statSpd"><p[^>]*>(\d+)</);
      if (speedMatch) {
        state.stats.speed = parseInt(speedMatch[1]);
      }
      
      // الرشاقة: <div class="jockey-mp-view__content__statAgi"><p style="text-align: left;">2</p>
      const agilityMatch = response.match(/statAgi"><p[^>]*>(\d+)</);
      if (agilityMatch) {
        state.stats.agility = parseInt(agilityMatch[1]);
      }
      
      // اسم الحيوان: <p class="jockey-mp-view__content__nameDiv">ب23</p>
      const nameMatch = response.match(/nameDiv">([^<]+)</);
      if (nameMatch) {
        state.animalName = nameMatch[1].trim();
      }
      
      // إجمالي السباقات: <div class="jockey-mp-view__content__statRaces"><p style="text-align: right;">1</p>
      const racesMatch = response.match(/statRaces"><p[^>]*>(\d+)</);
      if (racesMatch) {
        state.totalRaces = parseInt(racesMatch[1]);
      }
      
      // الفوز: <div class="jockey-mp-view__content__statWins"><p style="text-align: right;">1</p>
      const winsMatch = response.match(/statWins"><p[^>]*>(\d+)</);
      if (winsMatch) {
        state.racesWon = parseInt(winsMatch[1]);
      }
      
      // متوسط المركز: <div class="jockey-mp-view__content__statAvgPos"><p style="text-align: right;">1​</p>
      const avgPosMatch = response.match(/statAvgPos"><p[^>]*>(\d+)/);
      if (avgPosMatch) {
        state.avgPosition = parseInt(avgPosMatch[1]);
      }
      
      // حساب معدل الفوز
      if (state.totalRaces && state.racesWon !== null) {
        state.winRate = state.totalRaces > 0 ? state.racesWon / state.totalRaces : 0;
      }
      
    } catch (error) {
      console.error('⚠️ خطأ في تحليل الرد:', error.message);
    }
    
    return state;
  }
  
  /**
   * 📖 الحصول على الحالة (مع تحديث تلقائي)
   */
  async getState(forceUpdate = false) {
    // إذا الحالة قديمة أو مطلوب تحديث
    if (forceUpdate || !this.lastUpdate || (Date.now() - this.lastUpdate) > 60000) {
      return await this.readFullState();
    }
    
    // إرجاع الحالة المحفوظة
    return this.lastState;
  }
}

export default GameStateReader;
