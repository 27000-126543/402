<template>
  <div class="equipment">
    <el-row :gutter="16">
      <el-col :span="18">
        <el-card class="eq-list-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">设备列表</span>
              <div class="header-actions">
                <el-tag type="success">运行: {{ runningCount }}</el-tag>
                <el-tag type="info">空闲: {{ idleCount }}</el-tag>
                <el-tag type="warning">维保: {{ maintenanceCount }}</el-tag>
                <el-tag type="danger">故障: {{ faultCount }}</el-tag>
              </div>
            </div>
          </template>

          <el-table :data="store.equipment" stripe style="width: 100%">
            <el-table-column prop="id" label="设备编号" width="100" />
            <el-table-column prop="name" label="设备名称" width="160" />
            <el-table-column prop="type" label="处理品类" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getWasteTagType(row.type)">{{ getWasteName(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="getStatusType(row.status)">
                  {{ getStatusName(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="runHours" label="累计运行(小时)" width="130" sortable>
              <template #default="{ row }">{{ row.runHours.toFixed(1) }}</template>
            </el-table-column>
            <el-table-column label="维保进度" width="180">
              <template #default="{ row }">
                <el-progress 
                  :percentage="Math.round(row.runHours % row.maintenanceInterval / row.maintenanceInterval * 100)" 
                  :stroke-width="8"
                  :color="getProgressColor(row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="lastMaintenance" label="上次维保" width="110" />
            <el-table-column prop="location" label="位置" width="100" />
            <el-table-column prop="capacity" label="产能(吨/时)" width="100" />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click="viewDetail(row)">详情</el-button>
                <el-button type="warning" text size="small" @click="createMaintenance(row)" v-if="row.status !== 'MAINTENANCE'">
                  维保
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="order-card" style="margin-top: 16px;">
          <template #header>
            <div class="card-header">
              <span class="card-title">维保工单</span>
              <el-button type="primary" size="small" @click="generateAutoOrders">
                <el-icon><Refresh /></el-icon>
                自动生成工单
              </el-button>
            </div>
          </template>

          <el-table :data="store.maintenanceOrders" stripe style="width: 100%">
            <el-table-column prop="id" label="工单编号" width="130" />
            <el-table-column prop="equipmentName" label="设备名称" width="150" />
            <el-table-column prop="typeName" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.type === 'FAULT' ? 'danger' : row.type === 'SCHEDULED' ? 'warning' : 'info'">
                  {{ row.typeName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="priorityName" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.priority === 'HIGH' ? 'danger' : row.priority === 'MEDIUM' ? 'warning' : 'info'" effect="plain">
                  {{ row.priorityName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'COMPLETED' ? 'success' : row.status === 'IN_PROGRESS' ? 'primary' : 'warning'">
                  {{ row.statusName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="assignee" label="负责人" width="100" />
            <el-table-column prop="totalCost" label="费用(元)" width="100">
              <template #default="{ row }">¥{{ row.totalCost.toFixed(0) }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160" />
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click="viewOrderDetail(row)">详情</el-button>
                <el-button 
                  type="success" 
                  text 
                  size="small" 
                  @click="startMaintenance(row)" 
                  v-if="row.status === 'PENDING'"
                >
                  开始
                </el-button>
                <el-button 
                  type="primary" 
                  text 
                  size="small" 
                  @click="completeMaintenance(row)" 
                  v-if="row.status === 'IN_PROGRESS'"
                >
                  完成
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stock-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">备件库存</span>
              <el-badge :value="lowStockCount" type="danger" class="item">
                <span style="font-size: 12px; color: #909399;">库存预警</span>
              </el-badge>
            </div>
          </template>

          <div class="stock-list">
            <div v-for="part in store.spareParts" :key="part.id" class="stock-item" :class="{ low: part.stock < part.minStock }">
              <div class="stock-info">
                <span class="stock-name">{{ part.name }}</span>
                <span class="stock-category">{{ part.category }}</span>
              </div>
              <div class="stock-count">
                <span :class="{ 'low-stock': part.stock < part.minStock }">{{ part.stock }}</span>
                <span class="stock-unit">{{ part.unit }}</span>
              </div>
              <div class="stock-min">
                安全库存: {{ part.minStock }} {{ part.unit }}
              </div>
              <el-progress 
                :percentage="Math.round(part.stock / (part.minStock * 2) * 100)" 
                :stroke-width="4"
                :color="part.stock < part.minStock ? '#f56c6c' : '#67c23a'"
                style="margin-top: 6px;"
              />
            </div>
          </div>
        </el-card>

        <el-card class="warn-card" style="margin-top: 16px;">
          <template #header>
            <span class="card-title">设备预警</span>
          </template>
          <div class="warn-list">
            <div v-for="(warn, index) in equipmentWarnings" :key="index" class="warn-item" :class="warn.level">
              <el-icon><Warning /></el-icon>
              <div class="warn-content">
                <div class="warn-title">{{ warn.title }}</div>
                <div class="warn-desc">{{ warn.desc }}</div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="stats-card" style="margin-top: 16px;">
          <template #header>
            <span class="card-title">设备统计</span>
          </template>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-label">总设备数</span>
              <span class="stat-value">{{ store.equipment.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">设备利用率</span>
              <span class="stat-value" style="color: #67c23a;">{{ utilizationRate }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">本月维保次数</span>
              <span class="stat-value" style="color: #e6a23c;">{{ monthMaintenanceCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">故障率</span>
              <span class="stat-value" style="color: #f56c6c;">{{ faultRate }}%</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="detailVisible" title="设备详情" width="600px">
      <el-descriptions v-if="currentEquipment" :column="2" border>
        <el-descriptions-item label="设备编号">{{ currentEquipment.id }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ currentEquipment.name }}</el-descriptions-item>
        <el-descriptions-item label="处理品类">{{ getWasteName(currentEquipment.type) }}</el-descriptions-item>
        <el-descriptions-item label="设备状态">
          <el-tag :type="getStatusType(currentEquipment.status)">
            {{ getStatusName(currentEquipment.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="累计运行">{{ currentEquipment.runHours.toFixed(1) }} 小时</el-descriptions-item>
        <el-descriptions-item label="维保间隔">{{ currentEquipment.maintenanceInterval }} 小时</el-descriptions-item>
        <el-descriptions-item label="上次维保">{{ currentEquipment.lastMaintenance }}</el-descriptions-item>
        <el-descriptions-item label="放置位置">{{ currentEquipment.location }}</el-descriptions-item>
        <el-descriptions-item label="设计产能">{{ currentEquipment.capacity }} 吨/小时</el-descriptions-item>
        <el-descriptions-item label="传送带速度">{{ currentEquipment.conveyorSpeed }} m/s</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="orderVisible" title="维保工单详情" width="550px">
      <el-descriptions v-if="currentOrder" :column="2" border>
        <el-descriptions-item label="工单编号" :span="2">{{ currentOrder.id }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ currentOrder.equipmentName }}</el-descriptions-item>
        <el-descriptions-item label="工单类型">{{ currentOrder.typeName }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="currentOrder.priority === 'HIGH' ? 'danger' : currentOrder.priority === 'MEDIUM' ? 'warning' : 'info'">
            {{ currentOrder.priorityName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentOrder.status === 'COMPLETED' ? 'success' : currentOrder.status === 'IN_PROGRESS' ? 'primary' : 'warning'">
            {{ currentOrder.statusName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ currentOrder.assignee }}</el-descriptions-item>
        <el-descriptions-item label="费用">¥{{ currentOrder.totalCost.toFixed(0) }}</el-descriptions-item>
        <el-descriptions-item label="问题描述" :span="2">{{ currentOrder.description }}</el-descriptions-item>
        <el-descriptions-item label="备件使用" :span="2">
          <div v-for="(part, idx) in currentOrder.parts" :key="idx" class="part-item">
            {{ part.name }} x {{ part.quantity }} (¥{{ part.cost.toFixed(0) }})
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentOrder.createTime }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ currentOrder.startTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ currentOrder.endTime || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { WASTE_TYPES, EQUIPMENT_STATUS } from '@/data/constants'
import { Refresh, Warning } from '@element-plus/icons-vue'

const store = useAppStore()

const detailVisible = ref(false)
const orderVisible = ref(false)
const currentEquipment = ref(null)
const currentOrder = ref(null)

const wasteTypes = WASTE_TYPES

const runningCount = computed(() => store.equipment.filter(e => e.status === 'RUNNING').length)
const idleCount = computed(() => store.equipment.filter(e => e.status === 'IDLE').length)
const maintenanceCount = computed(() => store.equipment.filter(e => e.status === 'MAINTENANCE').length)
const faultCount = computed(() => store.equipment.filter(e => e.status === 'FAULT').length)
const lowStockCount = computed(() => store.spareParts.filter(s => s.stock < s.minStock).length)

const utilizationRate = computed(() => {
  const total = store.equipment.length
  const running = store.equipment.filter(e => e.status === 'RUNNING').length
  return ((running / total) * 100).toFixed(1)
})

const monthMaintenanceCount = computed(() => {
  return store.maintenanceOrders.filter(o => o.status === 'COMPLETED').length
})

const faultRate = computed(() => {
  return ((faultCount.value / store.equipment.length) * 100).toFixed(1)
})

const equipmentWarnings = computed(() => [
  { title: '玻璃分拣线', desc: '运行时长超维保周期160小时', level: 'high' },
  { title: '电子废弃物分拣线', desc: '设备故障待处理', level: 'high' },
  { title: '分拣刷库存不足', desc: '低于安全库存8套', level: 'medium' }
])

function getWasteName(code) {
  const t = wasteTypes.find(w => w.code === code)
  return t ? t.name : code
}

function getWasteTagType(type) {
  const map = {
    PAPER: 'warning',
    PLASTIC: 'primary',
    METAL: 'info',
    GLASS: 'success',
    TEXTILE: 'danger',
    ELECTRONIC: '',
    RUBBER: '',
    WOOD: 'warning'
  }
  return map[type] || ''
}

function getStatusName(status) {
  const s = EQUIPMENT_STATUS.find(e => e.code === status)
  return s ? s.name : status
}

function getStatusType(status) {
  const map = {
    RUNNING: 'success',
    IDLE: 'info',
    MAINTENANCE: 'warning',
    FAULT: 'danger'
  }
  return map[status] || 'info'
}

function getProgressColor(row) {
  const progress = (row.runHours % row.maintenanceInterval) / row.maintenanceInterval
  if (progress > 0.85 || row.status === 'FAULT') return '#f56c6c'
  if (progress > 0.6) return '#e6a23c'
  return '#67c23a'
}

function viewDetail(row) {
  currentEquipment.value = row
  detailVisible.value = true
}

function viewOrderDetail(row) {
  currentOrder.value = row
  orderVisible.value = true
}

function createMaintenance(row) {
  ElMessageBox.prompt('请输入维保原因', '创建维保工单', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
    inputValue: '定期保养',
    inputPlaceholder: '请输入维保原因'
  }).then(({ value }) => {
    store.addMaintenanceOrder({
      equipmentId: row.id,
      equipmentName: row.name,
      type: 'SCHEDULED',
      typeName: '定期维保',
      priority: 'MEDIUM',
      priorityName: '中',
      description: value,
      assigneeTeam: '维修一班',
      assignee: '维修人员',
      parts: [
        { name: '润滑油', quantity: 2, cost: 100 }
      ],
      totalCost: 500
    })
    ElMessage.success('维保工单已创建')
  }).catch(() => {})
}

function startMaintenance(row) {
  store.updateMaintenanceOrder(row.id, 'IN_PROGRESS')
  store.updateEquipmentStatus(row.equipmentId, 'MAINTENANCE')
  ElMessage.success('维保已开始')
}

function completeMaintenance(row) {
  ElMessageBox.confirm('确认完成该维保工单？', '提示', {
    type: 'success'
  }).then(() => {
    store.updateMaintenanceOrder(row.id, 'COMPLETED')
    store.updateEquipmentStatus(row.equipmentId, 'IDLE')
    
    const eq = store.equipment.find(e => e.id === row.equipmentId)
    if (eq) {
      eq.lastMaintenance = new Date().toISOString().split('T')[0]
      eq.runHours = Math.round((eq.runHours % eq.maintenanceInterval) * 100) / 100
    }
    
    ElMessage.success('维保完成，设备已恢复空闲状态')
  }).catch(() => {})
}

function generateAutoOrders() {
  ElMessage.info('正在扫描设备状态...')
  setTimeout(() => {
    let count = 0
    store.equipment.forEach(eq => {
      const progress = (eq.runHours % eq.maintenanceInterval) / eq.maintenanceInterval
      if (progress > 0.85 && eq.status !== 'MAINTENANCE') {
        store.addMaintenanceOrder({
          equipmentId: eq.id,
          equipmentName: eq.name,
          type: 'SCHEDULED',
          typeName: '定期维保',
          priority: progress > 0.95 ? 'HIGH' : 'MEDIUM',
          priorityName: progress > 0.95 ? '高' : '中',
          description: eq.name + '运行时长接近维保周期，需进行保养',
          assigneeTeam: '维修一班',
          assignee: '维修人员',
          parts: [
            { name: '润滑油', quantity: 2, cost: 100 },
            { name: '传送带检查', quantity: 1, cost: 300 }
          ],
          totalCost: 800
        })
        count++
      }
    })
    
    if (count > 0) {
      ElMessage.success(`已自动生成 ${count} 条维保工单`)
    } else {
      ElMessage.info('所有设备运行正常，无需维保')
    }
  }, 800)
}
</script>

<style scoped>
.equipment {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.eq-list-card,
.order-card,
.stock-card,
.warn-card,
.stats-card {
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

.header-actions {
  display: flex;
  gap: 8px;
}

.stock-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stock-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #67c23a;
}

.stock-item.low {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.stock-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.stock-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.stock-category {
  font-size: 12px;
  color: #909399;
}

.stock-count {
  margin-bottom: 4px;
}

.stock-count span:first-child {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stock-count .low-stock {
  color: #f56c6c;
}

.stock-unit {
  font-size: 12px;
  color: #909399;
  margin-left: 4px;
}

.stock-min {
  font-size: 12px;
  color: #909399;
}

.warn-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warn-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #fdf6ec;
  border-left: 3px solid #e6a23c;
  color: #e6a23c;
}

.warn-item.high {
  background: #fef0f0;
  border-left-color: #f56c6c;
  color: #f56c6c;
}

.warn-item.medium {
  background: #fdf6ec;
  border-left-color: #e6a23c;
  color: #e6a23c;
}

.warn-content {
  flex: 1;
}

.warn-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.warn-desc {
  font-size: 12px;
  color: #909399;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e4e7ed;
}

.stat-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stat-label {
  font-size: 13px;
  color: #606266;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.part-item {
  padding: 4px 0;
  font-size: 13px;
  color: #606266;
}
</style>
