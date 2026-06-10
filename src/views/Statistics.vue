<template>
  <div class="statistics">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="统计周期">
          <el-radio-group v-model="filterForm.period">
            <el-radio-button value="day">日</el-radio-button>
            <el-radio-button value="week">周</el-radio-button>
            <el-radio-button value="month">月</el-radio-button>
            <el-radio-button value="year">年</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="统计维度">
          <el-select v-model="filterForm.dimension" style="width: 140px">
            <el-option label="按品类" value="category" />
            <el-option label="按班组" value="team" />
            <el-option label="按设备" value="equipment" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryStats">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
        <el-form-item style="margin-left: auto;">
          <el-button type="success" @click="exportExcel">
            <el-icon><Download /></el-icon>
            导出Excel
          </el-button>
          <el-button type="warning" @click="exportMonthlyReport">
            <el-icon><Document /></el-icon>
            月度运营报告
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="16" class="stats-summary">
      <el-col :span="6">
        <div class="summary-card">
          <div class="summary-icon blue"><el-icon><Download /></el-icon></div>
          <div class="summary-info">
            <div class="summary-value">{{ totalInbound.toFixed(2) }}<span> 吨</span></div>
            <div class="summary-label">总入库量</div>
          </div>
          <div class="summary-trend up">
            <el-icon><Top /></el-icon> 12.5%
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="summary-card">
          <div class="summary-icon green"><el-icon><Upload /></el-icon></div>
          <div class="summary-info">
            <div class="summary-value">{{ totalOutbound.toFixed(2) }}<span> 吨</span></div>
            <div class="summary-label">总出库量</div>
          </div>
          <div class="summary-trend up">
            <el-icon><Top /></el-icon> 8.3%
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="summary-card">
          <div class="summary-icon orange"><el-icon><PieChart /></el-icon></div>
          <div class="summary-info">
            <div class="summary-value">{{ avgLossRate.toFixed(2) }}<span> %</span></div>
            <div class="summary-label">平均损耗率</div>
          </div>
          <div class="summary-trend down">
            <el-icon><Bottom /></el-icon> 2.1%
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="summary-card">
          <div class="summary-icon purple"><el-icon><Setting /></el-icon></div>
          <div class="summary-info">
            <div class="summary-value">{{ avgEquipmentUtilization.toFixed(1) }}<span> %</span></div>
            <div class="summary-label">设备利用率</div>
          </div>
          <div class="summary-trend up">
            <el-icon><Top /></el-icon> 5.2%
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">分拣量趋势</span>
              <el-radio-group v-model="chartType" size="small">
                <el-radio-button value="bar">柱状图</el-radio-button>
                <el-radio-button value="line">折线图</el-radio-button>
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
          <div ref="categoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">班组分拣量排行</span>
          </template>
          <div ref="teamChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span class="card-title">设备利用率</span>
          </template>
          <div ref="equipmentChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <span class="card-title">详细统计表</span>
          <span style="font-size: 13px; color: #909399;">共 {{ statsData.length }} 条记录</span>
        </div>
      </template>
      <el-table :data="statsData" stripe border style="width: 100%">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="category" :label="filterForm.dimension === 'category' ? '品类' : filterForm.dimension === 'team' ? '班组' : '设备'" width="140" />
        <el-table-column prop="inbound" label="入库量(吨)" width="120" sortable>
          <template #default="{ row }">
            <span style="color: #409eff;">{{ row.inbound.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="outbound" label="出库量(吨)" width="120" sortable>
          <template #default="{ row }">
            <span style="color: #67c23a;">{{ row.outbound.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="loss" label="损耗(吨)" width="100" sortable>
          <template #default="{ row }">
            <span style="color: #f56c6c;">{{ row.loss.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lossRate" label="损耗率" width="100" sortable>
          <template #default="{ row }">
            <el-tag size="small" :type="row.lossRate > 3 ? 'danger' : 'success'" effect="light">
              {{ row.lossRate.toFixed(2) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="batchCount" label="批次数量" width="100" sortable />
        <el-table-column prop="avgWeight" label="平均单重(吨)" width="120" sortable>
          <template #default="{ row }">{{ row.avgWeight.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="efficiency" label="分拣效率" width="100" sortable>
          <template #default="{ row }">
            <el-tag size="small" type="primary" effect="plain">{{ row.efficiency }}%</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { WASTE_TYPES } from '@/data/constants'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'
import {
  Search,
  Download,
  Document,
  Top,
  Bottom,
  PieChart,
  Setting,
  Upload,
  Download as DownloadIcon
} from '@element-plus/icons-vue'

const store = useAppStore()

const filterForm = reactive({
  period: 'month',
  dateRange: [],
  dimension: 'category'
})

const chartType = ref('bar')

const trendChartRef = ref(null)
const categoryChartRef = ref(null)
const teamChartRef = ref(null)
const equipmentChartRef = ref(null)

let trendChart = null
let categoryChart = null
let teamChart = null
let equipmentChart = null

function isInDateRange(timeStr) {
  if (!filterForm.dateRange || filterForm.dateRange.length !== 2) return true
  const [start, end] = filterForm.dateRange
  const batchDate = timeStr.split(' ')[0]
  return batchDate >= start && batchDate <= end
}

const filteredBatches = computed(() => {
  return store.wasteBatches.filter(b => isInDateRange(b.arrivalTime))
})

const statsData = computed(() => {
  const batches = filteredBatches.value
  
  if (filterForm.dimension === 'category') {
    return WASTE_TYPES.map(type => {
      const typeBatches = batches.filter(b => b.type === type.code)
      const inbound = typeBatches.reduce((sum, b) => sum + b.estimatedWeight, 0)
      const outbound = typeBatches.filter(b => b.status === 'OUTBOUND').reduce((sum, b) => sum + b.actualWeight, 0)
      const loss = inbound - outbound
      const lossRate = inbound > 0 ? (loss / inbound * 100) : 0
      const avgWeight = typeBatches.length > 0 ? inbound / typeBatches.length : 0
      const efficiency = 85 + Math.floor(Math.random() * 15)
      
      return {
        category: type.name,
        color: type.color,
        inbound,
        outbound,
        loss,
        lossRate,
        batchCount: typeBatches.length,
        avgWeight,
        efficiency
      }
    }).filter(item => item.batchCount > 0)
  } else if (filterForm.dimension === 'team') {
    const teams = ['A组', 'B组', 'C组', 'D组']
    const teamColors = ['#409eff', '#67c23a', '#e6a23c', '#909399']
    return teams.map((team, idx) => {
      const teamBatches = batches.filter(b => b.team === team)
      const inbound = teamBatches.reduce((sum, b) => sum + b.estimatedWeight, 0)
      const outbound = teamBatches.filter(b => b.status === 'OUTBOUND').reduce((sum, b) => sum + b.actualWeight, 0)
      const loss = inbound - outbound
      const lossRate = inbound > 0 ? (loss / inbound * 100) : 0
      const avgWeight = teamBatches.length > 0 ? inbound / teamBatches.length : 0
      const efficiency = 85 + Math.floor(Math.random() * 15)
      
      return {
        category: team,
        color: teamColors[idx],
        inbound,
        outbound,
        loss,
        lossRate,
        batchCount: teamBatches.length,
        avgWeight,
        efficiency
      }
    }).filter(item => item.batchCount > 0)
  } else {
    const equipmentBatchesMap = {}
    batches.forEach(batch => {
      if (batch.equipmentId) {
        if (!equipmentBatchesMap[batch.equipmentId]) {
          const eq = store.equipment.find(e => e.id === batch.equipmentId)
          equipmentBatchesMap[batch.equipmentId] = {
            id: batch.equipmentId,
            name: eq?.name || batch.equipmentId,
            batches: []
          }
        }
        equipmentBatchesMap[batch.equipmentId].batches.push(batch)
      }
    })
    
    return Object.values(equipmentBatchesMap).map(item => {
      const eqBatches = item.batches
      const inbound = eqBatches.reduce((sum, b) => sum + b.estimatedWeight, 0)
      const outbound = eqBatches.filter(b => b.status === 'OUTBOUND').reduce((sum, b) => sum + b.actualWeight, 0)
      const loss = inbound - outbound
      const lossRate = inbound > 0 ? (loss / inbound * 100) : 0
      const avgWeight = eqBatches.length > 0 ? inbound / eqBatches.length : 0
      const efficiency = 85 + Math.floor(Math.random() * 15)
      
      return {
        category: item.name,
        equipmentId: item.id,
        color: '#409eff',
        inbound,
        outbound,
        loss,
        lossRate,
        batchCount: eqBatches.length,
        avgWeight,
        efficiency
      }
    })
  }
})

const totalInbound = computed(() => statsData.value.reduce((sum, s) => sum + s.inbound, 0))
const totalOutbound = computed(() => statsData.value.reduce((sum, s) => sum + s.outbound, 0))
const avgLossRate = computed(() => {
  const total = statsData.value.reduce((sum, s) => sum + s.lossRate, 0)
  return statsData.value.length > 0 ? total / statsData.value.length : 0
})
const avgEquipmentUtilization = computed(() => {
  return parseFloat(store.stats.equipmentUtilization)
})

function generateTrendData() {
  const dates = []
  const inboundData = []
  const outboundData = []
  const batches = filteredBatches.value
  
  if (filterForm.period === 'day') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      dates.push((d.getMonth() + 1) + '/' + d.getDate())
      
      const dayBatches = batches.filter(b => b.arrivalTime.startsWith(dateStr))
      inboundData.push(Math.round(dayBatches.reduce((sum, b) => sum + b.estimatedWeight, 0) * 10) / 10)
      outboundData.push(Math.round(dayBatches.filter(b => b.status === 'OUTBOUND').reduce((sum, b) => sum + b.actualWeight, 0) * 10) / 10)
    }
  } else if (filterForm.period === 'week') {
    for (let i = 3; i >= 0; i--) {
      dates.push('第' + (4 - i) + '周')
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - i * 7 - 6)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const weekStartStr = weekStart.toISOString().split('T')[0]
      const weekEndStr = weekEnd.toISOString().split('T')[0]
      
      const weekBatches = batches.filter(b => {
        const bd = b.arrivalTime.split(' ')[0]
        return bd >= weekStartStr && bd <= weekEndStr
      })
      inboundData.push(Math.round(weekBatches.reduce((sum, b) => sum + b.estimatedWeight, 0)))
      outboundData.push(Math.round(weekBatches.filter(b => b.status === 'OUTBOUND').reduce((sum, b) => sum + b.actualWeight, 0)))
    }
  } else if (filterForm.period === 'month') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthStr = d.toISOString().slice(0, 7)
      dates.push((d.getMonth() + 1) + '月')
      
      const monthBatches = batches.filter(b => b.arrivalTime.startsWith(monthStr))
      inboundData.push(Math.round(monthBatches.reduce((sum, b) => sum + b.estimatedWeight, 0)))
      outboundData.push(Math.round(monthBatches.filter(b => b.status === 'OUTBOUND').reduce((sum, b) => sum + b.actualWeight, 0)))
    }
  } else {
    for (let i = 4; i >= 0; i--) {
      const d = new Date()
      const year = d.getFullYear() - i
      dates.push(year + '年')
      
      const yearBatches = batches.filter(b => b.arrivalTime.startsWith(String(year)))
      inboundData.push(Math.round(yearBatches.reduce((sum, b) => sum + b.estimatedWeight, 0)))
      outboundData.push(Math.round(yearBatches.filter(b => b.status === 'OUTBOUND').reduce((sum, b) => sum + b.actualWeight, 0)))
    }
  }
  
  return { dates, inboundData, outboundData }
}

function initTrendChart() {
  if (!trendChartRef.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  
  const { dates, inboundData, outboundData } = generateTrendData()
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e4e7ed',
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
    series: chartType.value === 'bar' ? [
      {
        name: '入库量',
        type: 'bar',
        data: inboundData,
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#66b1ff' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '出库量',
        type: 'bar',
        data: outboundData,
        barWidth: '35%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#85ce61' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ] : [
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
        }
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
        }
      }
    ]
  }
  
  trendChart.setOption(option)
}

function initCategoryChart() {
  if (!categoryChartRef.value) return
  if (!categoryChart) {
    categoryChart = echarts.init(categoryChartRef.value)
  }
  
  const data = statsData.value.map(item => ({
    value: item.inbound,
    name: item.category
  }))
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 吨 ({d}%)'
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 5,
      top: 'center',
      textStyle: { color: '#606266', fontSize: 12 }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: data,
        color: WASTE_TYPES.map(t => t.color)
      }
    ]
  }
  
  categoryChart.setOption(option)
}

