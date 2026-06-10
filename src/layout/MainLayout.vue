<template>
  <el-container class="main-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <el-icon :size="28" color="#409eff"><DataAnalysis /></el-icon>
        <span v-if="!isCollapse" class="logo-text">分拣中心管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#1a2942"
        text-color="#a0aec0"
        active-text-color="#ffffff"
        class="side-menu"
      >
        <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleSidebar">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="store.unreadCount" :hidden="store.unreadCount === 0" class="notification-badge">
            <el-button type="primary" text @click="showNotifications = true">
              <el-icon :size="20"><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">{{ store.currentUser.name }}</span>
              <el-tag size="small" type="success" effect="light">{{ store.currentUser.roleName }}</el-tag>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon> 系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <el-drawer v-model="showNotifications" title="消息通知" size="400px" direction="rtl">
      <div class="notification-list">
        <div v-for="item in store.notifications" :key="item.id" 
             class="notification-item" 
             :class="{ unread: !item.read }"
             @click="markRead(item.id)">
          <div class="notification-icon" :class="item.type">
            <el-icon><component :is="getNotificationIcon(item.type)" /></el-icon>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ item.title }}</div>
            <div class="notification-desc">{{ item.content }}</div>
            <div class="notification-time">{{ item.time }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="markAllRead" style="width: 100%">全部标记为已读</el-button>
      </template>
    </el-drawer>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  DataAnalysis,
  Edit,
  Calendar,
  Tickets,
  Setting,
  Grid,
  PieChart,
  Checked,
  User,
  Bell,
  Fold,
  Expand,
  SwitchButton,
  Warning,
  InfoFilled,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const isCollapse = ref(false)
const showNotifications = ref(false)

const menuItems = [
  { path: '/dashboard', title: '工作台', icon: 'DataAnalysis' },
  { path: '/waste-entry', title: '废品信息录入', icon: 'Edit' },
  { path: '/scheduling', title: '智能排程', icon: 'Calendar' },
  { path: '/batch-tracking', title: '批次追踪', icon: 'Tickets' },
  { path: '/equipment', title: '设备管理', icon: 'Setting' },
  { path: '/workshop', title: '车间可视化', icon: 'Grid' },
  { path: '/statistics', title: '统计报表', icon: 'PieChart' },
  { path: '/approval', title: '审批中心', icon: 'Checked' },
  { path: '/personnel', title: '人员管理', icon: 'User' }
]

const activeMenu = computed(() => route.path)
const currentPageTitle = computed(() => {
  const item = menuItems.find(m => m.path === route.path)
  return item ? item.title : ''
})

function toggleSidebar() {
  isCollapse.value = !isCollapse.value
}

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      store.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    }).catch(() => {})
  }
}

function getNotificationIcon(type) {
  const icons = {
    warning: Warning,
    info: InfoFilled,
    success: CircleCheck,
    error: CircleClose
  }
  return icons[type] || InfoFilled
}

function markRead(id) {
  store.markNotificationRead(id)
}

function markAllRead() {
  store.markAllNotificationsRead()
  ElMessage.success('已全部标记为已读')
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background: #1a2942;
  transition: width 0.3s;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.side-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 8px;
  border-radius: 8px;
}

:deep(.el-menu-item:hover) {
  background: rgba(64, 158, 255, 0.1);
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #409eff 0%, #667eea 100%);
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.username {
  color: #303133;
  font-size: 14px;
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #f5f7fa;
}

.notification-item.unread {
  background: #ecf5ff;
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 18px;
}

.notification-icon.warning {
  background: #e6a23c;
}

.notification-icon.info {
  background: #409eff;
}

.notification-icon.success {
  background: #67c23a;
}

.notification-icon.error {
  background: #f56c6c;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.notification-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}
</style>
