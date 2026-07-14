using System;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class SalesReportItemDto
    {
        public int InvoiceLineId { get; set; }
        public DateTime InvoiceDate { get; set; }
        public string CustomerName { get; set; }
        public string StockItemName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal ExtendedPrice { get; set; }
    }
}
