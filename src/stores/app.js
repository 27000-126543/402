import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateMockData } from '@/data/mockData'
import { WASTE_TYPES, EQUIPMENT_STATUS } from '@/data/constants'

export const useAppStore = defineStore('app', () => {
  const mockData = generateMockData()

  const currentUser = ref({
    id: 'EMP001',
    name: '张主管',
    role: 'supervisor',
    roleName: '主管',
    team: 'A组',
    avatar: ''
  })

  const personnel = ref(mockData.personnel)
  const equipment = ref(mockData.equipment)
  const wasteBatches = ref(mockData.wasteBatches)
  const maintenanceOrders = ref(mockData.maintenanceOrders)
  const spareParts = ref(mockData.spareParts)
  const inventory = ref(mockData.inventory)
  const marketPrices = ref(mockData.marketPrices)
  const schedules = ref(mockData.schedules)
  const approvalRecords = ref(mockData.approvalRecords)

  const notifications = ref([
    { id: 1, type: 'warning', title: '设备故障', content: '电子废弃物分拣线发生故障', time: '10分钟前', read: false },
    { id: 2, type: 'info', title: '排程审批', content: '今日中班排程待审批', time: '30分钟前', read: false },
    { id: 3, type: 'success', title: '维保完成', content: '玻璃分拣线维保完成', time: '1小时前', read: true }
  ])

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  const stats = computed(() => {
    const todayBatches = wasteBatches.value.filter(b => b.arrivalTime.startsWith(new Date().toISOString().split('T')[0]))
    const todayOutbound = wasteBatches.value.filter(b => b.status === 'OUTBOUND' && b.outboundTime?.startsWith(new Date().toISOString().split('T')[0]))
    
    return {
      todayArrival: todayBatches.reduce((sum, b) => sum + b.estimatedWeight, 0).toFixed(2),
      todayOutbound: todayOutbound.reduce((sum, b) => sum + b.actualWeight, 0).toFixed(2),
      pendingCount: wasteBatches.value.filter(b => b.status === 'PENDING').length,
      sortingCount: wasteBatches.value.filter(b => b.status === 'SORTING').length,
      equipmentRunning: equipment.value.filter(e => e.status === 'RUNNING').length,
      equipmentTotal: equipment.value.length,
      equipmentUtilization: ((equipment.value.filter(e => e.status === 'RUNNING').length / equipment.value.length) * 100).toFixed(1),
      pendingApprovals: approvalRecords.value.filter(a => a.status === 'PENDING').length,
      lowStockParts: spareParts.value.filter(s => s.stock < s.minStock).length
    }
  })

  function addWasteBatch(batch) {
    const newBatch = {
      id: 'B' + new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2) + String(wasteBatches.value.length + 1).padStart(3, '0'),
      ...batch,
      status: 'PENDING',
      actualWeight: 0,
      lossRate: 0,
      arrivalTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      sortingStartTime: null,
      sortingEndTime: null,
      outboundTime: null,
      equipmentId: null,
      operatorId: null,
      quality: '',
      remarks: ''
    }
    wasteBatches.value.unshift(newBatch)
    
    const inv = inventory.value.find(i => i.type === batch.type)
    if (inv) {
      inv.pendingQuantity = parseFloat((inv.pendingQuantity + batch.estimatedWeight).toFixed(2))
    }
    
    return newBatch
  }

  function updateBatchStatus(batchId, status, data = {}) {
    const batch = wasteBatches.value.find(b => b.id === batchId)
    if (batch) {
      batch.status = status
      
      if (status === 'SORTING') {
        batch.sortingStartTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      } else if (status === 'PACKING') {
        batch.sortingEndTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
        const inv = inventory.value.find(i => i.type === batch.type)
        if (inv) {
          inv.pendingQuantity = parseFloat((inv.pendingQuantity - batch.estimatedWeight).toFixed(2))
          inv.sortedQuantity = parseFloat((inv.sortedQuantity + batch.actualWeight).toFixed(2))
        }
      } else if (status === 'OUTBOUND') {
        batch.outboundTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
        const inv = inventory.value.find(i => i.type === batch.type)
        if (inv) {
          inv.sortedQuantity = parseFloat((inv.sortedQuantity - batch.actualWeight).toFixed(2))
          inv.quantity = parseFloat((inv.quantity - batch.actualWeight).toFixed(2))
        }
      }
      
      Object.assign(batch, data)
    }
    return batch
  }

  function updateEquipmentStatus(equipmentId, status) {
    const eq = equipment.value.find(e => e.id === equipmentId)
    if (eq) {
      eq.status = status
    }
    return eq
  }

  function addMaintenanceOrder(order) {
    const newOrder = {
      id: 'MO' + String(maintenanceOrders.value.length + 1).padStart(5, '0'),
      ...order,
      status: 'PENDING',
      statusName: '待处理',
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      startTime: null,
      endTime: null
    }
    maintenanceOrders.value.unshift(newOrder)
    return newOrder
  }

  function updateMaintenanceOrder(orderId, status, data = {}) {
    const order = maintenanceOrders.value.find(o => o.id === orderId)
    if (order) {
      order.status = status
      order.statusName = status === 'PENDING' ? '待处理' : status === 'IN_PROGRESS' ? '进行中' : '已完成'
      if (status === 'IN_PROGRESS' && !order.startTime) {
        order.startTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      } else if (status === 'COMPLETED') {
        order.endTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      Object.assign(order, data)
    }
    return order
  }

  function updateSparePartsStock(partId, quantity) {
    const part = spareParts.value.find(p => p.id === partId)
    if (part) {
      part.stock += quantity
    }
    return part
  }

  function generateSchedule(date) {
    const pendingBatches = wasteBatches.value.filter(b => b.status === 'PENDING')
    const runningEquipment = equipment.value.filter(e => e.status === 'RUNNING' || e.status === 'IDLE')
    
    const newSchedules = []
    let timeOffset = 8 * 60
    
    pendingBatches.forEach((batch, index) => {
      const availableEq = runningEquipment.filter(e => e.type === batch.type)
      if (availableEq.length === 0) return
      
      const eq = availableEq[index % availableEq.length]
      const qualifiedOps = personnel.value.filter(p => p.role === 'operator' && p.skills.includes(batch.type))
      const operator = qualifiedOps[index % Math.max(1, qualifiedOps.length)] || personnel.value.find(p => p.role === 'operator')
      
      const changeoverTime = index > 0 ? 30 : 0
      const startTime = timeOffset + changeoverTime
      
      newSchedules.push({
        id: 'SCH' + date.replace(/-/g, '') + '-' + batch.type + '-' + (index + 1),
        date: date,
        shift: startTime < 960 ? 'MORNING' : (startTime < 1440 ? 'AFTERNOON' : 'NIGHT'),
        shiftName: startTime < 960 ? '早班' : (startTime < 1440 ? '中班' : '夜班'),
        shiftTime: startTime < 960 ? '08:00-16:00' : (startTime < 1440 ? '16:00-24:00' : '00:00-08:00'),
        equipmentId: eq.id,
        equipmentName: eq.name,
        wasteType: batch.type,
        wasteTypeName: WASTE_TYPES.find(t => t.code === batch.type)?.name || batch.type,
        operatorId: operator?.id || 'EMP005',
        operatorName: operator?.name || '操作员',
        plannedQuantity: batch.estimatedWeight,
        actualQuantity: 0,
        status: 'PENDING',
        statusName: '待执行',
        approvalStatus: 'PENDING',
        approvalStatusName: '待审批',
        changeoverTime: changeoverTime,
        conveyorLoad: 70 + Math.floor(Math.random() * 20),
        blockageRisk: 10 + Math.floor(Math.random() * 20),
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        approver: null,
        approvalTime: null,
        remarks: ''
      })
      
      timeOffset = startTime + 120
    })
    
    newSchedules.forEach(s => schedules.value.push(s))
    return newSchedules
  }

  function approveSchedule(scheduleId, approved, reason = '') {
    const schedule = schedules.value.find(s => s.id === scheduleId)
    if (schedule) {
      schedule.approvalStatus = approved ? 'APPROVED' : 'REJECTED'
      schedule.approvalStatusName = approved ? '已通过' : '已驳回'
      schedule.approver = currentUser.value.name
      schedule.approvalTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      schedule.reason = reason
    }
    return schedule
  }

  function submitApprovalRequest(approval) {
    const newApproval = {
      id: 'APR-' + String(approvalRecords.value.length + 1).padStart(3, '0'),
      ...approval,
      status: 'PENDING',
      submitter: currentUser.value.name,
      submitTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
    approvalRecords.value.unshift(newApproval)
    return newApproval
  }

  function processApproval(approvalId, approved, reason = '') {
    const approval = approvalRecords.value.find(a => a.id === approvalId)
    if (approval) {
      approval.status = approved ? 'APPROVED' : 'REJECTED'
      approval.approver = currentUser.value.name
      approval.approvalTime = new Date().toISOString().slice(0, 19).replace('T', ' ')
      approval.reason = reason
    }
    return approval
  }

  function markNotificationRead(id) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  function markAllNotificationsRead() {
    notifications.value.forEach(n => n.read = true)
  }

  function login(username, password) {
    const supervisor = personnel.value.find(p => p.role === 'supervisor')
    if (supervisor) {
      currentUser.value = {
        id: supervisor.id,
        name: supervisor.name,
        role: supervisor.role,
        roleName: '主管',
        team: supervisor.team,
        avatar: ''
      }
    }
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userRole', currentUser.value.role)
    return true
  }

  function logout() {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userRole')
  }

  function getStatisticsByCategory(timeRange) {
    const result = WASTE_TYPES.map(type => {
      const batches = wasteBatches.value.filter(b => {
        if (b.type !== type.code) return false
        if (timeRange === 'today') {
          return b.arrivalTime.startsWith(new Date().toISOString().split('T')[0])
        }
        return true
      })
      
      return {
        type: type.code,
        name: type.name,
        color: type.color,
        inbound: batches.reduce((sum, b) => sum + b.estimatedWeight, 0),
        outbound: batches.filter(b => b.status === 'OUTBOUND').reduce((sum, b) => sum + b.actualWeight, 0),
        loss: batches.filter(b => b.status === 'OUTBOUND').reduce((sum, b) => sum + (b.estimatedWeight - b.actualWeight), 0),
        count: batches.length
      }
    })
    return result
  }

  function getWorkshopHeatmapData() {
    const zones = [
      { id: 'A1', name: 'A区-01', type: 'PAPER' },
      { id: 'A2', name: 'A区-02', type: 'PLASTIC' },
      { id: 'B1', name: 'B区-01', type: 'METAL' },
      { id: 'B2', name: 'B区-02', type: 'GLASS' },
      { id: 'C1', name: 'C区-01', type: 'TEXTILE' },
      { id: 'C2', name: 'C区-02', type: 'ELECTRONIC' },
      { id: 'D1', name: 'D区-01', type: 'RUBBER' },
      { id: 'D2', name: 'D区-02', type: 'WOOD' },
      { id: 'W1', name: '暂存区-1', type: 'STORAGE' },
      { id: 'W2', name: '暂存区-2', type: 'STORAGE' },
      { id: 'OUT', name: '出库区', type: 'OUTBOUND' },
      { id: 'ENT', name: '入库区', type: 'INBOUND' }
    ]
    
    return zones.map(zone => {
      const eq = equipment.value.find(e => e.location.includes(zone.name.charAt(0) + '区'))
      const inv = inventory.value.find(i => i.type === zone.type)
      
      let workLoad = 0
      if (eq) {
        workLoad = eq.status === 'RUNNING' ? 60 + Math.random() * 30 : eq.status === 'MAINTENANCE' ? 20 : 10
      } else if (zone.type === 'STORAGE') {
        workLoad = 30 + Math.random() * 40
      } else if (zone.type === 'OUTBOUND') {
        workLoad = 40 + Math.random() * 30
      } else {
        workLoad = 50 + Math.random() * 30
      }
      
      let stockLoad = 0
      if (inv) {
        stockLoad = Math.min(100, (inv.quantity / 50) * 100)
      } else if (zone.type === 'STORAGE') {
        stockLoad = 35 + Math.random() * 30
      }
      
      return {
        ...zone,
        workLoad: Math.round(workLoad),
        stockLoad: Math.round(stockLoad),
        equipment: eq,
        inventory: inv
      }
    })
  }

  return {
    currentUser,
    personnel,
    equipment,
    wasteBatches,
    maintenanceOrders,
    spareParts,
    inventory,
    marketPrices,
    schedules,
    approvalRecords,
    notifications,
    unreadCount,
    stats,
    addWasteBatch,
    updateBatchStatus,
    updateEquipmentStatus,
    addMaintenanceOrder,
    updateMaintenanceOrder,
    updateSparePartsStock,
    generateSchedule,
    approveSchedule,
    submitApprovalRequest,
    processApproval,
    markNotificationRead,
    markAllNotificationsRead,
    login,
    logout,
    getStatisticsByCategory,
    getWorkshopHeatmapData
  }
})
