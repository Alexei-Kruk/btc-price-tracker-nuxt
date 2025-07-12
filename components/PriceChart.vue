<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { DateTime } from 'luxon'
import { computed, onMounted, ref, watch } from 'vue'

interface ApiDataPoint {
  timestamp: string
  price: number
}

interface ChartDataPoint {
  x: number
  y: number
}

type Period = 'day' | 'week' | 'month' | 'year' | 'custom'

const props = withDefaults(defineProps<{
  period?: Period
  customFrom?: string
  customTo?: string
}>(), {
  period: 'month',
  customFrom: '',
  customTo: ''
})

const series = ref([{ 
  name: 'BTC Price', 
  data: [] as ChartDataPoint[]
}])

const isLoading = ref(false)
const errorMessage = ref<string | null>(null)


const chartOptions = computed<ApexOptions>(() => {
  let xLabelFormat = 'dd MMM'
  let tooltipFormat = 'dd MMM yyyy HH:mm'
  if (props.period === 'custom' && props.customFrom && props.customTo) {
    const fromDate = new Date(props.customFrom)
    const toDate = new Date(props.customTo)
    const diffMs = toDate.getTime() - fromDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    if (diffDays <= 2) {
      xLabelFormat = 'HH:mm'
      tooltipFormat = 'dd MMM yyyy HH:mm'
    } else if (diffDays <= 14) {
      xLabelFormat = 'dd MMM HH:mm'
      tooltipFormat = 'dd MMM yyyy HH:mm'
    } else if (diffDays <= 90) {
      xLabelFormat = 'dd MMM'
      tooltipFormat = 'dd MMM yyyy'
    } else {
      xLabelFormat = 'dd MMM'
      tooltipFormat = 'dd MMM yyyy'
    }
  } else {
    switch (props.period) {
      case 'day':
        xLabelFormat = 'HH:mm'
        tooltipFormat = 'dd MMM yyyy HH:mm'
        break
      case 'week':
        xLabelFormat = 'dd MMM HH:mm'
        tooltipFormat = 'dd MMM yyyy HH:mm'
        break
      case 'month':
        xLabelFormat = 'dd MMM'
        tooltipFormat = 'dd MMM yyyy'
        break
      case 'year':
        xLabelFormat = 'dd MMM'
        tooltipFormat = 'dd MMM yyyy'
        break
    }
  }
  return {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    xaxis: {
      type: 'datetime',
      labels: { format: xLabelFormat }
    },
    yaxis: {
      labels: {
        formatter: (value: number) => {
          if (value >= 1000) {
            return `$${Math.round(value / 1000)}K`
          }
          return `$${value.toFixed(2)}`
        }
      }
    },
    stroke: { curve: 'smooth', width: 2, colors: ['#F7931A'] },
    tooltip: {
      x: { format: tooltipFormat },
      y: { formatter: (value: number) => `$${value.toFixed(2)}` }
    }
  }
})

function buildUrl(): string | null {
  if (props.period === 'custom') {
    if (!props.customFrom || !props.customTo) {
      errorMessage.value = 'Укажите начальную и конечную даты'
      return null
    }
    return `/api/prices?from=${props.customFrom}&to=${props.customTo}`
  }

  const daysMap: Record<Exclude<Period, 'custom'>, number> = {
    day: 1,
    week: 7,
    month: 30,
    year: 365
  }

  return `/api/prices?days=${daysMap[props.period]}`
}

async function loadData() {
  const url = buildUrl()
  if (!url) return

  isLoading.value = true
  errorMessage.value = null

  try {
    const data = await $fetch<ApiDataPoint[]>(url)

    if (!Array.isArray(data)) {
      throw new Error('Некорректный формат данных')
    }

    series.value[0].data = aggregateData(data, props.period)
    
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Ошибка загрузки'
    console.error('Ошибка:', err)
  } finally {
    isLoading.value = false
  }
}

// Функция для агрегации данных в зависимости от периода
function aggregateData(data: ApiDataPoint[], period: Period): ChartDataPoint[] {
  if (period === 'day') {
    // Агрегация по 5 минутам за последние 24 часа
    const grouped = new Map<string, { sum: number, count: number }>()
    data.forEach(item => {
      const date = DateTime.fromISO(item.timestamp, { zone: 'Europe/Moscow' })
      // Округляем минуты до ближайших 5
      const roundedMinute = Math.floor(date.minute / 5) * 5
      const key = `${date.year}-${date.month}-${date.day}-${date.hour}-${roundedMinute}`
      if (!grouped.has(key)) {
        grouped.set(key, { sum: 0, count: 0 })
      }
      const group = grouped.get(key)!
      group.sum += item.price
      group.count++
    })
    return Array.from(grouped.entries()).map(([key, value]) => {
      const [year, month, day, hour, minute] = key.split('-').map(Number)
      const date = DateTime.fromObject({ year, month, day, hour, minute }, { zone: 'Europe/Moscow' })
      return {
        x: date.toMillis(),
        y: parseFloat((value.sum / value.count).toFixed(2))
      }
    }).sort((a, b) => a.x - b.x)
  }

  const grouped = new Map<string, {sum: number, count: number}>()

  data.forEach(item => {
    const date = DateTime.fromISO(item.timestamp, { zone: 'Europe/Moscow' })
    let key: string
    if (period === 'week') {
      const hours = Math.floor(date.hour / 4) * 4
      key = `${date.year}-${date.month}-${date.day}-${hours}`
    } else {
      key = `${date.year}-${date.month}-${date.day}`
    }
    if (!grouped.has(key)) {
      grouped.set(key, {sum: 0, count: 0})
    }
    const group = grouped.get(key)!
    group.sum += item.price
    group.count++
  })
  return Array.from(grouped.entries()).map(([key, value]) => {
    const [year, month, day, hour] = key.split('-').map(Number)
    const date = hour !== undefined 
      ? DateTime.fromObject({ year, month, day, hour }, { zone: 'Europe/Moscow' })
      : DateTime.fromObject({ year, month, day }, { zone: 'Europe/Moscow' })
    return {
      x: date.toMillis(),
      y: parseFloat((value.sum / value.count).toFixed(2))
    }
  })
}

onMounted(loadData)
watch(
  () => [props.period, props.customFrom, props.customTo],
  () => {
    const timer = setTimeout(loadData, 60)
    return () => clearTimeout(timer)
  }
)
</script>

<template>
  <div class="chart-container">
    <div v-if="isLoading" class="loading">Загрузка...</div>
    <div v-else-if="errorMessage" class="error">
      {{ errorMessage }} <button @click="loadData">Повторить</button>
    </div>
    <div v-else-if="!isLoading && !errorMessage && series[0].data.length === 0" class="empty-state">
      Нет данных за выбранный период
    </div>
    <ClientOnly>
      <ApexChart
        v-if="!isLoading && !errorMessage && series[0].data.length > 0"
        type="line"
        height="350"
        :options="chartOptions"
        :series="series"
      />
    </ClientOnly>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  min-height: 350px;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 16px;
  background: white;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
  color: #666;
}

.error-state button {
  margin-top: 10px;
  padding: 5px 15px;
  background: #F7931A;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chart {
  width: 100%;
}
</style>