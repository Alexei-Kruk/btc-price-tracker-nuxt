<script setup lang="ts">
import { computed, ref } from 'vue'
import PriceChart from '~/components/PriceChart.vue'

useHead({
	title: "Bitcoin Price Tracker",
});

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

    <section class="controls controls_main">
      <div class="controls__presets">
        <button 
          v-for="btn in [
            { id: 'day', label: 'День' },
            { id: 'week', label: 'Неделя' },
            { id: 'month', label: 'Месяц' },
            { id: 'year', label: 'Год' }
          ]" 
          :key="btn.id"
          :class="['controls__preset', { 'controls__preset_active': period === btn.id }]" 
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
          :class="{ 'controls__apply_disabled': !dateRangeValid }"
          :disabled="!dateRangeValid"
          @click="applyCustomRange"
        >
          Применить
        </button>
      </div>
    </section>

    <section class="chart chart_container">
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

    <section v-if="statsAvailable" class="stats stats_main">
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

