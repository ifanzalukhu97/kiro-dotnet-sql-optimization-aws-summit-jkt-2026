namespace WideWorldImporters.Api.Models.Dtos
{
    public class ProductSearchItemDto
    {
        public int StockItemId { get; set; }
        public string StockItemName { get; set; }
        public string SupplierName { get; set; }
        public string StockGroupName { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal RecommendedRetailPrice { get; set; }
        public decimal TaxRate { get; set; }
    }
}
