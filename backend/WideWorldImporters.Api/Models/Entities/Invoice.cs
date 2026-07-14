using System;
using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Entities
{
    public class Invoice
    {
        public int InvoiceID { get; set; }
        public int CustomerID { get; set; }
        public int? DeliveredByPersonID { get; set; }
        public DateTime InvoiceDate { get; set; }
        public decimal TotalDryItems { get; set; }
        public decimal TotalChillerItems { get; set; }

        public Customer Customer { get; set; }
        public Person DeliveredByPerson { get; set; }
        public ICollection<InvoiceLine> InvoiceLines { get; set; }
    }
}
