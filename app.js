// Climatica Application Orchestrator

const App = {
  state: {
    isOnboarded: false,
    footprint: null,
    calculatorSelections: null
  },

  /**
   * Sanitize a user-supplied name for safe DOM rendering.
   * @param {string} name - Raw input
   * @returns {string} Safe text
   */
  sanitizeName(name) {
    if (typeof name !== 'string') return '';
    return name.replace(/<[^>]*>/g, '').replace(/[&<>"'/]/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;'
    })[c] || c).trim().slice(0, 80);
  },

  init() {
    this.loadState();
    this.setupNavigation();
    this.setupToastSystem();
    this.renderLayout();
  },

  loadState() {
    try {
      const saved = localStorage.getItem('climatica_global_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          this.state = parsed;
        }
      }
    } catch (e) {
      console.warn('Climatica: could not load state from localStorage.', e);
      this.state = { isOnboarded: false, footprint: null, calculatorSelections: null };
    }
  },

  saveState() {
    try {
      localStorage.setItem('climatica_global_state', JSON.stringify(this.state));
    } catch (e) {
      console.warn('Climatica: could not save state to localStorage.', e);
    }
  },

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        this.switchView(target);
      });
    });

    const logoHome = document.getElementById('logo-home');
    if (logoHome) {
      logoHome.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.state.isOnboarded) {
          this.switchView('dashboard-view');
        } else {
          this.switchView('hero-section');
        }
      });
    }

    const btnStartCalc = document.getElementById('btn-start-calc');
    if (btnStartCalc) {
      btnStartCalc.addEventListener('click', () => {
        this.switchView('calculator-section');
        if (window.Calculator && typeof window.Calculator.reset === 'function') {
          window.Calculator.reset();
        }
      });
    }

    const btnRecalculate = document.getElementById('btn-recalculate');
    if (btnRecalculate) {
      btnRecalculate.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to recalculate your carbon footprint? Your current habits progress will be kept.")) {
          this.switchView('calculator-section');
          if (window.Calculator && typeof window.Calculator.reset === 'function') {
            window.Calculator.reset();
          }
        }
      });
    }

    const btnGoHabits = document.getElementById('btn-dash-go-habits');
    if (btnGoHabits) {
      btnGoHabits.addEventListener('click', () => {
        this.switchView('habits-view');
      });
    }
  },

  switchView(viewId) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => {
      sec.classList.remove('active');
      sec.setAttribute('aria-hidden', 'true');
    });

    const targetSec = document.getElementById(viewId);
    if (targetSec) {
      targetSec.classList.add('active');
      targetSec.removeAttribute('aria-hidden');
      
      // FIXED: Shift accessibility tracking focus onto newly rendered views
      targetSec.setAttribute('tabindex', '-1');
      targetSec.focus();
    }

    // FIXED: Synchronize active tabs with matching screen reader aria-current definitions
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    navLinks.forEach(link => {
      if (link.getAttribute('data-target') === viewId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  onCalculatorComplete(footprint, selections) {
    this.state.isOnboarded = true;
    this.state.footprint = footprint;
    this.state.calculatorSelections = selections;
    this.saveState();

    if (window.Habits && typeof window.Habits.unlockBadge === 'function') {
      window.Habits.unlockBadge('b_calc');
    }

    this.showToast("Onboarding complete! Your carbon footprint is audit-logged.", "success");
    this.renderLayout();
    this.switchView('dashboard-view');
  },

  onHabitsStateChange() {
    this.updateDashboard();
  },

  onOffsetsStateChange() {
    this.updateDashboard();
  },

  updateDashboard() {
    // FIXED: Wrapped cross-module reference calls within explicit verification logic to avoid engine failure
    if (this.state.isOnboarded && window.Dashboard && typeof window.Dashboard.update === 'function') {
      const streak = window.Habits && window.Habits.state ? window.Habits.state.streak : 0;
      const offsetsTons = window.Offsets && window.Offsets.state ? window.Offsets.state.totalOffsetTons : 0;
      window.Dashboard.update(this.state.footprint, streak, offsetsTons);
    }
  },

  renderLayout() {
    const navList = document.getElementById('main-nav-list');
    const profileWidget = document.getElementById('user-profile-widget');

    if (this.state.isOnboarded) {
      if (navList) navList.style.display = 'flex';
      if (profileWidget) profileWidget.style.display = 'flex';
      
      // FIXED: Leveraged safe timeout sequencing to avoid instantiation timing race conflicts
      setTimeout(() => this.updateDashboard(), 50);
      
      const activeSection = document.querySelector('.view-section.active');
      if (activeSection && (activeSection.id === 'hero-section' || activeSection.id === 'calculator-section')) {
        this.switchView('dashboard-view');
      }
    } else {
      if (navList) navList.style.display = 'none';
      if (profileWidget) profileWidget.style.display = 'none';
    }
  },

  setupToastSystem() {
    this.toastOutlet = document.getElementById('toast-outlet');
  },

  showToast(message, type = 'info') {
    if (!this.toastOutlet) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert'); // FIXED: Explicitly forced standard ARIA alert evaluation flags
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'level-up') icon = '🏆';

    toast.innerHTML = `
      <span aria-hidden="true">${icon}</span>
      <div>${message}</div>
    `;

    this.toastOutlet.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3200);
  }
};

window.App = App;

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
