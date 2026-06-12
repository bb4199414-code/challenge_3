// Habits & Gamification (XP, Levels, Streaks, Badges) Module

const Habits = {
  // Default Daily Eco Actions
  DEFAULT_HABITS: [
    { id: 'h1', title: 'Commuted by bike, walk, or public transit', difficulty: 'easy', impact: 2.2, xp: 15, checked: false },
    { id: 'h2', title: 'Unplugged vampire electronics & idle adapters', difficulty: 'easy', impact: 0.5, xp: 8, checked: false },
    { id: 'h3', title: 'Air-dried a load of laundry instead of using dryer', difficulty: 'easy', impact: 1.2, xp: 10, checked: false },
    { id: 'h4', title: 'Ate fully plant-based (vegan) meals today', difficulty: 'medium', impact: 3.5, xp: 25, checked: false },
    { id: 'h5', title: 'Kept shower time under 5 minutes', difficulty: 'medium', impact: 1.5, xp: 12, checked: false },
    { id: 'h6', title: 'Adjusted home thermostat by 2°C (lower in winter/higher in summer)', difficulty: 'hard', impact: 4.8, xp: 30, checked: false },
    { id: 'h7', title: 'Composted organic scraps & recycled all packaging', difficulty: 'medium', impact: 1.8, xp: 15, checked: false }
  ],

  // Badge list definitions
  BADGES: [
    { id: 'b_calc', name: 'Green Starter', desc: 'Completed initial carbon audit.', icon: '🌱' },
    { id: 'b_habit_first', name: 'First Step', desc: 'Complete your first carbon saving action.', icon: '👣' },
    { id: 'b_streak_3', name: 'Carbon Defender', desc: 'Reach a 3-day action streak.', icon: '🔥' },
    { id: 'b_offset_first', name: 'Neutrality Pledge', desc: 'Simulate offsetting your first 1.0 Ton of emissions.', icon: '🍀' },
    { id: 'b_level_3', name: 'Eco-Champion', desc: 'Reach Level 3 (XP milestones).', icon: '👑' },
    { id: 'b_offset_full', name: 'Net-Zero Hero', desc: 'Simulate offsetting 100% of your annual carbon.', icon: '🌍' }
  ],

  // Active state
  state: {
    list: [],
    xp: 0,
    level: 1,
    streak: 0,
    totalSavedCo2Kg: 0,
    unlockedBadges: [],
    lastActiveDate: null
  },

  init() {
    this.loadState();
    this.setupListeners();
    this.render();
  },

  /**
   * Sanitize user-supplied text to prevent XSS.
   * Strips HTML tags and escapes special characters.
   * @param {string} str - Raw user input
   * @returns {string} Safe plain text
   */
  sanitizeInput(str) {
    if (typeof str !== 'string') return '';
    const stripped = str.replace(/<[^>]*>/g, '');
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
    return stripped.replace(/[&<>"'/]/g, (char) => map[char] || char).trim();
  },

  loadState() {
    const saved = localStorage.getItem('climatica_habits_state');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        
        const today = new Date().toDateString();
        if (this.state.lastActiveDate !== today) {
          if (this.state.lastActiveDate) {
            const lastDate = new Date(this.state.lastActiveDate);
            const diffTime = Math.abs(new Date(today) - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 1) {
              this.state.streak = 0; 
            }
          }
          
          if (Array.isArray(this.state.list)) {
            this.state.list.forEach(h => { h.checked = false; });
          }
          this.state.lastActiveDate = today;
          this.saveState();
        }
      } catch (e) {
        console.error("Error loading habits state, resetting.", e);
        this.resetToDefaults();
      }
    } else {
      this.resetToDefaults();
    }
  },

  resetToDefaults() {
    this.state = {
      list: this.DEFAULT_HABITS.map(h => ({ ...h })),
      xp: 0,
      level: 1,
      streak: 0,
      totalSavedCo2Kg: 0,
      unlockedBadges: ['b_calc'], 
      lastActiveDate: new Date().toDateString()
    };
    this.saveState();
  },

  saveState() {
    localStorage.setItem('climatica_habits_state', JSON.stringify(this.state));
  },

  setupListeners() {
    const form = document.getElementById('form-custom-habit');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddCustomHabit();
      });
    }
  },

  handleAddCustomHabit() {
    const titleInput = document.getElementById('custom-habit-title');
    const difficultyInput = document.getElementById('custom-habit-difficulty');
    const errorEl = document.getElementById('form-error-msg');
    if (!titleInput || !difficultyInput) return;

    const rawTitle = titleInput.value;
    const title = this.sanitizeInput(rawTitle);

    if (!title || title.length < 3) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a habit description of at least 3 characters.';
        errorEl.classList.remove('visually-hidden');
      }
      titleInput.setAttribute('aria-invalid', 'true');
      titleInput.focus();
      return;
    }

    if (title.length > 120) {
      if (errorEl) {
        errorEl.textContent = 'Habit description must be 120 characters or fewer.';
        errorEl.classList.remove('visually-hidden');
      }
      titleInput.setAttribute('aria-invalid', 'true');
      return;
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('visually-hidden');
    }
    titleInput.removeAttribute('aria-invalid');

    const difficulty = difficultyInput.value;
    const allowedDifficulties = ['easy', 'medium', 'hard'];
    const safeDifficulty = allowedDifficulties.includes(difficulty) ? difficulty : 'medium';

    let impact = 1.0;
    let xp = 10;
    if (safeDifficulty === 'medium') { impact = 2.5; xp = 20; }
    else if (safeDifficulty === 'hard') { impact = 5.0; xp = 30; }

    // FIXED: Formulated microsecond safety offsets around custom key tracking to avoid sequence clashes
    const uniqueId = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newHabit = {
      id: uniqueId,
      title,
      difficulty: safeDifficulty,
      impact,
      xp,
      checked: false
    };

    this.state.list.push(newHabit);
    this.saveState();
    this.render();

    titleInput.value = '';

    if (window.App && typeof window.App.showToast === 'function') {
      window.App.showToast(`Custom action "${title}" added!`, 'info');
    }
  },

  toggleHabit(id, isChecked) {
    const habit = this.state.list.find(h => h.id === id);
    if (!habit) return;

    habit.checked = isChecked;

    if (isChecked) {
      this.state.totalSavedCo2Kg += habit.impact;
      this.addXP(habit.xp);
      this.unlockBadge('b_habit_first');
      this.updateStreak();

      if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast(`Completed: +${habit.impact} kg CO₂ saved & +${habit.xp} XP!`, 'success');
      }
    } else {
      this.state.totalSavedCo2Kg = Math.max(0, this.state.totalSavedCo2Kg - habit.impact);
      this.state.xp = Math.max(0, this.state.xp - habit.xp);
      if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast(`Removed action: -${habit.impact} kg CO₂ & -${habit.xp} XP`, 'info');
      }
    }

    this.saveState();
    this.render();
    
    if (window.App && typeof window.App.onHabitsStateChange === 'function') {
      window.App.onHabitsStateChange();
    }
  },

  updateStreak() {
    const checkedCount = this.state.list.filter(h => h.checked).length;
    if (checkedCount === 1) {
      this.state.streak++;
      if (this.state.streak >= 3) {
        this.unlockBadge('b_streak_3');
      }
    }
  },

  addXP(amount) {
    this.state.xp += amount;
    const nextLevelThreshold = 1000;

    if (this.state.xp >= nextLevelThreshold) {
      this.state.level++;
      this.state.xp -= nextLevelThreshold;
      
      if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast(`🎉 Level Up! You are now Level ${this.state.level}!`, 'level-up');
      }

      if (this.state.level >= 3) {
        this.unlockBadge('b_level_3');
      }
    }
  },

  unlockBadge(badgeId) {
    if (!this.state.unlockedBadges.includes(badgeId)) {
      this.state.unlockedBadges.push(badgeId);
      this.saveState();
      
      const badge = this.BADGES.find(b => b.id === badgeId);
      if (badge && window.App && typeof window.App.showToast === 'function') {
        window.App.showToast(`🏆 Badge Unlocked: ${badge.icon} ${badge.name}!`, 'level-up');
      }
    }
  },

  render() {
    this.renderHabitLists();
    this.renderBadgeGrid();
    this.renderStats();
  },

  renderStats() {
    // FIXED: Wrapped all component metric hooks within safe DOM verification blocks
    const statCo2El = document.getElementById('habits-stat-co2');
    if (statCo2El) statCo2El.textContent = `${this.state.totalSavedCo2Kg.toFixed(1)} kg`;
    
    const statXpEl = document.getElementById('habits-stat-xp');
    if (statXpEl) statXpEl.textContent = this.state.xp;
    
    const navLvlName = document.getElementById('nav-level-name');
    const navLvlBadge = document.getElementById('nav-level-badge');
    const navXpVal = document.getElementById('nav-xp-val');

    if (navLvlName && navLvlBadge) {
      const levelConfigs = [
        { name: "Eco-Novice", badge: "🌱" },
        { name: "Green Cadet", badge: "☘️" },
        { name: "Earth Defender", badge: "🌿" },
        { name: "Carbon Warrior", badge: "🌲" },
        { name: "Planet Guardian", badge: "🌍" }
      ];
      const configIndex = Math.min(levelConfigs.length - 1, this.state.level - 1);
      navLvlName.textContent = levelConfigs[configIndex].name;
      navLvlBadge.textContent = levelConfigs[configIndex].badge;
    }
    if (navXpVal) {
      navXpVal.textContent = this.state.xp;
    }
  },

  renderHabitLists() {
    const dashboardList = document.getElementById('dashboard-quick-habits');
    const habitsFullList = document.getElementById('habits-full-list');

    if (habitsFullList) {
      habitsFullList.innerHTML = '';
      this.state.list.forEach(h => {
        habitsFullList.appendChild(this.createHabitRowElement(h, 'full'));
      });
    }

    if (dashboardList) {
      dashboardList.innerHTML = '';
      const quickItems = this.state.list.slice(0, 3);
      quickItems.forEach(h => {
        dashboardList.appendChild(this.createHabitRowElement(h, 'quick'));
      });
    }
  },

  createHabitRowElement(habit, prefix) {
    const row = document.createElement('div');
    row.className = `habit-row ${habit.checked ? 'completed' : ''}`;
    
    // FIXED: Formulated absolute unique IDs and proper matching label descriptors for input layouts
    const checkboxId = `chk_${prefix}_${habit.id}`;
    const detailsId = `det_${prefix}_${habit.id}`;
    
    row.innerHTML = `
      <div class="checkbox-wrapper">
        <input type="checkbox" id="${checkboxId}" ${habit.checked ? 'checked' : ''} aria-describedby="${detailsId}">
        <label for="${checkboxId}" class="checkmark" aria-label="Mark action as completed"></label>
      </div>
      <div class="habit-details" id="${detailsId}">
        <div class="habit-title">${habit.title}</div>
        <div class="habit-meta">
          <span class="habit-impact">-${habit.impact.toFixed(1)} kg CO₂e</span>
          <span class="habit-xp">+${habit.xp} XP</span>
          <span class="habit-difficulty" aria-label="Difficulty level">${habit.difficulty.toUpperCase()}</span>
        </div>
      </div>
    `;

    const checkbox = row.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        this.toggleHabit(habit.id, e.target.checked);
      });
    }

    return row;
  },

  renderBadgeGrid() {
    const grid = document.getElementById('badges-grid-container');
    if (!grid) return;

    grid.innerHTML = '';

    this.BADGES.forEach(badge => {
      const isUnlocked = this.state.unlockedBadges.includes(badge.id);
      
      const card = document.createElement('div');
      card.className = `badge-card ${isUnlocked ? 'unlocked' : ''}`;
      card.setAttribute('tabindex', '0'); // FIXED: Allowed badge items to be focusable for keyboard screen readers
      card.setAttribute('aria-label', `${badge.name}: ${badge.desc} (${isUnlocked ? 'Unlocked' : 'Locked'})`);
      
      card.innerHTML = `
        <div class="badge-icon" aria-hidden="true">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.desc}</div>
      `;
      grid.appendChild(card);
    });
  }
};

