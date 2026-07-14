using System;
using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Dtos
{
    public class CustomerListDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public int OrderCount { get; set; }
        public DateTime? LastOrderDate { get; set; }
        public decimal OutstandingBalance { get; set; }
        public decimal? CreditLimit { get; set; }
    }

    public class CustomerDetailDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public decimal? CreditLimit { get; set; }
        public int OrderCount { get; set; }
        public int InvoiceCount { get; set; }
        public decimal OutstandingBalance { get; set; }
        public List<OrderListDto> RecentOrders { get; set; }
        public List<CustomerTransactionDto> RecentTransactions { get; set; }
    }

    public class CustomerTransactionDto
    {
        public int CustomerTransactionId { get; set; }
        public DateTime TransactionDate { get; set; }
        public decimal TransactionAmount { get; set; }
        public decimal OutstandingBalance { get; set; }
    }
}
