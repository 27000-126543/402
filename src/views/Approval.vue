<template>
  <div class="approval">
    <el-card class="stats-card">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-item pending">
            <el-icon :size="24"><Clock /></el-icon>
            <div class="stat-info">
              <span class="stat-value">{{ pendingCount }}</span>
              <span class="stat-label">待我审批</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item approved">
            <el-icon :size="24"><CircleCheck /></el-icon>
            <div class="stat-info">
              <span class="stat-value">{{ approvedCount }}</span>
              <span class="stat-label">已通过</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item rejected">
            <el-icon :size="24"><CircleClose /></el-icon>
            <div class="stat-info">
              <span class="stat-value">{{ rejectedCount }}</span>
              <span class="stat-label">已驳回</span>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item submitted">
            <el-icon :size="24"><Upload /></el-icon>
            <div class="stat-info">
              <span class="stat-value">{{ mySubmittedCount }}</span>
              <span class="stat-label">我提交的</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16">
      <el-col :span="4">
        <el-card class="type-card">
          <el-menu
            :default-active="activeType"
            @select="handleTypeSelect"
            class="type-menu"
          >
            <el-menu-item index="all">
              <el-icon><Document /></el-icon>
              <span>全部审批</span>
              <el-badge :value="pendingCount" class="item" v-if="pendingCount > 0" />
            </el-menu-item>
            <el-menu-item index="SCHEDULE">
              <el-icon><Calendar /></el-icon>
              <span>排程审批</span>
            </el-menu-item>
            <el-menu-item index="SCHEDULE_ADJUST">
              <el-icon><EditPen /></el-icon>
              <span>排程调整</span>
            </el-menu-item>
            <el-menu-item index="BATCH_ABNORMAL">
              <el-icon><Warning /></el-icon>
              <span>异常处理</span>
            </el-menu-item>
            <el-menu-item index="MAINTENANCE">
              <el-icon><Tools /></el-icon>
              <span>维保审批</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <el-col :span="20">
        <el-tabs v-model="activeTab" class="approval-tabs">
          <el-tab-pane label="待审批" name="pending">
            <el-card class="list-card">
              <el-table :data="pendingApprovals" stripe style="width: 100%">
                <el-table-column prop="id" label="申请编号" width="130" />
                <el-table-column prop="type" label="类型" width="120">
                  <template #default="{ row }">
                    <el-tag size="small" :type="getTypeColor(row.type)">{{ getTypeName(row.type) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="title" label="申请标题" min-width="200" />
                <el-table-column prop="submitter" label="申请人" width="100" />
                <el-table-column prop="submitTime" label="提交时间" width="160" />
                <el-table-column label="紧急程度" width="100">
                  <template #default="{ row }">
                    <el-tag size="small" type="warning" effect="plain">普通</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="220" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" text size="small" @click="viewDetail(row)">查看</el-button>
                    <el-button type="success" text size="small" @click="approve(row)">通过</el-button>
                    <el-button type="danger" text size="small" @click="reject(row)">驳回</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="已审批" name="approved">
            <el-card class="list-card">
              <el-table :data="approvedApprovals" stripe style="width: 100%">
                <el-table-column prop="id" label="申请编号" width="130" />
                <el-table-column prop="type" label="类型" width="120">
                  <template #default="{ row }">
                    <el-tag size="small" :type="getTypeColor(row.type)">{{ getTypeName(row.type) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="title" label="申请标题" min-width="200" />
                <el-table-column prop="submitter" label="申请人" width="100" />
                <el-table-column label="审批结果" width="100">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.status === 'APPROVED' ? 'success' : 'danger'">
                      {{ row.status === 'APPROVED' ? '已通过' : '已驳回' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="approver" label="审批人" width="100" />
                <el-table-column prop="approvalTime" label="审批时间" width="160" />
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" text size="small" @click="viewDetail(row)">查看</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="我提交的" name="submitted">
            <el-card class="list-card">
              <el-table :data="mySubmittedApprovals" stripe style="width: 100%">
                <el-table-column prop="id" label="申请编号" width="130" />
                <el-table-column prop="type" label="类型" width="120">
                  <template #default="{ row }">
                    <el-tag size="small" :type="getTypeColor(row.type)">{{ getTypeName(row.type) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="title" label="申请标题" min-width="200" />
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.status === 'PENDING' ? 'warning' : row.status === 'APPROVED' ? 'success' : 'danger'">
                      {{ row.status === 'PENDING' ? '待审批' : row.status === 'APPROVED' ? '已通过' : '已驳回' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="submitTime" label="提交时间" width="160" />
                <el-table-column prop="approver" label="审批人" width="100" />
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="{ row }">
                    <el-button type="primary" text size="small" @click="viewDetail(row)">详情</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>

    <el-dialog v-model="detailVisible" title="审批详情" width="600px">
      <div v-if="currentApproval" class="approval-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请编号" :span="2">{{ currentApproval.id }}</el-descriptions-item>
          <el-descriptions-item label="申请类型">
            <el-tag :type="getTypeColor(currentApproval.type)">{{ getTypeName(currentApproval.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请状态">
            <el-tag :type="currentApproval.status === 'PENDING' ? 'warning' : currentApproval.status === 'APPROVED' ? 'success' : 'danger'">
              {{ currentApproval.status === 'PENDING' ? '待审批' : currentApproval.status === 'APPROVED' ? '已通过' : '已驳回' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="申请标题" :span="2">{{ currentApproval.title }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentApproval.submitter }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentApproval.submitTime }}</el-descriptions-item>
          <el-descriptions-item v-if="currentApproval.approver" label="审批人">{{ currentApproval.approver }}</el-descriptions-item>
          <el-descriptions-item v-if="currentApproval.approvalTime" label="审批时间">{{ currentApproval.approvalTime }}</el-descriptions-item>
          <el-descriptions-item label="申请原因" :span="2">{{ currentApproval.reason || currentApproval.title }}</el-descriptions-item>
          <el-descriptions-item v-if="currentApproval.reason && currentApproval.reason !== currentApproval.title" label="备注" :span="2">
            {{ currentApproval.reason }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="approval-timeline">
          <div class="timeline-title">审批流程</div>
          <el-timeline>
            <el-timeline-item timestamp={currentApproval.submitTime} placement="top" type="primary">
              <div class="tl-content">
                <b>{{ currentApproval.submitter }}</b> 提交申请
              </div>
            </el-timeline-item>
            <el-timeline-item 
              v-if="currentApproval.approvalTime" 
              :timestamp="currentApproval.approvalTime" 
              placement="top"
              :type="currentApproval.status === 'APPROVED' ? 'success' : 'danger'"
            >
              <div class="tl-content">
                <b>{{ currentApproval.approver }}</b> 
                {{ currentApproval.status === 'APPROVED' ? '审批通过' : '审批驳回' }}
              </div>
            </el-timeline-item>
            <el-timeline-item v-else type="warning" placement="top">
              <div class="tl-content">
                等待 <b>主管</b> 审批
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <template #footer v-if="currentApproval?.status === 'PENDING'">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="danger" @click="reject(currentApproval)">驳回</el-button>
        <el-button type="success" @click="approve(currentApproval)">通过</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="驳回原因" width="450px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因">
          <el-input v-model="rejectForm.reason" type="textarea" :rows="4" placeholder="请输入驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import {
  Clock,
  CircleCheck,
  CircleClose,
  Upload,
  Document,
  Calendar,
  EditPen,
  Warning,
  Tools
} from '@element-plus/icons-vue'

const store = useAppStore()

const activeType = ref('all')
const activeTab = ref('pending')
const detailVisible = ref(false)
const rejectVisible = ref(false)
const currentApproval = ref(null)
const rejectForm = reactive({ reason: '' })

const pendingCount = computed(() => store.approvalRecords.filter(a => a.status === 'PENDING').length)
const approvedCount = computed(() => store.approvalRecords.filter(a => a.status === 'APPROVED').length)
const rejectedCount = computed(() => store.approvalRecords.filter(a => a.status === 'REJECTED').length)
const mySubmittedCount = computed(() => store.approvalRecords.filter(a => a.submitter === store.currentUser.name).length)

const filteredApprovals = computed(() => {
  return store.approvalRecords.filter(a => {
    if (activeType.value !== 'all' && a.type !== activeType.value) return false
    return true
  })
})

const pendingApprovals = computed(() => filteredApprovals.value.filter(a => a.status === 'PENDING'))
const approvedApprovals = computed(() => filteredApprovals.value.filter(a => a.status !== 'PENDING'))
const mySubmittedApprovals = computed(() => 
  store.approvalRecords.filter(a => a.submitter === store.currentUser.name)
)

function getTypeName(type) {
  const map = {
    SCHEDULE: '排程审批',
    SCHEDULE_ADJUST: '排程调整',
    BATCH_ABNORMAL: '异常处理',
    MAINTENANCE: '维保审批',
    PURCHASE: '采购审批'
  }
  return map[type] || type
}

function getTypeColor(type) {
  const map = {
    SCHEDULE: 'primary',
    SCHEDULE_ADJUST: 'warning',
    BATCH_ABNORMAL: 'danger',
    MAINTENANCE: 'info',
    PURCHASE: 'success'
  }
  return map[type] || ''
}

function handleTypeSelect(key) {
  activeType.value = key
}

function viewDetail(row) {
  currentApproval.value = row
  detailVisible.value = true
}

function approve(row) {
  ElMessageBox.confirm('确定通过该审批申请吗？', '确认通过', {
    type: 'success',
    confirmButtonText: '确定通过',
    cancelButtonText: '取消'
  }).then(() => {
    store.processApproval(row.id, true)
    detailVisible.value = false
    ElMessage.success('审批通过')
  }).catch(() => {})
}

function reject(row) {
  currentApproval.value = row
  rejectForm.reason = ''
  rejectVisible.value = true
}

function confirmReject() {
  if (!rejectForm.reason) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  store.processApproval(currentApproval.value.id, false, rejectForm.reason)
  rejectVisible.value = false
  detailVisible.value = false
  ElMessage.success('已驳回申请')
}
</script>

<style scoped>
.approval {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-card {
  border-radius: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 10px;
}

.stat-item.pending { color: #e6a23c; }
.stat-item.approved { color: #67c23a; }
.stat-item.rejected { color: #f56c6c; }
.stat-item.submitted { color: #409eff; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
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

.type-card {
  border-radius: 12px;
  padding: 0;
}

.type-menu {
  border-right: none;
}

.approval-tabs {
  margin-top: 0;
}

.list-card {
  border-radius: 12px;
  margin-top: 10px;
}

.approval-detail {
  padding: 10px 0;
}

.approval-timeline {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed #e4e7ed;
}

.timeline-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
}

.tl-content {
  font-size: 14px;
  color: #606266;
}
</style>