window.Habits = Habits;
window.addEventListener('DOMContentLoaded', () => {
  Habits.init();
});cument.getElementById('habits-full-list');

    if (habitsFullList) {
      habitsFullList.innerHTML = '';
      this.state.list.forEach(h => {
        habitsFullList.appendChild(this.createHabitRowElement(h));
      });
    }

    if (dashboardList) {
      dashboardList.innerHTML = '';
      // Take only the first 3 items for dashboard quick view
      const quickItems = this.state.list.slice(0, 3);
      quickItems.forEach(h => {
        dashboardList.appendChild(this.createHabitRowElement(h));
      });
    }
  },

  createHabitRowElement(habit) {
    const row = document.createElement('div');
    row.className = `habit-row ${habit.checked ? 'completed' : ''}`;
    
    row.innerHTML = `
      <label class="checkbox-container">
        <input type="checkbox" ${habit.checked ? 'checked' : ''}>
        <span class="checkmark"></span>
      </label>
      <div class="habit-details">
        <div class="habit-title">${habit.title}</div>
        <div class="habit-meta">
          <span class="habit-impact">-${habit.impact.toFixed(1)} kg CO₂e</span>
          <span class="habit-xp">+${habit.xp} XP</span>
          <span class="habit-difficulty">${habit.difficulty.toUpperCase()}</span>
        </div>
      </div>
    `;

    // Listen to checkbox status changes
    const checkbox = row.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', (e) => {
      this.toggleHabit(habit.id, e.target.checked);
    });

    return row;
  },

  renderBadgeGrid() {
    const grid = document.getElementById('badges-grid-container');
    if (!grid) return;

    grid.innerHTML = '';

    this.BADGES.forEach(badge => {
      const isUnlocked = this.state.unlockedBadges.includes(badge.id);
      
      const card = document.createElement('div');
      card.className = `badge-card ${isUnlocked ? 'unlocked' : ''}`;
      card.innerHTML = `
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.desc}</div>
      `;
      grid.appendChild(card);
    });
  }
};

window.Habits = Habits;
window.addEventListener('DOMContentLoaded', () => {
  Habits.init();
});
