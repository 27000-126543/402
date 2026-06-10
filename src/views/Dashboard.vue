<template>
  <div class="dashboard">
    <div class="stats-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card blue">
            <div class="stat-icon">
              <el-icon :size="28"><Download /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ store.stats.todayArrival }}<span class="stat-unit"> 吨</span></div>
              <div class="stat-label">今日入库量</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card green">
            <div class="stat-icon">
              <el-icon :size="28"><Upload /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ store.stats.todayOutbound }}<span class="stat-unit"> 吨</span></div>
              <div class="stat-label">今日出库量</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card orange">
            <div class="stat-icon">
              <el-icon :size="28"><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ store.stats.sortingCount }}<span class="stat-unit"> 批</span></div>
              <div class="stat-label">分拣中批次</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card purple">
            <div class="stat-icon">
              <el-icon :size="28"><Setting /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ store.stats.equipmentUtilization }}<span class="stat-unit"> %</span></div>
              <div class="stat-label">设备利用率</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">分拣量趋势</span>
              <el-radio-group v-model="trendType" size="small">
                <el-radio-button value="day">日</el-radio-button>
                <el-radio-button value="week">周</el-radio-button>
                <el-radio-button value="month">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">品类占比</span>
          </template>
          <div ref="categoryChartRef" class="chart-container small"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">设备运行状态</span>
          </template>
          <div class="equipment-status">
            <div v-for="eq in store.equipment.slice(0, 4)" :key="eq.id" class="eq-item">
              <div class="eq-header">
                <span class="eq-name">{{ eq.name }}</span>
                <el-tag size="small" :type="getEqStatusType(eq.status)">{{ getEqStatusName(eq.status) }}</el-tag>
              </div>
              <div class="eq-progress">
                <el-progress 
                  :percentage="Math.round(eq.runHours / 2000 * 100)" 
                  :stroke-width="8"
                  :color="getEqProgressColor(eq.status)"
                />
              </div>
              <div class="eq-info">
                <span>运行 {{ eq.runHours.toFixed(1) }} 小时</span>
                <span>位置: {{ eq.location }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">待办事项</span>
              <el-badge :value="store.stats.pendingApprovals" class="item">
                <span style="font-size: 14px; color: #909399;">待审批</span>
              </el-badge>
            </div>
          </template>
          <div class="todo-list">
            <div class="todo-item warning">
              <el-icon><Warning /></el-icon>
              <span>电子废弃物分拣线故障待处理</span>
              <el-button type="primary" text size="small">处理</el-button>
            </div>
            <div class="todo-item info">
              <el-icon><Document /></el-icon>
              <span>今日中班排程待审批</span>
              <el-button type="primary" text size="small">审批</el-button>
            </div>
            <div class="todo-item info">
              <el-icon><Box /></el-icon>
              <span>分拣刷库存低于安全线</span>
              <el-button type="primary" text size="small">查看</el-button>
            </div>
            <div class="todo-item success">
              <el-icon><CircleCheck /></el-icon>
              <span>玻璃分拣线维保完成</span>
              <el-button type="primary" text size="small">详情</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">市场价格动态</span>
              <span style="font-size: 12px; color: #909399;">近30天走势</span>
            </div>
          </template>
          <el-row :gutter="16">
            <el-col v-for="item in store.marketPrices" :key="item.type" :span="6">
              <div class="price-card">
                <div class="price-header">
                  <span class="price-name">{{ item.typeName }}</span>
                  <el-tag size="small" :type="item.priceChange >= 0 ? 'danger' : 'success'" effect="light">
                    {{ item.priceChange >= 0 ? '+' : '' }}{{ item.priceChange }}%
                  </el-tag>
                </div>
                <div class="price-value">¥{{ item.currentPrice.toLocaleString() }}<span class="price-unit">/吨</span></div>
                <div class="price-demand">
                  需求指数: <span :style="{ color: item.demandTrend === 'up' ? '#67c23a' : item.demandTrend === 'down' ? '#f56c6c' : '#909399' }">
                    {{ item.demand }}
                    <el-icon><component :is="item.demandTrend === 'up' ? 'Top' : item.demandTrend === 'down' ? 'Bottom' : 'Minus'" /></el-icon>
                  </span>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useAppStore } from '@/stores/app'
