using System;
using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class InvoiceListDto
    {
        public int InvoiceId { get; set; }
        public string CustomerName { get; set; }
        public DateTime InvoiceDate { get; set; }
        public int LineCount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TotalDryItems { get; set; }
        public decimal TotalChillerItems { get; set; }
    }

    public class InvoiceDetailDto
    {
        public int InvoiceId { get; set; }
        public string CustomerName { get; set; }
        public DateTime InvoiceDate { get; set; }
        public decimal TotalDryItems { get; set; }
        public decimal TotalChillerItems { get; set; }
        public List<InvoiceLineDto> Lines { get; set; }
    }

    public class InvoiceLineDto
    {
        public int InvoiceLineId { get; set; }
        public int StockItemId { get; set; }
        public string Description { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal ExtendedPrice { get; set; }
    }
}
