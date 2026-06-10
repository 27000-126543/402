<template>
  <div class="batch-tracking">
    <el-card class="stats-bar">
      <el-row :gutter="16">
        <el-col :span="4">
          <div class="stat-item info">
            <span class="stat-count">{{ pendingCount }}</span>
            <span class="stat-label">待分拣</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-item primary">
            <span class="stat-count">{{ sortingCount }}</span>
            <span class="stat-label">分拣中</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-item warning">
            <span class="stat-count">{{ packingCount }}</span>
            <span class="stat-label">打包中</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-item success">
            <span class="stat-count">{{ outboundCount }}</span>
            <span class="stat-label">已出库</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-item danger">
            <span class="stat-count">{{ abnormalCount }}</span>
            <span class="stat-label">异常</span>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-item">
            <span class="stat-count">{{ totalLossRate }}%</span>
            <span class="stat-label">综合损耗率</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="批次编号">
          <el-input v-model="filterForm.batchId" placeholder="请输入批次号" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="废品种类">
          <el-select v-model="filterForm.type" placeholder="全部种类" style="width: 140px" clearable>
            <el-option v-for="item in wasteTypes" :key="item.code" :label="item.name" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" style="width: 140px" clearable>
            <el-option label="待分拣" value="PENDING" />
            <el-option label="分拣中" value="SORTING" />
            <el-option label="打包中" value="PACKING" />
            <el-option label="已出库" value="OUTBOUND" />
            <el-option label="异常" value="ABNORMAL" />
          </el-select>
        </el-form-item>
        <el-form-item label="入库时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="batch-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">批次列表</span>
          <div class="header-actions">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button value="list">
                <el-icon><List /></el-icon>
              </el-radio-button>
              <el-radio-button value="card">
                <el-icon><Grid /></el-icon>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <el-table 
        v-if="viewMode === 'list'"
        :data="paginatedBatches" 
        stripe 
        style="width: 100%"
        @row-dblclick="viewDetail"
      >
        <el-table-column prop="id" label="批次编号" width="160" fixed />
        <el-table-column prop="typeName" label="种类" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getWasteTagType(row.type)">{{ row.typeName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="120">
          <template #default="{ row }">{{ getSourceName(row.source) }}</template>
        </el-table-column>
        <el-table-column prop="estimatedWeight" label="预估(吨)" width="90" sortable>
          <template #default="{ row }">
            <span style="color: #409eff;">{{ row.estimatedWeight }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="actualWeight" label="实际(吨)" width="90" sortable>
          <template #default="{ row }">
            {{ row.actualWeight || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="lossRate" label="损耗率" width="90" sortable>
          <template #default="{ row }">
            <span v-if="row.lossRate > 0" :style="{ color: row.lossRate > 3 ? '#f56c6c' : '#67c23a' }">
              {{ row.lossRate }}%
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="team" label="班组" width="80" />
        <el-table-column prop="operatorId" label="操作员" width="100" />
        <el-table-column prop="equipmentId" label="设备" width="100" />
        <el-table-column prop="arrivalTime" label="入库时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="viewDetail(row)">详情</el-button>
            <el-button 
              type="success" 
              text 
              size="small" 
              @click="nextStep(row)" 
              v-if="row.status !== 'OUTBOUND' && row.status !== 'ABNORMAL'"
            >
              推进
            </el-button>
            <el-button type="danger" text size="small" @click="markAbnormal(row)" v-if="row.status !== 'ABNORMAL'">
              异常
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-row v-else :gutter="16">
        <el-col v-for="batch in paginatedBatches" :key="batch.id" :span="6">
          <div class="batch-card-item" :class="batch.status">
            <div class="card-head">
              <el-tag size="small" :type="getStatusTagType(batch.status)">{{ getStatusName(batch.status) }}</el-tag>
              <span class="batch-id">{{ batch.id }}</span>
            </div>
            <div class="card-body">
              <div class="batch-type">
                <span :style="{ 
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getWasteColor(batch.type),
                  marginRight: '6px'
                }"></span>
                {{ batch.typeName }}
              </div>
              <div class="batch-weights">
                <span>预估: <b>{{ batch.estimatedWeight }}</b> 吨</span>
                <span v-if="batch.actualWeight">实际: <b>{{ batch.actualWeight }}</b> 吨</span>
              </div>
              <div class="batch-info">
                <span>来源: {{ getSourceName(batch.source) }}</span>
                <span>班组: {{ batch.team }}</span>
              </div>
            </div>
            <div class="card-foot">
              <span class="time">{{ batch.arrivalTime }}</span>
              <el-button type="primary" text size="small" @click="viewDetail(batch)">详情</el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredBatches.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="批次详情" size="600px" direction="rtl">
      <div v-if="currentBatch" class="batch-detail">
        <div class="detail-header">
          <h3>{{ currentBatch.id }}</h3>
          <el-tag size="large" :type="getStatusTagType(currentBatch.status)">
            {{ getStatusName(currentBatch.status) }}
          </el-tag>
        </div>

        <el-steps :active="getStepIndex(currentBatch.status)" finish-status="success" size="small">
          <el-step title="待分拣" description="已入库" />
          <el-step title="分拣中" description="处理中" />
          <el-step title="打包" description="质检中" />
          <el-step title="出库" description="完成" />
        </el-steps>

        <el-descriptions :column="2" border class="detail-desc">
          <el-descriptions-item label="废品种类">{{ currentBatch.typeName }}</el-descriptions-item>
          <el-descriptions-item label="来源渠道">{{ getSourceName(currentBatch.source) }}</el-descriptions-item>
          <el-descriptions-item label="预估重量">
            <span style="color: #409eff; font-weight: 500;">{{ currentBatch.estimatedWeight }} 吨</span>
          </el-descriptions-item>
          <el-descriptions-item label="实际重量">
            {{ currentBatch.actualWeight ? currentBatch.actualWeight + ' 吨' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="损耗率">
            <span v-if="currentBatch.lossRate > 0" :style="{ color: currentBatch.lossRate > 3 ? '#f56c6c' : '#67c23a' }">
              {{ currentBatch.lossRate }}%
            </span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="品质等级">{{ currentBatch.quality || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属班组">{{ currentBatch.team }}</el-descriptions-item>
          <el-descriptions-item label="分拣设备">{{ currentBatch.equipmentId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作员">{{ currentBatch.operatorId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="入库时间" :span="2">{{ currentBatch.arrivalTime }}</el-descriptions-item>
          <el-descriptions-item label="开始分拣" v-if="currentBatch.sortingStartTime" :span="2">
            {{ currentBatch.sortingStartTime }}
          </el-descriptions-item>
          <el-descriptions-item label="分拣完成" v-if="currentBatch.sortingEndTime" :span="2">
            {{ currentBatch.sortingEndTime }}
          </el-descriptions-item>
          <el-descriptions-item label="出库时间" v-if="currentBatch.outboundTime" :span="2">
            {{ currentBatch.outboundTime }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentBatch.remarks || '无' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-actions">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="nextStep(currentBatch)" 
            v-if="currentBatch.status !== 'OUTBOUND' && currentBatch.status !== 'ABNORMAL'"
          >
            推进到下一环节
          </el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="stepDialogVisible" title="状态更新" width="400px">
      <el-form :model="stepForm" label-width="100px">
        <el-form-item label="实际重量" v-if="showActualWeight">
          <el-input-number v-model="stepForm.actualWeight" :min="0" :step="0.1" :precision="2" />
          <span style="margin-left: 8px; color: #909399;">吨</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stepForm.remarks" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stepDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStep">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="abnormalVisible" title="标记异常" width="400px">
      <el-form :model="abnormalForm" label-width="100px">
        <el-form-item label="异常类型">
          <el-select v-model="abnormalForm.type" placeholder="请选择">
            <el-option label="设备故障" value="EQUIPMENT" />
            <el-option label="品质问题" value="QUALITY" />
            <el-option label="安全隐患" value="SAFETY" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常描述">
          <el-input v-model="abnormalForm.description" type="textarea" :rows="4" placeholder="请描述异常情况" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="abnormalVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmAbnormal">确认标记</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { WASTE_TYPES, SOURCES, BATCH_STATUS } from '@/data/constants'
import { Search, List, Grid } from '@element-plus/icons-vue'

const store = useAppStore()

const filterForm = reactive({
  batchId: '',
  type: '',
  status: '',
  dateRange: []
})

const viewMode = ref('list')
const currentPage = ref(1)
const pageSize = ref(20)
const detailVisible = ref(false)
const currentBatch = ref(null)
const stepDialogVisible = ref(false)
const stepForm = reactive({ actualWeight: 0, remarks: '' })
const showActualWeight = ref(false)
const abnormalVisible = ref(false)
const abnormalForm = reactive({ type: '', description: '' })

const wasteTypes = WASTE_TYPES
const sources = SOURCES

const pendingCount = computed(() => store.wasteBatches.filter(b => b.status === 'PENDING').length)
const sortingCount = computed(() => store.wasteBatches.filter(b => b.status === 'SORTING').length)
const packingCount = computed(() => store.wasteBatches.filter(b => b.status === 'PACKING').length)
const outboundCount = computed(() => store.wasteBatches.filter(b => b.status === 'OUTBOUND').length)
const abnormalCount = computed(() => store.wasteBatches.filter(b => b.status === 'ABNORMAL').length)

const totalLossRate = computed(() => {
  const completed = store.wasteBatches.filter(b => b.status === 'OUTBOUND' && b.lossRate > 0)
  if (completed.length === 0) return '0.00'
  const total = completed.reduce((sum, b) => sum + b.lossRate, 0)
  return (total / completed.length).toFixed(2)
})

const filteredBatches = computed(() => {
  return store.wasteBatches.filter(batch => {
    if (filterForm.batchId && !batch.id.includes(filterForm.batchId)) return false
    if (filterForm.type && batch.type !== filterForm.type) return false
    if (filterForm.status && batch.status !== filterForm.status) return false
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      const date = batch.arrivalTime.split(' ')[0]
      if (date < filterForm.dateRange[0] || date > filterForm.dateRange[1]) return false
    }
    return true
  })
})

const paginatedBatches = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredBatches.value.slice(start, end)
})

watch([() => filteredBatches.value.length, () => pageSize.value], () => {
  nextTick(() => {
    const totalPages = Math.max(1, Math.ceil(filteredBatches.value.length / pageSize.value))
    if (currentPage.value > totalPages) {
      currentPage.value = totalPages
    }
    if (currentPage.value < 1) {
      currentPage.value = 1
    }
  })
}, { immediate: true })

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

function getWasteColor(type) {
  const t = wasteTypes.find(w => w.code === type)
  return t ? t.color : '#909399'
}

function getSourceName(code) {
  const s = sources.find(src => src.code === code)
  return s ? s.name : code
}

function getStatusName(status) {
  const s = BATCH_STATUS.find(b => b.code === status)
  return s ? s.name : status
}

function getStatusTagType(status) {
  const map = {
    PENDING: 'info',
    SORTING: 'primary',
    PACKING: 'warning',
    OUTBOUND: 'success',
    ABNORMAL: 'danger'
  }
  return map[status] || 'info'
}

function getStepIndex(status) {
  const map = { PENDING: 0, SORTING: 1, PACKING: 2, OUTBOUND: 3, ABNORMAL: 0 }
  return map[status] || 0
}

function search() {
  currentPage.value = 1
  ElMessage.success('查询完成')
}

function reset() {
  filterForm.batchId = ''
  filterForm.type = ''
  filterForm.status = ''
  filterForm.dateRange = []
  currentPage.value = 1
}

function viewDetail(row) {
  currentBatch.value = row
  detailVisible.value = true
}

function nextStep(row) {
  currentBatch.value = row
  const nextStates = {
    PENDING: 'SORTING',
    SORTING: 'PACKING',
    PACKING: 'OUTBOUND'
  }
  const nextStatus = nextStates[row.status]
  if (!nextStatus) return
  
  showActualWeight.value = row.status === 'SORTING'
  if (showActualWeight.value) {
    stepForm.actualWeight = row.estimatedWeight * 0.97
  }
  stepForm.remarks = ''
  stepDialogVisible.value = true
}

function confirmStep() {
  if (!currentBatch.value) return
  
  const nextStates = {
    PENDING: 'SORTING',
    SORTING: 'PACKING',
    PACKING: 'OUTBOUND'
  }
  const nextStatus = nextStates[currentBatch.value.status]
  
  const data = {}
  if (showActualWeight.value && stepForm.actualWeight > 0) {
    data.actualWeight = stepForm.actualWeight
    data.lossRate = parseFloat(
      ((currentBatch.value.estimatedWeight - stepForm.actualWeight) / currentBatch.value.estimatedWeight * 100).toFixed(2)
    )
  }
  if (stepForm.remarks) {
    data.remarks = stepForm.remarks
  }
  
  store.updateBatchStatus(currentBatch.value.id, nextStatus, data)
  stepDialogVisible.value = false
  
  const statusNames = { SORTING: '分拣中', PACKING: '打包', OUTBOUND: '出库' }
  ElMessage.success(`已推进到：${statusNames[nextStatus]}`)
}

function markAbnormal(row) {
  currentBatch.value = row
  abnormalForm.type = ''
  abnormalForm.description = ''
  abnormalVisible.value = true
}

function confirmAbnormal() {
  if (!abnormalForm.type) {
    ElMessage.warning('请选择异常类型')
    return
  }
  if (!abnormalForm.description) {
    ElMessage.warning('请描述异常情况')
    return
  }
  
  store.updateBatchStatus(currentBatch.value.id, 'ABNORMAL', {
    remarks: abnormalForm.description
  })
  
  store.submitApprovalRequest({
    type: 'BATCH_ABNORMAL',
    title: `批次异常处理申请-${currentBatch.value.id}`,
    reason: abnormalForm.description
  })
  
  abnormalVisible.value = false
  ElMessage.success('已标记异常，已提交审批申请')
}
</script>

<style scoped>
.batch-tracking {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-bar {
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.stat-item.info .stat-count { color: #409eff; }
.stat-item.primary .stat-count { color: #409eff; }
.stat-item.warning .stat-count { color: #e6a23c; }
.stat-item.success .stat-count { color: #67c23a; }
.stat-item.danger .stat-count { color: #f56c6c; }

.stat-count {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.filter-card {
  border-radius: 12px;
}

.batch-card {
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

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.batch-card-item {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.3s;
}

.batch-card-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.batch-card-item.PENDING { border-left: 4px solid #909399; }
.batch-card-item.SORTING { border-left: 4px solid #409eff; }
.batch-card-item.PACKING { border-left: 4px solid #e6a23c; }
.batch-card-item.OUTBOUND { border-left: 4px solid #67c23a; }
.batch-card-item.ABNORMAL { border-left: 4px solid #f56c6c; }

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.batch-id {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.card-body {
  margin-bottom: 12px;
}

.batch-type {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.batch-weights {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #606266;
}

.batch-weights b {
  color: #409eff;
}

.batch-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #909399;
}

.card-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.time {
  font-size: 12px;
  color: #c0c4cc;
}

.batch-detail {
  padding: 10px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.detail-header h3 {
  font-size: 20px;
  color: #303133;
  margin: 0;
}

.detail-desc {
  margin-top: 24px;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}
</style>
