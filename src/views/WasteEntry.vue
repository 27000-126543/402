<template>
  <div class="waste-entry">
    <el-card class="entry-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">废品信息录入</span>
          <el-tag type="info">请填写废品详细信息</el-tag>
        </div>
      </template>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="entry-form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="批次编号" prop="batchId">
              <el-input v-model="form.batchId" placeholder="系统自动生成" disabled>
                <template #prefix>
                  <el-icon><Tickets /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="废品种类" prop="type">
              <el-select v-model="form.type" placeholder="请选择废品种类" style="width: 100%">
                <el-option v-for="item in wasteTypes" :key="item.code" :label="item.name" :value="item.code">
                  <span style="display: flex; align-items: center; gap: 8px;">
                    <span :style="{ 
                      display: 'inline-block', 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: item.color 
                    }"></span>
                    {{ item.name }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源渠道" prop="source">
              <el-select v-model="form.source" placeholder="请选择来源渠道" style="width: 100%">
                <el-option v-for="item in sources" :key="item.code" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预估重量" prop="estimatedWeight">
              <el-input-number v-model="form.estimatedWeight" :min="0.01" :step="0.1" :precision="2" style="width: 100%" />
              <span class="unit">吨</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属班组" prop="team">
              <el-select v-model="form.team" placeholder="请选择班组" style="width: 100%">
                <el-option label="A组" value="A组" />
                <el-option label="B组" value="B组" />
                <el-option label="C组" value="C组" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库时间" prop="arrivalTime">
              <el-date-picker
                v-model="form.arrivalTime"
                type="datetime"
                placeholder="选择入库时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注信息" prop="remarks">
              <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-actions">
          <el-button @click="resetForm">重置</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            <el-icon><Plus /></el-icon>
            提交录入
          </el-button>
        </div>
      </el-form>
    </el-card>

    <el-card class="recent-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">最近录入记录</span>
          <el-button type="primary" text @click="showAll = !showAll">
            {{ showAll ? '收起' : '查看全部' }}
            <el-icon><component :is="showAll ? 'Top' : 'Bottom'" /></el-icon>
          </el-button>
        </div>
      </template>

      <el-table :data="recentBatches" stripe style="width: 100%">
        <el-table-column prop="id" label="批次编号" width="160" />
        <el-table-column prop="typeName" label="种类" width="120">
          <template #default="{ row }">
            <el-tag :type="getWasteTagType(row.type)" effect="light">{{ row.typeName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="140">
          <template #default="{ row }">
            {{ getSourceName(row.source) }}
          </template>
        </el-table-column>
        <el-table-column prop="estimatedWeight" label="预估重量(吨)" width="120">
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: 500;">{{ row.estimatedWeight }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="arrivalTime" label="入库时间" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="批次详情" width="500px">
      <el-descriptions v-if="currentBatch" :column="2" border>
        <el-descriptions-item label="批次编号">{{ currentBatch.id }}</el-descriptions-item>
        <el-descriptions-item label="废品种类">{{ currentBatch.typeName }}</el-descriptions-item>
        <el-descriptions-item label="来源渠道">{{ getSourceName(currentBatch.source) }}</el-descriptions-item>
        <el-descriptions-item label="预估重量">{{ currentBatch.estimatedWeight }} 吨</el-descriptions-item>
        <el-descriptions-item label="实际重量">{{ currentBatch.actualWeight || '-' }} 吨</el-descriptions-item>
        <el-descriptions-item label="损耗率">{{ currentBatch.lossRate || '-' }}%</el-descriptions-item>
        <el-descriptions-item label="所属班组">{{ currentBatch.team }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusTagType(currentBatch.status)">
            {{ getStatusName(currentBatch.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="入库时间" :span="2">{{ currentBatch.arrivalTime }}</el-descriptions-item>
        <el-descriptions-item label="备注信息" :span="2">{{ currentBatch.remarks || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { WASTE_TYPES, SOURCES, BATCH_STATUS } from '@/data/constants'
import { Tickets, Plus, Top, Bottom } from '@element-plus/icons-vue'

const store = useAppStore()
const formRef = ref(null)
const submitting = ref(false)
const showAll = ref(false)
const detailVisible = ref(false)
const currentBatch = ref(null)

const wasteTypes = WASTE_TYPES
const sources = SOURCES

const form = reactive({
  batchId: '',
  type: '',
  source: '',
  estimatedWeight: 1,
  team: 'A组',
  arrivalTime: '',
  remarks: ''
})

const rules = {
  type: [{ required: true, message: '请选择废品种类', trigger: 'change' }],
  source: [{ required: true, message: '请选择来源渠道', trigger: 'change' }],
  estimatedWeight: [{ required: true, message: '请输入预估重量', trigger: 'blur' }]
}

const recentBatches = computed(() => {
  const batches = store.wasteBatches.filter(b => b.status === 'PENDING')
  return showAll.value ? batches : batches.slice(0, 10)
})

function generateBatchId() {
  const now = new Date()
  const dateStr = now.getFullYear().toString().slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const count = store.wasteBatches.filter(b => b.id.includes(dateStr)).length + 1
  return 'B' + dateStr + String(count).padStart(3, '0')
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

function getSourceName(code) {
  const source = sources.find(s => s.code === code)
  return source ? source.name : code
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

function resetForm() {
  formRef.value?.resetFields()
  form.type = ''
  form.source = ''
  form.estimatedWeight = 1
  form.team = 'A组'
  form.arrivalTime = ''
  form.remarks = ''
  form.batchId = generateBatchId()
}

function submitForm() {
  formRef.value.validate((valid) => {
    if (valid) {
      submitting.value = true
      setTimeout(() => {
        const typeInfo = wasteTypes.find(t => t.code === form.type)
        const batch = store.addWasteBatch({
          type: form.type,
          typeName: typeInfo?.name || '',
          source: form.source,
          estimatedWeight: form.estimatedWeight,
          team: form.team,
          remarks: form.remarks
        })
        
        submitting.value = false
        ElMessage.success('录入成功，批次号：' + batch.id)
        resetForm()
      }, 500)
    }
  })
}

function viewDetail(row) {
  currentBatch.value = row
  detailVisible.value = true
}

onMounted(() => {
  form.batchId = generateBatchId()
})
</script>

<style scoped>
.waste-entry {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.entry-card {
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

.entry-form {
  padding: 10px 0;
}

.unit {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.recent-card {
  border-radius: 12px;
}
</style>
