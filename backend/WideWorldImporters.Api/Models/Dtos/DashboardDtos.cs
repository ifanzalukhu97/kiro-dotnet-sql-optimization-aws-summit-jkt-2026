namespace WideWorldImporters.Api.Models.Dtos
{
    public class DashboardKpiDto
    {
        public int TotalOrders { get; set; }
        public int TotalCustomers { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalStockItems { get; set; }
        public decimal AverageOrderValue { get; set; }
        public string TopCustomerByRevenue { get; set; }
        public int RecentOrderCount { get; set; }
        public int PendingDeliveries { get; set; }
    }
}
