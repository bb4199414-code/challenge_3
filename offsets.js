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
      badge: 'Certified Gold Standard'
    },
    {
      id: 'p2',
      title: 'Kutch Wind Power Project',
      desc: 'Support the construction of wind turbine grids in Kutch, displacing carbon-intensive fossil power.',
      location: 'Gujarat, India',
      price: 8.50,
      rating: '4.7',
      image: 'assets/wind_turbines.png',
      badge: 'VCS Certified'
    },
    {
      id: 'p3',
      title: 'Great Pacific Ocean Clean-up',
      desc: 'Fund oceanic cleanup vessels extracting microplastics to restore marine carbon sequestration.',
      location: 'North Pacific Gyre',
      price: 22.00,
      rating: '4.9',
      image: 'assets/ocean_cleanup.png',
      badge: 'Ocean Blue Verified'
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
        this.state = JSON.parse(saved);
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
    // Generate certificate button
    const btnRender = document.getElementById('btn-render-cert');
    if (btnRender) {
      btnRender.addEventListener('click', () => {
        const nameInput = document.getElementById('cert-name-input');
        if (nameInput) {
          const name = nameInput.value.trim();
          if (name) {
            this.state.certHolderName = name;
            this.saveState();
            this.updateCertificateUI();
            if (window.App) {
              window.App.showToast("Certificate generated successfully!", "success");
            }
          } else {
            if (window.App) {
              window.App.showToast("Please enter a name first", "info");
            }
          }
        }
      });
    }

    // Print certificate button
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

    // Reward XP for offsetting (150 XP per Ton offset!)
    if (window.Habits) {
      window.Habits.addXP(Math.round(tons * 150));
      
      // Badge Check: Offset First 1.0 Ton
      if (this.state.totalOffsetTons >= 1.0) {
        window.Habits.unlockBadge('b_offset_first');
      }

      // Badge Check: Net Zero Hero (Offset >= annual footprint)
      const currentFootprint = window.App?.state?.footprint?.total || 0;
      if (currentFootprint > 0 && this.state.totalOffsetTons >= currentFootprint) {
        window.Habits.unlockBadge('b_offset_full');
      }
    }

    // Refresh general App views (Dashboard status update)
    if (window.App) {
      window.App.onOffsetsStateChange();
      window.App.showToast(`Purchased ${tons} Ton offset: Supported "${project.title}"!`, 'success');
    }
  },

  render() {
    // Render Stats
    const statsEl = document.getElementById('offsets-stat-tons');
    if (statsEl) {
      statsEl.textContent = this.state.totalOffsetTons.toFixed(1);
    }

    // Render Project Cards
    const container = document.getElementById('offset-projects-container');
    if (!container) return;

    container.innerHTML = '';

    this.PROJECTS.forEach(project => {
      const card = document.createElement('div');
      card.className = 'card offset-card';
      
      card.innerHTML = `
        <div class="offset-media">
          <div class="offset-project-badge">${project.badge}</div>
          <img src="${project.image}" alt="${project.title}">
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
            <button class="btn btn-secondary btn-sm btn-offset-buy" data-id="${project.id}" data-tons="0.5" style="padding:0.4rem 0.75rem; font-size:0.8rem;">+0.5t</button>
            <button class="btn btn-primary btn-sm btn-offset-buy" data-id="${project.id}" data-tons="1.0" style="padding:0.4rem 0.75rem; font-size:0.8rem;">+1.0t</button>
          </div>
        </div>
      `;

      // Setup Buy Buttons listener inside cards
      const buyButtons = card.querySelectorAll('.btn-offset-buy');
      buyButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const pid = e.target.getAttribute('data-id');
          const tons = parseFloat(e.target.getAttribute('data-tons'));
          this.purchaseOffset(pid, tons);
        });
      });

      container.appendChild(card);
    });

    this.updateCertificateUI();
  },

  updateCertificateUI() {
    const certName = document.getElementById('cert-display-name');
    const certFootprint = document.getElementById('cert-val-footprint');
    const certOffset = document.getElementById('cert-val-offset');
    const certDate = document.getElementById('cert-date');

    const annualFootprint = window.App?.state?.footprint?.total || 0;

    if (certName) certName.textContent = this.state.certHolderName;
    if (certFootprint) certFootprint.textContent = annualFootprint.toFixed(1);
    if (certOffset) certOffset.textContent = this.state.totalOffsetTons.toFixed(1);
    if (certDate) {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      certDate.textContent = new Date().toLocaleDateString('en-US', options);
    }
  },

  printCertificate() {
    const certContent = document.getElementById('printable-certificate').innerHTML;
    
    // Open a simple print window to print certificate cleanly
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
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
            .cert-title { font-size: 1.8rem; color: #10b981; font-weight: bold; margin-bottom: 20px; font-family: 'Outfit', sans-serif; }
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
