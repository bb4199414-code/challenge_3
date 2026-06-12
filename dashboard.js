// Dashboard UI & Interaction Module

const Dashboard = {
  // Category configuration
  CATEGORIES: {
    transport: { label: 'Transportation', color: '#06b6d4', icon: '🚗' }, // Teal
    energy: { label: 'Home Energy', color: '#f59e0b', icon: '💡' },    // Amber
    food: { label: 'Diet & Food', color: '#f43f5e', icon: '🥗' },      // Rose
    shopping: { label: 'Shopping', color: '#10b981', icon: '🛍️' }     // Emerald
  },

  CIRCUMFERENCE: 440, // 2 * pi * r (r=70)

  init() {
    this.setupSimulatorListeners();
  },

  update(footprintData, streak, totalOffsetsTons) {
    if (!footprintData) return;

    // 1. Update Stat Cards with strict null safety guards
    const footprintValEl = document.getElementById('dash-footprint-val');
    if (footprintValEl) footprintValEl.textContent = footprintData.total.toFixed(1);
    
    const streakValEl = document.getElementById('dash-streak-val');
    if (streakValEl) streakValEl.textContent = streak;

    const offsetPercentage = footprintData.total > 0 
      ? Math.min(100, Math.round((totalOffsetsTons / footprintData.total) * 100))
      : 0;
    
    const offsetPctEl = document.getElementById('dash-offset-pct');
    if (offsetPctEl) {
      offsetPctEl.textContent = `${offsetPercentage}% Neutral`;
      if (offsetPercentage >= 100) {
        offsetPctEl.style.color = '#10b981';
        offsetPctEl.innerHTML = `100% Neutral <span aria-hidden="true">🍀</span>`;
      } else if (offsetPercentage > 0) {
        offsetPctEl.style.color = '#06b6d4';
      } else {
        offsetPctEl.style.color = 'white';
      }
    }

    // 2. Render Donut Chart
    this.renderDonutChart(footprintData);

    // 3. Render Personalized Insights
    this.renderInsights(footprintData);

    // 4. Update the Impact Simulator default baseline
    this.updateSimulatorBaseline(footprintData);
  },

  renderDonutChart(data) {
    const svg = document.getElementById('dashboard-donut-svg');
    const legendContainer = document.getElementById('dashboard-legend-list');
    if (!svg || !legendContainer) return;

    const segments = svg.querySelectorAll('.donut-segment');
    segments.forEach(s => s.remove());

    legendContainer.innerHTML = '';

    const categories = data.categories;
    const total = data.total;

    const centerValEl = document.getElementById('donut-center-val');
    const updateCenter = (val, label) => {
      if (centerValEl) centerValEl.textContent = Number(val).toFixed(1);
      const labelText = svg.querySelector('.donut-center-text text:nth-child(2)');
      if (labelText) labelText.textContent = label.toUpperCase();
    };

    updateCenter(total, 'TONS/YR');

    let currentOffset = 0;

    Object.keys(this.CATEGORIES).forEach(key => {
      const catVal = categories[key] || 0;
      const catConfig = this.CATEGORIES[key];
      const percentage = total > 0 ? (catVal / total) : 0;
      const segmentLength = percentage * this.CIRCUMFERENCE;

      if (segmentLength > 0) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'donut-segment');
        circle.setAttribute('cx', '100');
        circle.setAttribute('cy', '100');
        circle.setAttribute('r', '70');
        circle.setAttribute('stroke', catConfig.color);
        circle.setAttribute('stroke-dasharray', `${segmentLength} ${this.CIRCUMFERENCE - segmentLength}`);
        circle.setAttribute('stroke-dashoffset', -currentOffset.toString());
        circle.style.transition = 'stroke-width 0.2s, stroke 0.2s';
        
        // FIXED: Added full ARIA accessibility and keyboard compliance hooks to graphic segments
        circle.setAttribute('role', 'img');
        circle.setAttribute('tabindex', '0');
        circle.setAttribute('aria-label', `${catConfig.label}: ${catVal.toFixed(1)} Tons, ${Math.round(percentage * 100)}%`);
        
        const activateSegment = () => {
          circle.setAttribute('stroke-width', '18');
          updateCenter(catVal, catConfig.label);
        };

        const deactivateSegment = () => {
          circle.setAttribute('stroke-width', '14');
          updateCenter(total, 'TONS/YR');
        };

        circle.addEventListener('mouseenter', activateSegment);
        circle.addEventListener('mouseleave', deactivateSegment);
        circle.addEventListener('focus', activateSegment);
        circle.addEventListener('blur', deactivateSegment);

        svg.appendChild(circle);
        currentOffset += segmentLength;
      }

      const pctDisplay = total > 0 ? Math.round(percentage * 100) : 0;
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.setAttribute('tabindex', '0'); // FIXED: Allowed keyboard users to access legend benchmarks
      legendItem.innerHTML = `
        <div class="legend-color-dot" style="background: ${catConfig.color};"></div>
        <span class="legend-label">${catConfig.icon} ${catConfig.label}</span>
        <span class="legend-val">${catVal.toFixed(1)} t (${pctDisplay}%)</span>
      `;

      const highlightSegment = () => {
        const matchingCircle = Array.from(svg.querySelectorAll('.donut-segment')).find(
          c => c.getAttribute('stroke') === catConfig.color
        );
        if (matchingCircle) matchingCircle.setAttribute('stroke-width', '18');
        updateCenter(catVal, catConfig.label);
      };

      const resetSegment = () => {
        const matchingCircle = Array.from(svg.querySelectorAll('.donut-segment')).find(
          c => c.getAttribute('stroke') === catConfig.color
        );
        if (matchingCircle) matchingCircle.setAttribute('stroke-width', '14');
        updateCenter(total, 'TONS/YR');
      };

      legendItem.addEventListener('mouseenter', highlightSegment);
      legendItem.addEventListener('mouseleave', resetSegment);
      legendItem.addEventListener('focus', highlightSegment);
      legendItem.addEventListener('blur', resetSegment);

      legendContainer.appendChild(legendItem);
    });
  },

  renderInsights(data) {
    const tipsBox = document.getElementById('dashboard-tips-box');
    if (!tipsBox) return;

    tipsBox.innerHTML = '';
    const categories = data.categories;
    
    const sortedCats = Object.keys(categories)
      .map(key => ({ key, val: categories[key] }))
      .sort((a, b) => b.val - a.val);

    const tipsTemplates = {
      transport: {
        title: 'Transportation Strategy',
        text: 'Commute emissions are your leading carbon source. Swapping 1 car trip a week for light transit or cycling saves up to 0.4 tons CO₂/yr.',
        theme: 'teal',
        icon: '🚗'
      },
      energy: {
        title: 'Home Energy Efficiency',
        text: 'Electricity usage contributes heavily to your score. Upgrading to LED bulbs and choosing smart power strips cuts heat loss and saves up to 0.3 tons.',
        theme: 'amber',
        icon: '💡'
      },
      food: {
        title: 'Dietary Impact',
        text: 'Animal products account for significant production emissions. Committing to a meat-free weekday habit saves an average of 0.6 tons annually.',
        theme: 'rose',
        icon: '🥗'
      },
      shopping: {
        title: 'Mindful Purchasing',
        text: 'New goods have large supply-chain footprints. Repairing items and sourcing second-hand cuts embedded carbon by nearly 45%.',
        theme: 'emerald',
        icon: '🛍️'
      }
    };

    const activeTips = sortedCats.slice(0, 2);
    
    activeTips.forEach(tip => {
      const template = tipsTemplates[tip.key];
      if (!template) return;
      
      const tipCard = document.createElement('div');
      
      let borderColor = 'rgba(255,255,255,0.06)';
      let glowColor = 'transparent';
      if (template.theme === 'teal') { borderColor = 'rgba(6, 182, 212, 0.2)'; glowColor = 'rgba(6, 182, 212, 0.05)'; }
      else if (template.theme === 'amber') { borderColor = 'rgba(245, 158, 11, 0.2)'; glowColor = 'rgba(245, 158, 11, 0.05)'; }
      else if (template.theme === 'rose') { borderColor = 'rgba(244, 63, 94, 0.2)'; glowColor = 'rgba(244, 63, 94, 0.05)'; }
      else if (template.theme === 'emerald') { borderColor = 'rgba(16, 185, 129, 0.2)'; glowColor = 'rgba(16, 185, 129, 0.05)'; }

      tipCard.style.padding = '0.85rem';
      tipCard.style.borderRadius = '10px';
      tipCard.style.background = `rgba(255,255,255,0.02)`;
      tipCard.style.border = `1px solid ${borderColor}`;
      tipCard.style.boxShadow = `inset 0 0 10px ${glowColor}`;

      tipCard.innerHTML = `
        <div style="font-weight: 700; font-size: 0.9rem; color: white; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem;">
          <span aria-hidden="true">${template.icon}</span> ${template.title}
        </div>
        <p style="font-size: 0.78rem; line-height: 1.4; color: #9ca3af;">${template.text}</p>
      `;
      tipsBox.appendChild(tipCard);
    });
  },

  baselineFootprint: null,

  updateSimulatorBaseline(footprintData) {
    this.baselineFootprint = footprintData;
    this.runSimulation();
  },

  setupSimulatorListeners() {
    const ranges = ['sim-range-energy', 'sim-range-commute', 'sim-range-diet'];
    ranges.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.runSimulation());
      }
    });
  },

  runSimulation() {
    if (!this.baselineFootprint) return;

    // FIXED: Formulated absolute null-checks around the simulation slider hooks
    const energyRange = document.getElementById('sim-range-energy');
    const commuteRange = document.getElementById('sim-range-commute');
    const dietRange = document.getElementById('sim-range-diet');

    if (!energyRange || !commuteRange || !dietRange) return;

    const energyVal = Number(energyRange.value); 
    const commuteVal = Number(commuteRange.value); 
    const dietVal = Number(dietRange.value); 

    // Synchronize current slider value indicators safely
    const energyLabels = ['No Change', 'Partial Solar (Save 50%)', 'Green Tariff (Save 95%)'];
    const energyValEl = document.getElementById('sim-val-energy');
    if (energyValEl) {
      energyValEl.textContent = energyLabels[energyVal];
      energyValEl.style.color = energyVal > 0 ? '#10b981' : '#9ca3af';
    }

    const commuteValEl = document.getElementById('sim-val-commute');
    if (commuteValEl) {
      commuteValEl.textContent = commuteVal > 0 ? `${commuteVal}% Less` : '0% Less';
      commuteValEl.style.color = commuteVal > 0 ? '#10b981' : '#9ca3af';
    }

    const dietLabels = ['No Change', 'Shift to Veggie', 'Shift to Vegan'];
    const dietValEl = document.getElementById('sim-val-diet');
    if (dietValEl) {
      dietValEl.textContent = dietLabels[dietVal];
      dietValEl.style.color = dietVal > 0 ? '#10b981' : '#9ca3af';
    }

    // Math calculations
    const cats = this.baselineFootprint.categories;
    const commuteReduction = (cats.transport * 0.75) * (commuteVal / 100);

    let energyReduction = 0;
    if (energyVal === 1) energyReduction = cats.energy * 0.5;
    else if (energyVal === 2) energyReduction = cats.energy * 0.95;

    let dietReduction = 0;
    if (dietVal === 1) {
      dietReduction = Math.max(0, cats.food * 0.35); 
    } else if (dietVal === 2) {
      dietReduction = Math.max(0, cats.food * 0.6); 
    }

    const totalSavings = commuteReduction + energyReduction + dietReduction;
    const simulatedFootprint = Math.max(0.2, this.baselineFootprint.total - totalSavings);

    const centerValEl = document.getElementById('donut-center-val');
    if (centerValEl) {
      if (totalSavings > 0) {
        centerValEl.innerHTML = `${simulatedFootprint.toFixed(1)} <span style="font-size: 0.65rem; color:#10b981; display:block; margin-top:-2px;">saved ${(totalSavings).toFixed(1)}t</span>`;
      } else {
        centerValEl.textContent = this.baselineFootprint.total.toFixed(1);
      }
    }
  }
};

window.Dashboard = Dashboard;
window.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});
