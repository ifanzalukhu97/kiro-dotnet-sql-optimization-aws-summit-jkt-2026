using System;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class WarehouseTransactionListDto
    {
        public int StockItemTransactionId { get; set; }
        public string StockItemName { get; set; }
        public DateTime TransactionOccurredWhen { get; set; }
        public decimal Quantity { get; set; }
        public int QuantityOnHand { get; set; }
    }

    public class WarehouseTransactionDetailDto
    {
        public int StockItemTransactionId { get; set; }
        public int StockItemId { get; set; }
        public string StockItemName { get; set; }
        public DateTime TransactionOccurredWhen { get; set; }
        public decimal Quantity { get; set; }
        public int QuantityOnHand { get; set; }
        public int ReorderLevel { get; set; }
        public int TargetStockLevel { get; set; }
    }
}