function initTeamChart() {
  if (!teamChartRef.value) return
  if (!teamChart) {
    teamChart = echarts.init(teamChartRef.value)
  }
  
  const teams = ['A组', 'B组', 'C组', 'D组']
  const batches = filteredBatches.value
  const data = teams.map(team => {
    const teamBatches = batches.filter(b => b.team === team)
    return Math.round(teamBatches.reduce((sum, b) => sum + b.estimatedWeight, 0) * 10) / 10
  })
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}: {c} 吨'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '吨',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'category',
      data: teams,
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#606266' }
    },
    series: [
      {
        type: 'bar',
        data: data,
        barWidth: '50%',
        itemStyle: {
          color: function(params) {
            const colors = ['#409eff', '#67c23a', '#e6a23c', '#909399']
            return colors[params.dataIndex]
          },
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right',
          color: '#606266',
          formatter: '{c} 吨'
        }
      }
    ]
  }
  
  teamChart.setOption(option)
}

function initEquipmentChart() {
  if (!equipmentChartRef.value) return
  if (!equipmentChart) {
    equipmentChart = echarts.init(equipmentChartRef.value)
  }
  
  const batches = filteredBatches.value
  const equipmentList = store.equipment.slice(0, 6)
  const names = equipmentList.map(e => e.name)
  const data = equipmentList.map(eq => {
    const eqBatches = batches.filter(b => {
      const sch = store.schedules.find(s => s.wasteType === b.type)
      return sch && sch.equipmentId === eq.id
    })
    const totalWeight = eqBatches.reduce((sum, b) => sum + b.estimatedWeight, 0)
    return eq.status === 'MAINTENANCE' ? 0 : Math.min(100, Math.round(40 + totalWeight * 2))
  })
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { 
        color: '#606266',
        rotate: 20,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      name: '利用率 %',
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399' }
    },
    series: [
      {
        type: 'bar',
        data: data,
        barWidth: '50%',
        itemStyle: {
          color: function(params) {
            if (params.value > 80) return '#67c23a'
            if (params.value > 50) return '#e6a23c'
            return '#909399'
          },
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#606266',
          formatter: '{c}%'
        }
      }
    ]
  }
  
  equipmentChart.setOption(option)
}

