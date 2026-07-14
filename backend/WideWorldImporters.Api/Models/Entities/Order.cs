using System;
using System.Collections.Generic;

namespace WideWorldImporters.Api.Models.Entities
{
    public class Order
    {
        public int OrderID { get; set; }
        public int CustomerID { get; set; }
        public int SalespersonPersonID { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime ExpectedDeliveryDate { get; set; }
        public bool IsUndersupplyBackordered { get; set; }

        public Customer Customer { get; set; }
        public ICollection<OrderLine> OrderLines { get; set; }
    }
}
