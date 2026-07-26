export interface TotalRevenue {
  totalRevenue: number;
  invoiceRevenue: number;
  orderRevenue: number;
}

export interface TopCustomer {
  customerId: number;
  customerName: string;
  totalRevenue: number;
}

export interface TopSalesman {
  personId: number;
  fullName: string;
  totalRevenue: number;
}

export interface TopProduct {
  stockItemId: number;
  stockItemName: string;
  totalRevenue: number;
  totalQuantitySold: number;
}

export interface CustomerActivity {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  activePercentage: number;
}

export interface SalesTrend {
  periodLabel: string;
  revenue: number;
  orderCount: number;
}

export interface StockLevel {
  stockItemId: number;
  stockItemName: string;
  quantityOnHand: number;
  reorderLevel: number;
  targetStockLevel: number;
}

export interface TopOutstanding {
  customerId: number;
  customerName: string;
  outstandingBalance: number;
}

export interface DormantCustomer {
  customerId: number;
  customerName: string;
  lastOrderDate: string;
  daysSinceLastOrder: number;
}

export interface TopStockGroup {
  stockGroupId: number;
  stockGroupName: string;
  totalRevenue: number;
  productCount: number;
}

export interface TopSupplier {
  supplierId: number;
  supplierName: string;
  totalRevenue: number;
  productCount: number;
}

export interface TopDriver {
  personId: number;
  fullName: string;
  deliveryCount: number;
  totalRevenueDelivered: number;
}
