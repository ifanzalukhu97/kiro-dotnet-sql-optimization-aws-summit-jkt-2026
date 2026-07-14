namespace WideWorldImporters.Api.Models.Entities
{
    public class InvoiceLine
    {
        public int InvoiceLineID { get; set; }
        public int InvoiceID { get; set; }
        public int StockItemID { get; set; }
        public string Description { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal ExtendedPrice { get; set; }

        public Invoice Invoice { get; set; }
        public StockItem StockItem { get; set; }
    }
}
