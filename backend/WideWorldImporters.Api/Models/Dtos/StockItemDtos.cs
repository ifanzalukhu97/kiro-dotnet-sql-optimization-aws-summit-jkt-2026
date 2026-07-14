using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class StockItemListDto
    {
        public int StockItemId { get; set; }
        public string StockItemName { get; set; }
        public string SupplierName { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal RecommendedRetailPrice { get; set; }
        public int QuantityOnHand { get; set; }
    }

    public class StockItemDetailDto
    {
        public int StockItemId { get; set; }
        public string StockItemName { get; set; }
        public string SupplierName { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal RecommendedRetailPrice { get; set; }
        public decimal TaxRate { get; set; }
        public decimal TypicalWeightPerUnit { get; set; }
        public int QuantityOnHand { get; set; }
        public int ReorderLevel { get; set; }
        public int TargetStockLevel { get; set; }
        public List<string> StockGroups { get; set; }
    }
}
