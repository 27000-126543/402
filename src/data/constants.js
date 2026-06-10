export const WASTE_TYPES = [
  { code: 'PAPER', name: '废纸', color: '#f59e0b', unit: '吨' },
  { code: 'PLASTIC', name: '塑料', color: '#3b82f6', unit: '吨' },
  { code: 'METAL', name: '金属', color: '#6366f1', unit: '吨' },
  { code: 'GLASS', name: '玻璃', color: '#10b981', unit: '吨' },
  { code: 'TEXTILE', name: '纺织品', color: '#ec4899', unit: '吨' },
  { code: 'ELECTRONIC', name: '电子废弃物', color: '#8b5cf6', unit: '吨' },
  { code: 'RUBBER', name: '橡胶', color: '#14b8a6', unit: '吨' },
  { code: 'WOOD', name: '木材', color: '#a16207', unit: '吨' }
]

export const SOURCES = [
  { code: 'COMMUNITY', name: '社区回收点' },
  { code: 'STATION', name: '回收站' },
  { code: 'FACTORY', name: '工厂废料' },
  { code: 'LOGISTICS', name: '物流中心' },
  { code: 'GOVERNMENT', name: '政府采购' },
  { code: 'ONLINE', name: '线上回收' }
]

export const BATCH_STATUS = [
  { code: 'PENDING', name: '待分拣', color: '#909399' },
  { code: 'SORTING', name: '分拣中', color: '#409eff' },
  { code: 'PACKING', name: '打包', color: '#e6a23c' },
  { code: 'OUTBOUND', name: '出库', color: '#67c23a' },
  { code: 'ABNORMAL', name: '异常', color: '#f56c6c' }
]

export const EQUIPMENT_STATUS = [
  { code: 'RUNNING', name: '运行中', color: '#67c23a' },
  { code: 'IDLE', name: '空闲', color: '#909399' },
  { code: 'MAINTENANCE', name: '维保中', color: '#e6a23c' },
  { code: 'FAULT', name: '故障', color: '#f56c6c' }
]

export const USER_ROLES = [
  { code: 'admin', name: '系统管理员' },
  { code: 'supervisor', name: '主管' },
  { code: 'operator', name: '操作员' },
  { code: 'maintenance', name: '维修人员' }
]

export const SHIFT_TYPES = [
  { code: 'MORNING', name: '早班', time: '08:00-16:00' },
  { code: 'AFTERNOON', name: '中班', time: '16:00-24:00' },
  { code: 'NIGHT', name: '夜班', time: '00:00-08:00' }
]
