using System;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class TotalRevenueDto
    {
        public decimal TotalRevenue { get; set; }
        public decimal InvoiceRevenue { get; set; }
        public decimal OrderRevenue { get; set; }
    }

    public class TopCustomerDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class TopSalesmanDto
    {
        public int PersonId { get; set; }
        public string FullName { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class TopProductDto
    {
        public int StockItemId { get; set; }
        public string StockItemName { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalQuantitySold { get; set; }
    }

    public class CustomerActivityDto
    {
        public int TotalCustomers { get; set; }
        public int ActiveCustomers { get; set; }
        public int InactiveCustomers { get; set; }
        public decimal ActivePercentage { get; set; }
    }

    public class SalesTrendDto
    {
        public string PeriodLabel { get; set; }
        public decimal Revenue { get; set; }
        public int OrderCount { get; set; }
    }

    public class StockLevelDto
    {
        public int StockItemId { get; set; }
        public string StockItemName { get; set; }
        public int QuantityOnHand { get; set; }
        public int ReorderLevel { get; set; }
        public int TargetStockLevel { get; set; }
    }

    public class TopOutstandingDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public decimal OutstandingBalance { get; set; }
    }

    public class DormantCustomerDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public DateTime LastOrderDate { get; set; }
        public int DaysSinceLastOrder { get; set; }
    }

    public class TopStockGroupDto
    {
        public int StockGroupId { get; set; }
        public string StockGroupName { get; set; }
        public decimal TotalRevenue { get; set; }
        public int ProductCount { get; set; }
    }

    public class TopSupplierDto
    {
        public int SupplierId { get; set; }
        public string SupplierName { get; set; }
        public decimal TotalRevenue { get; set; }
        public int ProductCount { get; set; }
    }

    public class TopDriverDto
    {
        public int PersonId { get; set; }
        public string FullName { get; set; }
        public int DeliveryCount { get; set; }
        public decimal TotalRevenueDelivered { get; set; }
    }
}
