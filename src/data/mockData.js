import { WASTE_TYPES, SOURCES, EQUIPMENT_STATUS, USER_ROLES, SHIFT_TYPES } from './constants'

function generateId(prefix, length = 8) {
  return prefix + '-' + Date.now().toString(36).toUpperCase().slice(-6) + 
         Math.random().toString(36).toUpperCase().slice(0, length - 6)
}

function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function getDateDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

export function generateMockData() {
  const personnel = []
  const names = ['张伟', '王芳', '李明', '刘洋', '陈静', '杨光', '赵敏', '黄磊', '周杰', '吴婷', '徐峰', '孙莉']
  const skills = ['PAPER', 'PLASTIC', 'METAL', 'GLASS', 'TEXTILE', 'ELECTRONIC', 'RUBBER', 'WOOD']
  
  for (let i = 0; i < 15; i++) {
    const role = i < 2 ? 'supervisor' : (i < 5 ? 'maintenance' : 'operator')
    const skillCount = role === 'operator' ? randomInt(2, 4) : 0
    const personSkills = []
    for (let j = 0; j < skillCount; j++) {
      const skill = randomFromArray(skills)
      if (!personSkills.includes(skill)) {
        personSkills.push(skill)
      }
    }
    personnel.push({
      id: 'EMP' + String(i + 1).padStart(3, '0'),
      name: names[i % names.length] + (i > 11 ? randomInt(1, 99) : ''),
      role: role,
      team: 'A组',
      skills: personSkills,
      phone: '138' + String(randomInt(10000000, 99999999)),
      status: 'active',
      workHours: randomInt(120, 180),
      joinDate: getDateDaysAgo(randomInt(100, 1000))
    })
  }

  const equipment = [
    { id: 'EQ-001', name: '废纸分拣线', type: 'PAPER', status: 'RUNNING', runHours: 1250.5, lastMaintenance: getDateDaysAgo(15), maintenanceInterval: 500, location: 'A区-01', capacity: 5, conveyorSpeed: 2.5 },
    { id: 'EQ-002', name: '塑料分拣线', type: 'PLASTIC', status: 'RUNNING', runHours: 980.2, lastMaintenance: getDateDaysAgo(20), maintenanceInterval: 600, location: 'A区-02', capacity: 4, conveyorSpeed: 2.0 },
    { id: 'EQ-003', name: '金属分拣线', type: 'METAL', status: 'IDLE', runHours: 760.8, lastMaintenance: getDateDaysAgo(10), maintenanceInterval: 800, location: 'B区-01', capacity: 3, conveyorSpeed: 1.8 },
    { id: 'EQ-004', name: '玻璃分拣线', type: 'GLASS', status: 'MAINTENANCE', runHours: 1560.3, lastMaintenance: getDateDaysAgo(45), maintenanceInterval: 400, location: 'B区-02', capacity: 2, conveyorSpeed: 1.5 },
    { id: 'EQ-005', name: '纺织品分拣线', type: 'TEXTILE', status: 'RUNNING', runHours: 420.1, lastMaintenance: getDateDaysAgo(5), maintenanceInterval: 700, location: 'C区-01', capacity: 3, conveyorSpeed: 2.2 },
    { id: 'EQ-006', name: '电子废弃物分拣线', type: 'ELECTRONIC', status: 'FAULT', runHours: 890.6, lastMaintenance: getDateDaysAgo(30), maintenanceInterval: 500, location: 'C区-02', capacity: 2, conveyorSpeed: 1.2 },
    { id: 'EQ-007', name: '橡胶分拣线', type: 'RUBBER', status: 'RUNNING', runHours: 650.4, lastMaintenance: getDateDaysAgo(25), maintenanceInterval: 600, location: 'D区-01', capacity: 3, conveyorSpeed: 2.0 },
    { id: 'EQ-008', name: '木材分拣线', type: 'WOOD', status: 'IDLE', runHours: 380.7, lastMaintenance: getDateDaysAgo(8), maintenanceInterval: 800, location: 'D区-02', capacity: 4, conveyorSpeed: 1.8 }
  ]

  const wasteBatches = []
  for (let i = 0; i < 30; i++) {
    const type = randomFromArray(WASTE_TYPES)
    const daysAgo = randomInt(0, 10)
    const weight = randomFloat(0.5, 8, 2)
    const statuses = ['PENDING', 'PENDING', 'SORTING', 'SORTING', 'PACKING', 'OUTBOUND', 'OUTBOUND']
    const status = daysAgo > 5 ? 'OUTBOUND' : randomFromArray(statuses)
    
    let actualWeight = weight
    let lossRate = 0
    if (status === 'OUTBOUND' || status === 'PACKING') {
      lossRate = randomFloat(0.5, 5, 2)
      actualWeight = parseFloat((weight * (1 - lossRate / 100)).toFixed(2))
    }

    wasteBatches.push({
      id: 'B' + getDateDaysAgo(daysAgo).replace(/-/g, '').slice(2) + String(i + 1).padStart(3, '0'),
      type: type.code,
      typeName: type.name,
      source: randomFromArray(SOURCES).code,
      estimatedWeight: weight,
      actualWeight: actualWeight,
      lossRate: lossRate,
      status: status,
      arrivalTime: getDateDaysAgo(daysAgo) + ' ' + String(randomInt(6, 20)).padStart(2, '0') + ':' + String(randomInt(0, 59)).padStart(2, '0') + ':00',
      sortingStartTime: status !== 'PENDING' ? getDateDaysAgo(Math.max(0, daysAgo - 1)) + ' ' + String(randomInt(8, 18)).padStart(2, '0') + ':00:00' : null,
      sortingEndTime: status === 'OUTBOUND' || status === 'PACKING' ? getDateDaysAgo(Math.max(0, daysAgo - 1)) + ' ' + String(randomInt(10, 22)).padStart(2, '0') + ':00:00' : null,
      outboundTime: status === 'OUTBOUND' ? getDateDaysAgo(Math.max(0, daysAgo - 2)) + ' ' + String(randomInt(14, 23)).padStart(2, '0') + ':00:00' : null,
      equipmentId: status !== 'PENDING' ? randomFromArray(equipment.filter(e => e.type === type.code))?.id || 'EQ-001' : null,
      operatorId: status !== 'PENDING' ? randomFromArray(personnel.filter(p => p.role === 'operator'))?.id || 'EMP005' : null,
      team: randomFromArray(['A组', 'B组', 'C组']),
      quality: randomFromArray(['优', '良', '中']),
      remarks: ''
    })
  }

  const maintenanceOrders = []
  for (let i = 0; i < 12; i++) {
    const eq = randomFromArray(equipment)
    const daysAgo = randomInt(0, 30)
    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'COMPLETED']
    const status = randomFromArray(statuses)
    
    maintenanceOrders.push({
      id: 'MO' + String(i + 1).padStart(5, '0'),
      equipmentId: eq.id,
      equipmentName: eq.name,
      type: randomFromArray(['SCHEDULED', 'FAULT', 'INSPECTION']),
      typeName: randomFromArray(['定期维保', '故障维修', '巡检']),
      status: status,
      statusName: status === 'PENDING' ? '待处理' : status === 'IN_PROGRESS' ? '进行中' : '已完成',
      priority: randomFromArray(['HIGH', 'MEDIUM', 'LOW']),
      priorityName: randomFromArray(['高', '中', '低']),
      description: eq.name + '需要进行常规维护保养',
      assigneeTeam: randomFromArray(['维修一班', '维修二班']),
      assignee: randomFromArray(personnel.filter(p => p.role === 'maintenance'))?.name || '维修人员',
      parts: [
        { name: '传动皮带', quantity: randomInt(1, 3), cost: randomFloat(200, 500) },
        { name: '润滑油', quantity: randomInt(2, 5), cost: randomFloat(50, 150) }
      ],
      totalCost: randomFloat(500, 2000),
      createTime: getDateDaysAgo(daysAgo) + ' 09:00:00',
      startTime: status !== 'PENDING' ? getDateDaysAgo(daysAgo) + ' 10:00:00' : null,
      endTime: status === 'COMPLETED' ? getDateDaysAgo(daysAgo) + ' ' + String(randomInt(12, 18)).padStart(2, '0') + ':30:00' : null,
      remarks: ''
    })
  }

  const spareParts = [
    { id: 'SP-001', name: '传动皮带', category: '传动部件', stock: 25, minStock: 10, unit: '条', location: 'A仓库-01' },
    { id: 'SP-002', name: '轴承', category: '传动部件', stock: 40, minStock: 15, unit: '个', location: 'A仓库-02' },
    { id: 'SP-003', name: '润滑油', category: '耗材', stock: 8, minStock: 5, unit: '桶', location: 'B仓库-01' },
    { id: 'SP-004', name: '分拣刷', category: '易损件', stock: 12, minStock: 20, unit: '套', location: 'B仓库-02' },
    { id: 'SP-005', name: '传感器', category: '电子部件', stock: 8, minStock: 6, unit: '个', location: 'C仓库-01' },
    { id: 'SP-006', name: '电机', category: '核心部件', stock: 3, minStock: 2, unit: '台', location: 'C仓库-02' },
    { id: 'SP-007', name: '传送带', category: '输送部件', stock: 6, minStock: 4, unit: '米', location: 'D仓库-01' },
    { id: 'SP-008', name: '液压油', category: '耗材', stock: 15, minStock: 10, unit: '桶', location: 'D仓库-02' }
  ]

  const inventory = WASTE_TYPES.map(type => ({
    type: type.code,
    typeName: type.name,
    quantity: randomFloat(5, 50, 2),
    pendingQuantity: randomFloat(2, 20, 2),
    sortedQuantity: randomFloat(3, 30, 2),
    warehouseZone: type.code.charCodeAt(0) % 4 + 1
  }))

  const marketPrices = WASTE_TYPES.map(type => {
    const history = []
    for (let i = 29; i >= 0; i--) {
      const basePrice = type.code === 'METAL' ? 3500 : type.code === 'PAPER' ? 1800 : type.code === 'PLASTIC' ? 2500 : type.code === 'ELECTRONIC' ? 5000 : 1200
      history.push({
        date: getDateDaysAgo(i),
        price: randomFloat(basePrice * 0.85, basePrice * 1.15, 0)
      })
    }
    return {
      type: type.code,
      typeName: type.name,
      currentPrice: history[history.length - 1].price,
      priceChange: randomFloat(-5, 5, 2),
      demand: randomFloat(80, 120, 1),
      demandTrend: randomFromArray(['up', 'down', 'stable']),
      history: history
    }
  })

  const schedules = []
  const today = new Date()
  for (let day = 0; day < 3; day++) {
    const date = new Date(today)
    date.setDate(date.getDate() + day)
    const dateStr = date.toISOString().split('T')[0]
    
    SHIFT_TYPES.forEach((shift, shiftIndex) => {
      const usedEquipment = []
      for (let i = 0; i < 3; i++) {
        const type = randomFromArray(WASTE_TYPES)
        const availableEq = equipment.filter(e => e.type === type.code && e.status !== 'FAULT' && !usedEquipment.includes(e.id))
        if (availableEq.length === 0) continue
        
        const eq = availableEq[0]
        usedEquipment.push(eq.id)
        
        const availableOps = personnel.filter(p => p.role === 'operator' && p.skills.includes(type.code))
        const operator = availableOps.length > 0 ? randomFromArray(availableOps) : personnel.find(p => p.role === 'operator')
        
        schedules.push({
          id: 'SCH' + dateStr.replace(/-/g, '') + '-' + shift.code + '-' + i,
          date: dateStr,
          shift: shift.code,
          shiftName: shift.name,
          shiftTime: shift.time,
          equipmentId: eq.id,
          equipmentName: eq.name,
          wasteType: type.code,
          wasteTypeName: type.name,
          operatorId: operator?.id || 'EMP005',
          operatorName: operator?.name || '操作员',
          plannedQuantity: randomFloat(2, 8, 2),
          actualQuantity: day === 0 ? randomFloat(1, 6, 2) : 0,
          status: day === 0 ? (shiftIndex === 0 ? 'COMPLETED' : shiftIndex === 1 ? 'IN_PROGRESS' : 'PENDING') : 'PENDING',
          statusName: '',
          approvalStatus: day === 0 ? 'APPROVED' : (day === 1 ? randomFromArray(['PENDING', 'APPROVED']) : 'DRAFT'),
          approvalStatusName: '',
          changeoverTime: 30 + randomInt(0, 20),
          conveyorLoad: randomInt(60, 95),
          blockageRisk: randomInt(5, 40),
          createTime: getDateDaysAgo(2 - day) + ' 08:00:00',
          approver: null,
          approvalTime: null,
          remarks: ''
        })
      }
    })
  }

  schedules.forEach(s => {
    const statusMap = {
      'PENDING': '待执行',
      'IN_PROGRESS': '进行中',
      'COMPLETED': '已完成'
    }
    s.statusName = statusMap[s.status] || s.status
    
    const approvalMap = {
      'DRAFT': '草稿',
      'PENDING': '待审批',
      'APPROVED': '已通过',
      'REJECTED': '已驳回'
    }
    s.approvalStatusName = approvalMap[s.approvalStatus] || s.approvalStatus
  })

  const approvalRecords = [
    { id: 'APR-001', type: 'SCHEDULE', title: '2024-01-15 早班排程审批', submitter: '系统自动', submitTime: '2024-01-14 18:00:00', status: 'APPROVED', approver: '张伟', approvalTime: '2024-01-14 19:30:00', reason: '' },
    { id: 'APR-002', type: 'SCHEDULE_ADJUST', title: '排程调整申请-塑料分拣线', submitter: '李明', submitTime: '2024-01-15 10:30:00', status: 'PENDING', approver: null, approvalTime: null, reason: '原料不足，需调整分拣顺序' },
    { id: 'APR-003', type: 'BATCH_ABNORMAL', title: '批次异常处理申请-B240115002', submitter: '王芳', submitTime: '2024-01-15 09:15:00', status: 'APPROVED', approver: '张伟', approvalTime: '2024-01-15 09:45:00', reason: '发现夹杂危险品，需特殊处理' }
  ]

  return {
    personnel,
    equipment,
    wasteBatches,
    maintenanceOrders,
    spareParts,
    inventory,
    marketPrices,
    schedules,
    approvalRecords
  }
}
