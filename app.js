// Climatica Application Orchestrator

const App = {
  state: {
    isOnboarded: false,
    footprint: null,
    calculatorSelections: null
  },

  init() {
    this.loadState();
    this.setupNavigation();
    this.setupToastSystem();
    this.renderLayout();
  },

  loadState() {
    const saved = localStorage.getItem('climatica_global_state');
    if (saved) {
      try {
        this.state = JSON.parse(saved);
      } catch (e) {
        console.error("Error loading global state, resetting.", e);
        this.state = { isOnboarded: false, footprint: null, calculatorSelections: null };
      }
    }
  },

  saveState() {
    localStorage.setItem('climatica_global_state', JSON.stringify(this.state));
  },

  setupNavigation() {
    // Navigation Tabs
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-target');
        this.switchView(target);
      });
    });

    // Home Logo click
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

    // Hero "Get Started" Button
    const btnStartCalc = document.getElementById('btn-start-calc');
    if (btnStartCalc) {
      btnStartCalc.addEventListener('click', () => {
        this.switchView('calculator-section');
        if (window.Calculator) {
          window.Calculator.reset();
        }
      });
    }

    // Recalculate / Setup Button
    const btnRecalculate = document.getElementById('btn-recalculate');
    if (btnRecalculate) {
      btnRecalculate.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to recalculate your carbon footprint? Your current habits progress will be kept.")) {
          this.switchView('calculator-section');
          if (window.Calculator) {
            window.Calculator.reset();
          }
        }
      });
    }

    // Dashboard Quick Habits -> Habits View Button
    const btnGoHabits = document.getElementById('btn-dash-go-habits');
    if (btnGoHabits) {
      btnGoHabits.addEventListener('click', () => {
        this.switchView('habits-view');
      });
    }
  },

  switchView(viewId) {
    // Hide all view sections
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(sec => sec.classList.remove('active'));

    // Show target section
    const targetSec = document.getElementById(viewId);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Update active class on nav links
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    navLinks.forEach(link => {
      if (link.getAttribute('data-target') === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Scroll to top of window
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Called by calculator.js when wizard concludes
  onCalculatorComplete(footprint, selections) {
    this.state.isOnboarded = true;
    this.state.footprint = footprint;
    this.state.calculatorSelections = selections;
    this.saveState();

    // Unlock Green Starter Badge
    if (window.Habits) {
      window.Habits.unlockBadge('b_calc');
    }

    // Show success toast
    this.showToast("Onboarding complete! Your carbon footprint is audit-logged.", "success");

    // Re-render layout (reveals navigation links and user profile widget)
    this.renderLayout();

    // Transition view to Dashboard
    this.switchView('dashboard-view');
  },

  // Called when habits completed/unchecked in habits.js
  onHabitsStateChange() {
    this.updateDashboard();
  },

  // Called when offset ton purchase completed in offsets.js
  onOffsetsStateChange() {
    this.updateDashboard();
  },

  // Refreshes the elements inside Dashboard View
  updateDashboard() {
    if (this.state.isOnboarded && window.Dashboard) {
      const streak = window.Habits?.state?.streak || 0;
      const offsetsTons = window.Offsets?.state?.totalOffsetTons || 0;
      window.Dashboard.update(this.state.footprint, streak, offsetsTons);
    }
  },

  renderLayout() {
    const navList = document.getElementById('main-nav-list');
    const profileWidget = document.getElementById('user-profile-widget');

    if (this.state.isOnboarded) {
      // Show main nav items and user profile level badge
      if (navList) navList.style.display = 'flex';
      if (profileWidget) profileWidget.style.display = 'flex';
      
      // Update Dashboard data
      this.updateDashboard();
      
      // If user visits the page and has completed calculator already, show dashboard directly
      const activeSection = document.querySelector('.view-section.active');
      if (activeSection && (activeSection.id === 'hero-section' || activeSection.id === 'calculator-section')) {
        this.switchView('dashboard-view');
      }
    } else {
      // Hide nav lists & profiles until calculator complete
      if (navList) navList.style.display = 'none';
      if (profileWidget) profileWidget.style.display = 'none';
    }
  },

  // Toast Alerts Engine
  setupToastSystem() {
    this.toastOutlet = document.getElementById('toast-outlet');
  },

  showToast(message, type = 'info') {
    if (!this.toastOutlet) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose icons
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'level-up') icon = '🏆';

    toast.innerHTML = `
      <span>${icon}</span>
      <div>${message}</div>
    `;

    this.toastOutlet.appendChild(toast);

    // Fade out after 3.2 seconds
    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3200);
  }
};

// Expose globally
window.App = App;

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
