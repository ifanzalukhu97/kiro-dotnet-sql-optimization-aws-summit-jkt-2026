namespace WideWorldImporters.Api.Models.Entities
{
    public class StockItemStockGroup
    {
        public int StockItemStockGroupID { get; set; }
        public int StockItemID { get; set; }
        public int StockGroupID { get; set; }

        public StockItem StockItem { get; set; }
        public StockGroup StockGroup { get; set; }
    }
}
