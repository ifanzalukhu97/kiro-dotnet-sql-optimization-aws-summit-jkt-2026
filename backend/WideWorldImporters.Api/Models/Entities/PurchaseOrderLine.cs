namespace WideWorldImporters.Api.Models.Entities
{
    public class PurchaseOrderLine
    {
        public int PurchaseOrderLineID { get; set; }
        public int PurchaseOrderID { get; set; }
        public int StockItemID { get; set; }
        public int OrderedOuters { get; set; }
        public int ReceivedOuters { get; set; }
        public decimal ExpectedUnitPricePerOuter { get; set; }

        public PurchaseOrder PurchaseOrder { get; set; }
        public StockItem StockItem { get; set; }
    }
}
