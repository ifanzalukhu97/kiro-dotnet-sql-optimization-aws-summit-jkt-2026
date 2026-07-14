using System;

namespace WideWorldImporters.Api.Models.Entities
{
    public class StockItemTransaction
    {
        public int StockItemTransactionID { get; set; }
        public int StockItemID { get; set; }
        public DateTime TransactionOccurredWhen { get; set; }
        public decimal Quantity { get; set; }

        public StockItem StockItem { get; set; }
    }
}
