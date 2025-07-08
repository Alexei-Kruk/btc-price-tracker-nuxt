<script setup>
import PriceChart from '~/components/PriceChart.vue'

const period = ref('month')
const customFrom = ref('')
const customTo = ref('')

function setPeriod(p) {
  period.value = p
}

function applyCustomRange() {
  if (customFrom.value && customTo.value && customFrom.value <= customTo.value) {
    period.value = 'custom'
  } else {
    alert('Пожалуйста, выберите корректный диапазон дат')
  }
}
</script>

<template>
  <div class="container">
    <header>
      <h1>Bitcoin Price Tracker</h1>
      <p>Отслеживайте динамику цены BTC</p>
    </header>

    <section class="controls">
      <div class="preset-buttons">
        <button :class="{ active: period === 'day' }" @click="setPeriod('day')">День</button>
        <button :class="{ active: period === 'week' }" @click="setPeriod('week')">Неделя</button>
        <button :class="{ active: period === 'month' }" @click="setPeriod('month')">Месяц</button>
        <button :class="{ active: period === 'year' }" @click="setPeriod('year')">Год</button>
      </div>

      <div class="custom-range">
        <label>
          От:
          <input v-model="customFrom" type="date" />
        </label>
        <label>
          До:
          <input v-model="customTo" type="date" />
        </label>
        <button @click="applyCustomRange">Применить</button>
      </div>
    </section>

    <section class="chart">
      <PriceChart :custom-from="customFrom" :period="period" />
    </section>

    <section class="stats">
      <div>Текущая цена: <strong>{{ currentPrice }}</strong></div>
      <div>Мин: <strong>{{ minPrice }}</strong></div>
      <div>Макс: <strong>{{ maxPrice }}</strong></div>
    </section>
  </div>
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: 'Inter', sans-serif;
  color: #222;
}

header {
  text-align: center;
  margin-bottom: 1.5rem;
}

header h1 {
  margin: 0;
  font-weight: 700;
  font-size: 2rem;
  color: #0070f3;
}

header p {
  margin: 0.25rem 0 0;
  color: #555;
  font-weight: 500;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.preset-buttons button {
  margin-right: 0.5rem;
  background: #0070f3;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.preset-buttons button:last-child {
  margin-right: 0;
}

.preset-buttons button.active,
.preset-buttons button:hover {
  background: #005bb5;
}

.custom-range label {
  margin-right: 0.5rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.custom-range input[type="date"] {
  padding: 0.3rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.custom-range button {
  background: #00b894;
  border: none;
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.custom-range button:hover {
  background: #019875;
}

.chart {
  border: 1px solid #ccc;
  height: 300px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

.stats {
  display: flex;
  justify-content: space-around;
  font-weight: 600;
  color: #333;
}
</style>
