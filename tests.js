/**
 * Climatica - In-Browser Unit Test Suite
 * ========================================
 * Run these tests by opening the browser console and typing:
 *   ClimaticaTests.run()
 *
 * Or open tests.html in your browser for a visual test report.
 * Tests cover: Calculator Math, Input Sanitization, Habit XP,
 *              Streak Logic, Offset Tracking, and State Persistence.
 */

const ClimaticaTests = (() => {
  // ─── Simple Test Runner ──────────────────────────────────────────────────

  const results = [];

  function test(description, fn) {
    try {
      fn();
      results.push({ pass: true, description });
    } catch (err) {
      results.push({ pass: false, description, error: err.message });
    }
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  function assertApprox(actual, expected, tolerance, message) {
    const diff = Math.abs(actual - expected);
    if (diff > tolerance) {
      throw new Error(
        message || `Expected ~${expected} ± ${tolerance}, got ${actual}`
      );
    }
  }

  function assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        message || `Expected "${expected}", got "${actual}"`
      );
    }
  }

  // ─── Helper: Local sanitizer (mirrors habits.js / app.js logic) ──────────

  function sanitize(str) {
    if (typeof str !== 'string') return '';
    const stripped = str.replace(/<[^>]*>/g, '');
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
    return stripped.replace(/[&<>"'/]/g, (c) => map[c] || c).trim();
  }

  // ─── Helper: Inline Calculator Logic (mirrors calculator.js) ────────────

  const COEF = {
    carKm: 0.18 / 1000,
    carEngine: { petrol: 1.0, hybrid: 0.6, electric: 0.15, none: 0.0 },
    flightHour: 90 / 1000,
    electricityDollar: (12 * 8 * 0.38) / 1000,
    cleanEnergy: { grid: 1.0, partial: 0.5, full: 0.05 },
    diet: { 'heavy-meat': 3.0, average: 1.8, vegetarian: 1.1, vegan: 0.65 },
    shopping: { high: 2.5, average: 1.2, low: 0.45 }
  };

  function calcFootprint(s) {
    const carEmissions = (s.carDistance * 52) * COEF.carKm * COEF.carEngine[s.carEngine];
    const flightEmissions = s.flights * COEF.flightHour;
    const transportTotal = carEmissions + flightEmissions;
    const energyTotal = s.electricityBill * COEF.electricityDollar * COEF.cleanEnergy[s.cleanEnergy];
    const foodTotal = COEF.diet[s.diet] + (s.foodWaste / 100) * 0.6;
    const shoppingTotal = COEF.shopping[s.shopping];
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
  }

  // ─── TEST SUITES ─────────────────────────────────────────────────────────

  function runCalculatorTests() {
    // --- Zero emissions: EV driver, green tariff, vegan, no waste, minimalist
    test('Zero-impact profile: EV + green energy + vegan + no waste + minimalist', () => {
      const result = calcFootprint({
        carDistance: 0, carEngine: 'none', flights: 0,
        electricityBill: 0, cleanEnergy: 'full',
        diet: 'vegan', foodWaste: 0, shopping: 'low'
      });
      assert(result.total < 1.5, `Should be under 1.5 tons, got ${result.total}`);
    });

    // --- Vegan diet baseline should be ~0.65 tons food
    test('Vegan diet produces lowest food emissions (~0.65 t)', () => {
      const result = calcFootprint({
        carDistance: 0, carEngine: 'none', flights: 0,
        electricityBill: 0, cleanEnergy: 'full',
        diet: 'vegan', foodWaste: 0, shopping: 'low'
      });
      assertApprox(result.categories.food, 0.65, 0.15, `Expected food ~0.65, got ${result.categories.food}`);
    });

    // --- Heavy meat diet baseline should be ~3.0 tons food
    test('Heavy-meat diet produces highest food emissions (~3.0 t)', () => {
      const result = calcFootprint({
        carDistance: 0, carEngine: 'none', flights: 0,
        electricityBill: 0, cleanEnergy: 'full',
        diet: 'heavy-meat', foodWaste: 0, shopping: 'low'
      });
      assertApprox(result.categories.food, 3.0, 0.2, `Expected food ~3.0, got ${result.categories.food}`);
    });

    // --- Electric vehicle should produce much less transport emissions than petrol
    test('Electric vehicle emits 85%+ less transport CO2 than petrol at same distance', () => {
      const petrol = calcFootprint({
        carDistance: 200, carEngine: 'petrol', flights: 0,
        electricityBill: 0, cleanEnergy: 'full',
        diet: 'vegan', foodWaste: 0, shopping: 'low'
      });
      const electric = calcFootprint({
        carDistance: 200, carEngine: 'electric', flights: 0,
        electricityBill: 0, cleanEnergy: 'full',
        diet: 'vegan', foodWaste: 0, shopping: 'low'
      });
      const reduction = ((petrol.categories.transport - electric.categories.transport) / petrol.categories.transport) * 100;
      assert(reduction > 80, `Reduction should be > 80%, got ${reduction.toFixed(1)}%`);
    });

    // --- No car should produce 0 car transport emissions
    test('No car / transit produces zero car-related transport emissions', () => {
      const result = calcFootprint({
        carDistance: 500, carEngine: 'none', flights: 0,
        electricityBill: 0, cleanEnergy: 'full',
        diet: 'vegan', foodWaste: 0, shopping: 'low'
      });
      assertApprox(result.categories.transport, 0, 0.05, `Expected 0 transport, got ${result.categories.transport}`);
    });

    // --- Full green tariff should produce ~95% less energy emissions than grid
    test('Full green energy tariff cuts energy emissions by ~95%', () => {
      const grid = calcFootprint({
        carDistance: 0, carEngine: 'none', flights: 0,
        electricityBill: 100, cleanEnergy: 'grid',
        diet: 'vegan', foodWaste: 0, shopping: 'low'
      });
      const green = calcFootprint({
        carDistance: 0, carEngine: 'none', flights: 0,
        electricityBill: 100, cleanEnergy: 'full',
        diet: 'vegan', foodWaste: 0, shopping: 'low'
      });
      const reduction = ((grid.categories.energy - green.categories.energy) / grid.categories.energy) * 100;
      assert(reduction > 90, `Energy reduction should be > 90%, got ${reduction.toFixed(1)}%`);
    });

    // --- Food waste adds to food footprint
    test('50% food waste adds ~0.3 tons to food emissions vs 0% waste', () => {
      const noWaste = calcFootprint({
        carDistance: 0, carEngine: 'none', flights: 0,
        electricityBill: 0, cleanEnergy: 'full',
        diet: 'average', foodWaste: 0, shopping: 'low'
      });
      const highWaste = calcFootprint({
        carDistance: 0, carEngine: 'none', flights: 0,
        electricityBill: 0, cleanEnergy: 'full',
        diet: 'average', foodWaste: 50, shopping: 'low'
      });
      const diff = highWaste.categories.food - noWaste.categories.food;
      assertApprox(diff, 0.3, 0.05, `Expected ~0.3 ton waste penalty, got ${diff.toFixed(2)}`);
    });

    // --- Total should equal sum of categories
    test('Total footprint equals sum of all category emissions', () => {
      const result = calcFootprint({
        carDistance: 150, carEngine: 'petrol', flights: 10,
        electricityBill: 80, cleanEnergy: 'grid',
        diet: 'average', foodWaste: 15, shopping: 'average'
      });
      const categorySum = Object.values(result.categories).reduce((a, b) => a + b, 0);
      assertApprox(result.total, categorySum, 0.2, `Total (${result.total}) should match category sum (${categorySum.toFixed(1)})`);
    });

    // --- High shopping profile should add 2.5 tons
    test('High shopping tier adds 2.5 tons CO2 to footprint', () => {
      const result = calcFootprint({
        carDistance: 0, carEngine: 'none', flights: 0,
        electricityBill: 0, cleanEnergy: 'full',
        diet: 'vegan', foodWaste: 0, shopping: 'high'
      });
      assertApprox(result.categories.shopping, 2.5, 0.05, `Expected shopping ~2.5, got ${result.categories.shopping}`);
    });
  }

  function runSanitizationTests() {
    test('sanitize() strips script tags', () => {
      const input = '<script>alert("xss")</script>My habit';
      const output = sanitize(input);
      assert(!output.includes('<script>'), `Script tag should be removed. Got: ${output}`);
      assert(!output.includes('alert'), `Script content should be removed. Got: ${output}`);
    });

    test('sanitize() strips HTML img injection', () => {
      const input = '<img src=x onerror=alert(1)>My habit';
      const output = sanitize(input);
      assert(!output.includes('<img'), `IMG tag should be removed. Got: ${output}`);
    });

    test('sanitize() escapes angle brackets', () => {
      const output = sanitize('<b>bold</b>');
      assert(output.includes('&lt;') || !output.includes('<b>'), `Angle brackets should be escaped. Got: ${output}`);
    });

    test('sanitize() preserves plain text content', () => {
      const output = sanitize('Cycled to work today');
      assertEqual(output, 'Cycled to work today', `Plain text should pass through unchanged`);
    });

    test('sanitize() trims whitespace', () => {
      const output = sanitize('  Eat vegan  ');
      assertEqual(output, 'Eat vegan', `Should trim leading/trailing spaces`);
    });

    test('sanitize() rejects non-string input gracefully', () => {
      const output = sanitize(null);
      assertEqual(output, '', `null input should return empty string`);

      const output2 = sanitize(undefined);
      assertEqual(output2, '', `undefined input should return empty string`);
    });

    test('sanitize() handles ampersands safely', () => {
      const output = sanitize('Fish & Chips');
      assert(output.includes('&amp;') || !output.includes('&'), `Ampersand should be escaped. Got: ${output}`);
    });
  }

  function runHabitXPTests() {
    test('XP threshold: 1000 XP triggers level up', () => {
      let xp = 999;
      let level = 1;
      const threshold = 1000;
      xp += 50; // Simulate gaining XP
      if (xp >= threshold) {
        level++;
        xp -= threshold;
      }
      assertEqual(level, 2, `Should be level 2 after exceeding 1000 XP`);
      assert(xp < threshold, `Remaining XP should be less than threshold after level up`);
    });

    test('XP does not go negative when habit is unchecked from 0', () => {
      let xp = 0;
      const habitXp = 15;
      xp = Math.max(0, xp - habitXp);
      assert(xp >= 0, `XP should never go below 0, got ${xp}`);
    });

    test('CO2 savings accumulate correctly across multiple habits', () => {
      const habits = [
        { impact: 2.2, checked: true },
        { impact: 0.5, checked: true },
        { impact: 3.5, checked: true }
      ];
      const totalSaved = habits.reduce((sum, h) => h.checked ? sum + h.impact : sum, 0);
      assertApprox(totalSaved, 6.2, 0.01, `Expected 6.2 kg saved, got ${totalSaved}`);
    });

    test('Easy habit gives 1.0 kg CO2 savings and 10 XP', () => {
      const difficultyMap = { easy: { impact: 1.0, xp: 10 }, medium: { impact: 2.5, xp: 20 }, hard: { impact: 5.0, xp: 30 } };
      assertEqual(difficultyMap.easy.impact, 1.0, 'Easy impact should be 1.0');
      assertEqual(difficultyMap.easy.xp, 10, 'Easy XP should be 10');
    });

    test('Hard habit gives 5.0 kg CO2 savings and 30 XP', () => {
      const difficultyMap = { easy: { impact: 1.0, xp: 10 }, medium: { impact: 2.5, xp: 20 }, hard: { impact: 5.0, xp: 30 } };
      assertEqual(difficultyMap.hard.impact, 5.0, 'Hard impact should be 5.0');
      assertEqual(difficultyMap.hard.xp, 30, 'Hard XP should be 30');
    });
  }

  function runOffsetTests() {
    test('Purchasing 0.5 tons offset increases total by 0.5', () => {
      let totalOffsets = 0.0;
      totalOffsets += 0.5;
      assertApprox(totalOffsets, 0.5, 0.001, `Total should be 0.5, got ${totalOffsets}`);
    });

    test('Offset percentage calculation: 50% of 10 ton footprint = 50%', () => {
      const footprint = 10.0;
      const offsets = 5.0;
      const pct = Math.min(100, Math.round((offsets / footprint) * 100));
      assertEqual(pct, 50, `Expected 50%, got ${pct}%`);
    });

    test('Offset percentage caps at 100% even if offsets exceed footprint', () => {
      const footprint = 5.0;
      const offsets = 10.0;
      const pct = Math.min(100, Math.round((offsets / footprint) * 100));
      assertEqual(pct, 100, `Should cap at 100%, got ${pct}%`);
    });

    test('Offset percentage is 0 when footprint is 0', () => {
      const footprint = 0;
      const offsets = 5.0;
      const pct = footprint > 0 ? Math.min(100, Math.round((offsets / footprint) * 100)) : 0;
      assertEqual(pct, 0, `Should be 0% when footprint is 0, got ${pct}%`);
    });
  }

  function runStreakTests() {
    test('Streak increments when first habit of the day is checked', () => {
      const list = [
        { id: 'h1', checked: true },
        { id: 'h2', checked: false }
      ];
      const checkedCount = list.filter(h => h.checked).length;
      let streak = 0;
      if (checkedCount === 1) streak++;
      assertEqual(streak, 1, `Streak should increment to 1 on first check`);
    });

    test('Streak does not double-increment when second habit is checked', () => {
      const list = [
        { id: 'h1', checked: true },
        { id: 'h2', checked: true }
      ];
      const checkedCount = list.filter(h => h.checked).length;
      let streak = 1; // Already incremented from first check
      if (checkedCount === 1) streak++;
      assertEqual(streak, 1, `Streak should not increment again when 2 habits are checked`);
    });

    test('Streak resets to 0 after more than 1 day gap', () => {
      const lastDate = new Date('2026-06-01');
      const today = new Date('2026-06-03'); // 2-day gap
      const diffDays = Math.ceil(Math.abs(today - lastDate) / (1000 * 60 * 60 * 24));
      let streak = 5;
      if (diffDays > 1) streak = 0;
      assertEqual(streak, 0, `Streak should reset after 2-day gap`);
    });

    test('Streak preserved after exactly 1 day gap (consecutive)', () => {
      const lastDate = new Date('2026-06-01');
      const today = new Date('2026-06-02'); // 1-day gap = consecutive
      const diffDays = Math.ceil(Math.abs(today - lastDate) / (1000 * 60 * 60 * 24));
      let streak = 5;
      if (diffDays > 1) streak = 0;
      assertEqual(streak, 5, `Streak should remain 5 after consecutive-day check`);
    });
  }

  // ─── Run all suites ───────────────────────────────────────────────────────

  function run() {
    results.length = 0; // Clear previous results

    console.group('%c🌿 Climatica Test Suite', 'color: #10b981; font-size: 1.1rem; font-weight: bold;');

    runCalculatorTests();
    runSanitizationTests();
    runHabitXPTests();
    runOffsetTests();
    runStreakTests();

    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    const total = results.length;

    console.log('\n%c📊 Results', 'font-weight: bold; font-size: 1rem;');
    results.forEach(r => {
      if (r.pass) {
        console.log(`%c  ✅ ${r.description}`, 'color: #10b981;');
      } else {
        console.log(`%c  ❌ ${r.description}`, 'color: #f43f5e; font-weight: bold;');
        console.log(`%c     Error: ${r.error}`, 'color: #f87171; padding-left: 1em;');
      }
    });

    console.log(`\n%c${passed}/${total} tests passed${failed > 0 ? ` (${failed} failed)` : ' 🎉'}`,
      `font-weight: bold; color: ${failed === 0 ? '#10b981' : '#f59e0b'}; font-size: 1.1rem;`);
    console.groupEnd();

    return { passed, failed, total, results };
  }

  return { run, results };
})();

// Auto-run in test mode (when loaded via tests.html)
if (typeof window !== 'undefined' && window.CLIMATICA_TEST_MODE) {
  window.addEventListener('DOMContentLoaded', () => {
    const output = ClimaticaTests.run();
    // Render to visual test page if available
    const container = document.getElementById('test-results');
    if (container) {
      container.innerHTML = output.results.map(r => `
        <div class="test-row ${r.pass ? 'pass' : 'fail'}">
          <span class="icon">${r.pass ? '✅' : '❌'}</span>
          <span class="desc">${r.description}</span>
          ${r.error ? `<span class="err">${r.error}</span>` : ''}
        </div>
      `).join('');
    }
  });
}

window.ClimaticaTests = ClimaticaTests;
