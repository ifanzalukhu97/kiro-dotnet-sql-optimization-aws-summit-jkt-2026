using System;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class PaymentListDto
    {
        public int CustomerTransactionId { get; set; }
        public string CustomerName { get; set; }
        public DateTime TransactionDate { get; set; }
        public decimal TransactionAmount { get; set; }
        public decimal OutstandingBalance { get; set; }
    }

    public class PaymentDetailDto
    {
        public int CustomerTransactionId { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public DateTime TransactionDate { get; set; }
        public decimal AmountExcludingTax { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TransactionAmount { get; set; }
        public decimal OutstandingBalance { get; set; }
    }
}
