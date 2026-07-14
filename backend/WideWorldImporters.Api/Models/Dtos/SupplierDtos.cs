using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class SupplierListDto
    {
        public int SupplierId { get; set; }
        public string SupplierName { get; set; }
        public string CategoryName { get; set; }
        public int PurchaseOrderCount { get; set; }
        public int StockItemCount { get; set; }
    }

    public class SupplierDetailDto
    {
        public int SupplierId { get; set; }
        public string SupplierName { get; set; }
        public string CategoryName { get; set; }
        public List<PurchaseOrderListDto> RecentPurchaseOrders { get; set; }
        public List<LookupDto> StockItems { get; set; }
    }
}
