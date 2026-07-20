using System;
using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Entities
{
    public class Invoice
    {
        public int InvoiceID { get; set; }
        public int CustomerID { get; set; }
        public int SalespersonPersonID { get; set; }
        public int PackedByPersonID { get; set; }
        public DateTime InvoiceDate { get; set; }
        public int TotalDryItems { get; set; }
        public int TotalChillerItems { get; set; }

        public Customer Customer { get; set; }
        public Person SalespersonPerson { get; set; }
        public Person PackedByPerson { get; set; }
        public ICollection<InvoiceLine> InvoiceLines { get; set; }
    }
}
