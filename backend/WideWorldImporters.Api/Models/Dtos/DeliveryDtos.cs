using System;
using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class DeliveryListDto
    {
        public int InvoiceId { get; set; }
        public string CustomerName { get; set; }
        public string DriverName { get; set; }
        public DateTime InvoiceDate { get; set; }
        public int LineCount { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class DeliveryDetailDto
    {
        public int InvoiceId { get; set; }
        public string CustomerName { get; set; }
        public string DriverName { get; set; }
        public DateTime InvoiceDate { get; set; }
        public int TotalDryItems { get; set; }
        public int TotalChillerItems { get; set; }
        public List<InvoiceLineDto> Lines { get; set; }
    }
}
