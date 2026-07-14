using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Entities
{
    public class Customer
    {
        public int CustomerID { get; set; }
        public string CustomerName { get; set; }
        public int CustomerCategoryID { get; set; }
        public int PrimaryContactPersonID { get; set; }
        public int DeliveryCityID { get; set; }
        public decimal? CreditLimit { get; set; }

        public ICollection<Order> Orders { get; set; }
        public ICollection<Invoice> Invoices { get; set; }
        public ICollection<CustomerTransaction> Transactions { get; set; }
    }
}
