// Carbon Footprint Onboarding Calculator Engine

const Calculator = {
  currentStep: 0,
  totalSteps: 4,
  
  // Coefficients & Formulas
  // Values are based on standard Greenhouse Gas Protocol conversion estimates, expressed in Annual Tons of CO2e.
  COEFFICIENTS: {
    carKm: 0.18 / 1000,          // 0.18 kg CO2e per km driven
    carEngine: {
      petrol: 1.0,
      hybrid: 0.6,
      electric: 0.15,
      none: 0.0
    },
    flightHour: 90 / 1000,       // 90 kg CO2e per flight hour
    electricityDollar: (12 * 8 * 0.38) / 1000, // Monthly $ * 12 months * 8 kWh per $ * 0.38 kg CO2e per kWh
    cleanEnergy: {
      grid: 1.0,
      partial: 0.5,
      full: 0.05
    },
    diet: {
      'heavy-meat': 3.0,
      'average': 1.8,
      'vegetarian': 1.1,
      'vegan': 0.65
    },
    shopping: {
      high: 2.5,
      average: 1.2,
      low: 0.45
    }
  },

  // Active user selections
  selections: {
    carDistance: 120, // weekly km
    carEngine: 'petrol',
    flights: 8,       // annual hours
    electricityBill: 80, // monthly $
    cleanEnergy: 'grid',
    diet: 'heavy-meat',
    foodWaste: 15,    // percent
    shopping: 'high'
  },

  init() {
    this.setupListeners();
    this.updateSliderValues();
    this.calculateLive();
  },

  setupListeners() {
    // Range Sliders configuration mapping
    const sliders = [
      { id: 'calc-car-distance', valId: 'val-car-distance', descId: 'val-car-distance-desc', key: 'carDistance', unit: 'km' },
      { id: 'calc-flights', valId: 'val-flights', descId: 'val-flights-desc', key: 'flights', unit: 'hours total' },
      { id: 'calc-electricity', valId: 'val-electricity', descId: 'val-electricity-desc', key: 'electricityBill', unit: 'dollars' },
      { id: 'calc-food-waste', valId: 'val-food-waste', descId: 'val-food-waste-desc', key: 'foodWaste', unit: 'percent' }
    ];

    sliders.forEach(slider => {
      const el = document.getElementById(slider.id);
      if (el) {
        el.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          
          // Update visual text indicators safely
          const valEl = document.getElementById(slider.valId);
          if (valEl) valEl.textContent = val;
          
          // FIXED: Update dynamic aria screen-reader states real-time
          el.setAttribute('aria-valuenow', val);
          const descEl = document.getElementById(slider.descId);
          if (descEl) {
            descEl.textContent = `Currently set to ${val} ${slider.unit}`;
          }

          this.selections[slider.key] = val;
          this.calculateLive();
        });
      }
    });

    // Option Grids selection logic
    this.setupOptionGrid('car-engine-select', 'carEngine');
    this.setupOptionGrid('clean-energy-select', 'cleanEnergy');
    this.setupOptionGrid('diet-select', 'diet');
    this.setupOptionGrid('shopping-select', 'shopping');

    // Navigation Buttons
    const btnNext = document.getElementById('btn-calc-next');
    const btnBack = document.getElementById('btn-calc-back');

    if (btnNext) {
      btnNext.addEventListener('click', () => this.handleNext());
    }
    if (btnBack) {
      btnBack.addEventListener('click', () => this.handleBack());
    }
  },

  setupOptionGrid(gridId, selectionKey) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const cards = grid.querySelectorAll('.option-card');

    const selectCard = (card) => {
      cards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      const value = card.getAttribute('data-value');
      this.selections[selectionKey] = value;
      this.calculateLive();
    };

    cards.forEach(card => {
      card.addEventListener('click', () => selectCard(card));

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectCard(card);
        }
      });
    });
  },

  updateSliderValues() {
    // FIXED: Wrapped element updates with safety hooks to prevent null references crashing calculations
    const sliderMap = [
      { id: 'calc-car-distance', valId: 'val-car-distance', val: this.selections.carDistance },
      { id: 'calc-flights', valId: 'val-flights', val: this.selections.flights },
      { id: 'calc-electricity', valId: 'val-electricity', val: this.selections.electricityBill },
      { id: 'calc-food-waste', valId: 'val-food-waste', val: this.selections.foodWaste }
    ];

    sliderMap.forEach(item => {
      const inputEl = document.getElementById(item.id);
      const valEl = document.getElementById(item.valId);
      if (inputEl) inputEl.setAttribute('aria-valuenow', item.val);
      if (valEl) valEl.textContent = item.val;
    });
  },

  calculateCurrentFootprint() {
    const s = this.selections;
    const coef = this.COEFFICIENTS;

    const carEmissions = (s.carDistance * 52) * coef.carKm * coef.carEngine[s.carEngine];
    const flightEmissions = s.flights * coef.flightHour;
    const transportTotal = carEmissions + flightEmissions;

    const energyTotal = s.electricityBill * coef.electricityDollar * coef.cleanEnergy[s.cleanEnergy];

    const dietBase = coef.diet[s.diet];
    const wastePenalty = (s.foodWaste / 100) * 0.6;
    const foodTotal = dietBase + wastePenalty;

    const shoppingTotal = coef.shopping[s.shopping];
    const total = transportTotal + energyTotal + foodTotal + shoppingTotal;

    return {
      total: Math.round(total * 10) / 10,
      categories: {
        transport: Math.round(transportTotal * 10) / 10,
        energy: Math.round(energyTotal * 10) / 10,
        food: Math.round(foodTotal * 10) / 10,
        shopping: Math.round(shoppingTotal * 10) / 10
      }
    };
  },

  calculateLive() {
    const result = this.calculateCurrentFootprint();
    const liveVal = document.getElementById('calc-live-val');
    if (liveVal) {
      liveVal.textContent = result.total.toFixed(1);
    }
  },

  handleNext() {
    if (this.currentStep < this.totalSteps - 1) {
      const currentStepEl = document.getElementById(`step-${this.currentStep}`);
      if (currentStepEl) currentStepEl.classList.remove('active');
      
      this.currentStep++;
      
      const nextStepEl = document.getElementById(`step-${this.currentStep}`);
      if (nextStepEl) {
        nextStepEl.classList.add('active');
        // FIXED: Shift keyboard focus to the newly revealed container view block for step changes
        nextStepEl.focus();
      }
      
      this.updateProgressUI();
    } else {
      const finalReport = this.calculateCurrentFootprint();
      if (window.App && typeof window.App.onCalculatorComplete === 'function') {
        window.App.onCalculatorComplete(finalReport, this.selections);
      }
    }
  },

  handleBack() {
    if (this.currentStep > 0) {
      const currentStepEl = document.getElementById(`step-${this.currentStep}`);
      if (currentStepEl) currentStepEl.classList.remove('active');
      
      this.currentStep--;
      
      const prevStepEl = document.getElementById(`step-${this.currentStep}`);
      if (prevStepEl) {
        prevStepEl.classList.add('active');
        prevStepEl.focus();
      }
      
      this.updateProgressUI();
    }
  },

  updateProgressUI() {
    const dots = document.querySelectorAll('.step-dot');
    dots.forEach((dot, index) => {
      dot.classList.remove('active', 'completed');
      if (index === this.currentStep) {
        dot.classList.add('active');
        dot.setAttribute('aria-current', 'step');
      } else {
        dot.removeAttribute('aria-current');
        if (index < this.currentStep) {
          dot.classList.add('completed');
        }
      }
    });

    const progressPct = (this.currentStep / (this.totalSteps - 1)) * 100;
    const progressBar = document.getElementById('wizard-progress-bar');
    if (progressBar) progressBar.style.width = `${progressPct}%`;
    
    const progressContainer = document.getElementById('wizard-progressbar');
    if (progressContainer) progressContainer.setAttribute('aria-valuenow', this.currentStep + 1);

    // FIXED: Corrected full accessibility sync for navigation action handlers
    const btnBack = document.getElementById('btn-calc-back');
    if (btnBack) {
      const isFirstStep = this.currentStep === 0;
      btnBack.disabled = isFirstStep;
      btnBack.setAttribute('aria-disabled', isFirstStep ? 'true' : 'false');
    }

    const btnNext = document.getElementById('btn-calc-next');
    if (btnNext) {
      if (this.currentStep === this.totalSteps - 1) {
        btnNext.innerHTML = 'Complete Setup <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
      } else {
        btnNext.textContent = 'Next';
      }
    }
  },

  reset() {
    this.currentStep = 0;
    this.updateProgressUI();
    
    for (let i = 0; i < this.totalSteps; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      if (stepEl) {
        stepEl.classList.remove('active');
      }
    }
    const stepZero = document.getElementById('step-0');
    if (stepZero) stepZero.classList.add('active');
    
    this.calculateLive();
  }
};

// Expose globally
window.Calculator = Calculator;
window.addEventListener('DOMContentLoaded', () => {
  Calculator.init();
});
