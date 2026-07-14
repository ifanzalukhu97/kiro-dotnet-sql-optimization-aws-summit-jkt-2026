using System;
using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class PurchaseOrderListDto
    {
        public int PurchaseOrderId { get; set; }
        public string SupplierName { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime ExpectedDeliveryDate { get; set; }
        public bool IsOrderFinalized { get; set; }
        public int LineCount { get; set; }
    }

    public class PurchaseOrderDetailDto
    {
        public int PurchaseOrderId { get; set; }
        public string SupplierName { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime ExpectedDeliveryDate { get; set; }
        public bool IsOrderFinalized { get; set; }
        public List<PurchaseOrderLineDto> Lines { get; set; }
    }

    public class PurchaseOrderLineDto
    {
        public int PurchaseOrderLineId { get; set; }
        public int StockItemId { get; set; }
        public string StockItemName { get; set; }
        public int OrderedOuters { get; set; }
        public int ReceivedOuters { get; set; }
        public decimal ExpectedUnitPricePerOuter { get; set; }
    }
}
