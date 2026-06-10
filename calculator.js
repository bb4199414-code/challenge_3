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
    // Range Sliders
    const sliders = [
      { id: 'calc-car-distance', valId: 'val-car-distance', key: 'carDistance' },
      { id: 'calc-flights', valId: 'val-flights', key: 'flights' },
      { id: 'calc-electricity', valId: 'val-electricity', key: 'electricityBill' },
      { id: 'calc-food-waste', valId: 'val-food-waste', key: 'foodWaste' }
    ];

    sliders.forEach(slider => {
      const el = document.getElementById(slider.id);
      if (el) {
        el.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          document.getElementById(slider.valId).textContent = val;
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
      // Mouse click
      card.addEventListener('click', () => selectCard(card));

      // Keyboard: Enter or Space activates the card
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectCard(card);
        }
      });
    });
  },

  updateSliderValues() {
    document.getElementById('val-car-distance').textContent = this.selections.carDistance;
    document.getElementById('val-flights').textContent = this.selections.flights;
    document.getElementById('val-electricity').textContent = this.selections.electricityBill;
    document.getElementById('val-food-waste').textContent = this.selections.foodWaste;
  },

  // Calculate live results based on selections
  calculateCurrentFootprint() {
    const s = this.selections;
    const coef = this.COEFFICIENTS;

    // 1. Transport emissions
    // Weekly km converted to annual: km * 52. Then times fuel multiplier
    const carEmissions = (s.carDistance * 52) * coef.carKm * coef.carEngine[s.carEngine];
    const flightEmissions = s.flights * coef.flightHour;
    const transportTotal = carEmissions + flightEmissions;

    // 2. Energy emissions
    const energyTotal = s.electricityBill * coef.electricityDollar * coef.cleanEnergy[s.cleanEnergy];

    // 3. Food emissions
    const dietBase = coef.diet[s.diet];
    const wastePenalty = (s.foodWaste / 100) * 0.6; // Higher waste results in up to 0.6 tons of extra waste emissions
    const foodTotal = dietBase + wastePenalty;

    // 4. Shopping emissions
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
      // Go to next slide
      document.getElementById(`step-${this.currentStep}`).classList.remove('active');
      this.currentStep++;
      document.getElementById(`step-${this.currentStep}`).classList.add('active');
      
      // Update progress visual indicators
      this.updateProgressUI();
    } else {
      // Completed calculator
      const finalReport = this.calculateCurrentFootprint();
      
      // Save footprint data to global App state and trigger layout change
      if (window.App) {
        window.App.onCalculatorComplete(finalReport, this.selections);
      }
    }
  },

  handleBack() {
    if (this.currentStep > 0) {
      document.getElementById(`step-${this.currentStep}`).classList.remove('active');
      this.currentStep--;
      document.getElementById(`step-${this.currentStep}`).classList.add('active');
      
      this.updateProgressUI();
    }
  },

  updateProgressUI() {
    // Update step dots classes
    const dots = document.querySelectorAll('.step-dot');
    dots.forEach((dot, index) => {
      dot.classList.remove('active', 'completed');
      if (index === this.currentStep) {
        dot.classList.add('active');
      } else if (index < this.currentStep) {
        dot.classList.add('completed');
      }
    });

    // Update progress bar width line
    const progressPct = (this.currentStep / (this.totalSteps - 1)) * 100;
    document.getElementById('wizard-progress-bar').style.width = `${progressPct}%`;

    // Toggle Back button enabled state
    const btnBack = document.getElementById('btn-calc-back');
    btnBack.disabled = this.currentStep === 0;

    // Change Next button text on last step
    const btnNext = document.getElementById('btn-calc-next');
    if (this.currentStep === this.totalSteps - 1) {
      btnNext.innerHTML = 'Complete Setup <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    } else {
      btnNext.textContent = 'Next';
    }
  },

  reset() {
    this.currentStep = 0;
    this.updateProgressUI();
    
    // Hide all steps, make first active
    for (let i = 0; i < this.totalSteps; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      if (stepEl) {
        stepEl.classList.remove('active');
      }
    }
    document.getElementById('step-0').classList.add('active');
    
    this.calculateLive();
  }
};

// Expose globally
window.Calculator = Calculator;
window.addEventListener('DOMContentLoaded', () => {
  Calculator.init();
});
