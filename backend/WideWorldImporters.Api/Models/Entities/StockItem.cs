using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Entities
{
    public class StockItem
    {
        public int StockItemID { get; set; }
        public string StockItemName { get; set; }
        public int SupplierID { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal RecommendedRetailPrice { get; set; }
        public decimal TaxRate { get; set; }
        public decimal TypicalWeightPerUnit { get; set; }

        public Supplier Supplier { get; set; }
        public StockItemHolding StockItemHolding { get; set; }
        public ICollection<StockItemStockGroup> StockItemStockGroups { get; set; }
    }
}
