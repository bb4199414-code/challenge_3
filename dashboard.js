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

    // 1. Update Stat Cards
    document.getElementById('dash-footprint-val').textContent = footprintData.total.toFixed(1);
    document.getElementById('dash-streak-val').textContent = streak;

    const offsetPercentage = footprintData.total > 0 
      ? Math.min(100, Math.round((totalOffsetsTons / footprintData.total) * 100))
      : 0;
    
    const offsetPctEl = document.getElementById('dash-offset-pct');
    offsetPctEl.textContent = `${offsetPercentage}% Neutral`;
    if (offsetPercentage >= 100) {
      offsetPctEl.style.color = '#10b981';
      offsetPctEl.innerHTML = `100% Neutral <span>🍀</span>`;
    } else if (offsetPercentage > 0) {
      offsetPctEl.style.color = '#06b6d4';
    } else {
      offsetPctEl.style.color = 'white';
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

    // Reset SVG segments except for the base circle and text center elements
    const segments = svg.querySelectorAll('.donut-segment');
    segments.forEach(s => s.remove());

    legendContainer.innerHTML = '';

    const categories = data.categories;
    const total = data.total;

    // Center text updater
    const centerValEl = document.getElementById('donut-center-val');
    const updateCenter = (val, label) => {
      centerValEl.textContent = Number(val).toFixed(1);
      const labelText = svg.querySelector('.donut-center-text text:nth-child(2)');
      if (labelText) labelText.textContent = label.toUpperCase();
    };

    // Set initial center text to total
    updateCenter(total, 'TONS/YR');

    let currentOffset = 0;

    // Loop through each category and draw segment
    Object.keys(this.CATEGORIES).forEach(key => {
      const catVal = categories[key] || 0;
      const catConfig = this.CATEGORIES[key];
      const percentage = total > 0 ? (catVal / total) : 0;
      const segmentLength = percentage * this.CIRCUMFERENCE;

      if (segmentLength > 0) {
        // Create SVG segment path
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'donut-segment');
        circle.setAttribute('cx', '100');
        circle.setAttribute('cy', '100');
        circle.setAttribute('r', '70');
        circle.setAttribute('stroke', catConfig.color);
        circle.setAttribute('stroke-dasharray', `${segmentLength} ${this.CIRCUMFERENCE - segmentLength}`);
        circle.setAttribute('stroke-dashoffset', -currentOffset);
        circle.style.transition = 'stroke-width 0.2s, stroke 0.2s';
        
        // Hover effects
        circle.addEventListener('mouseenter', () => {
          circle.setAttribute('stroke-width', '18');
          updateCenter(catVal, catConfig.label);
        });

        circle.addEventListener('mouseleave', () => {
          circle.setAttribute('stroke-width', '14');
          updateCenter(total, 'TONS/YR');
        });

        svg.appendChild(circle);
        currentOffset += segmentLength;
      }

      // Append to legend list
      const pctDisplay = total > 0 ? Math.round(percentage * 100) : 0;
      const legendItem = document.createElement('div');
      legendItem.className = 'legend-item';
      legendItem.innerHTML = `
        <div class="legend-color-dot" style="background: ${catConfig.color};"></div>
        <span class="legend-label">${catConfig.icon} ${catConfig.label}</span>
        <span class="legend-val">${catVal.toFixed(1)} t (${pctDisplay}%)</span>
      `;

      // Legend hover link to SVG highlights
      legendItem.addEventListener('mouseenter', () => {
        const matchingCircle = Array.from(svg.querySelectorAll('.donut-segment')).find(
          c => c.getAttribute('stroke') === catConfig.color
        );
        if (matchingCircle) matchingCircle.setAttribute('stroke-width', '18');
        updateCenter(catVal, catConfig.label);
      });

      legendItem.addEventListener('mouseleave', () => {
        const matchingCircle = Array.from(svg.querySelectorAll('.donut-segment')).find(
          c => c.getAttribute('stroke') === catConfig.color
        );
        if (matchingCircle) matchingCircle.setAttribute('stroke-width', '14');
        updateCenter(total, 'TONS/YR');
      });

      legendContainer.appendChild(legendItem);
    });
  },

  renderInsights(data) {
    const tipsBox = document.getElementById('dashboard-tips-box');
    if (!tipsBox) return;

    tipsBox.innerHTML = '';

    const categories = data.categories;
    
    // Sort categories by descending footprint
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

    // Render the top 2 highest carbon driving categories as tips
    const activeTips = sortedCats.slice(0, 2);
    
    activeTips.forEach(tip => {
      const template = tipsTemplates[tip.key];
      const tipCard = document.createElement('div');
      
      // Select appropriate theme borders
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
          <span>${template.icon}</span> ${template.title}
        </div>
        <p style="font-size: 0.78rem; line-height: 1.4; color: #9ca3af;">${template.text}</p>
      `;
      tipsBox.appendChild(tipCard);
    });
  },

  // Interactive Action Simulator
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

    // Get current simulator sliders values
    const energyVal = Number(document.getElementById('sim-range-energy').value); // 0, 1, 2
    const commuteVal = Number(document.getElementById('sim-range-commute').value); // 0 - 100
    const dietVal = Number(document.getElementById('sim-range-diet').value); // 0, 1, 2

    // Label indicators
    const energyLabels = ['No Change', 'Partial Solar (Save 50%)', 'Green Tariff (Save 95%)'];
    document.getElementById('sim-val-energy').textContent = energyLabels[energyVal];
    document.getElementById('sim-val-energy').style.color = energyVal > 0 ? '#10b981' : '#9ca3af';

    document.getElementById('sim-val-commute').textContent = commuteVal > 0 ? `${commuteVal}% Less` : '0% Less';
    document.getElementById('sim-val-commute').style.color = commuteVal > 0 ? '#10b981' : '#9ca3af';

    const dietLabels = ['No Change', 'Shift to Veggie', 'Shift to Vegan'];
    document.getElementById('sim-val-diet').textContent = dietLabels[dietVal];
    document.getElementById('sim-val-diet').style.color = dietVal > 0 ? '#10b981' : '#9ca3af';

    // Math calculation of simulated reductions
    const cats = this.baselineFootprint.categories;
    
    // Commute savings (only applies to car component of transport, which is roughly 75% of baseline transport)
    const commuteReduction = (cats.transport * 0.75) * (commuteVal / 100);

    // Energy savings
    let energyReduction = 0;
    if (energyVal === 1) energyReduction = cats.energy * 0.5;
    else if (energyVal === 2) energyReduction = cats.energy * 0.95;

    // Diet savings
    let dietReduction = 0;
    if (dietVal === 1) {
      // Shift meat diet to vegetarian (average 3.0 or 1.8 down to 1.1)
      dietReduction = Math.max(0, cats.food * 0.35); // Approx 35% savings
    } else if (dietVal === 2) {
      // Shift meat diet to vegan (average down to 0.65)
      dietReduction = Math.max(0, cats.food * 0.6); // Approx 60% savings
    }

    const totalSavings = commuteReduction + energyReduction + dietReduction;
    const simulatedFootprint = Math.max(0.2, this.baselineFootprint.total - totalSavings);

    // Render simulated value inside donut center text when sliders are used!
    const centerValEl = document.getElementById('donut-center-val');
    if (totalSavings > 0) {
      centerValEl.innerHTML = `${simulatedFootprint.toFixed(1)} <span style="font-size: 0.65rem; color:#10b981; display:block; margin-top:-2px;">saved ${(totalSavings).toFixed(1)}t</span>`;
    } else {
      centerValEl.textContent = this.baselineFootprint.total.toFixed(1);
    }
  }
};

window.Dashboard = Dashboard;
window.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});
