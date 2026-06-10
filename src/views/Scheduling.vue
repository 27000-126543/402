<template>
  <div class="scheduling">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="日期">
          <el-date-picker
            v-model="filterForm.date"
            type="date"
            placeholder="选择日期"
            style="width: 180px"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="班次">
          <el-select v-model="filterForm.shift" placeholder="全部班次" style="width: 140px" clearable>
            <el-option label="早班" value="MORNING" />
            <el-option label="中班" value="AFTERNOON" />
            <el-option label="夜班" value="NIGHT" />
          </el-select>
        </el-form-item>
        <el-form-item label="审批状态">
          <el-select v-model="filterForm.approvalStatus" placeholder="全部状态" style="width: 140px" clearable>
            <el-option label="草稿" value="DRAFT" />
            <el-option label="待审批" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchSchedules">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
        <el-form-item style="margin-left: auto;">
          <el-button type="success" @click="autoGenerate" :loading="generating">
            <el-icon><MagicStick /></el-icon>
            智能排程
          </el-button>
          <el-button type="primary" @click="batchApprove" v-if="store.currentUser.role === 'supervisor'">
            <el-icon><Checked /></el-icon>
            批量审批
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-tabs v-model="activeTab" class="schedule-tabs">
      <el-tab-pane label="全部排程" name="all">
    <el-row :gutter="16">
      <el-col :span="16">
        <el-card class="schedule-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">排程列表</span>
              <span style="color: #909399; font-size: 13px;">共 {{ filteredSchedules.length }} 条排程</span>
            </div>
          </template>

          <el-table :data="filteredSchedules" stripe style="width: 100%">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="排程编号" width="180" />
            <el-table-column prop="date" label="日期" width="110" />
            <el-table-column label="班次" width="130">
              <template #default="{ row }">
                <span>{{ row.shiftName }}</span>
                <span style="color: #909399; font-size: 12px;">({{ row.shiftTime }})</span>
              </template>
            </el-table-column>
            <el-table-column prop="wasteTypeName" label="废品种类" width="110">
              <template #default="{ row }">
                <el-tag size="small" :type="getWasteTagType(row.wasteType)">{{ row.wasteTypeName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="equipmentName" label="设备" width="140" />
            <el-table-column prop="operatorName" label="操作员" width="100" />
            <el-table-column prop="plannedQuantity" label="计划量(吨)" width="100">
              <template #default="{ row }">
                <span style="color: #409eff; font-weight: 500;">{{ row.plannedQuantity }}</span>
              </template>
            </el-table-column>
            <el-table-column label="推送状态" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.pushStatus" size="small" :type="row.pushStatus === 'PUSHED' ? 'success' : 'info'">
                  {{ row.pushStatusName || '未推送' }}
                </el-tag>
                <span v-else style="color: #c0c4cc;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="确认状态" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.confirmStatus" size="small" :type="row.confirmStatus === 'CONFIRMED' ? 'success' : 'warning'">
                  {{ row.confirmStatusName || '-' }}
                </el-tag>
                <span v-else style="color: #c0c4cc;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="执行状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="getStatusType(row.status)">
                  {{ row.statusName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="审批状态" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="getApprovalType(row.approvalStatus)" effect="plain">
                  {{ row.approvalStatusName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click="viewDetail(row)">详情</el-button>
                <el-button 
                  type="success" 
                  text 
                  size="small" 
                  @click="confirmTask(row)" 
                  v-if="row.confirmStatus === 'PENDING' && row.operatorId === store.currentUser.id"
                >
                  确认接收
                </el-button>
                <el-button 
                  type="warning" 
                  text 
                  size="small" 
                  @click="applyAdjust(row)" 
                  v-if="row.approvalStatus === 'APPROVED' && !row.adjustStatus"
                >
                  申请调整
                </el-button>
                <el-tag 
                  v-if="row.adjustStatus" 
                  size="small" 
                  :type="row.adjustStatus === 'PENDING' ? 'warning' : row.adjustStatus === 'APPROVED' ? 'success' : 'info'"
                  effect="light"
                >
                  {{ row.adjustStatusName }}
                </el-tag>
                <el-button 
                  type="success" 
                  text 
                  size="small" 
                  @click="approveSchedule(row, true)" 
                  v-if="row.approvalStatus === 'PENDING' && store.currentUser.role === 'supervisor'"
                >
                  通过
                </el-button>
                <el-button 
                  type="danger" 
                  text 
                  size="small" 
                  @click="approveSchedule(row, false)" 
                  v-if="row.approvalStatus === 'PENDING' && store.currentUser.role === 'supervisor'"
                >
                  驳回
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="info-card">
          <template #header>
            <span class="card-title">排程分析</span>
          </template>
          
          <div class="analysis-section">
            <div class="section-title">设备负荷</div>
            <div class="eq-load-list">
              <div v-for="eq in equipmentLoad" :key="eq.id" class="eq-load-item">
                <div class="eq-load-header">
                  <span class="eq-name">{{ eq.name }}</span>
                  <span class="eq-load-value">{{ eq.load }}%</span>
                </div>
                <el-progress 
                  :percentage="eq.load" 
                  :stroke-width="6"
                  :color="eq.load > 85 ? '#f56c6c' : eq.load > 60 ? '#e6a23c' : '#67c23a'"
                />
              </div>
            </div>
          </div>

          <el-divider />

          <div class="analysis-section">
            <div class="section-title">堵塞风险预警</div>
            <div class="risk-list">
              <div v-for="item in riskItems" :key="item.id" class="risk-item" :class="item.level">
                <el-icon><Warning /></el-icon>
                <div class="risk-info">
                  <span class="risk-name">{{ item.name }}</span>
                  <span class="risk-desc">堵塞风险 {{ item.risk }}%</span>
                </div>
                <el-tag size="small" :type="item.level === 'high' ? 'danger' : item.level === 'medium' ? 'warning' : 'success'">
                  {{ item.level === 'high' ? '高' : item.level === 'medium' ? '中' : '低' }}
                </el-tag>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="analysis-section">
            <div class="section-title">人员技能匹配</div>
            <div class="skill-match">
              <div class="match-item success">
                <el-icon><CircleCheck /></el-icon>
                <span>匹配度高：{{ skillMatch.high }} 人</span>
              </div>
              <div class="match-item warning">
                <el-icon><Warning /></el-icon>
                <span>需培训：{{ skillMatch.medium }} 人</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="timeline-card" style="margin-top: 16px;">
          <template #header>
            <span class="card-title">今日时间线</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in todayTimeline"
              :key="index"
              :timestamp="item.time"
              :type="item.type"
              :icon="item.icon"
            >
              {{ item.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
      </el-tab-pane>
      <el-tab-pane label="我的工位任务" name="my">
        <el-card class="my-tasks-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">我的工位任务</span>
              <span style="color: #909399; font-size: 13px;">共 {{ myTasks.length }} 条任务</span>
            </div>
          </template>
          <el-empty v-if="myTasks.length === 0" description="暂无分配给您的任务" />
          <el-table v-else :data="myTasks" stripe style="width: 100%">
            <el-table-column prop="id" label="排程编号" width="180" />
            <el-table-column prop="date" label="日期" width="110" />
            <el-table-column label="班次" width="130">
              <template #default="{ row }">
                <span>{{ row.shiftName }}</span>
                <span style="color: #909399; font-size: 12px;">({{ row.shiftTime }})</span>
              </template>
            </el-table-column>
            <el-table-column prop="wasteTypeName" label="废品种类" width="110">
              <template #default="{ row }">
                <el-tag size="small" :type="getWasteTagType(row.wasteType)">{{ row.wasteTypeName }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="equipmentName" label="设备" width="140" />
            <el-table-column prop="plannedQuantity" label="计划量(吨)" width="100">
              <template #default="{ row }">
                <span style="color: #409eff; font-weight: 500;">{{ row.plannedQuantity }}</span>
              </template>
            </el-table-column>
            <el-table-column label="确认状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.confirmStatus === 'CONFIRMED' ? 'success' : 'warning'">
                  {{ row.confirmStatusName || '待确认' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="推送时间" width="170">
              <template #default="{ row }">
                {{ row.pushTime || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="success" 
                  size="small" 
                  @click="confirmTask(row)" 
                  v-if="row.confirmStatus === 'PENDING'"
                >
                  确认接收
                </el-button>
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="applyAdjust(row)" 
                  v-if="!row.adjustStatus"
                >
                  申请调整
                </el-button>
                <el-tag 
                  v-if="row.adjustStatus" 
                  size="small" 
                  :type="row.adjustStatus === 'PENDING' ? 'warning' : row.adjustStatus === 'APPROVED' ? 'success' : 'info'"
                >
                  {{ row.adjustStatusName }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="detailVisible" title="排程详情" width="600px">
      <el-descriptions v-if="currentSchedule" :column="2" border>
        <el-descriptions-item label="排程编号" :span="2">{{ currentSchedule.id }}</el-descriptions-item>
        <el-descriptions-item label="排班日期">{{ currentSchedule.date }}</el-descriptions-item>
        <el-descriptions-item label="班次">{{ currentSchedule.shiftName }} ({{ currentSchedule.shiftTime }})</el-descriptions-item>
        <el-descriptions-item label="废品种类">{{ currentSchedule.wasteTypeName }}</el-descriptions-item>
        <el-descriptions-item label="分拣设备">{{ currentSchedule.equipmentName }}</el-descriptions-item>
        <el-descriptions-item label="负责人员">{{ currentSchedule.operatorName }}</el-descriptions-item>
        <el-descriptions-item label="计划产量">{{ currentSchedule.plannedQuantity }} 吨</el-descriptions-item>
        <el-descriptions-item label="实际产量">{{ currentSchedule.actualQuantity }} 吨</el-descriptions-item>
        <el-descriptions-item label="设备切换时间">{{ currentSchedule.changeoverTime }} 分钟</el-descriptions-item>
        <el-descriptions-item label="传送带负荷">{{ currentSchedule.conveyorLoad }}%</el-descriptions-item>
        <el-descriptions-item label="推送状态">
          <el-tag v-if="currentSchedule.pushStatus" :type="currentSchedule.pushStatus === 'PUSHED' ? 'success' : 'info'">
            {{ currentSchedule.pushStatusName || '未推送' }}
          </el-tag>
          <span v-else>未推送</span>
        </el-descriptions-item>
        <el-descriptions-item label="确认状态">
          <el-tag v-if="currentSchedule.confirmStatus" :type="currentSchedule.confirmStatus === 'CONFIRMED' ? 'success' : 'warning'">
            {{ currentSchedule.confirmStatusName || '-' }}
          </el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="执行状态">
          <el-tag :type="getStatusType(currentSchedule.status)">{{ currentSchedule.statusName }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审批状态">
          <el-tag :type="getApprovalType(currentSchedule.approvalStatus)" effect="plain">
            {{ currentSchedule.approvalStatusName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentSchedule.adjustStatus" label="调整状态">
          <el-tag :type="currentSchedule.adjustStatus === 'PENDING' ? 'warning' : currentSchedule.adjustStatus === 'APPROVED' ? 'success' : 'info'">
            {{ currentSchedule.adjustStatusName }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentSchedule.adjustStatus" label="调整备注">
          {{ currentSchedule.adjustRemark || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentSchedule.createTime }}</el-descriptions-item>
        <el-descriptions-item label="审批人" v-if="currentSchedule.approver">{{ currentSchedule.approver }}</el-descriptions-item>
        <el-descriptions-item label="审批时间" v-if="currentSchedule.approvalTime">{{ currentSchedule.approvalTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentSchedule.remarks || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button 
          type="primary" 
          @click="applyAdjust(currentSchedule)" 
          v-if="currentSchedule?.approvalStatus === 'APPROVED'"
        >
          申请调整
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustVisible" title="排程调整申请" width="500px">
      <el-form :model="adjustForm" :rules="adjustRules" ref="adjustFormRef" label-width="100px">
        <el-form-item label="调整原因" prop="reason">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="4" placeholder="请输入调整原因" />
        </el-form-item>
        <el-form-item label="调整内容" prop="content">
          <el-input v-model="adjustForm.content" type="textarea" :rows="3" placeholder="请描述具体调整内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust" :loading="submittingAdjust">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import {
  Search,
  MagicStick,
  Checked,
  Warning,
  CircleCheck,
  Promotion,
  UploadFilled,
  Setting
} from '@element-plus/icons-vue'

const store = useAppStore()

const filterForm = reactive({
  date: new Date().toISOString().split('T')[0],
  shift: '',
  approvalStatus: ''
})

const generating = ref(false)
const detailVisible = ref(false)
const adjustVisible = ref(false)
const currentSchedule = ref(null)
const adjustFormRef = ref(null)
const submittingAdjust = ref(false)
const activeTab = ref('all')

const adjustForm = reactive({
  reason: '',
  content: ''
})

const adjustRules = {
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

const filteredSchedules = computed(() => {
  return store.schedules.filter(s => {
    if (filterForm.date && s.date !== filterForm.date) return false
    if (filterForm.shift && s.shift !== filterForm.shift) return false
    if (filterForm.approvalStatus && s.approvalStatus !== filterForm.approvalStatus) return false
    return true
  }).sort((a, b) => b.date.localeCompare(a.date) || a.shift.localeCompare(b.shift))
})

const myTasks = computed(() => {
  return store.schedules.filter(s => 
    s.operatorId === store.currentUser.id && s.pushStatus === 'PUSHED'
  ).sort((a, b) => b.date.localeCompare(a.date) || a.shift.localeCompare(b.shift))
})

const equipmentLoad = computed(() => {
  return store.equipment.map(eq => ({
    id: eq.id,
    name: eq.name,
    load: eq.status === 'RUNNING' ? Math.round(60 + Math.random() * 35) : eq.status === 'MAINTENANCE' ? 0 : Math.round(10 + Math.random() * 20)
  })).slice(0, 6)
})

const riskItems = computed(() => {
  return store.equipment
    .filter(e => e.status === 'RUNNING')
    .map(eq => ({
      id: eq.id,
      name: eq.name,
      risk: Math.round(20 + Math.random() * 60),
      level: Math.random() > 0.7 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low'
    })).slice(0, 3)
})

const skillMatch = computed(() => ({
  high: 8,
  medium: 4
}))

const todayTimeline = computed(() => [
  { time: '08:00', content: '早班人员到位，设备启动检查', type: 'success', icon: Setting },
  { time: '09:30', content: '废纸分拣线开始运行，负荷75%', type: 'primary', icon: Promotion },
  { time: '11:00', content: '第一批废纸完成分拣打包', type: 'success', icon: UploadFilled },
  { time: '14:00', content: '中班交接班', type: 'warning', icon: Promotion }
])

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

function getStatusType(status) {
  const map = {
    PENDING: 'info',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success'
  }
  return map[status] || 'info'
}

function getApprovalType(status) {
  const map = {
    DRAFT: 'info',
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger'
  }
  return map[status] || 'info'
}

function searchSchedules() {
  ElMessage.success('查询成功')
}

function resetFilter() {
  filterForm.date = new Date().toISOString().split('T')[0]
  filterForm.shift = ''
  filterForm.approvalStatus = ''
}

function autoGenerate() {
  generating.value = true
  setTimeout(() => {
    const newSchedules = store.generateSchedule(filterForm.date)
    generating.value = false
    ElMessage.success(`智能排程生成成功，共生成 ${newSchedules.length} 条排程`)
  }, 1500)
}

function viewDetail(row) {
  currentSchedule.value = row
  detailVisible.value = true
}

function applyAdjust(row) {
  currentSchedule.value = row
  adjustVisible.value = true
  adjustForm.reason = ''
  adjustForm.content = ''
}

function confirmTask(row) {
  ElMessageBox.confirm('确定确认接收该任务吗？', '确认接收', {
    type: 'success'
  }).then(() => {
    store.confirmSchedule(row.id)
    ElMessage.success('任务已确认接收')
  }).catch(() => {})
}

function submitAdjust() {
  adjustFormRef.value.validate((valid) => {
    if (valid) {
      submittingAdjust.value = true
      setTimeout(() => {
        store.submitScheduleAdjust(currentSchedule.value.id, {
          reason: adjustForm.reason,
          content: adjustForm.content,
          adjustRemark: adjustForm.reason
        })
        submittingAdjust.value = false
        adjustVisible.value = false
        ElMessage.success('调整申请已提交，等待主管审批')
      }, 500)
    }
  })
}

function approveSchedule(row, approved) {
  const action = approved ? '通过' : '驳回'
  ElMessageBox.confirm(`确定${action}该排程吗？`, '确认', {
    type: approved ? 'success' : 'warning'
  }).then(() => {
    store.approveSchedule(row.id, approved)
    ElMessage.success(`排程已${action}`)
  }).catch(() => {})
}

function batchApprove() {
  ElMessageBox.confirm('确定批量通过所选排程吗？', '批量审批', {
    type: 'success'
  }).then(() => {
    ElMessage.success('批量审批成功')
  }).catch(() => {})
}
</script>

<style scoped>
.scheduling {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  border-radius: 12px;
}

.filter-form {
  margin: 0;
}

.schedule-card,
.info-card,
.timeline-card {
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

.analysis-section {
  padding: 8px 0;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.eq-load-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.eq-load-item {
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.eq-load-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.eq-name {
  font-size: 13px;
  color: #606266;
}

.eq-load-value {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  background: #f8f9fa;
}

.risk-item.high {
  border-left: 3px solid #f56c6c;
  color: #f56c6c;
}

.risk-item.medium {
  border-left: 3px solid #e6a23c;
  color: #e6a23c;
}

.risk-item.low {
  border-left: 3px solid #67c23a;
  color: #67c23a;
}

.risk-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.risk-name {
  font-size: 13px;
  color: #303133;
}

.risk-desc {
  font-size: 12px;
  color: #909399;
}

.skill-match {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.match-item.success {
  color: #67c23a;
}

.match-item.warning {
  color: #e6a23c;
}
</style>
