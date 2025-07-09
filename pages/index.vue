<script setup lang="ts">
import { computed, ref } from 'vue'
import PriceChart from '~/components/PriceChart.vue'

type Period = 'day' | 'week' | 'month' | 'year' | 'custom'

const period = ref<Period>('month')
const customFrom = ref<string>('')
const customTo = ref<string>('')
const loading = ref<boolean>(false)
const currentPrice = ref<number | null>(null)
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)

const dateRangeValid = computed<boolean>(() => {
  if (!customFrom.value || !customTo.value) return false
  return new Date(customFrom.value) <= new Date(customTo.value)
})

const statsAvailable = computed<boolean>(() => {
  return currentPrice.value !== null && minPrice.value !== null && maxPrice.value !== null
})

function setPeriod(p: Period): void {
  period.value = p
  if (p !== 'custom') {
    customFrom.value = ''
    customTo.value = ''
  }
}

function applyCustomRange(): void {
  if (!dateRangeValid.value) {
    alert('Пожалуйста, выберите корректный диапазон дат (начальная дата должна быть меньше или равна конечной)')
    return
  }
  period.value = 'custom'
}

function updateStats(data: { current: number; min: number; max: number }): void {
  currentPrice.value = data.current
  minPrice.value = data.min
  maxPrice.value = data.max
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <h1 class="page__title">Bitcoin Price Tracker</h1>
      <p class="page__subtitle">Отслеживайте динамику цены BTC в реальном времени</p>
    </header>

    <section class="controls controls--main">
      <div class="controls__presets">
        <button 
          v-for="btn in [
            { id: 'day', label: 'День' },
            { id: 'week', label: 'Неделя' },
            { id: 'month', label: 'Месяц' },
            { id: 'year', label: 'Год' }
          ]" 
          :key="btn.id"
          :class="['controls__preset', { 'controls__preset--active': period === btn.id }]" 
          @click="setPeriod(btn.id as Period)"
        >
          {{ btn.label }}
        </button>
      </div>

      <div class="controls__custom-range">
        <label class="controls__label">
          <span class="controls__label-text">От:</span>
          <input 
            v-model="customFrom" 
            type="date" 
            :max="customTo || undefined"
            class="controls__input"
            @change="period = 'custom'"
          >
        </label>
        <label class="controls__label">
          <span class="controls__label-text">До:</span>
          <input 
            v-model="customTo" 
            type="date" 
            :min="customFrom || undefined"
            class="controls__input"
            @change="period = 'custom'"
          >
        </label>
        <button 
          class="controls__apply"
          :class="{ 'controls__apply--disabled': !dateRangeValid }"
          :disabled="!dateRangeValid"
          @click="applyCustomRange"
        >
          Применить
        </button>
      </div>
    </section>

    <section class="chart chart--container">
      <div v-if="loading" class="chart__loading">
        <p>Загрузка данных...</p>
      </div>
      <PriceChart 
        v-else
        :period="period" 
        :custom-from="customFrom" 
        :custom-to="customTo"
        @update-stats="updateStats"
      />
    </section>

    <section v-if="statsAvailable" class="stats stats--main">
      <div class="stats__item">
        <span class="stats__label">Текущая цена:</span>
        <span class="stats__value">${{ currentPrice?.toLocaleString() }}</span>
      </div>
      <div class="stats__item">
        <span class="stats__label">Минимум:</span>
        <span class="stats__value">${{ minPrice?.toLocaleString() }}</span>
      </div>
      <div class="stats__item">
        <span class="stats__label">Максимум:</span>
        <span class="stats__value">${{ maxPrice?.toLocaleString() }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 1.5rem;
  font-family: 'Inter', system-ui, sans-serif;
  color: #2c3e50;
  background: rgba(255,255,255,0.85);
  border-radius: 18px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.08);
}

.page__header {
  text-align: center;
  margin-bottom: 2rem;
  background: rgba(255,255,255,0.6);
  border-radius: 18px 18px 0 0;
  padding: 2rem 1rem 1rem 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.page__title {
  margin: 0;
  font-weight: 800;
  font-size: 2.5rem;
  background: linear-gradient(90deg, #0070f3, #00b894);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.page__subtitle {
  margin: 0.5rem 0 0;
  color: #7f8c8d;
  font-weight: 500;
  font-size: 1.1rem;
}

.controls--main {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(248,249,250,0.85);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.controls__presets {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.controls__preset {
  flex: 1;
  min-width: 80px;
  background: rgba(224,242,254,0.8);
  border: none;
  color: #0369a1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.controls__preset--active {
  background: #0369a1;
  color: white;
  box-shadow: 0 2px 5px rgba(3, 105, 161, 0.18);
}
.controls__preset:not(.controls__preset--active):hover {
  background: #bae6fd;
}
.controls__custom-range {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}
.controls__label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-weight: 500;
  color: #374151;
}
.controls__label-text {
  opacity: 0.8;
}
.controls__input[type="date"] {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-family: inherit;
  background: rgba(255,255,255,0.7);
  transition: border-color 0.2s;
}
.controls__input[type="date"]:focus {
  outline: none;
  border-color: #0070f3;
}
.controls__apply {
  align-self: flex-end;
  background: #00b894;
  border: none;
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.controls__apply:hover:not(.controls__apply--disabled) {
  background: #019875;
  transform: translateY(-1px);
}
.controls__apply--disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.7;
}

.chart--container {
  position: relative;
  min-height: 400px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  background: rgba(255,255,255,0.85);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}
.chart__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.stats--main {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  background: rgba(248,249,250,0.85);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
.stats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255,255,255,0.85);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.stats__label {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}
.stats__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

@media (max-width: 768px) {
  .page {
    padding: 0 1rem;
  }
  .controls--main {
    padding: 1rem;
  }
  .controls__presets {
    gap: 0.5rem;
  }
  .controls__custom-range {
    flex-direction: column;
    align-items: stretch;
  }
  .stats--main {
    grid-template-columns: 1fr;
  }
}
</style>