import { EQUIPMENT_STATUS, WASTE_TYPES } from '@/data/constants'
import * as echarts from 'echarts'
import {
  Download,
  Upload,
  Tickets,
  Setting,
  Warning,
  Document,
  Box,
  CircleCheck,
  Top,
  Bottom,
  Minus
} from '@element-plus/icons-vue'

const store = useAppStore()
const trendType = ref('day')

const trendChartRef = ref(null)
const categoryChartRef = ref(null)
let trendChart = null
let categoryChart = null

function getEqStatusType(status) {
  const map = { RUNNING: 'success', IDLE: 'info', MAINTENANCE: 'warning', FAULT: 'danger' }
  return map[status] || 'info'
}

function getEqStatusName(status) {
  const eq = EQUIPMENT_STATUS.find(e => e.code === status)
  return eq ? eq.name : status
}

function getEqProgressColor(status) {
  if (status === 'FAULT') return '#f56c6c'
  if (status === 'MAINTENANCE') return '#e6a23c'
  return '#409eff'
}

function initTrendChart() {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  
  const dates = []
  for (let i = 13; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.getMonth() + 1 + '/' + date.getDate())
  }
  
  const inboundData = dates.map(() => Math.round(20 + Math.random() * 30))
  const outboundData = dates.map(() => Math.round(15 + Math.random() * 25))
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: { color: '#303133' }
    },
    legend: {
      data: ['入库量', '出库量'],
      right: 20,
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'value',
      name: '吨',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399' }
    },
    series: [
      {
        name: '入库量',
        type: 'line',
        smooth: true,
        data: inboundData,
        lineStyle: { color: '#409eff', width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        itemStyle: { color: '#409fff' }
      },
      {
        name: '出库量',
        type: 'line',
        smooth: true,
        data: outboundData,
        lineStyle: { color: '#67c23a', width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        },
        itemStyle: { color: '#67c23a' }
      }
    ]
  }
  
  trendChart.setOption(option)
}

function initCategoryChart() {
  if (!categoryChartRef.value) return
  categoryChart = echarts.init(categoryChartRef.value)
  
  const data = store.inventory.map(item => ({
    value: item.quantity,
    name: item.typeName
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 吨 ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
      borderWidth: 1,
      textStyle: { color: '#303133' }
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 5,
      top: 'center',
      textStyle: { color: '#606266', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data,
        color: WASTE_TYPES.map(t => t.color)
      }
    ]
  }
  
  categoryChart.setOption(option)
}

function handleResize() {
  trendChart?.resize()
  categoryChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initCategoryChart()
    window.addEventListener('resize', handleResize)
  })
})

watch(trendType, () => {
  setTimeout(() => initTrendChart(), 100)
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stats-cards {
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-card.blue .stat-icon {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.stat-card.green .stat-icon {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.stat-card.orange .stat-icon {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.stat-card.purple .stat-icon {
  background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-unit {
  font-size: 14px;
  font-weight: normal;
  color: #909399;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.chart-container.small {
  height: 280px;
}

.equipment-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.eq-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.eq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.eq-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.eq-progress {
  margin-bottom: 6px;
}

.eq-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 14px;
  color: #606266;
}

.todo-item.warning {
  border-left: 3px solid #e6a23c;
}

.todo-item.info {
  border-left: 3px solid #409eff;
}

.todo-item.success {
  border-left: 3px solid #67c23a;
}

.todo-item span {
  flex: 1;
}

.price-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: transform 0.2s;
}

.price-card:hover {
  transform: translateY(-2px);
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.price-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.price-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
}

.price-unit {
  font-size: 12px;
  font-weight: normal;
  color: #909399;
}

.price-demand {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.price-demand span {
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>
