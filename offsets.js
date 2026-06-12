// Carbon Offset Marketplace & Certificate Module

const Offsets = {
  PROJECTS: [
    {
      id: 'p1',
      title: 'Amazon Canopy Reforestation',
      desc: 'Plant native tree seedlings in the Amazon basin to restore canopy cover and capture carbon.',
      location: 'Amazon Rainforest, Brazil',
      price: 15.00,
      rating: '4.9',
      image: 'assets/amazon_reforestation.png',
      badge: 'Certified Gold Standard',
      altText: 'Native tree seedlings being planted inside the Amazon basin reforestation zone'
    },
    {
      id: 'p2',
      title: 'Kutch Wind Power Project',
      desc: 'Support the construction of wind turbine grids in Kutch, displacing carbon-intensive fossil power.',
      location: 'Gujarat, India',
      price: 8.50,
      rating: '4.7',
      image: 'assets/wind_turbines.png',
      badge: 'VCS Certified',
      altText: 'Modern green wind turbines operating clean power grids across Kutch fields'
    },
    {
      id: 'p3',
      title: 'Great Pacific Ocean Clean-up',
      desc: 'Fund oceanic cleanup vessels extracting microplastics to restore marine carbon sequestration.',
      location: 'North Pacific Gyre',
      price: 22.00,
      rating: '4.9',
      image: 'assets/ocean_cleanup.png',
      badge: 'Ocean Blue Verified',
      altText: 'Environmental marine extraction vessel harvesting microplastics out of the water grid'
    }
  ],

  state: {
    totalOffsetTons: 0,
    certHolderName: 'Eco Explorer'
  },

  init() {
    this.loadState();
    this.setupListeners();
    this.render();
  },

  loadState() {
    const saved = localStorage.getItem('climatica_offsets_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          this.state.totalOffsetTons = typeof parsed.totalOffsetTons === 'number' ? parsed.totalOffsetTons : 0;
          this.state.certHolderName = typeof parsed.certHolderName === 'string' ? parsed.certHolderName : 'Eco Explorer';
        }
      } catch (e) {
        console.error("Error loading offsets state, resetting.", e);
        this.state = { totalOffsetTons: 0, certHolderName: 'Eco Explorer' };
      }
    }
  },

  saveState() {
    localStorage.setItem('climatica_offsets_state', JSON.stringify(this.state));
  },

  setupListeners() {
    const btnRender = document.getElementById('btn-render-cert');
    if (btnRender) {
      btnRender.addEventListener('click', () => {
        const nameInput = document.getElementById('cert-name-input');
        if (nameInput) {
          const rawName = nameInput.value;
          const name = rawName.replace(/<[^>]*>/g, '').replace(/[&<>"'/]/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;'
          })[c] || c).trim().slice(0, 80);

          if (name && name.length >= 2) {
            this.state.certHolderName = name;
            this.saveState();
            this.updateCertificateUI();
            if (window.App && typeof window.App.showToast === 'function') {
              window.App.showToast("Certificate generated successfully!", "success");
            }
          } else {
            if (window.App && typeof window.App.showToast === 'function') {
              window.App.showToast("Please enter a valid name (at least 2 characters).", "info");
            }
          }
        }
      });
    }

    const btnPrint = document.getElementById('btn-print-cert');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        this.printCertificate();
      });
    }
  },

  purchaseOffset(projectId, tons) {
    const project = this.PROJECTS.find(p => p.id === projectId);
    if (!project) return;

    this.state.totalOffsetTons += tons;
    this.saveState();
    this.render();

    if (window.Habits && typeof window.Habits.addXP === 'function') {
      window.Habits.addXP(Math.round(tons * 150));
      
      if (this.state.totalOffsetTons >= 1.0 && typeof window.Habits.unlockBadge === 'function') {
        window.Habits.unlockBadge('b_offset_first');
      }

      const currentFootprint = window.App?.state?.footprint?.total || 0;
      if (currentFootprint > 0 && this.state.totalOffsetTons >= currentFootprint && typeof window.Habits.unlockBadge === 'function') {
        window.Habits.unlockBadge('b_offset_full');
      }
    }

    if (window.App && typeof window.App.onOffsetsStateChange === 'function') {
      window.App.onOffsetsStateChange();
      window.App.showToast(`Purchased ${tons} Ton offset: Supported "${project.title}"!`, 'success');
    }
  },

  render() {
    const statsEl = document.getElementById('offsets-stat-tons');
    if (statsEl) {
      statsEl.textContent = this.state.totalOffsetTons.toFixed(1);
    }

    const container = document.getElementById('offset-projects-container');
    if (!container) return;

    container.innerHTML = '';

    this.PROJECTS.forEach(project => {
      const card = document.createElement('div');
      card.className = 'card offset-card';
      
      card.innerHTML = `
        <div class="offset-media">
          <div class="offset-project-badge">${project.badge}</div>
          <img src="${project.image}" alt="${project.altText || project.title}">
        </div>
        <h3 style="font-size: 1.1rem; color: white; margin-bottom: 0.25rem;">${project.title}</h3>
        <div style="font-size: 0.75rem; color: var(--teal); font-weight:600; margin-bottom: 0.75rem; display:flex; justify-content:space-between;">
          <span>📍 ${project.location}</span>
          <span>⭐ ${project.rating}</span>
        </div>
        <p class="offset-card-desc">${project.desc}</p>
        <div class="offset-card-footer">
          <div class="offset-price">
            $${project.price.toFixed(2)} <span>/ Ton</span>
          </div>
          <div style="display:flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm btn-offset-buy" data-id="${project.id}" data-tons="0.5" aria-label="Purchase 0.5 Tons offset from ${project.title}">+0.5t</button>
            <button class="btn btn-primary btn-sm btn-offset-buy" data-id="${project.id}" data-tons="1.0" aria-label="Purchase 1.0 Ton offset from ${project.title}">+1.0t</button>
          </div>
        </div>
      `;

      const buyButtons = card.querySelectorAll('.btn-offset-buy');
      buyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const pid = e.currentTarget.getAttribute('data-id');
          const tons = parseFloat(e.currentTarget.getAttribute('data-tons'));
          if (pid && !isNaN(tons)) {
            this.purchaseOffset(pid, tons);
          }
        });
      });

      container.appendChild(card);
    });

    this.updateCertificateUI();
  },

  updateCertificateUI() {
    const certName = document.getElementById('cert-display-name');
    if (certName) certName.textContent = this.state.certHolderName;

    const annualFootprint = window.App?.state?.footprint?.total || 0;
    
    const certFootprint = document.getElementById('cert-val-footprint');
    if (certFootprint) certFootprint.textContent = annualFootprint.toFixed(1);
    
    const certOffset = document.getElementById('cert-val-offset');
    if (certOffset) certOffset.textContent = this.state.totalOffsetTons.toFixed(1);
    
    const certDate = document.getElementById('cert-date');
    if (certDate) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      certDate.textContent = new Date().toLocaleDateString('en-US', options);
    }
  },

  printCertificate() {
    const targetElement = document.getElementById('printable-certificate');
    if (!targetElement) return;
    
    const certContent = targetElement.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast("Popup blocked! Please allow popups to save your certificate.", "info");
      }
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Climatica - Carbon Neutral Certificate</title>
          <style>
            body {
              background-color: #060913;
              color: white;
              font-family: 'Inter', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .cert-card {
              border: 4px double #10b981;
              border-radius: 12px;
              padding: 40px;
              text-align: center;
              max-width: 550px;
              background-color: #0f1626;
              box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
            }
            .cert-seal { font-size: 3rem; margin-bottom: 10px; }
            .cert-title { font-size: 1.8rem; color: #10b981; font-weight: bold; margin-bottom: 20px; }
            .cert-recipient { font-size: 1.6rem; font-weight: bold; border-bottom: 2px solid rgba(255,255,255,0.2); display: inline-block; padding: 0 30px 5px 30px; margin-bottom: 20px; }
            .cert-text { font-size: 0.95rem; color: #cbd5e1; line-height: 1.5; margin-bottom: 25px; }
            .cert-metrics { display: inline-flex; gap: 30px; background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; margin-bottom: 25px; }
            .cert-stat { display: flex; flex-direction: column; }
            .cert-stat-val { font-weight: bold; font-size: 1.1rem; color: #06b6d4; }
            .cert-stat-label { font-size: 0.7rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
            .cert-footer { font-size: 0.75rem; color: #6b7280; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="cert-card">
            ${certContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};

window.Offsets = Offsets;
window.addEventListener('DOMContentLoaded', () => {
  Offsets.init();
});
