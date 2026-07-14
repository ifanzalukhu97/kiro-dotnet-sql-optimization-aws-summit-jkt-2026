namespace WideWorldImporters.Api.Models.Entities
{
    public class StockItemHolding
    {
        public int StockItemID { get; set; }
        public int QuantityOnHand { get; set; }
        public int ReorderLevel { get; set; }
        public int TargetStockLevel { get; set; }

        public StockItem StockItem { get; set; }
    }
}
