import { WOLF } from 'wolf.js';
import SmartRaceManager from './smart-race-manager.js';
import GameStateReader from './game-state-reader.js';
import fs from 'fs';

/**
 * 🤖 Intelligent Player Bot - بوت لاعب ذكي
 * 
 * يلعب مثل الإنسان الحقيقي:
 * - أوقات عشوائية (مو دقيقة)
 * - أخطاء عشوائية (ينسى أحياناً)
 * - استراحات طبيعية (نوم، أكل، شغل)
 * - قرارات ذكية (متى يدرب، متى يسابق)
 * - تطور تدريجي (مو سريع مرة)
 */

class IntelligentPlayerBot {
  constructor(client, targetBotId = 80277459) {
    this.client = client;
    this.targetBotId = targetBotId;
    
    // مدير السباقات الذكي
    this.raceManager = new SmartRaceManager(client, targetBotId);
    
    // قارئ حالة اللعبة
    this.stateReader = new GameStateReader(client, targetBotId);
    
    // حالة اللاعب
    this.state = {
      energy: 100,
      stats: { speed: 0, stamina: 0, agility: 0 },
      level: 1,
      xp: 0,
      points: 0,
      reputation: 0,
      
      // إحصائيات
      totalTrainings: 0,
      totalRaces: 0,
      racesWon: 0,
      racesLost: 0,
      
      // حالة النشاط
      isActive: false,
      lastAction: null,
      lastActionTime: null,
      
      // جدول اليوم
      todayTrainings: 0,
      todayRaces: 0,
      todayStartTime: Date.now()
    };
    
    // الشخصية (يحدد أسلوب اللعب)
    this.personality = {
      // نوع اللاعب
      type: this.randomChoice(['casual', 'competitive', 'balanced']),
      
      // أوقات النشاط (ساعات اليوم)
      activeHours: this.generateActiveHours(),
      
      // مدة الجلسات (دقائق)
      sessionDuration: { min: 15, max: 90 },
      
      // فترات الراحة (دقائق)
      breakDuration: { min: 30, max: 180 },
      
      // احتمال الأخطاء (0-1)
      mistakeProbability: 0.05, // 5% احتمال خطأ
      
      // السرعة (تأخير بين الأوامر بالثواني)
      actionDelay: { min: 3, max: 15 },
      
      // التفضيلات
      preferTraining: 0.6, // 60% تدريب، 40% سباق
      preferSpeed: 0.4,    // 40% سرعة
      preferStamina: 0.3,  // 30% تحمل
      preferAgility: 0.3   // 30% رشاقة
    };
    
    // السجل
    this.log = [];
    
    console.log('🤖 تم إنشاء البوت الذكي!');
    console.log(`📊 الشخصية: ${this.personality.type}`);
    console.log(`⏰ ساعات النشاط: ${this.personality.activeHours.length} ساعة/يوم`);
  }
  
  /**
   * 🎲 اختيار عشوائي من قائمة
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  /**
   * 🎲 رقم عشوائي بين min و max
   */
  randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * 🎲 احتمال (0-1)
   */
  randomChance(probability) {
    return Math.random() < probability;
  }
  
  /**
   * ⏰ توليد ساعات النشاط العشوائية
   */
  generateActiveHours() {
    const hours = [];
    const numHours = this.randomBetween(6, 16); // 6-16 ساعة نشاط
    
    // أوقات شائعة للعب (مساء وليل)
    const commonHours = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1];
    
    // اختر ساعات عشوائية
    while (hours.length < numHours) {
      const hour = this.randomChance(0.7) 
        ? this.randomChoice(commonHours)
        : this.randomBetween(0, 23);
      
      if (!hours.includes(hour)) {
        hours.push(hour);
      }
    }
    
