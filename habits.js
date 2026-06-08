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

  loadState() {
    const saved = localStorage.getItem('climatica_habits_state');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        
        // Check if day changed to reset checked states, but keep streak rules
        const today = new Date().toDateString();
        if (this.state.lastActiveDate !== today) {
          // Verify if streak is broken (more than 1 day difference)
          if (this.state.lastActiveDate) {
            const lastDate = new Date(this.state.lastActiveDate);
            const diffTime = Math.abs(new Date(today) - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 1) {
              this.state.streak = 0; // Streak broken
            }
          }
          
          // Reset checked states of all habits for the new day
          this.state.list.forEach(h => h.checked = false);
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
      list: [...this.DEFAULT_HABITS],
      xp: 0,
      level: 1,
      streak: 0,
      totalSavedCo2Kg: 0,
      unlockedBadges: ['b_calc'], // Unlocked by completing calculator initial step
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
    if (!titleInput || !difficultyInput) return;

    const title = titleInput.value.trim();
    const difficulty = difficultyInput.value;
    if (!title) return;

    // Determine impact & xp based on difficulty
    let impact = 1.0;
    let xp = 10;
    if (difficulty === 'medium') { impact = 2.5; xp = 20; }
    else if (difficulty === 'hard') { impact = 5.0; xp = 30; }

    const newHabit = {
      id: 'custom_' + Date.now(),
      title,
      difficulty,
      impact,
      xp,
      checked: false
    };

    this.state.list.push(newHabit);
    this.saveState();
    this.render();

    // Reset inputs
    titleInput.value = '';
    
    // Show toast
    if (window.App) {
      window.App.showToast(`Custom action "${title}" added!`, 'info');
    }
  },

  toggleHabit(id, isChecked) {
    const habit = this.state.list.find(h => h.id === id);
    if (!habit) return;

    habit.checked = isChecked;

    if (isChecked) {
      // Add XP & CO2 savings
      this.state.totalSavedCo2Kg += habit.impact;
      this.addXP(habit.xp);

      // Badge check: First habit completed
      this.unlockBadge('b_habit_first');

      // Update active streak if checking first item today
      this.updateStreak();

      if (window.App) {
        window.App.showToast(`Completed: +${habit.impact} kg CO₂ saved & +${habit.xp} XP!`, 'success');
      }
    } else {
      // Subtract XP & CO2 savings if unchecked (avoid exploit)
      this.state.totalSavedCo2Kg = Math.max(0, this.state.totalSavedCo2Kg - habit.impact);
      this.state.xp = Math.max(0, this.state.xp - habit.xp);
      if (window.App) {
        window.App.showToast(`Removed action: -${habit.impact} kg CO₂ & -${habit.xp} XP`, 'info');
      }
    }

    this.saveState();
    this.render();
    
    // Notify main App to refresh other views (e.g. Dashboard widgets)
    if (window.App) {
      window.App.onHabitsStateChange();
    }
  },

  updateStreak() {
    // Check if any other item is already checked today.
    // If this is the only checked habit, it means it's the first check of the day!
    const checkedCount = this.state.list.filter(h => h.checked).length;
    if (checkedCount === 1) {
      this.state.streak++;
      
      // Badge Check: 3 Day Streak
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
      
      // Level Up Toast Alert
      if (window.App) {
        window.App.showToast(`🎉 Level Up! You are now Level ${this.state.level}!`, 'level-up');
      }

      // Badge Check: Level 3
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
      if (badge && window.App) {
        window.App.showToast(`🏆 Badge Unlocked: ${badge.icon} ${badge.name}!`, 'level-up');
      }
    }
  },

  // Renders the habit templates and grids
  render() {
    this.renderHabitLists();
    this.renderBadgeGrid();
    this.renderStats();
  },

  renderStats() {
    // Update numerical stat labels
    document.getElementById('habits-stat-co2').textContent = `${this.state.totalSavedCo2Kg.toFixed(1)} kg`;
    document.getElementById('habits-stat-xp').textContent = this.state.xp;
    
    // Update navbar level stats
    const navLvlName = document.getElementById('nav-level-name');
    const navLvlBadge = document.getElementById('nav-level-badge');
    const navXpVal = document.getElementById('nav-xp-val');

    if (navLvlName) {
      const levelNames = ["🌱 Eco-Novice", "☘️ Green Cadet", "🌿 Earth Defender", "🌲 Carbon Warrior", "🌍 Planet Guardian"];
      const nameIndex = Math.min(levelNames.length - 1, this.state.level - 1);
      navLvlName.textContent = levelNames[nameIndex].split(' ')[1];
      navLvlBadge.textContent = levelNames[nameIndex].split(' ')[0];
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
