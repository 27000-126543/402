import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台', icon: 'DataAnalysis' }
      },
      {
        path: 'waste-entry',
        name: 'WasteEntry',
        component: () => import('@/views/WasteEntry.vue'),
        meta: { title: '废品信息录入', icon: 'Edit' }
      },
      {
        path: 'scheduling',
        name: 'Scheduling',
        component: () => import('@/views/Scheduling.vue'),
        meta: { title: '智能排程', icon: 'Calendar' }
      },
      {
        path: 'batch-tracking',
        name: 'BatchTracking',
        component: () => import('@/views/BatchTracking.vue'),
        meta: { title: '批次追踪', icon: 'Tickets' }
      },
      {
        path: 'equipment',
        name: 'Equipment',
        component: () => import('@/views/Equipment.vue'),
        meta: { title: '设备管理', icon: 'Setting' }
      },
      {
        path: 'workshop',
        name: 'Workshop',
        component: () => import('@/views/Workshop.vue'),
        meta: { title: '车间可视化', icon: 'Grid' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/Statistics.vue'),
        meta: { title: '统计报表', icon: 'PieChart' }
      },
      {
        path: 'approval',
        name: 'Approval',
        component: () => import('@/views/Approval.vue'),
        meta: { title: '审批中心', icon: 'Checked' }
      },
      {
        path: 'personnel',
        name: 'Personnel',
        component: () => import('@/views/Personnel.vue'),
        meta: { title: '人员管理', icon: 'User' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const userRole = localStorage.getItem('userRole') || 'operator'

  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
