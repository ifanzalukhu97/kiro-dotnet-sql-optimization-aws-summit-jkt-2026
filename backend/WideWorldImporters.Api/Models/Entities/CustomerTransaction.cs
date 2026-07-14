using System;

namespace WideWorldImporters.Api.Models.Entities
{
    public class CustomerTransaction
    {
        public int CustomerTransactionID { get; set; }
        public int CustomerID { get; set; }
        public DateTime TransactionDate { get; set; }
        public decimal AmountExcludingTax { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TransactionAmount { get; set; }
        public decimal OutstandingBalance { get; set; }

        public Customer Customer { get; set; }
    }
}