    return hours.sort((a, b) => a - b);
  }
  
  /**
   * ⏰ هل الوقت الحالي وقت نشاط؟
   */
  isActiveTime() {
    const currentHour = new Date().getHours();
    return this.personality.activeHours.includes(currentHour);
  }
  
  /**
   * 💤 انتظار عشوائي (يبدو طبيعي)
   */
  async humanDelay() {
    const delay = this.randomBetween(
      this.personality.actionDelay.min * 1000,
      this.personality.actionDelay.max * 1000
    );
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * 📝 تسجيل حدث
   */
  addLog(type, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      type,
      message,
      data
    };
    
    this.log.push(entry);
    console.log(`[${entry.time}] ${type}: ${message}`);
    
    // حفظ السجل
    fs.writeFileSync('bot_activity_log.json', JSON.stringify(this.log, null, 2));
    
    // حفظ الحالة
    this.saveState();
  }
  
  /**
   * 💾 حفظ الحالة
   */
  saveState() {
    fs.writeFileSync('bot_state.json', JSON.stringify(this.state, null, 2));
  }
  
  /**
   * 📖 تحميل الحالة
   */
  loadState() {
    try {
      if (fs.existsSync('bot_state.json')) {
        const saved = JSON.parse(fs.readFileSync('bot_state.json', 'utf8'));
        this.state = { ...this.state, ...saved };
        console.log('✅ تم تحميل الحالة المحفوظة');
      }
    } catch (error) {
      console.log('⚠️ فشل تحميل الحالة:', error.message);
    }
  }
  
  /**
   * 🎯 اتخاذ قرار: ماذا أفعل الآن؟
   * 
   * نظام قرار ذكي متعدد المستويات:
   * 1. فحوصات أساسية (طاقة، وقت، حدود)
   * 2. تحليل الحالة الحالية
   * 3. حساب الأولويات
   * 4. اتخاذ القرار الأمثل
   */
  async decideNextAction() {
    // تحديث الطاقة
    await this.updateEnergy();
    
    // ═══════════════════════════════════════════════════════════
    // المستوى 1: فحوصات أساسية (شروط إجبارية)
    // ═══════════════════════════════════════════════════════════
    
    // 1.1 فحص الطاقة الحرجة
    if (this.state.energy < 10) {
      return { 
        action: 'rest', 
        reason: 'طاقة حرجة (< 10%)',
        priority: 'critical'
      };
    }
    
    // 1.2 فحص الوقت
    if (!this.isActiveTime()) {
      return { 
        action: 'rest', 
        reason: 'خارج أوقات النشاط',
        priority: 'time'
      };
    }
    
    // 1.3 فحص الحد اليومي
    const dailyLimit = this.getDailyLimit();
    if (this.state.todayTrainings + this.state.todayRaces >= dailyLimit) {
      return { 
        action: 'rest', 
        reason: `وصلت حد اليوم (${dailyLimit})`,
        priority: 'limit'
      };
    }
    
    // ═══════════════════════════════════════════════════════════
    // المستوى 2: تحليل الحالة
    // ═══════════════════════════════════════════════════════════
    
    const analysis = this.analyzeCurrentState();
    
    // ═══════════════════════════════════════════════════════════
    // المستوى 3: حساب الأولويات
    // ═══════════════════════════════════════════════════════════
    
    const priorities = this.calculatePriorities(analysis);
    
    // ═══════════════════════════════════════════════════════════
    // المستوى 4: اتخاذ القرار
    // ═══════════════════════════════════════════════════════════
    
    return this.makeDecision(priorities, analysis);
  }
  
  /**
   * 📊 تحليل الحالة الحالية
   */
  analyzeCurrentState() {
    // حساب متوسط المهارات
    const avgStat = (this.state.stats.speed + this.state.stats.stamina + this.state.stats.agility) / 3;
    
    // تحديد المرحلة
    let phase;
    if (avgStat < 10) phase = 'beginner';        // مبتدئ
    else if (avgStat < 30) phase = 'intermediate'; // متوسط
    else if (avgStat < 60) phase = 'advanced';     // متقدم
    else phase = 'expert';                         // خبير
    
    // تحليل توازن المهارات
    const maxStat = Math.max(this.state.stats.speed, this.state.stats.stamina, this.state.stats.agility);
    const minStat = Math.min(this.state.stats.speed, this.state.stats.stamina, this.state.stats.agility);
    const statBalance = maxStat > 0 ? minStat / maxStat : 1;
    const isBalanced = statBalance > 0.7; // متوازن إذا الفرق أقل من 30%
    
    // تحليل معدل الفوز
    const winRate = this.state.totalRaces > 0 
      ? this.state.racesWon / this.state.totalRaces 
      : 0;
    
    // تحليل النشاط اليومي
    const todayTotal = this.state.todayTrainings + this.state.todayRaces;
    const todayRatio = this.state.todayRaces > 0
      ? this.state.todayTrainings / this.state.todayRaces
      : Infinity;
    
    // تحليل الطاقة
    let energyStatus;
    if (this.state.energy >= 80) energyStatus = 'high';
    else if (this.state.energy >= 40) energyStatus = 'medium';
    else if (this.state.energy >= 20) energyStatus = 'low';
    else energyStatus = 'critical';
    
    return {
      // المهارات
      avgStat,
      maxStat,
      minStat,
      statBalance,
      isBalanced,
      weakestStat: this.getWeakestStat(),
      strongestStat: this.getStrongestStat(),
      
      // المرحلة
      phase,
      
      // الأداء
      winRate,
      totalRaces: this.state.totalRaces,
      racesWon: this.state.racesWon,
      
      // النشاط
      todayTotal,
      todayTrainings: this.state.todayTrainings,
      todayRaces: this.state.todayRaces,
      todayRatio,
      
      // الطاقة
      energy: this.state.energy,
      energyStatus,
      canRace: this.state.energy >= 20,
      canTrain: this.state.energy >= 10
    };
  }
  
  /**
   * 🎯 حساب الأولويات
   */
  calculatePriorities(analysis) {
    const priorities = {
      train: 0,
      race: 0,
      rest: 0
    };
    
    // ═══════════════════════════════════════════════════════════
    // عوامل التدريب
    // ═══════════════════════════════════════════════════════════
    
    // 1. المرحلة (كلما أضعف، كلما أكثر تدريب)
    if (analysis.phase === 'beginner') priorities.train += 50;
    else if (analysis.phase === 'intermediate') priorities.train += 30;
    else if (analysis.phase === 'advanced') priorities.train += 15;
    else priorities.train += 5;
    
    // 2. التوازن (إذا غير متوازن، درب المهارة الضعيفة)
    if (!analysis.isBalanced) {
      priorities.train += 20;
    }
    
    // 3. معدل الفوز (إذا منخفض، درب أكثر)
    if (analysis.winRate < 0.3 && analysis.totalRaces > 5) {
      priorities.train += 25;
    }
    
    // 4. نسبة النشاط اليومي (إذا سابقت كثير، درب)
    if (analysis.todayRatio < 1 && analysis.todayRaces > 3) {
      priorities.train += 15;
    }
    
    // 5. الشخصية
    if (this.personality.type === 'balanced') {
      priorities.train += 10;
    }
    
    // ═══════════════════════════════════════════════════════════
    // عوامل السباق
    // ═══════════════════════════════════════════════════════════
    
    // 1. المرحلة (كلما أقوى، كلما أكثر سباق)
    if (analysis.phase === 'expert') priorities.race += 50;
    else if (analysis.phase === 'advanced') priorities.race += 35;
    else if (analysis.phase === 'intermediate') priorities.race += 20;
    else priorities.race += 5;
    
    // 2. معدل الفوز (إذا عالي، سابق أكثر)
    if (analysis.winRate > 0.5 && analysis.totalRaces > 5) {
      priorities.race += 30;
    } else if (analysis.winRate > 0.3 && analysis.totalRaces > 5) {
      priorities.race += 15;
    }
    
    // 3. نسبة النشاط اليومي (إذا دربت كثير، سابق)
    if (analysis.todayRatio > 3 && analysis.todayTrainings > 5) {
      priorities.race += 20;
    }
    
    // 4. الشخصية
    if (this.personality.type === 'competitive') {
      priorities.race += 25;
    } else if (this.personality.type === 'casual') {
      priorities.race += 5;
    }
    
    // 5. الطاقة (إذا عالية، استغلها في السباق)
    if (analysis.energyStatus === 'high') {
      priorities.race += 15;
    }
    
    // ═══════════════════════════════════════════════════════════
    // عوامل الراحة
    // ═══════════════════════════════════════════════════════════
    
    // 1. الطاقة المنخفضة
    if (analysis.energyStatus === 'low') {
      priorities.rest += 30;
    } else if (analysis.energyStatus === 'critical') {
      priorities.rest += 60;
    }
    
    // 2. النشاط الكثير
    if (analysis.todayTotal > dailyLimit * 0.8) {
      priorities.rest += 20;
    }
    
    // 3. الشخصية
    if (this.personality.type === 'casual') {
      priorities.rest += 10;
    }
    
    // ═══════════════════════════════════════════════════════════
    // تطبيق القيود
    // ═══════════════════════════════════════════════════════════
    
    // لا يمكن السباق بدون طاقة كافية
    if (!analysis.canRace) {
      priorities.race = 0;
    }
    
    // لا يمكن التدريب بدون طاقة كافية
    if (!analysis.canTrain) {
      priorities.train = 0;
    }
    
    return priorities;
  }
  
  /**
   * 🎲 اتخاذ القرار النهائي
   */
  makeDecision(priorities, analysis) {
    // إذا كل الأولويات صفر، راحة
    const total = priorities.train + priorities.race + priorities.rest;
    if (total === 0) {
      return {
        action: 'rest',
        reason: 'لا توجد أولويات',
        priorities,
        analysis
      };
    }
    
    // اختيار عشوائي مرجح بالأولويات
    const rand = Math.random() * total;
    
    if (rand < priorities.train) {
      return {
        action: 'train',
        reason: this.getTrainReason(analysis),
        priorities,
        analysis
      };
    } else if (rand < priorities.train + priorities.race) {
      return {
        action: 'race',
        reason: this.getRaceReason(analysis),
        priorities,
        analysis
      };
    } else {
      return {
        action: 'rest',
        reason: this.getRestReason(analysis),
        priorities,
        analysis
      };
    }
  }
  
  /**
   * 📝 سبب التدريب
   */
  getTrainReason(analysis) {
    if (analysis.phase === 'beginner') return 'مبتدئ - تحتاج تدريب مكثف';
    if (!analysis.isBalanced) return `تحسين ${analysis.weakestStat} (غير متوازن)`;
    if (analysis.winRate < 0.3) return 'معدل فوز منخفض - تحتاج تحسين';
    if (analysis.todayRaces > analysis.todayTrainings) return 'توازن النشاط اليومي';
    return 'تحسين المهارات';
  }
  
  /**
   * 📝 سبب السباق
   */
  getRaceReason(analysis) {
    if (analysis.phase === 'expert') return 'خبير - وقت السباق!';
    if (analysis.winRate > 0.5) return `معدل فوز عالي (${(analysis.winRate * 100).toFixed(0)}%)`;
    if (analysis.todayTrainings > analysis.todayRaces * 2) return 'دربت كثير - وقت السباق';
    if (analysis.energyStatus === 'high') return 'طاقة عالية - استغلال الفرصة';
    return 'اختبار المهارات';
  }
  
  /**
   * 📝 سبب الراحة
   */
  getRestReason(analysis) {
    if (analysis.energyStatus === 'critical') return 'طاقة حرجة';
    if (analysis.energyStatus === 'low') return 'طاقة منخفضة';
    if (analysis.todayTotal > 15) return 'نشاط كثير اليوم';
    return 'استراحة طبيعية';
  }
  
  /**
   * 🔍 أضعف مهارة
   */
  getWeakestStat() {
    const stats = this.state.stats;
    if (stats.speed <= stats.stamina && stats.speed <= stats.agility) return 'speed';
    if (stats.stamina <= stats.agility) return 'stamina';
    return 'agility';
  }
  
  /**
   * 🔍 أقوى مهارة
   */
  getStrongestStat() {
    const stats = this.state.stats;
    if (stats.speed >= stats.stamina && stats.speed >= stats.agility) return 'speed';
    if (stats.stamina >= stats.agility) return 'stamina';
    return 'agility';
  }
  
  /**
   * 📊 الحد اليومي للأنشطة
   */
  getDailyLimit() {
    switch (this.personality.type) {
      case 'casual': return this.randomBetween(5, 10);
      case 'competitive': return this.randomBetween(15, 25);
      case 'balanced': return this.randomBetween(10, 15);
      default: return 10;
    }
  }
  
  /**
   * ⚡ تحديث الطاقة من اللعبة الحقيقية
   */
  async updateEnergy() {
    try {
      // قراءة الحالة الكاملة من اللعبة
      const gameState = await this.stateReader.getState();
      
      if (gameState && gameState.energy !== null) {
        // تحديث من اللعبة الحقيقية
        this.state.energy = gameState.energy;
        
        // تحديث المهارات أيضاً
        if (gameState.stats.speed !== null) {
          this.state.stats.speed = gameState.stats.speed;
        }
        if (gameState.stats.stamina !== null) {
          this.state.stats.stamina = gameState.stats.stamina;
        }
        if (gameState.stats.agility !== null) {
          this.state.stats.agility = gameState.stats.agility;
        }
        
        // تحديث المستوى والنقاط
        if (gameState.level !== null) {
          this.state.level = gameState.level;
        }
        if (gameState.xp !== null) {
          this.state.xp = gameState.xp;
        }
        if (gameState.points !== null) {
          this.state.points = gameState.points;
        }
        
        console.log(`✅ تحديث الحالة: طاقة ${this.state.energy}%, مهارات ${this.state.stats.speed}/${this.state.stats.stamina}/${this.state.stats.agility}`);
        
      } else {
        // فشل القراءة، استخدم التقدير
        console.log('⚠️ فشل قراءة الحالة، استخدام التقدير');
        
        const now = Date.now();
        if (this.state.lastActionTime) {
          const minutesPassed = (now - this.state.lastActionTime) / 60000;
          const energyGained = Math.floor(minutesPassed * 2); // 2% كل دقيقة
          
          this.state.energy = Math.min(100, this.state.energy + energyGained);
        }
      }
      
    } catch (error) {
      console.error('❌ خطأ في تحديث الطاقة:', error.message);
      
      // استخدام التقدير كخطة احتياطية
      const now = Date.now();
      if (this.state.lastActionTime) {
        const minutesPassed = (now - this.state.lastActionTime) / 60000;
        const energyGained = Math.floor(minutesPassed * 2);
        
        this.state.energy = Math.min(100, this.state.energy + energyGained);
      }
    }
  }
  
  /**
   * 🏋️ تدريب
   */
  async train() {
    this.addLog('ACTION', '🏋️ بدء التدريب...');
    
    // اختيار نوع التدريب بذكاء
    const trainType = this.chooseTrainingType();
    
    // الأوامر
    const commands = {
      speed: '!سباق تدريب سرعة',
      stamina: '!سباق تدريب تحمل',
      agility: '!سباق تدريب رشاقة',
      all: '!سباق تدريب كل'
    };
    
    try {
      // تأخير طبيعي
      await this.humanDelay();
      
      // إرسال الأمر
      await this.client.messaging.sendPrivateMessage(this.targetBotId, commands[trainType]);
      
      // تحديث الحالة
      this.state.energy -= 10;
      this.state.totalTrainings++;
      this.state.todayTrainings++;
      this.state.lastAction = 'train';
      this.state.lastActionTime = Date.now();
      
      // تحديث المهارات (تقديري)
      if (trainType === 'all') {
        this.state.stats.speed += 1;
        this.state.stats.stamina += 1;
      } else {
        this.state.stats[trainType] += 1;
      }
      
      this.addLog('SUCCESS', `✅ تدريب ${trainType} نجح!`, {
        energy: this.state.energy,
        stats: this.state.stats
      });
      
      return { success: true, type: trainType };
      
    } catch (error) {
      this.addLog('ERROR', `❌ فشل التدريب: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 🎯 اختيار نوع التدريب بذكاء
   */
  chooseTrainingType() {
    const stats = this.state.stats;
    const avgStat = (stats.speed + stats.stamina + stats.agility) / 3;
    
    // ═══════════════════════════════════════════════════════════
    // استراتيجية 1: في البداية - درب الكل
    // ═══════════════════════════════════════════════════════════
    if (avgStat < 5) {
      // 50% احتمال تدريب الكل في البداية
      if (this.randomChance(0.5)) {
        return 'all';
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // استراتيجية 2: توازن المهارات
    // ═══════════════════════════════════════════════════════════
    const maxStat = Math.max(stats.speed, stats.stamina, stats.agility);
    const minStat = Math.min(stats.speed, stats.stamina, stats.agility);
    const difference = maxStat - minStat;
    
    // إذا الفرق كبير (> 10)، درب الأضعف
    if (difference > 10) {
      const weakest = this.getWeakestStat();
      
      // 70% احتمال تدريب الأضعف
      if (this.randomChance(0.7)) {
        return weakest;
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // استراتيجية 3: التخصص (بعد المستوى المتوسط)
    // ═══════════════════════════════════════════════════════════
    if (avgStat > 30) {
      const strongest = this.getStrongestStat();
      
      // 40% احتمال تدريب الأقوى (التخصص)
      if (this.randomChance(0.4)) {
        return strongest;
      }
    }
    
    // ═══════════════════════════════════════════════════════════
    // استراتيجية 4: تدريب الكل (أحياناً)
    // ═══════════════════════════════════════════════════════════
    if (this.randomChance(0.15)) {
      return 'all';
    }
    
    // ═══════════════════════════════════════════════════════════
    // استراتيجية 5: حسب التفضيلات (افتراضي)
    // ═══════════════════════════════════════════════════════════
    const rand = Math.random();
    
    if (rand < this.personality.preferSpeed) {
      return 'speed';
    } else if (rand < this.personality.preferSpeed + this.personality.preferStamina) {
      return 'stamina';
    } else {
      return 'agility';
    }
  }
  
  /**
   * 🏁 سباق
   */
  async race() {
    this.addLog('ACTION', '🏁 محاولة السباق...');
    
    try {
      // تأخير طبيعي
      await this.humanDelay();
      
      // استخدام المدير الذكي
      const result = await this.raceManager.smartRace();
      
      if (result.success) {
        // تحديث الحالة
        this.state.energy -= 20;
        this.state.totalRaces++;
        this.state.todayRaces++;
        this.state.lastAction = 'race';
        this.state.lastActionTime = Date.now();
        
        this.addLog('SUCCESS', `✅ سباق ${result.action} في القناة ${result.channelId}`, {
          energy: this.state.energy
        });
        
        return { success: true, ...result };
        
      } else {
        this.addLog('WARNING', `⚠️ فشل السباق: ${result.reason}`);
        return { success: false, ...result };
      }
      
    } catch (error) {
      this.addLog('ERROR', `❌ خطأ في السباق: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * 💤 راحة
   */
  async rest(duration) {
    const minutes = duration || this.randomBetween(
      this.personality.breakDuration.min,
      this.personality.breakDuration.max
    );
    
    this.addLog('REST', `💤 راحة لمدة ${minutes} دقيقة`);
    
    this.state.isActive = false;
    
    await new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
    
    this.state.isActive = true;
    
    this.addLog('ACTIVE', '✨ عودة للنشاط');
  }
  
  /**
   * 🎮 جلسة لعب واحدة
   */
  async playSession() {
    const duration = this.randomBetween(
      this.personality.sessionDuration.min,
      this.personality.sessionDuration.max
    );
    
    this.addLog('SESSION_START', `🎮 بدء جلسة لعب (${duration} دقيقة)`);
    
    const endTime = Date.now() + (duration * 60 * 1000);
    
    while (Date.now() < endTime && this.state.isActive) {
      // قرار: ماذا أفعل؟
      const decision = await this.decideNextAction();
      
      this.addLog('DECISION', `🤔 القرار: ${decision.action} (${decision.reason})`);
      
      switch (decision.action) {
        case 'train':
          await this.train();
          break;
          
        case 'race':
          await this.race();
          break;
          
        case 'rest':
          this.addLog('SESSION_END', '🏁 نهاية الجلسة');
          return;
      }
      
      // أحياناً يأخذ استراحة قصيرة
      if (this.randomChance(0.3)) {
        const shortBreak = this.randomBetween(1, 5);
        this.addLog('BREAK', `☕ استراحة قصيرة (${shortBreak} دقيقة)`);
        await new Promise(resolve => setTimeout(resolve, shortBreak * 60 * 1000));
      }
    }
    
    this.addLog('SESSION_END', '🏁 نهاية الجلسة');
  }
  
  /**
   * 🚀 بدء البوت
   */
  async start() {
    this.addLog('BOT_START', '🚀 بدء البوت الذكي');
    
    // تحميل الحالة المحفوظة
    this.loadState();
    
    // قراءة الحالة الحقيقية من اللعبة
    this.addLog('INIT', '📖 قراءة حالة اللعبة...');
    await this.updateEnergy();
    
    // فحص القنوات
    this.addLog('INIT', '🔍 فحص القنوات...');
    await this.raceManager.discoverChannels();
    
    this.state.isActive = true;
    
    // حلقة اللعب الرئيسية
    while (this.state.isActive) {
      // تحقق من الوقت
      if (this.isActiveTime()) {
        // جلسة لعب
        await this.playSession();
        
        // راحة بين الجلسات
        await this.rest();
        
      } else {
        // خارج أوقات النشاط
        const nextActiveHour = this.getNextActiveHour();
        const waitMinutes = this.getMinutesUntil(nextActiveHour);
        
        this.addLog('SLEEP', `😴 نوم حتى الساعة ${nextActiveHour}:00 (${waitMinutes} دقيقة)`);
        
        await new Promise(resolve => setTimeout(resolve, waitMinutes * 60 * 1000));
      }
      
      // تحديث يوم جديد
      this.checkNewDay();
    }
  }
  
  /**
   * ⏰ الساعة النشطة التالية
   */
  getNextActiveHour() {
    const currentHour = new Date().getHours();
    
    // ابحث عن أقرب ساعة نشطة
    for (const hour of this.personality.activeHours) {
      if (hour > currentHour) {
        return hour;
      }
    }
    
    // إذا ما فيه، خذ أول ساعة من اليوم التالي
    return this.personality.activeHours[0];
  }
  
  /**
   * ⏰ الدقائق حتى ساعة معينة
   */
  getMinutesUntil(targetHour) {
    const now = new Date();
    const target = new Date();
    target.setHours(targetHour, 0, 0, 0);
    
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    return Math.floor((target - now) / 60000);
  }
  
  /**
   * 📅 تحقق من يوم جديد
   */
  checkNewDay() {
    const daysPassed = Math.floor((Date.now() - this.state.todayStartTime) / 86400000);
    
    if (daysPassed >= 1) {
      this.addLog('NEW_DAY', '📅 يوم جديد!', {
        yesterdayTrainings: this.state.todayTrainings,
        yesterdayRaces: this.state.todayRaces
      });
      
      this.state.todayTrainings = 0;
      this.state.todayRaces = 0;
      this.state.todayStartTime = Date.now();
    }
  }
  
  /**
   * 🛑 إيقاف البوت
   */
  stop() {
    this.addLog('BOT_STOP', '🛑 إيقاف البوت');
    this.state.isActive = false;
    this.saveState();
  }
  
  /**
   * 📊 عرض الإحصائيات
   */
  showStats() {
    console.log('\n' + '═'.repeat(70));
    console.log('📊 إحصائيات البوت');
    console.log('═'.repeat(70));
    console.log(`\n⚡ الطاقة: ${this.state.energy}%`);
    console.log(`📈 المستوى: ${this.state.level}`);
    console.log(`⭐ XP: ${this.state.xp}`);
    console.log(`💰 النقاط: ${this.state.points}`);
    console.log(`🏆 السمعة: ${this.state.reputation}`);
    console.log(`\n🎯 المهارات:`);
    console.log(`   السرعة: ${this.state.stats.speed}`);
    console.log(`   التحمل: ${this.state.stats.stamina}`);
    console.log(`   الرشاقة: ${this.state.stats.agility}`);
    console.log(`\n📊 الإحصائيات:`);
    console.log(`   إجمالي التدريبات: ${this.state.totalTrainings}`);
    console.log(`   إجمالي السباقات: ${this.state.totalRaces}`);
    console.log(`   السباقات المكسوبة: ${this.state.racesWon}`);
    console.log(`   السباقات المخسورة: ${this.state.racesLost}`);
    console.log(`\n📅 اليوم:`);
    console.log(`   تدريبات: ${this.state.todayTrainings}`);
    console.log(`   سباقات: ${this.state.todayRaces}`);
    console.log('═'.repeat(70) + '\n');
  }
}

export default IntelligentPlayerBot;
