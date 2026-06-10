<template>
  <div class="workshop">
    <el-card class="control-card">
      <div class="control-bar">
        <div class="control-left">
          <span class="title">车间平面图</span>
          <el-tag type="success">实时更新</el-tag>
        </div>
        <div class="control-right">
          <span class="label">热力类型：</span>
          <el-radio-group v-model="heatmapType" size="default">
            <el-radio-button value="workload">
              <el-icon><Operation /></el-icon>
              忙闲热力
            </el-radio-button>
            <el-radio-button value="stock">
              <el-icon><Box /></el-icon>
              库存热力
            </el-radio-button>
          </el-radio-group>
          <el-divider direction="vertical" />
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="18">
        <el-card class="floor-card">
          <div class="floor-plan">
            <svg viewBox="0 0 1000 600" class="floor-svg">
              <defs>
                <linearGradient id="zoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#fff;stop-opacity:0.1" />
                  <stop offset="100%" style="stop-color:#e4e7ed;stop-opacity:0.3" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.2" />
                </filter>
              </defs>

              <rect x="10" y="10" width="980" height="580" fill="#f5f7fa" stroke="#dcdfe6" stroke-width="2" rx="8" />

              <g v-for="zone in zones" :key="zone.id" @click="selectZone(zone)" class="zone-group" :class="{ selected: selectedZone?.id === zone.id }">
                <rect 
                  :x="zone.x" 
                  :y="zone.y" 
                  :width="zone.width" 
                  :height="zone.height"
                  :fill="getZoneColor(zone)"
                  :fill-opacity="getZoneOpacity(zone)"
                  stroke="#909399"
                  stroke-width="1.5"
                  rx="6"
                  filter="url(#shadow)"
                />
                <text 
                  :x="zone.x + zone.width / 2" 
                  :y="zone.y + 28" 
                  text-anchor="middle" 
                  class="zone-name"
                  :fill="getZoneTextColor(zone)"
                >
                  {{ zone.name }}
                </text>
                <text 
                  :x="zone.x + zone.width / 2" 
                  :y="zone.y + 48" 
                  text-anchor="middle" 
                  class="zone-value"
                  :fill="getZoneTextColor(zone)"
                >
                  {{ heatmapType === 'workload' ? zone.workLoad + '%' : zone.stockLoad + '%' }}
                </text>
                <text 
                  v-if="zone.equipment"
                  :x="zone.x + zone.width / 2" 
                  :y="zone.y + 68" 
                  text-anchor="middle" 
                  class="zone-equipment"
                  :fill="getZoneTextColor(zone)"
                >
                  {{ zone.equipment.name }}
                </text>
                <g v-if="zone.equipment && zone.equipment.status === 'RUNNING'">
                  <circle :cx="zone.x + 20" :cy="zone.y + 20" r="6" fill="#67c23a">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </g>
              </g>

              <g class="conveyor-group">
                <rect x="260" y="280" width="480" height="20" fill="#e4e7ed" rx="4" />
                <rect v-for="i in 8" :key="i" :x="260 + i * 60" y="283" width="40" height="14" fill="#c0c4cc" rx="2">
                  <animate 
                    attributeName="fill" 
                    values="#c0c4cc;#909399;#c0c4cc" 
                    dur="2s" 
                    :begin="(i * 0.2) + 's'"
                    repeatCount="indefinite" 
                  />
                </rect>
              </g>

              <g class="legend">
                <text x="30" y="565" class="legend-title">图例：</text>
                <rect x="80" y="552" width="16" height="16" fill="#67c23a" fill-opacity="0.7" rx="3" />
                <text x="102" y="565" class="legend-text">低负荷</text>
                <rect x="170" y="552" width="16" height="16" fill="#e6a23c" fill-opacity="0.7" rx="3" />
                <text x="192" y="565" class="legend-text">中负荷</text>
                <rect x="260" y="552" width="16" height="16" fill="#f56c6c" fill-opacity="0.7" rx="3" />
                <text x="282" y="565" class="legend-text">高负荷</text>
                <circle cx="380" cy="560" r="6" fill="#67c23a" />
                <text x="395" y="565" class="legend-text">运行中</text>
                <circle cx="470" cy="560" r="6" fill="#f56c6c" />
                <text x="485" y="565" class="legend-text">故障</text>
              </g>
            </svg>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="info-card" v-if="selectedZone">
          <template #header>
            <div class="card-header">
              <span class="card-title">{{ selectedZone.name }}</span>
              <el-tag :type="getZoneStatusType(selectedZone)" size="small">
                {{ getZoneStatusText(selectedZone) }}
              </el-tag>
            </div>
          </template>

          <div class="zone-info">
            <div class="info-item">
              <span class="info-label">忙闲程度</span>
              <div class="info-value">
                <el-progress 
                  :percentage="selectedZone.workLoad" 
                  :stroke-width="8"
                  :color="getLoadColor(selectedZone.workLoad)"
                />
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">库存占用</span>
              <div class="info-value">
                <el-progress 
                  :percentage="selectedZone.stockLoad" 
                  :stroke-width="8"
                  :color="getLoadColor(selectedZone.stockLoad)"
                />
              </div>
            </div>
            <el-divider />
            <div v-if="selectedZone.equipment" class="eq-detail">
              <div class="eq-title">设备信息</div>
              <div class="eq-row">
                <span>设备名称</span>
                <span>{{ selectedZone.equipment.name }}</span>
              </div>
              <div class="eq-row">
                <span>运行状态</span>
                <el-tag size="small" :type="getEqStatusType(selectedZone.equipment.status)">
                  {{ getEqStatusName(selectedZone.equipment.status) }}
                </el-tag>
              </div>
              <div class="eq-row">
                <span>累计运行</span>
                <span>{{ selectedZone.equipment.runHours.toFixed(1) }} 小时</span>
              </div>
              <div class="eq-row">
                <span>设计产能</span>
                <span>{{ selectedZone.equipment.capacity }} 吨/时</span>
              </div>
            </div>
            <div v-if="selectedZone.inventory" class="inv-detail">
              <div class="inv-title">库存信息</div>
              <div class="inv-row">
                <span>库存总量</span>
                <span class="inv-value">{{ selectedZone.inventory.quantity }} 吨</span>
              </div>
              <div class="inv-row">
                <span>待分拣</span>
                <span>{{ selectedZone.inventory.pendingQuantity }} 吨</span>
              </div>
              <div class="inv-row">
                <span>已分拣</span>
                <span>{{ selectedZone.inventory.sortedQuantity }} 吨</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card" style="margin-top: 16px;">
          <template #header>
            <span class="card-title">实时统计</span>
          </template>
          <div class="realtime-stats">
            <div class="stat-item">
              <span class="stat-label">运行设备</span>
              <span class="stat-value" style="color: #67c23a;">{{ runningCount }} / {{ store.equipment.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">平均负荷</span>
              <span class="stat-value" style="color: #409eff;">{{ avgLoad }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">在岗人员</span>
              <span class="stat-value" style="color: #e6a23c;">12 人</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">今日分拣</span>
              <span class="stat-value" style="color: #909399;">{{ todaySorting }} 吨</span>
            </div>
          </div>
        </el-card>

        <el-card class="alert-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时预警</span>
              <el-badge :value="alerts.length" type="danger" />
            </div>
          </template>
          <div class="alert-list">
            <div v-for="(alert, index) in alerts" :key="index" class="alert-item" :class="alert.level">
              <el-icon><Warning /></el-icon>
              <div class="alert-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-time">{{ alert.time }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { WASTE_TYPES, EQUIPMENT_STATUS } from '@/data/constants'
import { Operation, Box, Refresh, Warning } from '@element-plus/icons-vue'

const store = useAppStore()

const heatmapType = ref('workload')
const selectedZone = ref(null)

const zoneLayout = [
  { id: 'A1', name: 'A区-01', x: 50, y: 50, width: 200, height: 120, type: 'PAPER' },
  { id: 'A2', name: 'A区-02', x: 50, y: 190, width: 200, height: 120, type: 'PLASTIC' },
  { id: 'B1', name: 'B区-01', x: 50, y: 340, width: 200, height: 120, type: 'METAL' },
  { id: 'B2', name: 'B区-02', x: 50, y: 480, width: 200, height: 80, type: 'GLASS' },
  { id: 'C1', name: 'C区-01', x: 750, y: 50, width: 200, height: 120, type: 'TEXTILE' },
  { id: 'C2', name: 'C区-02', x: 750, y: 190, width: 200, height: 120, type: 'ELECTRONIC' },
  { id: 'D1', name: 'D区-01', x: 750, y: 340, width: 200, height: 120, type: 'RUBBER' },
  { id: 'D2', name: 'D区-02', x: 750, y: 480, width: 200, height: 80, type: 'WOOD' },
  { id: 'W1', name: '暂存区-1', x: 300, y: 50, width: 180, height: 100, type: 'STORAGE' },
  { id: 'W2', name: '暂存区-2', x: 520, y: 50, width: 180, height: 100, type: 'STORAGE' },
  { id: 'ENT', name: '入库区', x: 300, y: 180, width: 180, height: 80, type: 'INBOUND' },
  { id: 'OUT', name: '出库区', x: 520, y: 180, width: 180, height: 80, type: 'OUTBOUND' },
  { id: 'PACK', name: '打包区', x: 300, y: 400, width: 400, height: 100, type: 'PACKING' },
  { id: 'QUAL', name: '质检区', x: 400, y: 520, width: 200, height: 60, type: 'QUALITY' }
]

const zones = computed(() => {
  return zoneLayout.map(zone => {
    const eq = store.equipment.find(e => e.location === zone.name || e.type === zone.type)
    const inv = store.inventory.find(i => i.type === zone.type)
    
    let workLoad = 0
    let stockLoad = 0
    
    if (eq) {
      if (eq.status === 'RUNNING') {
        workLoad = 60 + Math.floor(Math.random() * 35)
      } else if (eq.status === 'MAINTENANCE') {
        workLoad = 10
      } else if (eq.status === 'FAULT') {
        workLoad = 5
      } else {
        workLoad = 15 + Math.floor(Math.random() * 15)
      }
    } else if (zone.type === 'STORAGE') {
      workLoad = 30 + Math.floor(Math.random() * 30)
      stockLoad = 40 + Math.floor(Math.random() * 40)
    } else if (zone.type === 'INBOUND') {
      workLoad = 45 + Math.floor(Math.random() * 25)
    } else if (zone.type === 'OUTBOUND') {
      workLoad = 35 + Math.floor(Math.random() * 30)
    } else if (zone.type === 'PACKING') {
      workLoad = 55 + Math.floor(Math.random() * 25)
    } else {
      workLoad = 25 + Math.floor(Math.random() * 30)
    }
    
    if (inv) {
      stockLoad = Math.min(100, Math.round(inv.quantity / 50 * 100))
    } else if (zone.type === 'STORAGE') {
      stockLoad = 35 + Math.floor(Math.random() * 40)
    }
    
    return {
      ...zone,
      workLoad,
      stockLoad,
      equipment: eq,
      inventory: inv
    }
  })
})

const runningCount = computed(() => store.equipment.filter(e => e.status === 'RUNNING').length)

const avgLoad = computed(() => {
  const total = zones.value.reduce((sum, z) => sum + z.workLoad, 0)
  return Math.round(total / zones.value.length)
})

const todaySorting = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return store.wasteBatches
    .filter(b => b.status === 'OUTBOUND' && b.outboundTime?.startsWith(today))
    .reduce((sum, b) => sum + b.actualWeight, 0)
    .toFixed(2)
})

const alerts = computed(() => {
  const list = []
  
  store.equipment.forEach(eq => {
    if (eq.status === 'FAULT') {
      list.push({ 
        title: `${eq.name} - 设备故障`, 
        level: 'high', 
        time: '实时' 
      })
    }
    const progress = (eq.runHours % eq.maintenanceInterval) / eq.maintenanceInterval
    if (progress > 0.9 && eq.status !== 'MAINTENANCE') {
      list.push({ 
        title: `${eq.name} - 急需维保`, 
        level: 'high', 
        time: '实时' 
      })
    } else if (progress > 0.8 && eq.status !== 'MAINTENANCE') {
      list.push({ 
        title: `${eq.name} - 接近维保周期`, 
        level: 'medium', 
        time: '实时' 
      })
    }
  })
  
  store.spareParts.forEach(part => {
    if (part.stock < part.minStock) {
      const shortage = part.minStock - part.stock
      list.push({
        title: `${part.name}库存不足 - 缺${shortage}${part.unit}`,
        level: 'medium',
        time: '实时'
      })
    }
  })
  
  const pendingApprovals = store.approvalRecords.filter(a => a.status === 'PENDING').length
  if (pendingApprovals > 0) {
    list.push({
      title: `待审批事项 - ${pendingApprovals}条`,
      level: 'medium',
      time: '实时'
    })
  }
  
  return list.slice(0, 8)
})

let refreshTimer = null

function getZoneColor(zone) {
  const value = heatmapType.value === 'workload' ? zone.workLoad : zone.stockLoad
  if (value >= 80) return '#f56c6c'
  if (value >= 50) return '#e6a23c'
  return '#67c23a'
}

function getZoneOpacity(zone) {
  const value = heatmapType.value === 'workload' ? zone.workLoad : zone.stockLoad
  return 0.3 + (value / 100) * 0.5
}

function getZoneTextColor(zone) {
  const value = heatmapType.value === 'workload' ? zone.workLoad : zone.stockLoad
  return value >= 70 ? '#fff' : '#303133'
}

function getZoneStatusType(zone) {
  if (zone.equipment?.status === 'FAULT') return 'danger'
  if (zone.equipment?.status === 'MAINTENANCE') return 'warning'
  if (zone.equipment?.status === 'RUNNING') return 'success'
  return 'info'
}

function getZoneStatusText(zone) {
  if (zone.equipment?.status === 'FAULT') return '故障'
  if (zone.equipment?.status === 'MAINTENANCE') return '维保中'
  if (zone.equipment?.status === 'RUNNING') return '运行中'
  if (zone.equipment?.status === 'IDLE') return '空闲'
  return '正常'
}

function getLoadColor(value) {
  if (value >= 80) return '#f56c6c'
  if (value >= 50) return '#e6a23c'
  return '#67c23a'
}

function getEqStatusType(status) {
  const map = {
    RUNNING: 'success',
    IDLE: 'info',
    MAINTENANCE: 'warning',
    FAULT: 'danger'
  }
  return map[status] || 'info'
}

function getEqStatusName(status) {
  const s = EQUIPMENT_STATUS.find(e => e.code === status)
  return s ? s.name : status
}

function selectZone(zone) {
  selectedZone.value = zone
}

function refreshData() {
  alerts.value = [
    { title: '玻璃分拣线需维保', level: 'high', time: '刚刚' },
    { title: '分拣刷库存预警', level: 'medium', time: '30分钟前' },
    { title: '废纸分拣线负荷过高', level: 'medium', time: '1小时前' }
  ]
}

onMounted(() => {
  refreshTimer = setInterval(() => {
    zones.value.forEach(z => {
      if (z.equipment?.status === 'RUNNING') {
        z.workLoad = 60 + Math.floor(Math.random() * 35)
      }
    })
  }, 3000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.workshop {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-card,
.floor-card,
.info-card,
.stats-card,
.alert-card {
  border-radius: 12px;
}

.control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.control-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 14px;
  color: #606266;
}

.floor-plan {
  background: #fafafa;
  border-radius: 8px;
  padding: 10px;
}

.floor-svg {
  width: 100%;
  height: 550px;
}

.zone-group {
  cursor: pointer;
  transition: all 0.3s;
}

.zone-group:hover rect {
  stroke-width: 2.5;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.zone-group.selected rect {
  stroke: #409eff;
  stroke-width: 3;
}

.zone-name {
  font-size: 14px;
  font-weight: 600;
}

.zone-value {
  font-size: 18px;
  font-weight: bold;
}

.zone-equipment {
  font-size: 11px;
  opacity: 0.9;
}

.legend-title {
  font-size: 12px;
  fill: #909399;
}

.legend-text {
  font-size: 12px;
  fill: #606266;
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

.zone-info {
  padding: 5px 0;
}

.info-item {
  margin-bottom: 16px;
}

.info-label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.info-value {
  padding: 0 5px;
}

.eq-detail,
.inv-detail {
  margin-top: 10px;
}

.eq-title,
.inv-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.eq-row,
.inv-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  color: #606266;
  border-bottom: 1px dashed #f0f0f0;
}

.eq-row:last-child,
.inv-row:last-child {
  border-bottom: none;
}

.inv-value {
  color: #409eff;
  font-weight: 500;
}

.realtime-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
  color: #f56c6c;
}

.alert-item.medium {
  background: #fdf6ec;
  border-left-color: #e6a23c;
  color: #e6a23c;
}

.alert-item.low {
  background: #f0f9eb;
  border-left-color: #67c23a;
  color: #67c23a;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 13px;
  color: #303133;
  margin-bottom: 2px;
}

.alert-time {
  font-size: 11px;
  color: #909399;
}
</style>