watch([() => filterForm.dimension, () => filterForm.dateRange, () => filterForm.period], () => {
  nextTick(() => {
    initTrendChart()
    initCategoryChart()
    initTeamChart()
    initEquipmentChart()
  })
}, { deep: true })

function queryStats() {
  ElMessage.success('统计数据已更新')
  setTimeout(() => {
    initTrendChart()
    initCategoryChart()
    initTeamChart()
    initEquipmentChart()
  }, 100)
}

function resetFilter() {
  filterForm.period = 'month'
  filterForm.dateRange = []
  filterForm.dimension = 'category'
  queryStats()
}

function exportExcel() {
  const data = statsData.value.map((item, index) => ({
    '序号': index + 1,
    '品类': item.category,
    '入库量(吨)': item.inbound.toFixed(2),
    '出库量(吨)': item.outbound.toFixed(2),
    '损耗(吨)': item.loss.toFixed(2),
    '损耗率(%)': item.lossRate.toFixed(2),
    '批次数量': item.batchCount,
    '平均单重(吨)': item.avgWeight.toFixed(2),
    '分拣效率(%)': item.efficiency
  }))
  
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '分拣统计')
  
  ws['!cols'] = [
    { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
  ]
  
  const fileName = `分拣统计报表_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
  
  ElMessage.success('Excel导出成功')
}

function exportMonthlyReport() {
  const reportData = [
    ['再生资源分拣中心 月度运营报告', ''],
    ['统计月份：', new Date().toLocaleDateString()],
    ['', ''],
    ['一、运营概览', ''],
    ['指标', '数值'],
    ['总入库量(吨)', totalInbound.value.toFixed(2)],
    ['总出库量(吨)', totalOutbound.value.toFixed(2)],
    ['平均损耗率(%)', avgLossRate.value.toFixed(2)],
    ['设备利用率(%)', avgEquipmentUtilization.value.toFixed(1)],
    ['', ''],
    ['二、品类明细', ''],
    ['品类', '入库量(吨)']
  ]
  
  statsData.value.forEach(item => {
    reportData.push([item.category, item.inbound.toFixed(2)])
  })
  
  reportData.push(['', ''])
  reportData.push(['三、设备状态', ''])
  reportData.push(['运行中设备', store.equipment.filter(e => e.status === 'RUNNING').length + ' 台'])
  reportData.push(['空闲设备', store.equipment.filter(e => e.status === 'IDLE').length + ' 台'])
  reportData.push(['维保中设备', store.equipment.filter(e => e.status === 'MAINTENANCE').length + ' 台'])
  reportData.push(['故障设备', store.equipment.filter(e => e.status === 'FAULT').length + ' 台'])
  
  const ws = XLSX.utils.aoa_to_sheet(reportData)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '月度报告')
  
  ws['!cols'] = [{ wch: 20 }, { wch: 20 }]
  
  const fileName = `月度运营报告_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, fileName)
  
  ElMessage.success('月度运营报告导出成功')
}

function handleResize() {
  trendChart?.resize()
  categoryChart?.resize()
  teamChart?.resize()
  equipmentChart?.resize()
}

watch(chartType, () => {
  initTrendChart()
})

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initCategoryChart()
    initTeamChart()
    initEquipmentChart()
    window.addEventListener('resize', handleResize)
  })
})
</script>

<style scoped>
.statistics {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card,
.chart-card,
.table-card {
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

.stats-summary {
  margin-bottom: 16px;
}

.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.summary-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}

.summary-icon.blue {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.summary-icon.green {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.summary-icon.orange {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.summary-icon.purple {
  background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
}

.summary-info {
  flex: 1;
}

.summary-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.summary-value span {
  font-size: 14px;
  font-weight: normal;
  color: #909399;
}

.summary-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.summary-trend {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.summary-trend.up {
  color: #67c23a;
}

.summary-trend.down {
  color: #f56c6c;
}

.chart-container {
  height: 300px;
  width: 100%;
}
</style>
