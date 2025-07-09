<script setup lang="ts">
import { useFetch } from '#app'
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  period?: string
  customFrom?: string
  customTo?: string
}>(), {
  period: 'month',
  customFrom: '',
  customTo: ''
})

const series = ref([{ name: 'BTC Price', data: [] }])
const chartOptions = ref({
  chart: {
    id: 'btc-chart'
  },
  xaxis: {
    type: 'datetime'
  },
  stroke: {
    curve: 'smooth'
  }
})

// функция для получения URL API
function buildUrl() {
  if (props.period === 'custom' && props.customFrom && props.customTo) {
    return `/api/prices?from=${props.customFrom}&to=${props.customTo}`
  }

  const ranges: Record<string, string> = {
    day: '1d',
    week: '7d',
    month: '1m',
    year: '1y'
  }

  const rangeParam = ranges[props.period] || '1d'
  return `/api/prices?range=${rangeParam}`
}

// загрузка данных
async function loadData() {
  const url = buildUrl()

  const { data, error } = await useFetch(url)

  if (error.value) {
    console.error('API Error:', error.value)
    return
  }

  if (!data.value || !Array.isArray(data.value)) {
    console.warn('Нет данных с API или неверный формат')
    return
  }

  series.value[0].data = data.value.map(p => ({
    x: new Date(p.timestamp).getTime(),
    y: p.price
  }))
}

// реакция на изменение пропсов
watch(() => [props.period, props.customFrom, props.customTo], loadData, { immediate: true })
</script>

<template>
  <apexchart
    type="line"
    :options="chartOptions"
    :series="series"
    height="350"
  />
</template>
