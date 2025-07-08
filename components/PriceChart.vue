<script setup>
import { onMounted, ref } from 'vue'

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

onMounted(async () => {
  const { data, error } = await useFetch('/api/prices?range=7d')

  if (error.value) {
    console.error('API error:', error.value)
    return
  }

  if (!data.value) {
    console.warn('No data returned from API')
    return
  }

  series.value[0].data = data.value.map(p => ({
    x: new Date(p.timestamp).getTime(),
    y: p.price
  }))
})
</script>

<template>
  <apexchart
    type="line"
    :options="chartOptions"
    :series="series"
    height="350"
  />
</template>
