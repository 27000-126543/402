<template>
  <div class="personnel">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="姓名">
          <el-input v-model="filterForm.name" placeholder="请输入姓名" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filterForm.role" placeholder="全部角色" clearable style="width: 140px">
            <el-option label="主管" value="supervisor" />
            <el-option label="操作员" value="operator" />
            <el-option label="维修人员" value="maintenance" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="班组">
          <el-select v-model="filterForm.team" placeholder="全部班组" clearable style="width: 140px">
            <el-option label="A组" value="A组" />
            <el-option label="B组" value="B组" />
            <el-option label="C组" value="C组" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
        <el-form-item style="margin-left: auto;">
          <el-button type="primary" @click="addPersonnel">
            <el-icon><Plus /></el-icon>
            添加人员
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card">
      <el-table :data="filteredPersonnel" stripe style="width: 100%">
        <el-table-column label="工号" width="100">
          <template #default="{ row }">{{ row.id }}</template>
        </el-table-column>
        <el-table-column label="姓名" width="100">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <el-avatar :size="32">{{ row.name.charAt(0) }}</el-avatar>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getRoleTagType(row.role)">{{ getRoleName(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="班组" width="80" />
        <el-table-column label="技能标签" min-width="200">
          <template #default="{ row }">
            <el-tag 
              v-for="skill in row.skills" 
              :key="skill" 
              size="small" 
              :type="getSkillTagType(skill)"
              effect="light"
              style="margin-right: 4px; margin-bottom: 4px;"
            >
              {{ getSkillName(skill) }}
            </el-tag>
            <span v-if="!row.skills || row.skills.length === 0" style="color: #c0c4cc;">暂无</span>
          </template>
        </el-table-column>
        <el-table-column label="联系电话" width="140" />
        <el-table-column label="工作时长(小时)" width="130" sortable>
          <template #default="{ row }">{{ row.workHours }}</template>
        </el-table-column>
        <el-table-column label="入职日期" width="120" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="warning" text size="small" @click="editPersonnel(row)">编辑</el-button>
            <el-button type="danger" text size="small" @click="deletePersonnel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredPersonnel.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑人员' : '添加人员'" width="600px">
      <el-form :model="personForm" :rules="personRules" ref="personFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="personForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工号">
              <el-input v-model="personForm.id" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="personForm.role" placeholder="请选择角色" style="width: 100%">
                <el-option label="主管" value="supervisor" />
                <el-option label="操作员" value="operator" />
                <el-option label="维修人员" value="maintenance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班组" prop="team">
              <el-select v-model="personForm.team" placeholder="请选择班组" style="width: 100%">
                <el-option label="A组" value="A组" />
                <el-option label="B组" value="B组" />
                <el-option label="C组" value="C组" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="personForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期">
              <el-date-picker
                v-model="personForm.joinDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="技能标签" v-if="personForm.role === 'operator'">
              <el-checkbox-group v-model="personForm.skills">
                <el-checkbox v-for="skill in skills" :key="skill.code" :label="skill.code">
                  {{ skill.name }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="personForm.remarks" type="textarea" :rows="3" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailVisible" title="人员详情" size="450px" direction="rtl">
      <div v-if="currentPerson" class="person-detail">
        <div class="detail-header">
          <el-avatar :size="64" style="font-size: 28px;">{{ currentPerson.name.charAt(0) }}</el-avatar>
          <div class="detail-info">
            <h3>{{ currentPerson.name }}</h3>
            <el-tag :type="getRoleTagType(currentPerson.role)">{{ getRoleName(currentPerson.role) }}</el-tag>
            <p>{{ currentPerson.team }} · {{ currentPerson.id }}</p>
          </div>
        </div>

        <el-descriptions :column="1" border class="detail-desc">
          <el-descriptions-item label="联系电话">{{ currentPerson.phone }}</el-descriptions-item>
          <el-descriptions-item label="入职日期">{{ currentPerson.joinDate }}</el-descriptions-item>
          <el-descriptions-item label="累计工作时长">{{ currentPerson.workHours }} 小时</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentPerson.status === 'active' ? 'success' : 'info'">
              {{ currentPerson.status === 'active' ? '在职' : '离职' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="技能标签" v-if="currentPerson.skills?.length > 0">
            <el-tag 
              v-for="skill in currentPerson.skills" 
              :key="skill" 
              size="small" 
              :type="getSkillTagType(skill)"
              effect="light"
              style="margin-right: 4px;"
            >
              {{ getSkillName(skill) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="performance">
          <div class="perf-title">绩效概览</div>
          <el-row :gutter="12">
            <el-col :span="8">
              <div class="perf-card">
                <div class="perf-value">128</div>
                <div class="perf-label">分拣批次</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="perf-card">
                <div class="perf-value">45.2</div>
                <div class="perf-label">分拣量(吨)</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="perf-card">
                <div class="perf-value">98.5%</div>
                <div class="perf-label">合格率</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { WASTE_TYPES } from '@/data/constants'
import { Search, Plus } from '@element-plus/icons-vue'

const store = useAppStore()

const filterForm = reactive({
  name: '',
  role: '',
  team: ''
})

const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const isEdit = ref(false)
const currentPerson = ref(null)
const personFormRef = ref(null)

const skills = WASTE_TYPES

const personForm = reactive({
  id: '',
  name: '',
  role: 'operator',
  team: 'A组',
  phone: '',
  joinDate: '',
  skills: [],
  remarks: ''
})

const personRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  team: [{ required: true, message: '请选择班组', trigger: 'change' }]
}

const filteredPersonnel = computed(() => {
  return store.personnel.filter(p => {
    if (filterForm.name && !p.name.includes(filterForm.name)) return false
    if (filterForm.role && p.role !== filterForm.role) return false
    if (filterForm.team && p.team !== filterForm.team) return false
    return true
  })
})

function getRoleName(role) {
  const map = {
    admin: '系统管理员',
    supervisor: '主管',
    operator: '操作员',
    maintenance: '维修人员'
  }
  return map[role] || role
}

function getRoleTagType(role) {
  const map = {
    admin: 'danger',
    supervisor: 'primary',
    operator: 'success',
    maintenance: 'warning'
  }
  return map[role] || ''
}

function getSkillName(code) {
  const s = skills.find(sk => sk.code === code)
  return s ? s.name : code
}

function getSkillTagType(type) {
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

function search() {
  ElMessage.success('查询完成')
}

function reset() {
  filterForm.name = ''
  filterForm.role = ''
  filterForm.team = ''
}

function addPersonnel() {
  isEdit.value = false
  personForm.id = 'EMP' + String(store.personnel.length + 1).padStart(3, '0')
  personForm.name = ''
  personForm.role = 'operator'
  personForm.team = 'A组'
  personForm.phone = ''
  personForm.joinDate = new Date().toISOString().split('T')[0]
  personForm.skills = []
  personForm.remarks = ''
  dialogVisible.value = true
}

function editPersonnel(row) {
  isEdit.value = true
  Object.assign(personForm, row)
  dialogVisible.value = true
}

function viewDetail(row) {
  currentPerson.value = row
  detailVisible.value = true
}

function deletePersonnel(row) {
  ElMessageBox.confirm(`确定删除人员 "${row.name}" 吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  }).then(() => {
    const index = store.personnel.findIndex(p => p.id === row.id)
    if (index > -1) {
      store.personnel.splice(index, 1)
    }
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function submitForm() {
  personFormRef.value?.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        const index = store.personnel.findIndex(p => p.id === personForm.id)
        if (index > -1) {
          Object.assign(store.personnel[index], personForm)
        }
        ElMessage.success('编辑成功')
      } else {
        store.personnel.push({
          ...personForm,
          status: 'active',
          workHours: 0
        })
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
    }
  })
}
</script>

<style scoped>
.personnel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card,
.list-card {
  border-radius: 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.person-detail {
  padding: 10px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-info h3 {
  font-size: 20px;
  color: #303133;
  margin: 0 0 6px 0;
}

.detail-info p {
  font-size: 13px;
  color: #909399;
  margin: 6px 0 0 0;
}

.detail-desc {
  margin-bottom: 24px;
}

.performance {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.perf-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
}

.perf-card {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.perf-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.perf-label {
  font-size: 12px;
  color: #909399;
}
</style>
